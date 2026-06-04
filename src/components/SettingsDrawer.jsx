import React from "react";

const SettingsDrawer = ({ 
  wordWrap, 
  setWordWrap, 
  fontSize, 
  setFontSize,
  minimap,
  setMinimap
}) => {
  return (
    <div style={{
      position: "absolute",
      top: "65px",
      right: "20px",
      backgroundColor: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: "10px",
      padding: "16px",
      zIndex: 200,
      width: "250px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
    }}>
      <h3 className="font-ui" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
        Editor Configuration
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Word Wrap</span>
          <button 
            onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
            className="btn-minimal"
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
          >
            {wordWrap.toUpperCase()}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Minimap</span>
          <button 
            onClick={() => setMinimap(!minimap)}
            className="btn-minimal"
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
          >
            {minimap ? "SHOW" : "HIDE"}
          </button>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Font Size</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button 
              onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              className="btn-minimal"
              style={{ padding: "2px 6px", fontSize: "0.75rem" }}
            >-</button>
            <span style={{ fontSize: "0.8rem", fontFamily: "var(--code-font)" }}>{fontSize}px</span>
            <button 
              onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
              className="btn-minimal"
              style={{ padding: "2px 6px", fontSize: "0.75rem" }}
            >+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
