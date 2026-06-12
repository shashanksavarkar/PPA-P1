import { useState } from "react";
import {
  Trash2, Info, XCircle, AlertCircle, CheckCircle2, RotateCw, Globe, Eye, EyeOff, Terminal, ChevronDown, ChevronRight
} from "lucide-react";
import JsonInspector from "./JsonInspector";

const OutputPanel = ({
  srcDoc, consoleLogs, setConsoleLogs, onRefresh, isCompiling,
  expectedSrcDoc, showExpectedPreview, setShowExpectedPreview,
  hasActiveChallenge, hideExpectedOption,
  col3Height = 55, onDragStart
}) => {
  const [logFilter, setLogFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);

  const filteredLogs = consoleLogs.filter(log => {
    if (logFilter === "log" && log.type !== "log" && log.type !== "info") return false;
    if (logFilter !== "all" && logFilter !== "log" && log.type !== logFilter) return false;
    return !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const consoleHeight = 100 - col3Height;
  const iframeSandbox = "allow-scripts allow-same-origin";

  return (
    <div className="h-full flex flex-col overflow-hidden gap-0.5">

      {/* Browser Panel (Top) */}
      <div className="grow min-h-[15%] flex flex-col border border-border rounded-lg overflow-hidden bg-bg-secondary">
        {/* Browser Header */}
        <div className="h-9 flex items-center justify-between border-b border-border bg-bg-primary px-3 shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-text-primary text-xs font-bold">
            <Globe size={13} className="text-text-secondary" />
            <span>Browser</span>
          </div>
          {hasActiveChallenge && !hideExpectedOption && (
            <button
              onClick={() => setShowExpectedPreview(!showExpectedPreview)}
              className={`px-2 py-[3px] text-[0.68rem] inline-flex items-center gap-1 border border-border rounded cursor-pointer ${
                showExpectedPreview ? "bg-accent/[0.08] text-accent" : "bg-transparent text-text-secondary"
              }`}
            >
              {showExpectedPreview ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showExpectedPreview ? "Hide Expected" : "Expected Output"}</span>
            </button>
          )}
        </div>

        {/* Browser Viewport Area */}
        <div className={`grow flex min-h-0 p-2 relative ${showExpectedPreview ? "gap-2" : "gap-0"}`}>
          <div className="grow flex flex-col min-h-0 border border-border rounded-md overflow-hidden relative">
            <iframe
              srcDoc={srcDoc}
              title="Preview Output"
              className="preview-iframe"
              sandbox={iframeSandbox}
            />

            {isCompiling && (
              <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2.5">
                <RotateCw className="animate-spin" size={20} style={{ color: "var(--color-accent)" }} />
                <span className="text-[0.7rem] font-semibold">COMPILING...</span>
              </div>
            )}

            {/* reload button overlay */}
            <button
              onClick={onRefresh}
              className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-bg-secondary border border-border flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-text-secondary z-5 outline-none"
              title="Reload Preview"
            >
              <RotateCw size={12} />
            </button>
          </div>

          {showExpectedPreview && (
            <div className="grow flex flex-col min-h-0 border border-accent rounded-md overflow-hidden">
              <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-accent-glow border-b border-accent select-none">
                <span className="text-accent font-semibold text-[0.7rem]">Reference Output</span>
              </div>
              <iframe srcDoc={expectedSrcDoc} title="Expected Output" className="w-full h-full border-none bg-white" sandbox={iframeSandbox} />
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Row Resizer Handle */}
      {onDragStart && (
        <div
          className="h-1.5 cursor-row-resize bg-transparent flex items-center justify-center z-10 shrink-0 select-none"
          onMouseDown={onDragStart}
        >
          <div className="h-0.5 w-9 rounded-sm bg-black/[0.08]" />
        </div>
      )}

      {/* Console Panel (Bottom) */}
      <div
        className="flex flex-col border border-border rounded-lg overflow-hidden bg-bg-secondary transition-[height] duration-200"
        style={{
          height: consoleCollapsed ? "36px" : `${consoleHeight}%`,
          minHeight: consoleCollapsed ? "36px" : "15%",
          flexShrink: consoleCollapsed ? 0 : undefined
        }}
      >
        {/* Console Header */}
        <div
          onClick={() => setConsoleCollapsed(c => !c)}
          className="h-9 flex items-center justify-between bg-bg-primary px-3 shrink-0 select-none cursor-pointer"
          style={{ borderBottom: consoleCollapsed ? "none" : "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-1.5 text-text-primary text-xs font-bold">
            {consoleCollapsed ? <ChevronRight size={13} className="text-text-secondary" /> : <ChevronDown size={13} className="text-text-secondary" />}
            <Terminal size={13} className="text-text-secondary" />
            <span>Console</span>
            {consoleLogs.length > 0 && (
              <span className="text-[0.65rem] bg-bg-quaternary border border-border rounded-xl px-[5px] text-text-secondary">{consoleLogs.length}</span>
            )}
          </div>

          {!consoleCollapsed && (
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
              {/* Filter Pills */}
              <div className="flex gap-1">
                {[
                  { id: "all", label: "All", count: consoleLogs.length },
                  { id: "log", label: "Logs", count: consoleLogs.filter(l => l.type === "log" || l.type === "info").length },
                  { id: "error", label: "Errors", count: consoleLogs.filter(l => l.type === "error").length }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setLogFilter(f.id)}
                    className={`px-1.5 py-0.5 text-[0.65rem] border border-border rounded cursor-pointer text-text-secondary ${
                      logFilter === f.id ? "bg-bg-quaternary font-bold" : "bg-transparent font-medium"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-[0.65rem] bg-bg-primary border border-border rounded px-1.5 py-0.5 w-[100px] outline-none text-text-primary"
              />
              <button
                onClick={() => setConsoleLogs([])}
                className="px-1.5 py-0.5 text-[0.65rem] inline-flex items-center gap-1 bg-transparent border border-border rounded text-text-secondary cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Console Logs Container */}
        {!consoleCollapsed && (
          <div className="grow overflow-y-auto px-3.5 py-2.5 font-[family-name:var(--font-family-code)] text-xs bg-bg-secondary">
            {/* Persistent header comment */}
            <div className="text-text-secondary font-mono mb-3 whitespace-pre leading-relaxed opacity-70">
              {`/**\n* Your test output will go here\n*/`}
            </div>

            {filteredLogs.length === 0 ? (
              searchTerm && (
                <div className="text-text-secondary text-[0.7rem] italic text-center mt-2.5">
                  No logs matching filter
                </div>
              )
            ) : (
              filteredLogs.map((log, index) => {
                const colors = { warn: "#b45309", error: "var(--color-neon-red)", success: "var(--color-neon-green)" };
                const icons = {
                  warn: <AlertCircle size={10} style={{ color: "#b45309" }} />,
                  error: <XCircle size={10} className="text-neon-red" />,
                  success: <CheckCircle2 size={10} className="text-neon-green" />
                };
                const color = colors[log.type] || "var(--color-text-primary)";
                const icon = icons[log.type] || <Info size={10} className="text-accent" />;

                let renderContent = <span className="whitespace-pre-wrap break-all">{log.message}</span>;
                const trimmed = log.message.trim();
                if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                  try {
                    renderContent = <JsonInspector data={JSON.parse(trimmed)} />;
                  } catch {
                    renderContent = <span className="whitespace-pre-wrap break-all">{log.message}</span>;
                  }
                }

                return (
                  <div key={index} className="flex gap-2 items-start mb-1 border-b border-border pb-1" style={{ color }}>
                    <span className="mt-0.5 shrink-0">{icon}</span>
                    {renderContent}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
