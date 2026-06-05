import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
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
  HelpCircle
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
  
  // Active selected challenge
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

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
  const [editorTheme, setEditorTheme] = useState(() => {
    try { return localStorage.getItem("ppa_setting_editor_theme") || "vs-dark"; } catch(e) { return "vs-dark"; }
  });
  const [autoCompile, setAutoCompile] = useState(() => {
    try { return localStorage.getItem("ppa_setting_autocompile") !== "false"; } catch(e) { return true; }
  });
  const [tabSize, setTabSize] = useState(() => {
    try { return parseInt(localStorage.getItem("ppa_setting_tabsize") || "2", 10); } catch(e) { return 2; }
  });
  const [visibleHints, setVisibleHints] = useState({});
  const [celebrated, setCelebrated] = useState(false);

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

  // Debounced auto compilation
  useEffect(() => {
    if (!autoCompile) return;
    const timer = setTimeout(() => {
      const compiled = compileWebSandbox(htmlCode, cssCode, webJsCode);
      setSrcDoc(compiled);
    }, 800);
    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, webJsCode, autoCompile]);

  // Confetti particles generator
  const triggerConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["#3b82f6", "#10b981", "#fbbf24", "#ef4444", "#a855f7", "#6366f1"];

    (function frame() {
      if (Date.now() > end) return;
      
      const p = document.createElement("div");
      p.style.position = "fixed";
      p.style.width = `${Math.random() * 8 + 4}px`;
      p.style.height = `${Math.random() * 12 + 6}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${Math.random() * 100}vw`;
      p.style.top = `-20px`;
      p.style.opacity = "0.9";
      p.style.zIndex = "9999";
      p.style.pointerEvents = "none";
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      p.style.borderRadius = "2px";
      
      document.body.appendChild(p);

      let y = -20;
      let x = parseFloat(p.style.left);
      const speed = Math.random() * 4 + 3;
      const drift = Math.random() * 1.6 - 0.8;
      
      const interval = setInterval(() => {
        y += speed;
        x += drift;
        p.style.top = `${y}px`;
        p.style.left = `${x}vw`;
        p.style.transform = `rotate(${y * 2.5}deg)`;
        
        if (y > window.innerHeight) {
          clearInterval(interval);
          p.remove();
        }
      }, 16);
      
      requestAnimationFrame(frame);
    }());
  };

  // Celebrate on success
  useEffect(() => {
    if (validationResult?.success) {
      if (!celebrated) {
        triggerConfetti();
        setCelebrated(true);
      }
    } else {
      setCelebrated(false);
    }
  }, [validationResult?.success, celebrated]);

  const toggleHint = (idx) => {
    setVisibleHints(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Run compiling script
  const handleRunCode = () => {
    setConsoleLogs([]); // reset browser console
    const compiled = compileWebSandbox(htmlCode, cssCode, webJsCode);
    setSrcDoc(compiled);
  };

  // Select question handler (doesn't overwrite current editor content, keeping user's codebase clean)
  const handleSelectQuestion = (q) => {
    setCelebrated(false);
    setVisibleHints({});
    if (activeQuestion && activeQuestion.id === q.id) {
      setActiveQuestion(null);
      setValidationResult(null);
      setHtmlCode(DEFAULT_HTML);
      setCssCode(DEFAULT_CSS);
      setWebJsCode(DEFAULT_WEB_JS);
      try {
        localStorage.setItem("ppa_playground_html", DEFAULT_HTML);
        localStorage.setItem("ppa_playground_css", DEFAULT_CSS);
        localStorage.setItem("ppa_playground_webjs", DEFAULT_WEB_JS);
      } catch(e){}
    } else {
      setActiveQuestion(q);
      setValidationResult(null);
      const targetHtml = q.initialHtml || DEFAULT_HTML;
      const targetCss = q.initialCss || DEFAULT_CSS;
      const targetJs = q.initialJs || DEFAULT_WEB_JS;
      setHtmlCode(targetHtml);
      setCssCode(targetCss);
      setWebJsCode(targetJs);
      try {
        localStorage.setItem("ppa_playground_html", targetHtml);
        localStorage.setItem("ppa_playground_css", targetCss);
        localStorage.setItem("ppa_playground_webjs", targetJs);
      } catch(e){}
    }
  };

  // Keep compiler trigger ref updated to prevent stale closures
  useEffect(() => {
    handleRunCodeRef.current = handleRunCode;
  }, [htmlCode, cssCode, webJsCode]);

  // Window-level Ctrl+S (Command+S) listener
  useEffect(() => {
    const handleGlobalSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (handleRunCodeRef.current) {
          handleRunCodeRef.current();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalSave);
    return () => window.removeEventListener("keydown", handleGlobalSave);
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
  };

  // Get active file name label
  const getActiveFileName = () => {
    return `index.${webSubTab}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header component */}
      <Header 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        handleRunCode={handleRunCode}
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
          <div>
            <h2 className="font-ui panel-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={18} style={{ color: "var(--accent-color)" }} />
              <span>CHALLENGES</span>
            </h2>
            <div className="challenge-list" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {QUESTIONS.map((q) => {
                const isActive = activeQuestion?.id === q.id;
                return (
                  <div 
                    key={q.id}
                    className={`challenge-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectQuestion(q)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: isActive ? "var(--accent-color)" : "var(--border-color)",
                      backgroundColor: isActive ? "rgba(59, 130, 246, 0.08)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isActive ? "white" : "var(--text-primary)" }}>{q.title}</span>
                      <span className={`challenge-difficulty ${q.difficulty.toLowerCase()}`} style={{ fontSize: "0.7rem", fontWeight: 600, padding: "2px 6px", borderRadius: "4px" }}>
                        {q.difficulty}
                      </span>
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
                          backgroundColor: progressPercent === 100 ? "var(--neon-green)" : "var(--accent-color)",
                          boxShadow: progressPercent === 100 ? "0 0 8px var(--neon-green)" : "none",
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
                    <span>Changes to be Done</span>
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
                        <li key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: textColor, lineHeight: "1.4", borderBottom: "1px solid rgba(255, 255, 255, 0.02)", paddingBottom: "8px" }}>
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
                                onClick={() => toggleHint(idx)}
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
                                <HelpCircle size={12} />
                              </button>
                            )}
                          </div>
                          {hintText && visibleHints[idx] && (
                            <div style={{
                              marginLeft: "22px",
                              padding: "6px 10px",
                              backgroundColor: "var(--bg-tertiary)",
                              borderLeft: "2px solid var(--accent-color)",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              color: "var(--text-secondary)",
                              lineHeight: "1.3",
                              border: "1px solid var(--border-color)"
                            }}>
                              💡 {hintText}
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
                    className={`challenge-status-bar ${validationResult.success ? "success" : "error"}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      lineHeight: "1.3",
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
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", gap: "10px", padding: "20px", textAlign: "center" }}>
                <Award size={36} style={{ color: "var(--border-hover)" }} />
                <p style={{ fontSize: "0.8rem" }}>Select a challenge from the list above to view the statement, required changes, and validation status.</p>
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

        {/* Middle Card: CODE EDITOR */}
        <div 
          className="modern-card"
          style={{
            width: isDesktop ? `${editorWidth}%` : "100%",
            flexShrink: 0,
            flexGrow: 0
          }}
        >
          <div className="panel-header-controls">
            <h2 className="font-ui panel-title">CODE EDITOR</h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--code-font)", background: "var(--bg-tertiary)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                {getActiveFileName()}
              </span>

              {/* Reset to Boilerplate Button */}
              <button 
                className="btn-minimal"
                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                onClick={handleResetCode}
                title="Reset to Boilerplate"
              >
                <RefreshCw size={12} style={{ marginRight: "4px" }} />
                <span>Reset</span>
              </button>

              <button 
                className="btn-minimal"
                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                onClick={handleFormatCode}
                title="Format Document"
              >
                <Sparkles size={12} style={{ color: "var(--accent-color)" }} />
                <span>Format</span>
              </button>
              <button 
                className="btn-minimal"
                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                onClick={handleCopyCode}
              >
                {copied ? <Check size={12} style={{ color: "var(--neon-green)" }} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Web tab selection */}
          <div className="tab-container">
            <button 
              className={`btn-minimal ${webSubTab === "html" ? "active" : ""}`}
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={() => setWebSubTab("html")}
            >
              <span>index.html</span>
            </button>
            <button 
              className={`btn-minimal ${webSubTab === "css" ? "active" : ""}`}
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={() => setWebSubTab("css")}
            >
              <span>style.css</span>
            </button>
            <button 
              className={`btn-minimal ${webSubTab === "js" ? "active" : ""}`}
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={() => setWebSubTab("js")}
            >
              <span>app.js</span>
            </button>
          </div>

          {/* Monaco Editor Wrapper */}
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={getMonacoLanguage()}
              value={getActiveCode()}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme={editorTheme}
              loading={
                <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", gap: "8px", background: "#1e1e1e" }}>
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
            width: isDesktop ? `${100 - sidebarWidth - editorWidth}%` : "100%", 
            flexShrink: 0,
            flexGrow: 0,
            height: isDesktop ? "100%" : "auto",
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
          />
        </div>
      </main>
    </div>
  );
};

export default App;