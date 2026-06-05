import React from "react";
import { X, Sliders, Type, Layout, Terminal as TermIcon, Play } from "lucide-react";

const SettingsDrawer = ({ 
  wordWrap, 
  setWordWrap, 
  fontSize, 
  setFontSize,
  minimap,
  setMinimap,
  uiFontSize,
  setUiFontSize,
  editorTheme,
  setEditorTheme,
  autoCompile,
  setAutoCompile,
  tabSize,
  setTabSize,
  onClose
}) => {
  return (
    <div style={{
      position: "absolute",
      top: "65px",
      right: "20px",
      backgroundColor: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      padding: "20px",
      zIndex: 200,
      width: "300px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      animation: "fadeIn 0.15s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <h3 className="font-ui" style={{ fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sliders size={14} style={{ color: "var(--accent-color)" }} />
          Preferences & Options
        </h3>
        <button 
          onClick={onClose} 
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* UI Font Size Option */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Type size={12} />
              UI Text Size
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button 
                onClick={() => setUiFontSize(prev => Math.max(12, prev - 1))}
                className="btn-minimal"
                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
              >-</button>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--code-font)" }}>{uiFontSize}px</span>
              <button 
                onClick={() => setUiFontSize(prev => Math.min(20, prev + 1))}
                className="btn-minimal"
                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
              >+</button>
            </div>
          </div>
        </div>

        {/* Editor Font Size Option */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Type size={12} />
              Editor Code Size
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button 
                onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                className="btn-minimal"
                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
              >-</button>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--code-font)" }}>{fontSize}px</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(32, prev + 1))}
                className="btn-minimal"
                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
              >+</button>
            </div>
          </div>
        </div>

        {/* Theme select option */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Layout size={12} />
            Editor Theme
          </span>
          <select 
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontFamily: "var(--ui-font)",
              cursor: "pointer"
            }}
          >
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>

        {/* Auto Compile toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Play size={12} />
            Auto Compile
          </span>
          <button 
            onClick={() => setAutoCompile(!autoCompile)}
            className="btn-minimal"
            style={{ padding: "4px 8px", fontSize: "0.7rem", backgroundColor: autoCompile ? "rgba(16,185,129,0.15)" : "var(--bg-tertiary)", borderColor: autoCompile ? "var(--neon-green)" : "var(--border-color)", color: autoCompile ? "var(--neon-green)" : "var(--text-primary)" }}
          >
            {autoCompile ? "ENABLED" : "DISABLED"}
          </button>
        </div>

        {/* Tab Size Select */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sliders size={12} />
            Tab Indentation
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button 
              onClick={() => setTabSize(2)}
              className={`btn-minimal ${tabSize === 2 ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.7rem" }}
            >2</button>
            <button 
              onClick={() => setTabSize(4)}
              className={`btn-minimal ${tabSize === 4 ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.7rem" }}
            >4</button>
          </div>
        </div>

        {/* Word Wrap toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Word Wrap</span>
          <button 
            onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
            className="btn-minimal"
            style={{ padding: "4px 8px", fontSize: "0.7rem" }}
          >
            {wordWrap.toUpperCase()}
          </button>
        </div>

        {/* Minimap toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Editor Minimap</span>
          <button 
            onClick={() => setMinimap(!minimap)}
            className="btn-minimal"
            style={{ padding: "4px 8px", fontSize: "0.7rem" }}
          >
            {minimap ? "SHOW" : "HIDE"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsDrawer;
