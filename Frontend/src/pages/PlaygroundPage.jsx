import { useState, useEffect, useRef, useCallback, useId } from "react";
import { emmetHTML, emmetCSS } from "emmet-monaco-es";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { compileWebSandbox } from "../utils/compiler";
import { evaluateRules } from "../utils/ruleEvaluator";
import { getLocal, setLocal, resolveVal } from "../utils/storage";
import { getChallenges } from "../utils/pb";

import SettingsDrawer from "../components/SettingsDrawer";
import OutputPanel from "../components/OutputPanel";
import ShortcutsModal from "../components/ShortcutsModal";
import WorkspaceEditor from "../components/WorkspaceEditor";
import ChallengeSidebar from "../components/ChallengeSidebar";
import PlaygroundFooter from "../components/PlaygroundFooter";

import { useResizableLayout } from "../hooks/useResizableLayout";
import { useTimer } from "../hooks/useTimer";

const CODE_STORAGE_KEYS = {
  html: "ppa_playground_html",
  css: "ppa_playground_css",
  js: "ppa_playground_webjs"
};

const CONSOLE_MESSAGE_TYPES = new Set(["log", "info", "warn", "error"]);

const getChallengeCodeKey = (kind, questionId) => `${CODE_STORAGE_KEYS[kind]}_${questionId}`;

const getQuestionCode = (question, kind, fallback) => {
  if (!question?.id) return getLocal(CODE_STORAGE_KEYS[kind], fallback);
  return getLocal(getChallengeCodeKey(kind, question.id), fallback);
};

const DEFAULT_HTML = `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <title>PPA</title>\n    <link rel="stylesheet" href="style.css">\n  </head>\n  <body>\n    <script src="index.js"></script>\n  </body>\n</html>`;
const DEFAULT_CSS  = `body {\n  font-family: sans-serif;\n  margin: 20px;\n  background-color: #0f172a;\n  color: #f8fafc;\n}`;
const DEFAULT_JS   = `console.log("Hello from Javascript!");`;

const PlaygroundPage = () => {
  const handleRunCodeRef = useRef(null);
  const editorRef        = useRef(null);
  const diffEditorRef    = useRef(null);
  const sandboxToken     = useId();

  // Custom Hooks for Layout Resizing and Timer
  const {
    containerRef,
    rightColumnRef,
    col1Width,
    col2Width,
    col3Height,
    dragging,
    isDesktop,
    sidebarCollapsed,
    setSidebarCollapsed,
    startDragging
  } = useResizableLayout();

  const {
    timeSpent,
    timerRunning,
    setTimerRunning
  } = useTimer();

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
  const [ui, setUi] = useState({ settings: false, shortcuts: false, compiling: false, diff: false, copied: false });
  const { settings: showSettings, shortcuts: showShortcutsModal, compiling: isCompiling, diff: diffView, copied } = ui;

  // Challenge state
  const [challenge, setChallenge] = useState({
    questions:      getLocal("ppa_custom_challenges", DEFAULT_QUESTIONS).filter(q => q.type !== 'MCQ' && q.type !== 'Coding' && q.id !== 'js-counter-app'),
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


  const [htmlCode, setHtmlCode]   = useState(() => getLocal("ppa_playground_html", DEFAULT_HTML));
  const [cssCode,  setCssCode]    = useState(() => getLocal("ppa_playground_css",  DEFAULT_CSS));
  const [webJsCode, setWebJsCode] = useState(() => getLocal("ppa_playground_webjs", DEFAULT_JS));
  const initialCodeRef = useRef({ html: htmlCode, css: cssCode, js: webJsCode });

  const [webSubTab,   setWebSubTab]   = useState("html");
  const [srcDoc,      setSrcDoc]      = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [toasts,      setToasts]      = useState([]);

  const activeQuestion = questions[activeIndex] ?? null;

  const showToast = (message, type = "success") => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev;
      const id = Date.now();
      const next = [...prev, { id, message, type }].slice(-3);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
      return next;
    });
  };

  const updatePref      = (key, valOrFn) => setPrefs(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));
  const updateUi        = (key, valOrFn) => setUi(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));
  const updateChallenge = (key, valOrFn) => setChallenge(p => ({ ...p, [key]: resolveVal(valOrFn, p[key]) }));

  const persistCurrentCode = useCallback((kind, value, questionId = activeQuestion?.id) => {
    setLocal(CODE_STORAGE_KEYS[kind], value);
    if (questionId) setLocal(getChallengeCodeKey(kind, questionId), value);
  }, [activeQuestion?.id]);

  // ── Effects ───────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiFontSize}px`;
    setLocal("ppa_setting_ui_fontsize", uiFontSize);
    setLocal("ppa_setting_autocompile", autoCompile);
    setLocal("ppa_setting_tabsize", tabSize);
  }, [uiFontSize, autoCompile, tabSize]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "ppa_custom_challenges") {
        try {
          setChallenge(p => ({ ...p, questions: JSON.parse(e.newValue) }));
        } catch {
          setChallenge(p => ({ ...p, questions: DEFAULT_QUESTIONS }));
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await getChallenges();
      setChallenge(p => ({ ...p, questions: data }));
    };
    load();
  }, []);


  useEffect(() => {
    const onMsg = (e) => {
      const iframeWindow = document.querySelector(".preview-iframe")?.contentWindow;
      const data = e.data;
      if (
        e.source === iframeWindow &&
        data?.source === "sandbox-web-iframe" &&
        data?.token === sandboxToken &&
        CONSOLE_MESSAGE_TYPES.has(data.type) &&
        typeof data.message === "string"
      ) {
        setConsoleLogs(prev => {
          const n = [...prev, { type: data.type, message: data.message, time: String(data.time || "") }];
          return n.length > 80 ? n.slice(1) : n;
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [sandboxToken]);

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
    if (!activeQuestion) {
      queueMicrotask(() => {
        setChallenge(p => p.validationResult ? ({ ...p, validationResult: null }) : p);
      });
      return;
    }
    const id = setTimeout(() => {
      const iframe    = document.querySelector(".preview-iframe");
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      setChallenge(p => ({ ...p, validationResult: evaluateRules(htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, iframeDoc) }));
    }, 350);
    return () => clearTimeout(id);
  }, [htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, srcDoc]);

  useEffect(() => {
    if (validationResult?.success && activeQuestion && !completedIds.has(activeQuestion.id)) {
      queueMicrotask(() => {
        showToast("🎉 Challenge Completed!", "success");
        setChallenge(p => {
          const next = new Set(p.completedIds).add(activeQuestion.id);
          setLocal("ppa_completed_ids", Array.from(next));
          return { ...p, completedIds: next };
        });
      });
    }
  }, [validationResult, completedIds, activeQuestion]);

  // ── Actions ───────────────────────────────────────────────
  const handleRunCode = useCallback(() => {
    setConsoleLogs([]);
    setUi(p => ({ ...p, compiling: true }));
    setTimeout(() => { 
      setSrcDoc(compileWebSandbox(htmlCode, cssCode, webJsCode, sandboxToken)); 
      setUi(p => ({ ...p, compiling: false })); 
      showToast("Built successfully!", "success"); 

      // Run tests and log results to console after the iframe has rendered
      setTimeout(() => {
        const iframe    = document.querySelector(".preview-iframe");
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const res = evaluateRules(htmlCode, cssCode, webJsCode, [], activeQuestion, iframeDoc);
        
        const testLogs = [];
        testLogs.push({ type: "info", message: "Running tests...", time: "" });
        
        if (activeQuestion?.changesToBeDone?.length > 0) {
          activeQuestion.changesToBeDone.forEach((change, idx) => {
            const stepResult = res.stepResults?.[idx];
            const hasRule = activeQuestion.rules?.some((r, rIdx) => (r.stepIndex ?? Math.min(rIdx, activeQuestion.changesToBeDone.length - 1)) === idx);
            const isPassed = hasRule ? stepResult?.success : res.success;
            
            if (isPassed) {
              testLogs.push({
                type: "success",
                message: `✓ Test ${idx + 1} passed: ${change}`,
                time: ""
              });
            } else {
              const errMsg = (stepResult?.messages && stepResult.messages[0]) || "Test failed or requirements missing.";
              testLogs.push({
                type: "error",
                message: `✗ Test ${idx + 1} failed: ${change}\n  └─ ${errMsg}`,
                time: ""
              });
            }
          });
        }
        
        if (res.success) {
          testLogs.push({
            type: "success",
            message: `🎉 All tests passed successfully!`,
            time: ""
          });
        } else {
          testLogs.push({
            type: "error",
            message: `❌ Some tests are failing or missing. Please check the checklist and try again.`,
            time: ""
          });
        }
        
        setConsoleLogs(prev => [...prev, ...testLogs]);
      }, 500); // 500ms after srcDoc is set to allow iframe loading
    }, 450);
  }, [htmlCode, cssCode, webJsCode, sandboxToken, activeQuestion]);

  useEffect(() => { handleRunCodeRef.current = handleRunCode; }, [handleRunCode]);

  const loadQuestion = useCallback((idx) => {
    if (idx < 0 || idx >= questions.length) return;
    const q = questions[idx];
    const h = getQuestionCode(q, "html", q.initialHtml || DEFAULT_HTML);
    const c = getQuestionCode(q, "css",  q.initialCss  || DEFAULT_CSS);
    const j = getQuestionCode(q, "js",   q.initialJs   || DEFAULT_JS);
    setHtmlCode(h); setCssCode(c); setWebJsCode(j);
    setLocal("ppa_playground_html", h); setLocal("ppa_playground_css", c); setLocal("ppa_playground_webjs", j);
    
    // Reset console and preview to fresh state for the new question
    setConsoleLogs([]);
    setSrcDoc(compileWebSandbox(h, c, j, sandboxToken));

    setChallenge(p => ({ ...p, activeIndex: idx, visibleHints: {}, validationResult: null, showExpected: false, expectedSrcDoc: compileWebSandbox(q.solutionHtml || h, q.solutionCss || c, q.solutionJs || j, sandboxToken) }));
  }, [questions, sandboxToken]);

  useEffect(() => {
    queueMicrotask(() => {
      loadQuestion(0);
      setSrcDoc(compileWebSandbox(initialCodeRef.current.html, initialCodeRef.current.css, initialCodeRef.current.js, sandboxToken));
    });
  }, [loadQuestion, sandboxToken]);

  const handleEditorChange = (value = "") => {
    if (webSubTab === "html") { setHtmlCode(value); persistCurrentCode("html", value); }
    else if (webSubTab === "css") { setCssCode(value); persistCurrentCode("css", value); }
    else { setWebJsCode(value); persistCurrentCode("js", value); }
  };

  const handleStepClick = (idx) => {
    if (!activeQuestion) return;
    const desc = activeQuestion.changesToBeDone[idx]?.toLowerCase() || "";
    let term = "";
    if (desc.includes("style") || desc.includes("css") || desc.includes("color") || desc.includes("background")) {
      term = desc.includes("title") ? "#title" : desc.includes("stats") ? ".stats-grid" : desc.includes("card") ? ".stat-card" : "button";
      setWebSubTab("css");
    } else if (idx <= 3) {
      term = desc.includes("stats") ? "stats-grid" : desc.includes("card") ? "stat-card" : "id=\"title\"";
      setWebSubTab("html");
    } else {
      term = desc.includes("click") ? "addEventListener" : "items";
      setWebSubTab("js");
    }
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

    // Register Emmet autocomplete extension
    try {
      emmetHTML(monaco, ["html"]);
      emmetCSS(monaco, ["css"]);
    } catch (e) {
      console.error("Failed to load Emmet:", e);
    }

    // Custom extension: Auto-close HTML tags
    editor.onDidType((text) => {
      if (text === ">") {
        const position = editor.getPosition();
        if (!position) return;
        const model = editor.getModel();
        if (!model) return;
        const lang = model.getLanguageId ? model.getLanguageId() : (model.getModeId ? model.getModeId() : "html");
        if (lang !== "html") return;

        const line = model.getLineContent(position.lineNumber);
        const textBefore = line.substring(0, position.column - 1);
        const match = textBefore.match(/<([a-zA-Z1-6-]+)(?:\s+[^>\/]*)*>$/);
        if (!match) return;

        const tagName = match[1];
        const voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
        if (voidElements.includes(tagName.toLowerCase())) return;

        const closingTag = `</${tagName}>`;
        editor.executeEdits("auto-close-tag", [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: closingTag,
            forceMoveMarkers: true,
          },
        ]);
        editor.setPosition(position);
      }
    });

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
    persistCurrentCode("html", h);
    persistCurrentCode("css", c);
    persistCurrentCode("js", j);
    showToast("Code reset", "info");
  };
  const handleCopyCode = () => {
    const code = webSubTab === "html" ? htmlCode : webSubTab === "css" ? cssCode : webJsCode;
    navigator.clipboard.writeText(code);
    setUi(p => ({ ...p, copied: true }));
    setTimeout(() => setUi(p => ({ ...p, copied: false })), 2000);
    showToast("Copied!", "success");
  };

  const displayCol2Width = sidebarCollapsed ? col2Width * (100 / (100 - col1Width)) : col2Width;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-bg-primary">
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
              expectedSrcDoc={expectedSrcDoc}
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
            onMouseDown={e => { e.preventDefault(); startDragging("col1"); }}
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
          <div className={`resize-divider ${dragging === "col2" ? "dragging" : ""}`} onMouseDown={e => { e.preventDefault(); startDragging("col2"); }} />
        )}

        {/* Column 3: Output */}
        {!isEditorFullscreen && (
          <div ref={rightColumnRef} className="flex flex-col grow h-full min-w-0 overflow-hidden">
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
              onDragStart={e => { e.preventDefault(); startDragging("col3"); }}
            />
          </div>
        )}
      </main>

      {/* Footer Component */}
      <PlaygroundFooter 
        timerRunning={timerRunning}
        setTimerRunning={setTimerRunning}
        timeSpent={timeSpent}
        onResetCode={handleResetCode}
        onRunCode={handleRunCode}
      />

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast-item toast-${t.type || "info"}`}><span>{t.message}</span></div>)}
      </div>

      {showShortcutsModal && <ShortcutsModal showShortcutsModal={showShortcutsModal} setShowShortcutsModal={s => setUi(p => ({ ...p, shortcuts: s }))} />}
    </div>
  );
};

export default PlaygroundPage;
