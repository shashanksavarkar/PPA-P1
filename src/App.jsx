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
  XCircle 
} from "lucide-react";

// Local imports
import {
  DEFAULT_HTML,
  DEFAULT_CSS,
  DEFAULT_WEB_JS
} from "./constants/templates";

import { QUESTIONS } from "./constants/questions";
import { compileWebSandbox } from "./utils/compiler";

import Header from "./components/Header";
import SettingsDrawer from "./components/SettingsDrawer";
import OutputPanel from "./components/OutputPanel";

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

  // Run compiling script
  const handleRunCode = () => {
    setConsoleLogs([]); // reset browser console
    const compiled = compileWebSandbox(htmlCode, cssCode, webJsCode);
    setSrcDoc(compiled);
  };

  // Select question handler (doesn't overwrite current editor content, keeping user's codebase clean)
  const handleSelectQuestion = (q) => {
    if (activeQuestion && activeQuestion.id === q.id) {
      setActiveQuestion(null);
      setValidationResult(null);
    } else {
      setActiveQuestion(q);
      setValidationResult(null);
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

  // Run validation whenever code changes, or when consoleLogs change
  useEffect(() => {
    if (!activeQuestion) {
      setValidationResult(null);
      return;
    }

    const result = activeQuestion.validate(htmlCode, cssCode, webJsCode, consoleLogs);
    setValidationResult(result);
  }, [htmlCode, cssCode, webJsCode, consoleLogs, activeQuestion]);

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
    if (window.confirm("Are you sure you want to reset the current editor to the default HTML/CSS boilerplate?")) {
      setHtmlCode(DEFAULT_HTML);
      setCssCode(DEFAULT_CSS);
      setWebJsCode(DEFAULT_WEB_JS);
      try {
        localStorage.setItem("ppa_playground_html", DEFAULT_HTML);
        localStorage.setItem("ppa_playground_css", DEFAULT_CSS);
        localStorage.setItem("ppa_playground_webjs", DEFAULT_WEB_JS);
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
    if (webSubTab === "html") {
      setHtmlCode(code);
      try { localStorage.setItem("ppa_playground_html", code); } catch(e){}
    } else if (webSubTab === "css") {
      setCssCode(code);
      try { localStorage.setItem("ppa_playground_css", code); } catch(e){}
    } else {
      setWebJsCode(code);
      try { localStorage.setItem("ppa_playground_webjs", code); } catch(e){}
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
                  <ul style={{ display: "flex", flexDirection: "column", gap: "8px", listStyle: "none" }}>
                    {activeQuestion.changesToBeDone.map((change, idx) => (
                      <li key={idx} style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        <span style={{ color: "var(--accent-color)", fontWeight: "bold" }}>•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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
                      marginTop: "auto",
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
              theme="vs-dark"
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
                tabSize: 2,
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