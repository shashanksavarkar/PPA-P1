import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Check, Copy, RefreshCw, Sparkles, Trophy, Award } from "lucide-react";

// Local imports
import {
  DEFAULT_HTML,
  DEFAULT_CSS,
  DEFAULT_WEB_JS,
  DEFAULT_JS,
  DEFAULT_PYTHON,
  DEFAULT_C,
  DEFAULT_CPP
} from "./constants/templates";

import { QUESTIONS } from "./constants/questions";

import {
  compileWebSandbox,
  simulateScriptExecution
} from "./utils/compiler";

import Header from "./components/Header";
import SettingsDrawer from "./components/SettingsDrawer";
import OutputPanel from "./components/OutputPanel";

const App = () => {
  // Environment selector: "web", "js", "python", "c", "cpp"
  const [env, setEnv] = useState("web");

  // Coding challenges states (Challenge Mode Only)
  const [activeQuestion, setActiveQuestion] = useState(() => QUESTIONS[0]);
  const [validationResult, setValidationResult] = useState(null);
  
  // Ref to hold the latest compilation run handler
  const handleRunCodeRef = useRef(null);

  // Ref to hold the Monaco Editor instance for programmatic formatting
  const editorRef = useRef(null);
  
  // Resizable panels state hooks (three columns)
  const [sidebarWidth, setSidebarWidth] = useState(22);
  const [editorWidth, setEditorWidth] = useState(38);
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
  
  // Independent code values for each environment (from localStorage or matching challenge initialCode)
  const [htmlCode, setHtmlCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "web")?.initialCode.html || DEFAULT_HTML;
    try { return localStorage.getItem("ppa_playground_html") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [cssCode, setCssCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "web")?.initialCode.css || DEFAULT_CSS;
    try { return localStorage.getItem("ppa_playground_css") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [webJsCode, setWebJsCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "web")?.initialCode.js || DEFAULT_WEB_JS;
    try { return localStorage.getItem("ppa_playground_webjs") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [jsCode, setJsCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "js")?.initialCode.code || DEFAULT_JS;
    try { return localStorage.getItem("ppa_playground_js") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [pythonCode, setPythonCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "python")?.initialCode.code || DEFAULT_PYTHON;
    try { return localStorage.getItem("ppa_playground_python") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [cCode, setCCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "c")?.initialCode.code || DEFAULT_C;
    try { return localStorage.getItem("ppa_playground_c") || defaultVal; } catch(e) { return defaultVal; }
  });
  const [cppCode, setCppCode] = useState(() => {
    const defaultVal = QUESTIONS.find(q => q.env === "cpp")?.initialCode.code || DEFAULT_CPP;
    try { return localStorage.getItem("ppa_playground_cpp") || defaultVal; } catch(e) { return defaultVal; }
  });
  
  // Active sub-tab under "web" project
  const [webSubTab, setWebSubTab] = useState("html");
  
  // Compiler / Output states
  const [srcDoc, setSrcDoc] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]); // Array for web project iframe console
  const [terminalLogs, setTerminalLogs] = useState([]); // Array for standalone script execution terminal
  const [isCompiling, setIsCompiling] = useState(false);
  
  // General setting preferences
  const [wordWrap, setWordWrap] = useState("on");
  const [fontSize, setFontSize] = useState(14);
  const [minimap, setMinimap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleMaximized, setConsoleMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sync / Run compiling script
  const handleRunCode = () => {
    const time = new Date().toLocaleTimeString();

    if (env === "web") {
      setConsoleLogs([]); // reset browser console
      const compiled = compileWebSandbox(htmlCode, cssCode, webJsCode);
      setSrcDoc(compiled);
    } else {
      setIsCompiling(true);
      setTerminalLogs([{ type: "sys", message: "Compiling code, please wait...", time }]);
      
      setTimeout(() => {
        setIsCompiling(false);
        const results = simulateScriptExecution(env, {
          jsCode,
          pythonCode,
          cCode,
          cppCode
        });
        setTerminalLogs(results);
      }, 550); // slight compile lag for visual realism
    }
  };

  // Keep compiler trigger ref updated to prevent stale closures
  useEffect(() => {
    handleRunCodeRef.current = handleRunCode;
  }, [htmlCode, cssCode, webJsCode, jsCode, pythonCode, cCode, cppCode, env]);

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

  // Mouse handlers for panel resizers (Challenges, Editor, Output)
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
      if (draggingDivider === "none" || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;

      if (draggingDivider === "sidebar") {
        // Constrain sidebar width between 15% and 40%
        if (clientXPercent >= 15 && clientXPercent <= 40) {
          setSidebarWidth(clientXPercent);
        }
      } else if (draggingDivider === "editor") {
        // Constrain editor width so that editor is at least 20% and output panel is at least 15%
        const newEditorWidth = clientXPercent - sidebarWidth;
        if (newEditorWidth >= 20 && (clientXPercent <= 85)) {
          setEditorWidth(newEditorWidth);
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

  // Load a selected coding challenge
  const handleSelectQuestion = (question) => {
    if (activeQuestion && activeQuestion.id === question.id) {
      setActiveQuestion(null);
      setValidationResult(null);
      return;
    }

    if (window.confirm(`Load challenge "${question.title}"? This will overwrite your current code.`)) {
      setActiveQuestion(question);
      setEnv(question.env);
      if (question.env === "web") {
        setHtmlCode(question.initialCode.html);
        setCssCode(question.initialCode.css);
        setWebJsCode(question.initialCode.js);
        setWebSubTab("html");
        try {
          localStorage.setItem("ppa_playground_html", question.initialCode.html);
          localStorage.setItem("ppa_playground_css", question.initialCode.css);
          localStorage.setItem("ppa_playground_webjs", question.initialCode.js);
        } catch(e){}
      } else {
        const code = question.initialCode.code;
        if (question.env === "js") {
          setJsCode(code);
          try { localStorage.setItem("ppa_playground_js", code); } catch(e){}
        } else if (question.env === "python") {
          setPythonCode(code);
          try { localStorage.setItem("ppa_playground_python", code); } catch(e){}
        } else if (question.env === "c") {
          setCCode(code);
          try { localStorage.setItem("ppa_playground_c", code); } catch(e){}
        } else if (question.env === "cpp") {
          setCppCode(code);
          try { localStorage.setItem("ppa_playground_cpp", code); } catch(e){}
        }
      }
    }
  };

  // Run validation checks when code changes
  useEffect(() => {
    if (!activeQuestion) {
      setValidationResult(null);
      return;
    }

    if (env !== activeQuestion.env) {
      setValidationResult({ success: false, message: `Switch back to ${activeQuestion.env.toUpperCase()} environment to validate.` });
      return;
    }

    try {
      let res = null;
      if (env === "web") {
        res = activeQuestion.validate(htmlCode, cssCode, webJsCode);
      } else {
        res = activeQuestion.validate(getActiveCode(), terminalLogs);
      }
      setValidationResult(res);
    } catch (err) {
      setValidationResult({ success: false, message: `Validation Error: ${err.message}` });
    }
  }, [htmlCode, cssCode, webJsCode, jsCode, pythonCode, cCode, cppCode, env, terminalLogs, activeQuestion]);

  // Auto-switch active challenge when environment tab is selected in Header
  useEffect(() => {
    if (activeQuestion && activeQuestion.env === env) return;
    
    const matchingQuestion = QUESTIONS.find(q => q.env === env);
    if (matchingQuestion) {
      setActiveQuestion(matchingQuestion);
    }
  }, [env]);

  // Reset current environment to default boilerplate (or starting challenge code)
  const handleResetCode = () => {
    const isChallenge = activeQuestion && activeQuestion.env === env;
    const msg = isChallenge
      ? "Are you sure you want to reset the editor to the starting code for this challenge?"
      : "Are you sure you want to reset the current editor to the boilerplate?";

    if (window.confirm(msg)) {
      if (isChallenge) {
        if (env === "web") {
          setHtmlCode(activeQuestion.initialCode.html);
          setCssCode(activeQuestion.initialCode.css);
          setWebJsCode(activeQuestion.initialCode.js);
          try {
            localStorage.setItem("ppa_playground_html", activeQuestion.initialCode.html);
            localStorage.setItem("ppa_playground_css", activeQuestion.initialCode.css);
            localStorage.setItem("ppa_playground_webjs", activeQuestion.initialCode.js);
          } catch(err){}
        } else {
          const code = activeQuestion.initialCode.code;
          if (env === "js") {
            setJsCode(code);
            try { localStorage.setItem("ppa_playground_js", code); } catch(err){}
          } else if (env === "python") {
            setPythonCode(code);
            try { localStorage.setItem("ppa_playground_python", code); } catch(err){}
          } else if (env === "c") {
            setCCode(code);
            try { localStorage.setItem("ppa_playground_c", code); } catch(err){}
          } else if (env === "cpp") {
            setCppCode(code);
            try { localStorage.setItem("ppa_playground_cpp", code); } catch(err){}
          }
        }
      } else {
        if (env === "web") {
          setHtmlCode(DEFAULT_HTML);
          setCssCode(DEFAULT_CSS);
          setWebJsCode(DEFAULT_WEB_JS);
          try {
            localStorage.setItem("ppa_playground_html", DEFAULT_HTML);
            localStorage.setItem("ppa_playground_css", DEFAULT_CSS);
            localStorage.setItem("ppa_playground_webjs", DEFAULT_WEB_JS);
          } catch(err){}
        } else if (env === "js") {
          setJsCode(DEFAULT_JS);
          try { localStorage.setItem("ppa_playground_js", DEFAULT_JS); } catch(err){}
        } else if (env === "python") {
          setPythonCode(DEFAULT_PYTHON);
          try { localStorage.setItem("ppa_playground_python", DEFAULT_PYTHON); } catch(err){}
        } else if (env === "c") {
          setCCode(DEFAULT_C);
          try { localStorage.setItem("ppa_playground_c", DEFAULT_C); } catch(err){}
        } else if (env === "cpp") {
          setCppCode(DEFAULT_CPP);
          try { localStorage.setItem("ppa_playground_cpp", DEFAULT_CPP); } catch(err){}
        }
      }
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

  // The user should always hit Run to get the output, so we do not auto-run code.

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
    if (env === "web") {
      if (webSubTab === "html") return htmlCode;
      if (webSubTab === "css") return cssCode;
      return webJsCode;
    }
    if (env === "js") return jsCode;
    if (env === "python") return pythonCode;
    if (env === "c") return cCode;
    return cppCode;
  };

  // Sync values edited in Monaco
  const handleEditorChange = (value) => {
    const code = value || "";
    if (env === "web") {
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
    } else if (env === "js") {
      setJsCode(code);
      try { localStorage.setItem("ppa_playground_js", code); } catch(e){}
    } else if (env === "python") {
      setPythonCode(code);
      try { localStorage.setItem("ppa_playground_python", code); } catch(e){}
    } else if (env === "c") {
      setCCode(code);
      try { localStorage.setItem("ppa_playground_c", code); } catch(e){}
    } else if (env === "cpp") {
      setCppCode(code);
      try { localStorage.setItem("ppa_playground_cpp", code); } catch(e){}
    }
  };

  // Language translation helper for Monaco Editor component
  const getMonacoLanguage = () => {
    if (env === "web") {
      if (webSubTab === "html") return "html";
      if (webSubTab === "css") return "css";
      return "javascript";
    }
    if (env === "js") return "javascript";
    if (env === "python") return "python";
    if (env === "c") return "c";
    return "cpp";
  };

  // Copy code utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get active file name label
  const getActiveFileName = () => {
    if (env === "web") return `index.${webSubTab}`;
    if (env === "js") return "main.js";
    if (env === "python") return "main.py";
    if (env === "c") return "main.c";
    return "main.cpp";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header component */}
      <Header 
        env={env}
        setEnv={setEnv}
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
        {/* Left Side Panel: Coding Challenges list & active description (always visible) */}
        <div 
          className="modern-card challenges-sidebar"
          style={{
            width: isDesktop ? `${sidebarWidth}%` : "100%",
            flexShrink: 0,
            flexGrow: 0
          }}
        >
          <h2 className="font-ui panel-title">CHALLENGES</h2>
          
          <div className="challenge-list">
            {QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSelectQuestion(q)}
                className={`challenge-item ${activeQuestion?.id === q.id ? "active" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{q.title}</span>
                  <span className={`challenge-difficulty ${q.difficulty.toLowerCase()}`}>
                    {q.difficulty}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Language: {q.env.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {activeQuestion && (
            <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Award size={14} style={{ color: "#eab308" }} />
                <span>Challenge Instructions</span>
              </h3>
              <div className="challenge-active-desc">
                {activeQuestion.description}
              </div>

              {validationResult && (
                <div className={`challenge-status-bar ${validationResult.success ? "success" : "error"}`}>
                  <span style={{ fontWeight: 700 }}>
                    {validationResult.success ? "✓ SOLVED: " : "✗ FAILED: "}
                  </span>
                  <span>{validationResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Draggable Divider */}
        {isDesktop && (
          <div 
            className={`resize-divider ${draggingDivider === "sidebar" ? "dragging" : ""}`}
            onMouseDown={handleSidebarMouseDown}
          />
        )}

        {/* Left Card: CODE EDITOR */}
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

          {/* Web tab selection if env === "web" */}
          {env === "web" && (
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
          )}

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
            env={env}
            srcDoc={srcDoc}
            consoleLogs={consoleLogs}
            setConsoleLogs={setConsoleLogs}
            terminalLogs={terminalLogs}
            isCompiling={isCompiling}
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