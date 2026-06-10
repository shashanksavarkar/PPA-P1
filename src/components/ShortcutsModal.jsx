import { Keyboard } from "lucide-react";

const ShortcutsModal = ({ showShortcutsModal, setShowShortcutsModal }) => {
  if (!showShortcutsModal) return null;

  return (
    <div className="modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
      <div className="modal-content w-[420px] max-w-[90%]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-base font-bold m-0 flex items-center gap-2">
            <Keyboard size={16} className="text-accent" />Keyboard Shortcuts
          </h3>
          <button onClick={() => setShowShortcutsModal(false)} className="bg-transparent border-none text-text-secondary cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {[
            { keys: ["Ctrl", "S"], desc: "Compile sandbox / run tests" },
            { keys: ["Alt", "Z"], desc: "Toggle editor word-wrap" },
            { keys: ["Ctrl", "Alt", "D"], desc: "Toggle side-by-side diff view" },
            { keys: ["Ctrl", "Alt", "K"], desc: "Toggle shortcuts guide" },
            { keys: ["F1"], desc: "Open Monaco command palette" }
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-text-secondary">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[0.7rem] font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowShortcutsModal(false)} className="btn-minimal active w-full justify-center py-2">Close Guide</button>
      </div>
    </div>
  );
};

export default ShortcutsModal;
