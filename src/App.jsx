import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";

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

import { SNIPPETS } from "./constants/snippets";

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
  
  // Ref to hold the latest compilation run handler
  const handleRunCodeRef = useRef(null);

  // Ref to hold the Monaco Editor instance for programmatic formatting
  const editorRef = useRef(null);
  
  // Resizable panels state hooks
  const [leftWidth, setLeftWidth] = useState(50); // panel splits percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth > 1024 : true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Independent code values for each environment (from localStorage if available)
  const [htmlCode, setHtmlCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_html") || DEFAULT_HTML; } catch(e) { return DEFAULT_HTML; }
  });
  const [cssCode, setCssCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_css") || DEFAULT_CSS; } catch(e) { return DEFAULT_CSS; }
  });
  const [webJsCode, setWebJsCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_webjs") || DEFAULT_WEB_JS; } catch(e) { return DEFAULT_WEB_JS; }
  });
  const [jsCode, setJsCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_js") || DEFAULT_JS; } catch(e) { return DEFAULT_JS; }
  });
  const [pythonCode, setPythonCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_python") || DEFAULT_PYTHON; } catch(e) { return DEFAULT_PYTHON; }
  });
  const [cCode, setCCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_c") || DEFAULT_C; } catch(e) { return DEFAULT_C; }
  });
  const [cppCode, setCppCode] = useState(() => {
    try { return localStorage.getItem("ppa_playground_cpp") || DEFAULT_CPP; } catch(e) { return DEFAULT_CPP; }
  });
  
  // Active sub-tab under "web" project
  const [webSubTab, setWebSubTab] = useState("html");
  
  // Compiler / Output states
  const [srcDoc, setSrcDoc] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]); // Array for web project iframe console
  const [terminalLogs, setTerminalLogs] = useState([]); // Array for standalone script execution terminal
  const [isCompiling, setIsCompiling] = useState(false);
  
  // General setting preferences
  const [autoRun, setAutoRun] = useState(true);
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

  // Mouse handlers for panel resizer
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 15 && newWidth <= 85) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Trigger Monaco's programmatic formatting provider
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger("format-action", "editor.action.formatDocument");
    }
  };

  // Load a preset code template snippet
  const handleLoadSnippet = (e) => {
    const snippetId = e.target.value;
    if (!snippetId) return;

    const snippetList = SNIPPETS[env];
    if (!snippetList) return;

    const snippet = snippetList.find(s => s.id === snippetId);
    if (!snippet) return;

    if (env === "web") {
      setHtmlCode(snippet.html);
      setCssCode(snippet.css);
      setWebJsCode(snippet.js);
      try {
        localStorage.setItem("ppa_playground_html", snippet.html);
        localStorage.setItem("ppa_playground_css", snippet.css);
        localStorage.setItem("ppa_playground_webjs", snippet.js);
      } catch(err){}
    } else {
      const code = snippet.code;
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
    
    e.target.value = ""; // reset dropdown value
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

  // Auto compile triggers
  useEffect(() => {
    if (!autoRun) return;
    const timeout = setTimeout(() => {
      handleRunCode();
    }, 800);
    return () => clearTimeout(timeout);
  }, [htmlCode, cssCode, webJsCode, jsCode, pythonCode, cCode, cppCode, autoRun, env]);

  // Initial load run
  useEffect(() => {
    handleRunCode();
  }, [env]);

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
        autoRun={autoRun}
        setAutoRun={setAutoRun}
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
        
        {/* Left Card: CODE EDITOR */}
        <div 
          className="modern-card"
          style={{
            width: isDesktop ? `${leftWidth}%` : "100%",
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

              {/* Snippet Presets Selector */}
              {SNIPPETS[env] && SNIPPETS[env].length > 0 && (
                <select
                  onChange={handleLoadSnippet}
                  defaultValue=""
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "var(--ui-font)"
                  }}
                >
                  <option value="" disabled>Presets...</option>
                  {SNIPPETS[env].map(snippet => (
                    <option key={snippet.id} value={snippet.id}>
                      {snippet.name}
                    </option>
                  ))}
                </select>
              )}

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
        <div 
          className={`resize-divider ${isDragging ? "dragging" : ""}`}
          onMouseDown={handleMouseDown}
        />

        {/* Right Card: PREVIEW & OUTPUT */}
        <div 
          style={{ 
            width: isDesktop ? `${100 - leftWidth}%` : "100%", 
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