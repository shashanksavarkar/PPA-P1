import React, { useState, useEffect, useRef } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { 
  Check, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  ListTodo,
  CheckCircle,
  XCircle,
  Play,
  HelpCircle,
  GitCompare,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";

// Local templates defined directly
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>PPA</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <script src="index.js"></script>
  </body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: sans-serif;
  margin: 20px;
  background-color: #0f172a;
  color: #f8fafc;
}`;

const DEFAULT_WEB_JS = `console.log("Hello from Javascript!");`;

import QUESTIONS from "./constants/challenges.json";
import { compileWebSandbox } from "./utils/compiler";

import Header from "./components/Header";
import SettingsDrawer from "./components/SettingsDrawer";
import OutputPanel from "./components/OutputPanel";
import { evaluateRules } from "./utils/ruleEvaluator";

const App = () => {
  // Ref to hold the latest compilation run handler
  const handleRunCodeRef = useRef(null);

  // Ref to hold the Monaco Editor instance for programmatic formatting
  const editorRef = useRef(null);
  
  // Resizable panels state hooks (three columns)
  const [sidebarWidth, setSidebarWidth] = useState(23);
  const [editorWidth, setEditorWidth] = useState(50);
  const [draggingDivider, setDraggingDivider] = useState("none"); // "none" | "sidebar" | "editor"
  const containerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth > 1024 : true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Active selected challenge — driven by index for Prev/Next navigation
  const [activeIndex, setActiveIndex] = useState(null); // null = no challenge selected
  const activeQuestion = activeIndex !== null ? QUESTIONS[activeIndex] : null;
  const [validationResult, setValidationResult] = useState(null);

  // Track which challenge IDs have been fully completed
  const [completedIds, setCompletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ppa_completed_ids") || "[]"));
    } catch(e) { return new Set(); }
  });

  // Expected Output Preview toggle
  const [showExpectedPreview, setShowExpectedPreview] = useState(false);
  const [expectedSrcDoc, setExpectedSrcDoc] = useState("");

  // Independent code values for each file
  const [htmlCode, setHtmlCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_html") || DEFAULT_HTML; } catch(e) { return DEFAULT_HTML; }
  });
  const [cssCode, setCssCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_css") || DEFAULT_CSS; } catch(e) { return DEFAULT_CSS; }
  });
  const [webJsCode, setWebJsCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_webjs") || DEFAULT_WEB_JS; } catch(e) { return DEFAULT_WEB_JS; }
  });
  
  // Active sub-tab under "web" project
  const [webSubTab, setWebSubTab] = useState("html");
  
  // Compiler / Output states
  const [srcDoc, setSrcDoc] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]); // Array for web project iframe console
  
  // General setting preferences
  const [wordWrap, setWordWrap] = useState("on");
  const [fontSize, setFontSize] = useState(14);
  const [minimap, setMinimap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleMaximized, setConsoleMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // More interactive preferences & workspace states
  const [uiFontSize, setUiFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("ppa_setting_ui_fontsize") || "14", 10); } catch(e) { return 14; }
  });
  const [uiTheme, setUiTheme] = useState(() => {
    try { return localStorage.getItem("ppa_setting_ui_theme") || "dark"; } catch(e) { return "dark"; }
  });
  const [editorTheme, setEditorTheme] = useState(() => {
    try { return localStorage.getItem("ppa_setting_editor_theme") || (uiTheme === "dark" ? "vs-dark" : "light"); } catch(e) { return "vs-dark"; }
  });
  const [autoCompile, setAutoCompile] = useState(() => {
    try { return localStorage.getItem("ppa_setting_autocompile") !== "false"; } catch(e) { return true; }
  });
  const [tabSize, setTabSize] = useState(() => {
    try { return parseInt(localStorage.getItem("ppa_setting_tabsize") || "2", 10); } catch(e) { return 2; }
  });
  const [visibleHints, setVisibleHints] = useState({});
  const [celebrated, setCelebrated] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [diffView, setDiffView] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const diffEditorRef = useRef(null);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    try { localStorage.setItem("ppa_setting_ui_theme", uiTheme); } catch(e){}
    document.documentElement.setAttribute("data-theme", uiTheme);
    setEditorTheme(uiTheme === "dark" ? "vs-dark" : "light");
  }, [uiTheme]);

  useEffect(() => {
    try { localStorage.setItem("ppa_setting_ui_fontsize", uiFontSize.toString()); } catch(e){}
  }, [uiFontSize]);

  useEffect(() => {
    try { localStorage.setItem("ppa_setting_editor_theme", editorTheme); } catch(e){}
  }, [editorTheme]);

  useEffect(() => {
    try { localStorage.setItem("ppa_setting_autocompile", autoCompile.toString()); } catch(e){}
  }, [autoCompile]);

  useEffect(() => {
    try { localStorage.setItem("ppa_setting_tabsize", tabSize.toString()); } catch(e){}
  }, [tabSize]);

  // Root element font size setter for scaling all rem values dynamically
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiFontSize}px`;
  }, [uiFontSize]);


  const toggleHint = (idx) => {
    setVisibleHints(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleStepClick = (idx) => {
    if (!activeQuestion) return;
    const changeDesc = activeQuestion.changesToBeDone[idx]?.toLowerCase() || "";
    let targetTab = "html";
    let searchTerm = "";

    if (changeDesc.includes("style") || changeDesc.includes("css") || changeDesc.includes("color") || changeDesc.includes("background")) {
      targetTab = "css";
      if (changeDesc.includes("title")) searchTerm = "#title";
      else if (changeDesc.includes("stats") || changeDesc.includes("grid")) searchTerm = ".stats-grid";
      else if (changeDesc.includes("card")) searchTerm = ".stat-card";
      else if (changeDesc.includes("button") || changeDesc.includes("btn")) searchTerm = "button";
    } else if (idx <= 3) {
      targetTab = "html";
      if (changeDesc.includes("stats") || changeDesc.includes("grid")) searchTerm = "stats-grid";
      else if (changeDesc.includes("card")) searchTerm = "stat-card";
      else if (changeDesc.includes("dashboard")) searchTerm = "dashboard";
      else if (changeDesc.includes("title")) searchTerm = "id=\"title\"";
    } else {
      targetTab = "js";
      if (changeDesc.includes("add") || changeDesc.includes("click")) searchTerm = "addEventListener";
      else if (changeDesc.includes("array") || changeDesc.includes("list")) searchTerm = "items";
    }

    setWebSubTab(targetTab);

    // Focus and highlight term inside Monaco
    if (editorRef.current && searchTerm) {
      setTimeout(() => {
        const model = editorRef.current.getModel();
        if (model) {
          const matches = model.findMatches(searchTerm, true, false, false, null, true);
          if (matches && matches.length > 0) {
            const match = matches[0];
            editorRef.current.revealRangeInCenter(match.range);
            editorRef.current.setSelection(match.range);
            editorRef.current.focus();
            showToast(`Focused target segment: "${searchTerm}"`, "info");
          }
        }
      }, 150);
    }
  };

  // Run compiling script
  const handleRunCode = () => {
    setConsoleLogs([]); // reset browser console
    setIsCompiling(true);
    setTimeout(() => {
      const compiled = compileWebSandbox(htmlCode, cssCode, webJsCode);
      setSrcDoc(compiled);
      setIsCompiling(false);
      showToast("Sandbox built successfully!", "success");
    }, 450);
  };

  // Load a challenge by index
  const loadQuestion = (idx) => {
    if (idx === null || idx < 0 || idx >= QUESTIONS.length) return;
    const q = QUESTIONS[idx];
    setCelebrated(false);
    setVisibleHints({});
    setValidationResult(null);
    setShowExpectedPreview(false);
    const targetHtml = q.initialHtml || DEFAULT_HTML;
    const targetCss = q.initialCss || DEFAULT_CSS;
    const targetJs = q.initialJs || DEFAULT_WEB_JS;
    setHtmlCode(targetHtml);
    setCssCode(targetCss);
    setWebJsCode(targetJs);
    // Build expected output from solution fields if present, otherwise initial code
    const expHtml = q.solutionHtml || targetHtml;
    const expCss  = q.solutionCss  || targetCss;
    const expJs   = q.solutionJs   || targetJs;
    setExpectedSrcDoc(compileWebSandbox(expHtml, expCss, expJs));
    try {
      localStorage.setItem("ppa_playground_html", targetHtml);
      localStorage.setItem("ppa_playground_css", targetCss);
      localStorage.setItem("ppa_playground_webjs", targetJs);
    } catch(e){}
    setActiveIndex(idx);
  };

  const handleNavPrev = () => {
    if (activeIndex === null) { loadQuestion(QUESTIONS.length - 1); return; }
    if (activeIndex > 0) loadQuestion(activeIndex - 1);
  };

  const handleNavNext = () => {
    if (activeIndex === null) { loadQuestion(0); return; }
    if (activeIndex < QUESTIONS.length - 1) loadQuestion(activeIndex + 1);
  };

  // Keep compiler trigger ref updated to prevent stale closures
  useEffect(() => {
    handleRunCodeRef.current = handleRunCode;
  }, [htmlCode, cssCode, webJsCode]);

  // Window-level Ctrl+S, Ctrl+Alt+D, Ctrl+Alt+K listener
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (handleRunCodeRef.current) {
          handleRunCodeRef.current();
        }
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDiffView(prev => !prev);
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  // Run validation whenever code changes, console logs update, or the preview source is compiled (debounced to avoid typing lag)
  useEffect(() => {
    if (!activeQuestion) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      const iframe = document.querySelector(".preview-iframe");
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const result = evaluateRules(htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, iframeDoc);
      setValidationResult(result);
    }, 350);

    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion, srcDoc]);

  // Mouse handlers for panel resizer
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    setDraggingDivider("sidebar");
  };

  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    setDraggingDivider("editor");
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current || draggingDivider === "none") return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      
      if (draggingDivider === "sidebar") {
        // Constrain sidebar width between 15% and 40%
        if (clientXPercent >= 15 && clientXPercent <= 40) {
          setSidebarWidth(clientXPercent);
        }
      } else if (draggingDivider === "editor") {
        // Constrain editor width such that output has at least 20%
        const minEditorX = sidebarWidth + 15;
        const maxEditorX = 80;
        if (clientXPercent >= minEditorX && clientXPercent <= maxEditorX) {
          setEditorWidth(clientXPercent - sidebarWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingDivider("none");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (draggingDivider !== "none") {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingDivider, sidebarWidth]);

  // Trigger Monaco's programmatic formatting provider
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger("format-action", "editor.action.formatDocument");
      showToast("Code formatted!", "success");
    }
  };

  // Reset current environment to default boilerplate
  const handleResetCode = () => {
    const confirmMsg = activeQuestion 
      ? `Are you sure you want to reset the editor to the boilerplate for "${activeQuestion.title}"?`
      : "Are you sure you want to reset the editor to the default HTML/CSS boilerplate?";

    if (window.confirm(confirmMsg)) {
      const targetHtml = activeQuestion?.initialHtml || DEFAULT_HTML;
      const targetCss = activeQuestion?.initialCss || DEFAULT_CSS;
      const targetJs = activeQuestion?.initialJs || DEFAULT_WEB_JS;

      setHtmlCode(targetHtml);
      setCssCode(targetCss);
      setWebJsCode(targetJs);
      try {
        localStorage.setItem("ppa_playground_html", targetHtml);
        localStorage.setItem("ppa_playground_css", targetCss);
        localStorage.setItem("ppa_playground_webjs", targetJs);
      } catch(err){}
      showToast("Code reset to template", "info");
    }
  };

  // Monaco Editor keybinding registration for Ctrl+S
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (handleRunCodeRef.current) {
        handleRunCodeRef.current();
      }
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyD, () => {
      setDiffView(prev => !prev);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyK, () => {
      setShowShortcutsModal(true);
    });
  };

  // Frame message listener for browser console logs
  useEffect(() => {
    const handleFrameMsg = (e) => {
      if (e.data && e.data.source === 'sandbox-web-iframe') {
        setConsoleLogs((prev) => {
          const fresh = [...prev, e.data];
          return fresh.length > 80 ? fresh.slice(1) : fresh;
        });
      }
    };
    window.addEventListener("message", handleFrameMsg);
    return () => window.removeEventListener("message", handleFrameMsg);
  }, []);

  const getOriginalCode = () => {
    if (webSubTab === "html") return activeQuestion?.initialHtml || DEFAULT_HTML;
    if (webSubTab === "css") return activeQuestion?.initialCss || DEFAULT_CSS;
    return activeQuestion?.initialJs || DEFAULT_WEB_JS;
  };

  const handleDiffMount = (editor, monaco) => {
    diffEditorRef.current = editor;
    const modifiedEditor = editor.getModifiedEditor();
    modifiedEditor.onDidChangeModelContent(() => {
      handleEditorChange(modifiedEditor.getValue());
    });
    modifiedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (handleRunCodeRef.current) {
        handleRunCodeRef.current();
      }
    });
    modifiedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyD, () => {
      setDiffView(prev => !prev);
    });
    modifiedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyK, () => {
      setShowShortcutsModal(true);
    });
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!celebrated || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        if (p.y < canvas.height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        animationId = requestAnimationFrame(draw);
      } else {
        setCelebrated(false);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [celebrated]);

  useEffect(() => {
    if (validationResult && validationResult.success && !celebrated) {
      setCelebrated(true);
      showToast("🎉 Challenge Completed successfully! 🎉", "success");
      // Persist completed challenge ID
      if (activeQuestion) {
        setCompletedIds(prev => {
          const next = new Set(prev);
          next.add(activeQuestion.id);
          try { localStorage.setItem("ppa_completed_ids", JSON.stringify([...next])); } catch(e){}
          return next;
        });
      }
    }
  }, [validationResult, celebrated]);

  // Return currently focused Monaco Editor value
  const getActiveCode = () => {
    if (webSubTab === "html") return htmlCode;
    if (webSubTab === "css") return cssCode;
    return webJsCode;
  };

  // Sync values edited in Monaco
  const handleEditorChange = (value) => {
    const code = value || "";
    const suffix = activeQuestion ? `_${activeQuestion.id}` : "";
    if (webSubTab === "html") {
      setHtmlCode(code);
      try { localStorage.setItem(`ppa_playground_html${suffix}`, code); } catch(e){}
    } else if (webSubTab === "css") {
      setCssCode(code);
      try { localStorage.setItem(`ppa_playground_css${suffix}`, code); } catch(e){}
    } else {
      setWebJsCode(code);
      try { localStorage.setItem(`ppa_playground_webjs${suffix}`, code); } catch(e){}
    }
  };

  // Language translation helper for Monaco Editor component
  const getMonacoLanguage = () => {
    if (webSubTab === "html") return "html";
    if (webSubTab === "css") return "css";
    return "javascript";
  };

  // Copy code utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Code copied to clipboard!", "success");
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header component */}
      <Header 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        handleRunCode={handleRunCode}
        uiTheme={uiTheme}
        setUiTheme={setUiTheme}
      />

      {/* Preferences flyout */}
      {showSettings && (
        <SettingsDrawer 
          wordWrap={wordWrap}
          setWordWrap={setWordWrap}
          fontSize={fontSize}
          setFontSize={setFontSize}
          minimap={minimap}
          setMinimap={setMinimap}
          uiFontSize={uiFontSize}
          setUiFontSize={setUiFontSize}
          editorTheme={editorTheme}
          setEditorTheme={setEditorTheme}
          autoCompile={autoCompile}
          setAutoCompile={setAutoCompile}
          tabSize={tabSize}
          setTabSize={setTabSize}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Main Panel Layout */}
      <main ref={containerRef} className="playground-layout">
        {/* Left Side Panel: Coding Challenges list & active description */}
        <div 
          className="modern-card challenges-sidebar"
          style={{
            width: isDesktop ? `${sidebarWidth}%` : "100%",
            flexShrink: 0,
            flexGrow: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0
          }}
        >
          {/* ── Challenge Navigator Header ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 className="font-ui panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
                <Trophy size={16} style={{ color: "var(--accent-color)" }} />
                <span>CHALLENGES</span>
              </h2>
              {/* Prev / Next nav */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={handleNavPrev}
                  disabled={activeIndex === 0}
                  className="btn-minimal"
                  style={{ padding: "4px 8px", opacity: activeIndex === 0 ? 0.35 : 1 }}
                  title="Previous Question"
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, minWidth: "52px", textAlign: "center" }}>
                  {activeIndex !== null ? `Q ${activeIndex + 1} / ${QUESTIONS.length}` : `${QUESTIONS.length} Qs`}
                </span>
                <button
                  onClick={handleNavNext}
                  disabled={activeIndex === QUESTIONS.length - 1}
                  className="btn-minimal"
                  style={{ padding: "4px 8px", opacity: activeIndex === QUESTIONS.length - 1 ? 0.35 : 1 }}
                  title="Next Question"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Challenge list with status badges */}
            <div className="challenge-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {QUESTIONS.map((q, qIdx) => {
                const isActive = activeIndex === qIdx;
                const isDone   = completedIds.has(q.id);
                const isInProgress = !isDone && activeIndex === qIdx && validationResult && !validationResult.success;
                // Status badge
                let badgeLabel = "Not Started";
                let badgeColor = "var(--text-secondary)";
                let badgeBg   = "var(--bg-quaternary)";
                if (isDone) { badgeLabel = "✓ Done"; badgeColor = "var(--neon-green)"; badgeBg = "rgba(16,185,129,0.12)"; }
                else if (isActive && validationResult) { badgeLabel = "In Progress"; badgeColor = "#f59e0b"; badgeBg = "rgba(245,158,11,0.12)"; }

                return (
                  <div
                    key={q.id}
                    className={`challenge-item ${isActive ? "active" : ""}`}
                    onClick={() => loadQuestion(qIdx)}
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: isDone ? "rgba(16,185,129,0.3)" : isActive ? "var(--accent-color)" : "var(--border-color)",
                      backgroundColor: isDone ? "rgba(16,185,129,0.05)" : isActive ? "rgba(59,130,246,0.08)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>Q{qIdx + 1}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isActive ? "white" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                        <span className={`challenge-difficulty ${q.difficulty.toLowerCase()}`} style={{ fontSize: "0.65rem", fontWeight: 600, padding: "1px 5px", borderRadius: "3px" }}>{q.difficulty}</span>
                        <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 5px", borderRadius: "3px", backgroundColor: badgeBg, color: badgeColor, whiteSpace: "nowrap" }}>{badgeLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-color)" }} />

          {/* Active Question detail section */}
          <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", minHeight: 0 }}>
            {activeQuestion ? (
              <>
                {/* Progress Bar */}
                {(() => {
                  const totalSteps = activeQuestion.changesToBeDone.length;
                  let passedSteps = 0;
                  if (validationResult && validationResult.stepResults) {
                    passedSteps = Object.values(validationResult.stepResults).filter(r => r.success).length;
                  }
                  const progressPercent = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;
                  return (
                    <div style={{ padding: "4px 0", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        <span>CHALLENGE PROGRESS</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                        <div style={{
                          width: `${progressPercent}%`,
                          height: "100%",
                          background: progressPercent === 100 ? "var(--neon-green)" : "linear-gradient(90deg, var(--accent-color), var(--neon-green))",
                          boxShadow: progressPercent > 0 ? (progressPercent === 100 ? "0 0 10px var(--neon-green)" : "0 0 8px var(--accent-color)") : "none",
                          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease"
                        }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Question Statement */}
                <div>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", marginBottom: "6px" }}>
                    <BookOpen size={14} style={{ color: "var(--accent-color)" }} />
                    <span>Question Statement</span>
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {activeQuestion.description}
                  </p>
                </div>

                {/* What changes are supposed to be done */}
                <div>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", marginBottom: "6px" }}>
                    <ListTodo size={14} style={{ color: "var(--accent-color)" }} />
                    <span>Required Tasks</span>
                  </h3>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none" }}>
                    {activeQuestion.changesToBeDone.map((change, idx) => {
                      const stepResult = validationResult?.stepResults?.[idx];
                      let stepIcon = <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>○</span>;
                      let textColor = "var(--text-secondary)";

                      const hasRule = activeQuestion.rules?.some((r, rIdx) => {
                        const sIdx = r.stepIndex !== undefined ? r.stepIndex : Math.min(rIdx, activeQuestion.changesToBeDone.length - 1);
                        return sIdx === idx;
                      });

                      if (hasRule) {
                        if (stepResult) {
                          if (stepResult.success) {
                            stepIcon = <Check size={14} style={{ color: "var(--neon-green)" }} />;
                            textColor = "var(--text-primary)";
                          } else {
                            stepIcon = <XCircle size={14} style={{ color: "var(--neon-red)" }} />;
                            textColor = "var(--neon-red)";
                          }
                        }
                      } else {
                        if (validationResult && validationResult.success) {
                          stepIcon = <Check size={14} style={{ color: "var(--neon-green)" }} />;
                          textColor = "var(--text-primary)";
                        } else {
                          stepIcon = <span style={{ color: "var(--text-secondary)", fontSize: "0.6rem", display: "inline-block", transform: "translateY(-1px)" }}>●</span>;
                          textColor = "var(--text-secondary)";
                        }
                      }

                      const hintText = activeQuestion.hints?.[idx];

                      return (
                        <li key={idx} 
                          onClick={() => handleStepClick(idx)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            fontSize: "0.75rem",
                            color: textColor,
                            lineHeight: "1.4",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                            paddingBottom: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease"
                          }}
                          className="hover-bg-highlight"
                          title="Click to focus relevant file in editor"
                        >
                          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ display: "flex", alignItems: "center", height: "18px" }}>{stepIcon}</span>
                            <div style={{ flexGrow: 1 }}>
                              <span>{change}</span>
                              {stepResult && !stepResult.success && stepResult.messages.length > 0 && (
                                <div style={{ fontSize: "0.7rem", color: "var(--neon-red)", marginTop: "2px", fontWeight: 400, opacity: 0.85 }}>
                                  {stepResult.messages[0]}
                                </div>
                              )}
                            </div>
                            {hintText && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleHint(idx); }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: visibleHints[idx] ? "var(--accent-color)" : "var(--text-secondary)",
                                  cursor: "pointer",
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.75
                                }}
                                title="Show Hint"
                              >
                                <HelpCircle size={13} />
                              </button>
                            )}
                          </div>
                          {visibleHints[idx] && hintText && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                marginTop: "6px",
                                padding: "8px 10px",
                                backgroundColor: "var(--bg-quaternary)",
                                borderLeft: "2px solid var(--accent-color)",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                color: "var(--text-primary)",
                                lineHeight: "1.35",
                                cursor: "default"
                              }}
                            >
                              <span style={{ fontWeight: 600, display: "block", marginBottom: "2px", color: "var(--accent-color)" }}>HELPFUL HINT:</span>
                              {hintText}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Run Tests Button */}
                <button
                  onClick={handleRunCode}
                  className="btn-minimal"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    marginTop: "auto",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    borderColor: "rgba(59, 130, 246, 0.25)",
                    color: "var(--accent-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  <Play size={12} fill="var(--accent-color)" />
                  <span>Run Tests (Ctrl+S)</span>
                </button>

                {/* Validation status feedback */}
                {validationResult && (
                  <div 
                    style={{
                      display: "flex",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      marginTop: "8px",
                      backgroundColor: validationResult.success ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: validationResult.success ? "var(--neon-green)" : "var(--neon-red)",
                      border: "1px solid",
                      borderColor: validationResult.success ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
                    }}
                  >
                    <span style={{ marginTop: "1px" }}>
                      {validationResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, display: "block" }}>{validationResult.success ? "SUCCESS:" : "PENDING:"}</span>
                      <span>{validationResult.message}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", gap: "12px", padding: "20px", textAlign: "center" }}>
                <Award size={36} style={{ color: "var(--border-hover)" }} />
                <p style={{ fontSize: "0.8rem" }}>Click a challenge above or use the arrows to start.</p>
                <button onClick={() => loadQuestion(0)} className="btn-minimal" style={{ fontSize: "0.75rem", padding: "6px 14px", backgroundColor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)", color: "var(--accent-color)" }}>
                  <Play size={12} fill="var(--accent-color)" /> Start Challenge 1
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar resize divider */}
        {isDesktop && (
          <div 
            className={`resize-divider ${draggingDivider === "sidebar" ? "dragging" : ""}`}
            onMouseDown={handleSidebarMouseDown}
          />
        )}

        {/* Right workspace container wrapper */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          height: "100%",
          minWidth: 0,
          overflow: "hidden"
        }}>
          {/* Middle Card: CODE EDITOR - Redesigned to look exactly like VS Code */}
          <div 
            className="modern-card"
            style={{
              width: isDesktop ? `${(editorWidth / (100 - sidebarWidth)) * 100}%` : "100%",
              height: "100%",
              flexShrink: 0,
              flexGrow: 0,
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
              padding: 0,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-secondary)"
            }}
          >

            {/* Main VS Code Editor Workspace Area */}
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {/* VS Code Editor Tabs Bar */}
              <div style={{
                height: "35px",
                backgroundColor: "var(--bg-primary)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
                userSelect: "none"
              }}>
                {/* Left side: Tab list */}
                <div style={{ display: "flex", height: "100%", overflowX: "auto" }}>
                  {/* HTML Tab */}
                  <div 
                    onClick={() => setWebSubTab("html")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 16px",
                      height: "100%",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      backgroundColor: webSubTab === "html" ? "var(--bg-secondary)" : "transparent",
                      color: webSubTab === "html" ? "var(--text-primary)" : "var(--text-secondary)",
                      borderRight: "1px solid var(--border-color)",
                      borderTop: webSubTab === "html" ? "2px solid var(--accent-color)" : "none",
                      fontWeight: webSubTab === "html" ? 600 : 400
                    }}
                  >
                    <span style={{ color: "#e34c26" }}>&lt;&gt;</span>
                    <span>index.html</span>
                  </div>

                  {/* CSS Tab */}
                  <div 
                    onClick={() => setWebSubTab("css")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 16px",
                      height: "100%",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      backgroundColor: webSubTab === "css" ? "var(--bg-secondary)" : "transparent",
                      color: webSubTab === "css" ? "var(--text-primary)" : "var(--text-secondary)",
                      borderRight: "1px solid var(--border-color)",
                      borderTop: webSubTab === "css" ? "2px solid var(--accent-color)" : "none",
                      fontWeight: webSubTab === "css" ? 600 : 400
                    }}
                  >
                    <span style={{ color: "#0284c7" }}>#</span>
                    <span>style.css</span>
                  </div>

                  {/* JS Tab */}
                  <div 
                    onClick={() => setWebSubTab("js")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 16px",
                      height: "100%",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      backgroundColor: webSubTab === "js" ? "var(--bg-secondary)" : "transparent",
                      color: webSubTab === "js" ? "var(--text-primary)" : "var(--text-secondary)",
                      borderRight: "1px solid var(--border-color)",
                      borderTop: webSubTab === "js" ? "2px solid var(--accent-color)" : "none",
                      fontWeight: webSubTab === "js" ? 600 : 400
                    }}
                  >
                    <span style={{ color: "#eab308", fontSize: "0.7rem", fontWeight: 700 }}>JS</span>
                    <span>index.js</span>
                  </div>
                </div>

                {/* Right side: Editor action button icons */}
                <div style={{ display: "flex", gap: "6px", paddingRight: "12px", alignItems: "center" }}>
                  <button 
                    onClick={() => setDiffView(!diffView)}
                    style={{ background: "none", border: "none", color: diffView ? "var(--accent-color)" : "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    title="Toggle Side-by-Side Diff (Ctrl+Alt+D)"
                  >
                    <GitCompare size={14} />
                  </button>
                  <button 
                    onClick={() => setShowShortcutsModal(true)}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    title="Keyboard Shortcuts (Ctrl+Alt+K)"
                  >
                    <Keyboard size={14} />
                  </button>
                  <button 
                    onClick={handleFormatCode}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    title="Format Document (Sparkles)"
                  >
                    <Sparkles size={14} />
                  </button>
                  <button 
                    onClick={handleCopyCode}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    title="Copy Code"
                  >
                    {copied ? <Check size={14} style={{ color: "var(--neon-green)" }} /> : <Copy size={14} />}
                  </button>
                  <button 
                    onClick={handleResetCode}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    title="Reset to Template"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* VS Code Breadcrumb Bar */}
              <div style={{
                height: "24px",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                gap: "4px",
                userSelect: "none"
              }}>
                <span>src</span>
                <span>&gt;</span>
                <span style={{ color: "var(--text-primary)" }}>{`index.${webSubTab}`}</span>
              </div>

              {/* Monaco Editor Container */}
              <div className="editor-wrapper" style={{ flexGrow: 1, border: "none", borderRadius: 0 }}>
                {diffView ? (
                  <DiffEditor
                    height="100%"
                    language={getMonacoLanguage()}
                    original={getOriginalCode()}
                    modified={getActiveCode()}
                    onMount={handleDiffMount}
                    theme={editorTheme}
                    options={{
                      fontSize: fontSize,
                      fontFamily: "var(--code-font)",
                      minimap: { enabled: false },
                      wordWrap: wordWrap,
                      readOnly: false,
                      automaticLayout: true,
                      renderSideBySide: true
                    }}
                  />
                ) : (
                  <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    value={getActiveCode()}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme={editorTheme}
                    loading={
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", gap: "8px", background: "var(--bg-secondary)" }}>
                        <RefreshCw className="animate-spin" size={24} style={{ color: "var(--accent-color)" }} />
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Loading editor interface...</p>
                      </div>
                    }
                    options={{
                      fontSize: fontSize,
                      fontFamily: "var(--code-font)",
                      minimap: { enabled: minimap },
                      wordWrap: wordWrap,
                      lineNumbers: "on",
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      smoothScrolling: true,
                      tabSize: tabSize,
                      scrollBeyondLastLine: false,
                      bracketPairColorization: { enabled: true }
                    }}
                  />
                )}
              </div>

              {/* VS Code Bottom Status Bar */}
              <div style={{
                height: "22px",
                backgroundColor: "var(--bg-tertiary)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
                justifyContent: "space-between",
                userSelect: "none"
              }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span>⚡ Ctrl+S: Run Tests</span>
                  <span>📖 Alt+Z: Toggle Wrap</span>
                  <span>🛠️ F1: Command Palette</span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span>Tab Size: {tabSize}</span>
                  <span>UTF-8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Draggable Divider */}
          {isDesktop && (
            <div 
              className={`resize-divider ${draggingDivider === "editor" ? "dragging" : ""}`}
              onMouseDown={handleEditorMouseDown}
            />
          )}

          {/* Right Card: PREVIEW & OUTPUT */}
          <div 
            style={{ 
              width: isDesktop ? `${((100 - sidebarWidth - editorWidth) / (100 - sidebarWidth)) * 100}%` : "100%",
              height: "100%",
              flexShrink: 0,
              flexGrow: 0,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <OutputPanel 
              srcDoc={srcDoc}
              consoleLogs={consoleLogs}
              setConsoleLogs={setConsoleLogs}
              showConsole={showConsole}
              setShowConsole={setShowConsole}
              consoleMaximized={consoleMaximized}
              setConsoleMaximized={setConsoleMaximized}
              onRefresh={handleRunCode}
              isCompiling={isCompiling}
              expectedSrcDoc={expectedSrcDoc}
              showExpectedPreview={showExpectedPreview}
              setShowExpectedPreview={setShowExpectedPreview}
              hasActiveChallenge={!!activeQuestion}
            />
          </div>
        </div>
      </main>

      {/* Floating Toast Notifications Container */}
      <div style={{
        position: "fixed",
        bottom: "35px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 99999,
        pointerEvents: "none"
      }}>
        {toasts.map(toast => {
          let bgColor = "rgba(59, 130, 246, 0.95)"; // info
          if (toast.type === "success") bgColor = "rgba(16, 185, 129, 0.95)";
          if (toast.type === "error") bgColor = "rgba(239, 68, 68, 0.95)";
          
          return (
            <div key={toast.id} style={{
              padding: "10px 16px",
              borderRadius: "6px",
              backgroundColor: bgColor,
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: "auto",
              animation: "slideIn 0.2s ease"
            }}>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>

      {celebrated && (
        <canvas 
          ref={canvasRef} 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            pointerEvents: "none", 
            zIndex: 999999 
          }} 
        />
      )}

      {showShortcutsModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100000,
          animation: "fadeIn 0.2s ease"
        }} onClick={() => setShowShortcutsModal(false)}>
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "24px",
            width: "420px",
            maxWidth: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            animation: "slideIn 0.2s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 className="font-ui" style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Keyboard size={16} style={{ color: "var(--accent-color)" }} />
                Keyboard Shortcuts Guide
              </h3>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { keys: ["Ctrl", "S"], desc: "Compile sandbox / run test criteria validation" },
                { keys: ["Alt", "Z"], desc: "Toggle editor code word-wrap" },
                { keys: ["Ctrl", "Alt", "D"], desc: "Toggle side-by-side original code diff view" },
                { keys: ["Ctrl", "Alt", "K"], desc: "Toggle keyboard shortcuts checklist modal" },
                { keys: ["F1"], desc: "Open Monaco Editor command palette" }
              ].map((shortcut, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{shortcut.desc}</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {shortcut.keys.map((k, j) => (
                      <kbd key={j} style={{
                        padding: "3px 6px",
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        boxShadow: "0 2px 0 var(--border-color)"
                      }}>{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowShortcutsModal(false)}
              className="btn-minimal"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "20px",
                fontWeight: 600,
                fontSize: "0.75rem",
                textAlign: "center",
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                borderColor: "rgba(59, 130, 246, 0.2)",
                cursor: "pointer"
              }}
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;