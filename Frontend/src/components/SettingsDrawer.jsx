import { X, Sliders, Type, Play } from "lucide-react";

const SizeStepper = ({ value, onDecrease, onIncrease }) => (
  <div className="flex items-center gap-1.5">
    <button onClick={onDecrease} className="btn-minimal px-1.5 py-0.5 text-[0.7rem]">-</button>
    <span className="text-xs font-[family-name:var(--font-family-code)]">{value}px</span>
    <button onClick={onIncrease} className="btn-minimal px-1.5 py-0.5 text-[0.7rem]">+</button>
  </div>
);

const ToggleRow = ({ label, icon, active, onToggle }) => (
  <div className="flex justify-between items-center">
    <span className="text-[0.8rem] text-text-secondary inline-flex items-center gap-1">
      {icon}
      {label}
    </span>
    <button
      onClick={onToggle}
      className="btn-minimal px-2 py-1 text-[0.7rem]"
      style={{
        color: active ? "var(--color-accent)" : "var(--color-text-primary)",
        borderColor: active ? "var(--color-accent)" : "var(--color-border)"
      }}
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
    <div className="absolute top-[65px] right-5 bg-bg-secondary border border-border rounded-xl p-5 z-200 w-[300px] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
        <h3 className="font-[family-name:var(--font-family-ui)] text-[0.9rem] font-semibold flex items-center gap-1.5">
          <Sliders size={14} className="text-accent" />
          Preferences &amp; Options
        </h3>
        <button onClick={onClose} className="bg-transparent border-none text-text-secondary cursor-pointer flex items-center">
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-[0.8rem] text-text-secondary inline-flex items-center gap-1">
            <Type size={12} />
            UI Text Size
          </span>
          <SizeStepper value={uiFontSize} onDecrease={() => setUiFontSize(prev => Math.max(12, prev - 1))} onIncrease={() => setUiFontSize(prev => Math.min(20, prev + 1))} />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[0.8rem] text-text-secondary inline-flex items-center gap-1">
            <Type size={12} />
            Editor Code Size
          </span>
          <SizeStepper value={fontSize} onDecrease={() => setFontSize(prev => Math.max(10, prev - 1))} onIncrease={() => setFontSize(prev => Math.min(32, prev + 1))} />
        </div>

        <ToggleRow label="Auto Compile" icon={<Play size={12} />} active={autoCompile} onToggle={() => setAutoCompile(!autoCompile)} />

        <div className="flex justify-between items-center">
          <span className="text-[0.8rem] text-text-secondary inline-flex items-center gap-1">
            <Sliders size={12} />
            Tab Indentation
          </span>
          <div className="flex gap-1">
            {[2, 4].map(sz => (
              <button key={sz} onClick={() => setTabSize(sz)} className={`btn-minimal px-2 py-[3px] text-[0.7rem] ${tabSize === sz ? "active" : ""}`}>
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
