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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", gap: "2px" }}>
      
      {/* Browser Panel (Top) */}
      <div style={{ 
        flexGrow: 1,
        minHeight: "15%", 
        display: "flex", 
        flexDirection: "column", 
        border: "1px solid var(--border-color)", 
        borderRadius: "8px", 
        overflow: "hidden", 
        backgroundColor: "var(--bg-secondary)" 
      }}>
        {/* Browser Header */}
        <div style={{ 
          height: "36px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          borderBottom: "1px solid var(--border-color)", 
          backgroundColor: "var(--bg-primary)", 
          padding: "0 12px", 
          flexShrink: 0, 
          userSelect: "none" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
            <Globe size={13} style={{ color: "var(--text-secondary)" }} />
            <span>Browser</span>
          </div>
          {hasActiveChallenge && !hideExpectedOption && (
            <button 
              onClick={() => setShowExpectedPreview(!showExpectedPreview)} 
              style={{ 
                padding: "3px 8px", 
                fontSize: "0.68rem", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "4px", 
                backgroundColor: showExpectedPreview ? "rgba(79, 70, 229, 0.08)" : "transparent", 
                border: "1px solid var(--border-color)", 
                borderRadius: "4px", 
                color: showExpectedPreview ? "var(--accent-color)" : "var(--text-secondary)", 
                cursor: "pointer" 
              }}
            >
              {showExpectedPreview ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showExpectedPreview ? "Hide Expected" : "Expected Output"}</span>
            </button>
          )}
        </div>
        
        {/* Browser Viewport Area */}
        <div style={{ flexGrow: 1, display: "flex", gap: showExpectedPreview ? "8px" : "0", minHeight: 0, padding: "8px", position: "relative" }}>
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
            <iframe 
              srcDoc={srcDoc} 
              title="Preview Output" 
              className="preview-iframe" 
              sandbox="allow-scripts allow-same-origin" 
              style={{ width: "100%", height: "100%", border: "none", background: "white" }} 
            />
            
            {isCompiling && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#ffffff", opacity: 0.85, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <RotateCw className="animate-spin" size={20} style={{ color: "var(--accent-color)" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>COMPILING...</span>
              </div>
            )}

            {/* reload button overlay */}
            <button 
              onClick={onRefresh} 
              style={{
                position: "absolute", bottom: "12px", right: "12px",
                width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                color: "var(--text-secondary)", zIndex: 5, outline: "none"
              }} 
              title="Reload Preview"
            >
              <RotateCw size={12} className="hover-spin" />
            </button>
          </div>

          {showExpectedPreview && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid var(--accent-color)", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", backgroundColor: "var(--accent-glow)", borderBottom: "1px solid var(--accent-color)", userSelect: "none" }}>
                <span style={{ color: "var(--accent-color)", fontWeight: 600, fontSize: "0.7rem" }}>Reference Output</span>
              </div>
              <iframe srcDoc={expectedSrcDoc} title="Expected Output" style={{ width: "100%", height: "100%", border: "none", background: "white" }} sandbox="allow-scripts allow-same-origin" />
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Row Resizer Handle */}
      {onDragStart && (
        <div 
          style={{
            height: "6px", cursor: "row-resize", backgroundColor: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, flexShrink: 0, userSelect: "none"
          }}
          onMouseDown={onDragStart}
        >
          <div style={{ height: "2px", width: "36px", borderRadius: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)" }} />
        </div>
      )}

      {/* Console Panel (Bottom) */}
      <div style={{ 
        height: consoleCollapsed ? "36px" : `${consoleHeight}%`, 
        minHeight: consoleCollapsed ? "36px" : "15%",
        flexShrink: consoleCollapsed ? 0 : undefined,
        display: "flex", 
        flexDirection: "column", 
        border: "1px solid var(--border-color)", 
        borderRadius: "8px", 
        overflow: "hidden", 
        backgroundColor: "var(--bg-secondary)",
        transition: "height 0.2s ease"
      }}>
        {/* Console Header — click to collapse/expand */}
        <div 
          onClick={() => setConsoleCollapsed(c => !c)}
          style={{ 
            height: "36px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            borderBottom: consoleCollapsed ? "none" : "1px solid var(--border-color)", 
            backgroundColor: "var(--bg-primary)", 
            padding: "0 12px", 
            flexShrink: 0, 
            userSelect: "none",
            cursor: "pointer"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
            {consoleCollapsed ? <ChevronRight size={13} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-secondary)" }} />}
            <Terminal size={13} style={{ color: "var(--text-secondary)" }} />
            <span>Console</span>
            {consoleLogs.length > 0 && (
              <span style={{ fontSize: "0.65rem", backgroundColor: "var(--bg-quaternary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0 5px", color: "var(--text-secondary)" }}>{consoleLogs.length}</span>
            )}
          </div>
          
          {!consoleCollapsed && (
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Filter Pills */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { id: "all", label: "All", count: consoleLogs.length },
                  { id: "log", label: "Logs", count: consoleLogs.filter(l => l.type === "log" || l.type === "info").length },
                  { id: "error", label: "Errors", count: consoleLogs.filter(l => l.type === "error").length }
                ].map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setLogFilter(f.id)} 
                    style={{ 
                      padding: "2px 6px", 
                      fontSize: "0.65rem", 
                      backgroundColor: logFilter === f.id ? "var(--bg-quaternary)" : "transparent", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: "4px", 
                      color: "var(--text-secondary)", 
                      cursor: "pointer",
                      fontWeight: logFilter === f.id ? 700 : 500
                    }}
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
                style={{ 
                  fontSize: "0.65rem", 
                  backgroundColor: "var(--bg-primary)", 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "4px", 
                  padding: "2px 6px", 
                  width: "100px", 
                  outline: "none",
                  color: "var(--text-primary)"
                }} 
              />
              <button 
                onClick={() => setConsoleLogs([])} 
                style={{ 
                  padding: "2px 6px", 
                  fontSize: "0.65rem", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  backgroundColor: "transparent", 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "4px", 
                  color: "var(--text-secondary)", 
                  cursor: "pointer" 
                }} 
                title="Clear Logs"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Console Logs Container */}
        {!consoleCollapsed && (
        <div style={{ flexGrow: 1, overflowY: "auto", padding: "10px 14px", fontFamily: "var(--code-font)", fontSize: "0.75rem", backgroundColor: "var(--bg-secondary)" }}>
          {filteredLogs.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontStyle: "italic", textAlign: "center", marginTop: "10px" }}>
              {searchTerm ? "No logs matching filter" : "Console empty"}
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const colors = { warn: "#b45309", error: "var(--neon-red)", success: "var(--neon-green)" };
              const icons = {
                warn: <AlertCircle size={10} style={{ color: "#b45309" }} />,
                error: <XCircle size={10} style={{ color: "var(--neon-red)" }} />,
                success: <CheckCircle2 size={10} style={{ color: "var(--neon-green)" }} />
              };
              const color = colors[log.type] || "var(--text-primary)";
              const icon = icons[log.type] || <Info size={10} style={{ color: "var(--accent-color)" }} />;

              let renderContent = <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{log.message}</span>;
              const trimmed = log.message.trim();
              if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try { renderContent = <JsonInspector data={JSON.parse(trimmed)} />; } catch {}
              }
              
              return (
                <div key={index} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "4px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px", color }}>
                  <span style={{ marginTop: "2px", flexShrink: 0 }}>{icon}</span>
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
