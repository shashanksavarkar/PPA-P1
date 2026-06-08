import { Keyboard } from "lucide-react";

const ShortcutsModal = ({ showShortcutsModal, setShowShortcutsModal }) => {
  if (!showShortcutsModal) return null;

  return (
    <div className="modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
      <div className="modal-content" style={{ width: "420px", maxWidth: "90%" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Keyboard size={16} style={{ color: "var(--accent-color)" }} />Keyboard Shortcuts
          </h3>
          <button onClick={() => setShowShortcutsModal(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>✕</button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.75rem" }}>
          {[
            { keys: ["Ctrl", "S"], desc: "Compile sandbox / run tests" },
            { keys: ["Alt", "Z"], desc: "Toggle editor word-wrap" },
            { keys: ["Ctrl", "Alt", "D"], desc: "Toggle side-by-side diff view" },
            { keys: ["Ctrl", "Alt", "K"], desc: "Toggle shortcuts guide" },
            { keys: ["F1"], desc: "Open Monaco command palette" }
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>{s.desc}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {s.keys.map((k, j) => (
                  <kbd key={j} style={{ padding: "2px 6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontFamily: "monospace", fontSize: "0.7rem" }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowShortcutsModal(false)} className="btn-minimal active" style={{ width: "100%", justifyContent: "center", padding: "8px" }}>Close Guide</button>
      </div>
    </div>
  );
};

export default ShortcutsModal;
