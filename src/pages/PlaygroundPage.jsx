import { useState, useEffect, useRef, useCallback } from "react";
import { Timer as TimerIcon, RefreshCw, Play, Send } from "lucide-react";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { compileWebSandbox } from "../utils/compiler";
import { evaluateRules } from "../utils/ruleEvaluator";
import { getLocal, getSession, setLocal, setSession, formatTime, resolveVal } from "../utils/storage";
import { runConfetti } from "../utils/confetti";

import SettingsDrawer from "../components/SettingsDrawer";
import OutputPanel from "../components/OutputPanel";
import ShortcutsModal from "../components/ShortcutsModal";
import WorkspaceEditor from "../components/WorkspaceEditor";
import ChallengeSidebar from "../components/ChallengeSidebar";

const DEFAULT_HTML = `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <title>PPA</title>\n    <link rel="stylesheet" href="style.css">\n  </head>\n  <body>\n    <script src="index.js"></script>\n  </body>\n</html>`;
const DEFAULT_CSS  = `body {\n  font-family: sans-serif;\n  margin: 20px;\n  background-color: #0f172a;\n  color: #f8fafc;\n}`;
const DEFAULT_JS   = `console.log("Hello from Javascript!");`;

const PlaygroundPage = () => {
  const handleRunCodeRef = useRef(null);
  const editorRef        = useRef(null);
  const diffEditorRef    = useRef(null);
  const containerRef     = useRef(null);
  const rightColumnRef   = useRef(null);
  const canvasRef        = useRef(null);

  // Layout
  const [layout, setLayout] = useState({
    col1Width:  getLocal("ppa_col1_width", 30),
    col2Width:  getLocal("ppa_col2_width", 45),
    col3Height: getLocal("ppa_col3_height", 55),
    dragging:   "none",
    isDesktop:  window.innerWidth > 1024
  });
  const { col1Width, col2Width, col3Height, dragging, isDesktop } = layout;
  const [sidebarCollapsed,   setSidebarCollapsed]   = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Editor prefs
  const [prefs, setPrefs] = useState({
    uiFontSize:  getLocal("ppa_setting_ui_fontsize", 14),
    autoCompile: getLocal("ppa_setting_autocompile", true),
    tabSize:     getLocal("ppa_setting_tabsize", 2),
    wordWrap:    "on",
    fontSize:    14,
    minimap:     false
  });
  const { uiFontSize, autoCompile, tabSize, wordWrap, fontSize, minimap } = prefs;

  // UI toggles
  const [ui, setUi] = useState({ settings: false, shortcuts: false, compiling: false, diff: false, celebrated: false, copied: false });
  const { settings: showSettings, shortcuts: showShortcutsModal, compiling: isCompiling, diff: diffView, celebrated, copied } = ui;

  // Challenge state
  const [challenge, setChallenge] = useState({
    questions:      getLocal("ppa_custom_challenges", DEFAULT_QUESTIONS),
    activeIndex:    0,
    validationResult: null,
    completedIds:   new Set(getLocal("ppa_completed_ids", [])),
    showExpected:   false,
    expectedSrcDoc: "",
    visibleHints:   {}
  });
  const { questions, activeIndex, validationResult, completedIds, showExpected: showExpectedPreview, expectedSrcDoc, visibleHints } = challenge;

  const [isAuthorMode] = useState(() => {
    try { const p = new URLSearchParams(window.location.search); return p.get("author") === "true" || p.get("creator") === "true"; }
    catch { return false; }
  });

  const [timeSpent,    setTimeSpent]    = useState(() => getSession("ppa_practice_time_spent", 0));
  const [timerRunning, setTimerRunning] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);

  const [htmlCode, setHtmlCode] = useState(() => getLocal("ppa_playground_html", DEFAULT_HTML));
  const [cssCode,  setCssCode]  = useState(() => getLocal("ppa_playground_css",  DEFAULT_CSS));
  const [webJsCode, setWebJsCode] = useState(() => getLocal("ppa_playground_webjs", DEFAULT_JS));

  const [webSubTab,    setWebSubTab]    = useState("html");
  const [srcDoc,       setSrcDoc]       = useState("");
  const [consoleLogs,  setConsoleLogs]  = useState([]);
  const [toasts,       setToasts]       = useState([]);

  const activeQuestion = questions[activeIndex] ?? null;

  const showToast = (message, type = "success") => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev; // deduplicate
      const id = Date.now();
      const next = [...prev, { id, message, type }].slice(-3); // max 3
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
      return next;
    });
  };

  const updatePref = (key, valOrFn) => setPrefs(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));
  const updateUi = (key, valOrFn) => setUi(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));
  const updateChallenge = (key, valOrFn) => setChallenge(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));


  // ── Effects ───────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setLayout(p => ({ ...p, isDesktop: window.innerWidth > 1024 }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimeSpent(prev => { const n = prev + 1; setSession("ppa_practice_time_spent", n); return n; }), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiFontSize}px`;
    setLocal("ppa_setting_ui_fontsize", uiFontSize);
    setLocal("ppa_setting_autocompile", autoCompile);
    setLocal("ppa_setting_tabsize", tabSize);
  }, [uiFontSize, autoCompile, tabSize]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "ppa_custom_challenges") {
        try { setChallenge(p => ({ ...p, questions: JSON.parse(e.newValue) })); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.source === "sandbox-web-iframe")
        setConsoleLogs(prev => { const n = [...prev, e.data]; return n.length > 80 ? n.slice(1) : n; });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); handleRunCodeRef.current?.(); }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d")    { e.preventDefault(); setUi(p => ({ ...p, diff: !p.diff })); }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k")    { e.preventDefault(); setUi(p => ({ ...p, shortcuts: !p.shortcuts })); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Live validation
  useEffect(() => {
    if (!activeQuestion) { setChallenge(p => ({ ...p, validationResult: null })); return; }
    const id = setTimeout(() => {
      const iframe   = document.querySelector(".preview-iframe");
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      setChallenge(p => ({ ...p, validationResult: evaluateRules(htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, iframeDoc) }));
    }, 350);
    return () => clearTimeout(id);
  }, [htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, srcDoc]);

  // Drag resize
  useEffect(() => {
    if (dragging === "none") return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (dragging === "col1") {
        const val = ((e.clientX - rect.left) / rect.width) * 100;
        if (val >= 15 && val <= 50) { setLayout(p => ({ ...p, col1Width: val })); setLocal("ppa_col1_width", val); }
      } else if (dragging === "col2") {
        const col2Val = ((e.clientX - rect.left) / rect.width) * 100 - (sidebarCollapsed ? 0 : col1Width);
        const totalVal = col2Val + (sidebarCollapsed ? 0 : col1Width);
        if (col2Val >= 20 && totalVal <= 85) { setLayout(p => ({ ...p, col2Width: col2Val })); setLocal("ppa_col2_width", col2Val); }
      } else if (dragging === "col3" && rightColumnRef.current) {
        const rRect = rightColumnRef.current.getBoundingClientRect();
        const val = ((e.clientY - rRect.top) / rRect.height) * 100;
        if (val >= 15 && val <= 85) { setLayout(p => ({ ...p, col3Height: val })); setLocal("ppa_col3_height", val); }
      }
    };
    const onUp = () => { setLayout(p => ({ ...p, dragging: "none" })); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.body.style.cursor     = (dragging === "col1" || dragging === "col2") ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [dragging, col1Width, sidebarCollapsed]);

  // Confetti
  useEffect(() => {
    if (!celebrated || !canvasRef.current) return;
    return runConfetti(canvasRef.current, () => {
      setUi(p => ({ ...p, celebrated: false }));
    });
  }, [celebrated]);

  useEffect(() => {
    if (validationResult?.success && !celebrated) {
      setUi(p => ({ ...p, celebrated: true }));
      showToast("🎉 Challenge Completed!", "success");
      if (activeQuestion) setChallenge(p => {
        const next = new Set(p.completedIds).add(activeQuestion.id);
        setLocal("ppa_completed_ids", Array.from(next));
        return { ...p, completedIds: next };
      });
    }
  }, [validationResult, celebrated, activeQuestion]);

  // ── Actions ───────────────────────────────────────────────
  const handleRunCode = useCallback(() => {
    setConsoleLogs([]);
    setUi(p => ({ ...p, compiling: true }));
    setTimeout(() => { setSrcDoc(compileWebSandbox(htmlCode, cssCode, webJsCode)); setUi(p => ({ ...p, compiling: false })); showToast("Built successfully!", "success"); }, 450);
  }, [htmlCode, cssCode, webJsCode]);

  useEffect(() => { handleRunCodeRef.current = handleRunCode; }, [handleRunCode]);

  const loadQuestion = (idx) => {
    if (idx < 0 || idx >= questions.length) return;
    const q = questions[idx];
    const h = q.initialHtml || DEFAULT_HTML, c = q.initialCss || DEFAULT_CSS, j = q.initialJs || DEFAULT_JS;
    setHtmlCode(h); setCssCode(c); setWebJsCode(j);
    setLocal("ppa_playground_html", h); setLocal("ppa_playground_css", c); setLocal("ppa_playground_webjs", j);
    setChallenge(p => ({ ...p, activeIndex: idx, visibleHints: {}, validationResult: null, showExpected: false, expectedSrcDoc: compileWebSandbox(q.solutionHtml || h, q.solutionCss || c, q.solutionJs || j) }));
    setUi(p => ({ ...p, celebrated: false }));
  };

  useEffect(() => { loadQuestion(0); setSrcDoc(compileWebSandbox(htmlCode, cssCode, webJsCode)); }, []);

  const handleEditorChange = (value = "") => {
    const suffix = activeQuestion ? `_${activeQuestion.id}` : "";
    if (webSubTab === "html") { setHtmlCode(value); setLocal(`ppa_playground_html${suffix}`, value); }
    else if (webSubTab === "css") { setCssCode(value); setLocal(`ppa_playground_css${suffix}`, value); }
    else { setWebJsCode(value); setLocal(`ppa_playground_webjs${suffix}`, value); }
  };

  const handleStepClick = (idx) => {
    if (!activeQuestion) return;
    const desc = activeQuestion.changesToBeDone[idx]?.toLowerCase() || "";
    let tab = "html", term = "";
    if (desc.includes("style") || desc.includes("css") || desc.includes("color") || desc.includes("background")) {
      tab = "css"; term = desc.includes("title") ? "#title" : desc.includes("stats") ? ".stats-grid" : desc.includes("card") ? ".stat-card" : "button";
    } else if (idx <= 3) {
      tab = "html"; term = desc.includes("stats") ? "stats-grid" : desc.includes("card") ? "stat-card" : "id=\"title\"";
    } else {
      tab = "js"; term = desc.includes("click") ? "addEventListener" : "items";
    }
    setWebSubTab(tab);
    if (editorRef.current && term) {
      setTimeout(() => {
        const model = editorRef.current.getModel();
        const match = model?.findMatches(term, true, false, false, null, true)?.[0];
        if (match) { editorRef.current.revealRangeInCenter(match.range); editorRef.current.setSelection(match.range); editorRef.current.focus(); }
      }, 150);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handleRunCodeRef.current?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyD, () => setUi(p => ({ ...p, diff: !p.diff })));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyK, () => setUi(p => ({ ...p, shortcuts: true })));
  };

  const handleDiffMount = (editor, monaco) => {
    diffEditorRef.current = editor;
    const mod = editor.getModifiedEditor();
    mod.onDidChangeModelContent(() => handleEditorChange(mod.getValue()));
    mod.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handleRunCodeRef.current?.());
    mod.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyD, () => setUi(p => ({ ...p, diff: !p.diff })));
  };

  const handleFormatCode = () => { editorRef.current?.trigger("fmt", "editor.action.formatDocument"); showToast("Code formatted!"); };
  const handleResetCode  = () => {
    if (!window.confirm("Reset editor to boilerplate?")) return;
    const h = activeQuestion?.initialHtml || DEFAULT_HTML, c = activeQuestion?.initialCss || DEFAULT_CSS, j = activeQuestion?.initialJs || DEFAULT_JS;
    setHtmlCode(h); setCssCode(c); setWebJsCode(j);
    setLocal("ppa_playground_html", h); setLocal("ppa_playground_css", c); setLocal("ppa_playground_webjs", j);
    showToast("Code reset", "info");
  };
  const handleCopyCode = () => {
    const code = webSubTab === "html" ? htmlCode : webSubTab === "css" ? cssCode : webJsCode;
    navigator.clipboard.writeText(code);
    setUi(p => ({ ...p, copied: true }));
    setTimeout(() => setUi(p => ({ ...p, copied: false })), 2000);
    showToast("Copied!", "success");
  };
  const handleSubmitPractice = () => {
    setAttemptsCount(prev => prev + 1);
    handleRunCode();
    setTimeout(() => {
      const iframeDoc = document.querySelector(".preview-iframe")?.contentDocument;
      const res = evaluateRules(htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, iframeDoc);
      showToast(res?.success ? "🎉 Challenge complete!" : "❌ Some tasks still failing. Keep going!", res?.success ? "success" : "error");
      if (res?.success) setUi(p => ({ ...p, celebrated: true }));
    }, 550);
  };

  const displayCol2Width = sidebarCollapsed ? col2Width * (100 / (100 - col1Width)) : col2Width;

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {showSettings && (
        <SettingsDrawer
          wordWrap={wordWrap}       setWordWrap={w => updatePref("wordWrap", w)}
          fontSize={fontSize}       setFontSize={f => updatePref("fontSize", f)}
          minimap={minimap}         setMinimap={m => updatePref("minimap", m)}
          uiFontSize={uiFontSize}   setUiFontSize={u => updatePref("uiFontSize", u)}
          autoCompile={autoCompile} setAutoCompile={a => updatePref("autoCompile", a)}
          tabSize={tabSize}         setTabSize={t => updatePref("tabSize", t)}
          onClose={() => updateUi("settings", false)}
        />
      )}

      <main ref={containerRef} className="playground-layout" style={{ height: "calc(100vh - 50px)", padding: 0 }}>

        {/* Column 1: Challenge Sidebar */}
        {!sidebarCollapsed && !isEditorFullscreen && (
          <div style={{ width: isDesktop ? `${col1Width}%` : "100%", height: "100%", position: "relative", flexShrink: 0, display: "flex" }}>
            <ChallengeSidebar
              isDesktop={isDesktop}
              sidebarWidth={col1Width}
              activeIndex={activeIndex}
              totalQuestions={questions.length}
              activeQuestion={activeQuestion}
              handleNavPrev={() => loadQuestion(activeIndex - 1)}
              handleNavNext={() => loadQuestion(activeIndex + 1)}
              validationResult={validationResult}
              handleStepClick={handleStepClick}
              isAuthorMode={isAuthorMode}
              visibleHints={visibleHints}
              toggleHint={idx => setChallenge(p => ({ ...p, visibleHints: { ...p.visibleHints, [idx]: !p.visibleHints[idx] } }))}
            />
          </div>
        )}

        {/* Collapsed sidebar expand tab */}
        {sidebarCollapsed && !isEditorFullscreen && isDesktop && (
          <div
            onClick={() => setSidebarCollapsed(false)}
            title="Expand Sidebar"
            className="sidebar-expand-tab"
          >
            ›
          </div>
        )}

        {/* Divider 1 */}
        {isDesktop && !sidebarCollapsed && !isEditorFullscreen && (
          <div
            className={`resize-divider ${dragging === "col1" ? "dragging" : ""}`}
            onMouseDown={e => { e.preventDefault(); setLayout(p => ({ ...p, dragging: "col1" })); }}
            style={{ position: "relative" }}
          >
            <div
              onClick={e => { e.stopPropagation(); setSidebarCollapsed(true); }}
              onMouseDown={e => e.stopPropagation()}
              title="Collapse Sidebar"
              className="divider-collapse-tab"
            >
              ‹
            </div>
          </div>
        )}

        {/* Column 2: Code Editor */}
        <div style={{ width: isDesktop ? (isEditorFullscreen ? "100%" : `${displayCol2Width}%`) : "100%", height: "100%", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <WorkspaceEditor
            isDesktop={isDesktop}
            webSubTab={webSubTab}         setWebSubTab={setWebSubTab}
            diffView={diffView}           setDiffView={d => updateUi("diff", d)}
            setShowShortcutsModal={s => updateUi("shortcuts", s)}
            handleFormatCode={handleFormatCode}
            handleCopyCode={handleCopyCode}  copied={copied}
            handleResetCode={handleResetCode}
            getMonacoLanguage={() => webSubTab === "js" ? "javascript" : webSubTab}
            getOriginalCode={() => webSubTab === "html" ? (activeQuestion?.initialHtml || DEFAULT_HTML) : webSubTab === "css" ? (activeQuestion?.initialCss || DEFAULT_CSS) : (activeQuestion?.initialJs || DEFAULT_JS)}
            getActiveCode={() => webSubTab === "html" ? htmlCode : webSubTab === "css" ? cssCode : webJsCode}
            handleEditorChange={handleEditorChange}
            handleEditorDidMount={handleEditorDidMount}
            handleDiffMount={handleDiffMount}
            fontSize={fontSize} wordWrap={wordWrap} minimap={minimap} tabSize={tabSize}
            isEditorFullscreen={isEditorFullscreen} setIsEditorFullscreen={setIsEditorFullscreen}
            setShowSettings={s => updateUi("settings", s)}
          />
        </div>

        {/* Divider 2 */}
        {isDesktop && !isEditorFullscreen && (
          <div className={`resize-divider ${dragging === "col2" ? "dragging" : ""}`} onMouseDown={e => { e.preventDefault(); setLayout(p => ({ ...p, dragging: "col2" })); }} />
        )}

        {/* Column 3: Output */}
        {!isEditorFullscreen && (
          <div ref={rightColumnRef} style={{ display: "flex", flexDirection: "column", flexGrow: 1, height: "100%", minWidth: 0, overflow: "hidden" }}>
            <OutputPanel
              srcDoc={srcDoc}
              consoleLogs={consoleLogs}     setConsoleLogs={setConsoleLogs}
              onRefresh={handleRunCode}
              isCompiling={isCompiling}
              expectedSrcDoc={expectedSrcDoc}
              showExpectedPreview={showExpectedPreview}
              setShowExpectedPreview={s => updateChallenge("showExpected", s)}
              hasActiveChallenge={!!activeQuestion}
              hideExpectedOption={!isAuthorMode}
              col3Height={col3Height}
              onDragStart={e => { e.preventDefault(); setLayout(p => ({ ...p, dragging: "col3" })); }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ height: "50px", backgroundColor: "#111827", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontFamily: "var(--ui-font)", color: "#ffffff", flexShrink: 0, userSelect: "none", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setTimerRunning(!timerRunning)} style={{ height: "32px", padding: "0 14px", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ffffff", fontSize: "0.78rem", fontWeight: 600 }} title={timerRunning ? "Pause timer" : "Start timer"}>
            <TimerIcon size={14} style={{ color: timerRunning ? "#10b981" : "#9ca3af" }} />
            <span style={{ color: timerRunning ? "#10b981" : "#ffffff", fontFamily: timerRunning ? "monospace" : "var(--ui-font)" }}>{timerRunning ? formatTime(timeSpent) : "Start Timer"}</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={handleResetCode} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#dc2626", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ffffff" }} title="Reset code"><RefreshCw size={14} /></button>
          <div style={{ height: "32px", padding: "0 12px", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", color: "#d1d5db", fontSize: "0.75rem", fontWeight: 600 }}>Attempts: {attemptsCount}</div>
          <button onClick={handleRunCode} style={{ height: "32px", padding: "0 16px", borderRadius: "6px", backgroundColor: "#ea580c", border: "none", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} title="Run (Ctrl+S)"><Play size={12} fill="#ffffff" /><span>Run</span></button>
          <button onClick={handleSubmitPractice} style={{ height: "32px", padding: "0 16px", borderRadius: "6px", backgroundColor: "#2563eb", border: "none", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} title="Submit"><Send size={12} style={{ transform: "rotate(-45deg)" }} /><span>Submit</span></button>
        </div>
      </footer>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast-item toast-${t.type || "info"}`}><span>{t.message}</span></div>)}
      </div>

      {/* Confetti canvas */}
      {celebrated && <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 999999 }} />}

      {showShortcutsModal && <ShortcutsModal showShortcutsModal={showShortcutsModal} setShowShortcutsModal={s => setUi(p => ({ ...p, shortcuts: s }))} />}
    </div>
  );
};

export default PlaygroundPage;
