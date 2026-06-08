import { X, Sliders, Type, Play } from "lucide-react";

const SizeStepper = ({ value, onDecrease, onIncrease }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <button onClick={onDecrease} className="btn-minimal" style={{ padding: "2px 6px", fontSize: "0.7rem" }}>-</button>
    <span style={{ fontSize: "0.75rem", fontFamily: "var(--code-font)" }}>{value}px</span>
    <button onClick={onIncrease} className="btn-minimal" style={{ padding: "2px 6px", fontSize: "0.7rem" }}>+</button>
  </div>
);

const ToggleRow = ({ label, icon, active, onToggle }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {icon}
      {label}
    </span>
    <button 
      onClick={onToggle}
      className="btn-minimal"
      style={{ padding: "4px 8px", fontSize: "0.7rem", color: active ? "var(--accent-color)" : "var(--text-primary)", borderColor: active ? "var(--accent-color)" : "var(--border-color)" }}
    >
      {active ? "ON" : "OFF"}
    </button>
  </div>
);

const SettingsDrawer = ({ 
  wordWrap, 
  setWordWrap, 
  fontSize, 
  setFontSize,
  minimap,
  setMinimap,
  uiFontSize,
  setUiFontSize,
  autoCompile,
  setAutoCompile,
  tabSize,
  setTabSize,
  onClose
}) => {
  return (
    <div style={{ position: "absolute", top: "65px", right: "20px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", zIndex: 200, width: "300px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <h3 className="font-ui" style={{ fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sliders size={14} style={{ color: "var(--accent-color)" }} />
          Preferences & Options
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Type size={12} />
            UI Text Size
          </span>
          <SizeStepper value={uiFontSize} onDecrease={() => setUiFontSize(prev => Math.max(12, prev - 1))} onIncrease={() => setUiFontSize(prev => Math.min(20, prev + 1))} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Type size={12} />
            Editor Code Size
          </span>
          <SizeStepper value={fontSize} onDecrease={() => setFontSize(prev => Math.max(10, prev - 1))} onIncrease={() => setFontSize(prev => Math.min(32, prev + 1))} />
        </div>

        <ToggleRow label="Auto Compile" icon={<Play size={12} />} active={autoCompile} onToggle={() => setAutoCompile(!autoCompile)} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Sliders size={12} />
            Tab Indentation
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[2, 4].map(sz => (
              <button key={sz} onClick={() => setTabSize(sz)} className={`btn-minimal ${tabSize === sz ? "active" : ""}`} style={{ padding: "3px 8px", fontSize: "0.7rem" }}>
                {sz}
              </button>
            ))}
          </div>
        </div>

        <ToggleRow label="Word Wrap" active={wordWrap === "on"} onToggle={() => setWordWrap(wordWrap === "on" ? "off" : "on")} />
        <ToggleRow label="Editor Minimap" active={minimap} onToggle={() => setMinimap(!minimap)} />
      </div>
    </div>
  );
};

export default SettingsDrawer;
