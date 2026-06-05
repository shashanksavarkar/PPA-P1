import React from "react";
import { 
  Play, 
  Code2, 
  Sliders
} from "lucide-react";

const Header = ({ 
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
          style={{ backgroundColor: "rgba(59, 130, 246, 0.18)", borderColor: "rgba(59, 130, 246, 0.4)" }}
          onClick={handleRunCode}
          title="Run Code (Ctrl+S)"
        >
          <Play size={14} fill="var(--accent-color)" style={{ color: "var(--accent-color)" }} />
          <span style={{ color: "var(--accent-color)", fontWeight: 600 }}>Run</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
