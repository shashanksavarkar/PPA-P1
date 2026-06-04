import React from "react";
import { 
  Play, 
  Code2, 
  Sliders, 
  FileCode,
  Binary,
  Layers,
  Sparkles
} from "lucide-react";

const Header = ({ 
  env, 
  setEnv, 
  autoRun, 
  setAutoRun, 
  showSettings, 
  setShowSettings, 
  handleRunCode 
}) => {
  return (
    <header className="modern-header">
      <div className="header-title-container">
        <div style={{ padding: "8px", background: "var(--bg-tertiary)", borderRadius: "8px", display: "flex", border: "1px solid var(--border-color)" }}>
          <Code2 size={20} style={{ color: "var(--accent-color)" }} />
        </div>
        <div>
          <h1 className="font-ui" style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            DEVELOPER PLAYGROUND
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1px" }}>
            Multi-Language Compiler Sandbox
          </p>
        </div>
      </div>

      {/* Environment selectors */}
      <div className="environment-selector">
        <button 
          className={`btn-minimal ${env === "web" ? "active" : ""}`}
          onClick={() => setEnv("web")}
        >
          <Layers size={14} />
          <span>HTML/CSS</span>
        </button>
        <button 
          className={`btn-minimal ${env === "js" ? "active" : ""}`}
          onClick={() => setEnv("js")}
        >
          <Sparkles size={14} />
          <span>JavaScript</span>
        </button>
        <button 
          className={`btn-minimal ${env === "python" ? "active" : ""}`}
          onClick={() => setEnv("python")}
        >
          <FileCode size={14} />
          <span>Python</span>
        </button>
        <button 
          className={`btn-minimal ${env === "c" ? "active" : ""}`}
          onClick={() => setEnv("c")}
        >
          <Binary size={14} />
          <span>C</span>
        </button>
        <button 
          className={`btn-minimal ${env === "cpp" ? "active" : ""}`}
          onClick={() => setEnv("cpp")}
        >
          <Binary size={14} />
          <span>C++</span>
        </button>
      </div>

      {/* Preferences toggles */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button 
          className={`btn-minimal ${showSettings ? "active" : ""}`}
          onClick={() => setShowSettings(!showSettings)}
          title="Preferences"
        >
          <Sliders size={15} />
          <span>Options</span>
        </button>
        
        <button 
          className="btn-minimal" 
          style={{ backgroundColor: autoRun ? "rgba(16, 185, 129, 0.08)" : "var(--bg-tertiary)" }}
          onClick={() => setAutoRun(!autoRun)}
        >
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: autoRun ? "var(--neon-green)" : "var(--text-secondary)",
            display: "inline-block"
          }} />
          <span>Auto Run</span>
        </button>

        {!autoRun && (
          <button 
            className="btn-minimal" 
            style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
            onClick={handleRunCode}
          >
            <Play size={14} fill="white" />
            <span>Run</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
