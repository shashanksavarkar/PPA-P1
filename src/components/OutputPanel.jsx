import React, { useState } from "react";
import { 
  Terminal, 
  Trash2, 
  Minimize2, 
  Maximize2, 
  Info, 
  XCircle, 
  AlertCircle, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Globe,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

const JsonInspector = ({ data, label }) => {
  const [expanded, setExpanded] = useState(false);

  if (data === null) return <span style={{ color: "#808080" }}>null</span>;
  if (data === undefined) return <span style={{ color: "#808080" }}>undefined</span>;

  const type = typeof data;
  if (type === "string") {
    return <span style={{ color: "var(--neon-green)" }}>"{data}"</span>;
  }
  if (type === "number") {
    return <span style={{ color: "#eab308" }}>{data}</span>;
  }
  if (type === "boolean") {
    return <span style={{ color: "#3b82f6" }}>{data ? "true" : "false"}</span>;
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);

  return (
    <div style={{ paddingLeft: "8px", display: "inline-block", fontFamily: "var(--code-font)" }}>
      <span 
        onClick={() => setExpanded(!expanded)} 
        style={{ cursor: "pointer", userSelect: "none", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <span style={{ fontSize: "0.6rem", width: "8px" }}>{expanded ? "▼" : "▶"}</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {label ? `${label}: ` : ""}{isArray ? `Array(${data.length})` : "Object"}
        </span>
        <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
          {isArray ? "[" : "{"} {!expanded && `... ${isArray ? "]" : "}"}`}
        </span>
      </span>

      {expanded && (
        <div style={{ borderLeft: "1px dashed var(--border-color)", marginLeft: "4px", paddingLeft: "8px" }}>
          {keys.map(key => (
            <div key={key} style={{ margin: "2px 0", display: "flex", gap: "4px" }}>
              <span style={{ color: "var(--accent-color)", flexShrink: 0 }}>{key}:</span>
              <JsonInspector data={data[key]} />
            </div>
          ))}
          <span style={{ color: "var(--text-secondary)", opacity: 0.5, display: "block" }}>
            {isArray ? "]" : "}"}
          </span>
        </div>
      )}
    </div>
  );
};

const OutputPanel = ({
  srcDoc,
  consoleLogs,
  setConsoleLogs,
  showConsole,
  setShowConsole,
  consoleMaximized,
  setConsoleMaximized,
  onRefresh,
  isCompiling,
  expectedSrcDoc,
  showExpectedPreview,
  setShowExpectedPreview,
  hasActiveChallenge
}) => {
  const [logFilter, setLogFilter] = useState("all"); // "all" | "log" | "warn" | "error"
  const [searchTerm, setSearchTerm] = useState("");

  // Filter logs based on selection and search query
  const filteredLogs = consoleLogs.filter(log => {
    // Severity Filter
    if (logFilter === "log" && !(log.type === "log" || log.type === "info")) return false;
    if (logFilter === "warn" && log.type !== "warn") return false;
    if (logFilter === "error" && log.type !== "error") return false;
    
    // Search Term Filter
    if (searchTerm) {
      return log.message.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="modern-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="panel-header-controls">
        <h2 className="font-ui panel-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Globe size={14} style={{ color: "var(--accent-color)" }} />
          LIVE PREVIEW
        </h2>
        {hasActiveChallenge && (
          <button
            onClick={() => setShowExpectedPreview(!showExpectedPreview)}
            className={`btn-minimal ${showExpectedPreview ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: "0.7rem", gap: "5px" }}
            title={showExpectedPreview ? "Hide Expected Output" : "Show Expected Output"}
          >
            {showExpectedPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showExpectedPreview ? "Hide Expected" : "Expected Output"}</span>
          </button>
        )}
      </div>

      {/* Preview area — side-by-side when expected preview is enabled */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "row", gap: showExpectedPreview ? "8px" : "0", minHeight: 0 }}>

        {/* Student Live Output */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", userSelect: "none" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            </div>
            <button onClick={onRefresh} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }} title="Refresh Preview">
              <RotateCw size={14} className="hover-spin" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 12px", flexGrow: 1, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              <Lock size={10} style={{ color: "var(--neon-green)" }} />
              <span style={{ color: "var(--text-primary)" }}>localhost:5173</span>
              <span style={{ opacity: 0.6 }}>/index.html</span>
            </div>
            {showExpectedPreview && <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap", padding: "2px 5px", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px" }}>YOURS</span>}
          </div>
          <div className="output-wrapper" style={{ flexGrow: 1, minHeight: 0, border: "none", borderRadius: 0, position: "relative" }}>
            <iframe srcDoc={srcDoc} title="Web Sandbox Preview Output" className="preview-iframe" sandbox="allow-scripts allow-same-origin" />
            {isCompiling && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--bg-secondary)", opacity: 0.85, backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", zIndex: 100 }}>
                <RotateCw className="animate-spin" size={24} style={{ color: "var(--accent-color)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-primary)" }}>COMPILING SANDBOX...</span>
              </div>
            )}
          </div>
        </div>

        {/* Expected Output Reference Panel */}
        {showExpectedPreview && (
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid rgba(59,130,246,0.4)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 0 0 1px rgba(59,130,246,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", backgroundColor: "rgba(59,130,246,0.06)", borderBottom: "1px solid rgba(59,130,246,0.2)", userSelect: "none" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.35)" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(245,158,11,0.35)" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.35)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "6px", padding: "4px 12px", flexGrow: 1, fontSize: "0.75rem" }}>
                <Eye size={10} style={{ color: "var(--accent-color)" }} />
                <span style={{ color: "var(--accent-color)", fontWeight: 600 }}>reference output</span>
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent-color)", whiteSpace: "nowrap", padding: "2px 5px", backgroundColor: "rgba(59,130,246,0.12)", borderRadius: "3px" }}>EXPECTED</span>
            </div>
            <div style={{ flexGrow: 1, minHeight: 0, position: "relative" }}>
              <iframe
                srcDoc={expectedSrcDoc}
                title="Expected Output Reference"
                style={{ width: "100%", height: "100%", border: "none", background: "white" }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Console Logs Panel */}
      <div 
        className="console-panel" 
        style={{
          marginTop: "12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          height: !showConsole ? "38px" : (consoleMaximized ? "280px" : "150px"),
          transition: "height 0.2s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0
        }}
      >
        {/* Header */}
        <div 
          className="console-header"
          style={{ 
            cursor: "pointer", 
            userSelect: "none", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "8px 16px",
            backgroundColor: "var(--bg-tertiary)",
            borderBottom: showConsole ? "1px solid var(--border-color)" : "none"
          }}
          onClick={() => setShowConsole(!showConsole)}
        >
          <div className="console-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--text-primary)" }}>
            <Terminal size={12} style={{ color: showConsole ? "var(--accent-color)" : "var(--text-secondary)" }} />
            <span style={{ fontWeight: 500 }}>Console Logs ({filteredLogs.length})</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
              {showConsole ? <ChevronDown size={12} style={{ verticalAlign: "middle" }} /> : <ChevronUp size={12} style={{ verticalAlign: "middle" }} />}
            </span>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            {/* Clear logs */}
            <button 
              onClick={() => setConsoleLogs([])}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Clear Logs"
            >
              <Trash2 size={12} />
            </button>
            
            {/* Maximize / Minimize toggle (only visible when expanded) */}
            {showConsole && (
              <button 
                onClick={() => setConsoleMaximized(!consoleMaximized)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {consoleMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls & Search (visible only when expanded) */}
        {showConsole && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.7rem",
            gap: "8px"
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => setLogFilter("all")}
                className={`btn-minimal ${logFilter === "all" ? "active" : ""}`}
                style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem" }}
              >
                All ({consoleLogs.length})
              </button>
              <button 
                onClick={() => setLogFilter("log")}
                className={`btn-minimal ${logFilter === "log" ? "active" : ""}`}
                style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem" }}
              >
                Logs ({consoleLogs.filter(l => l.type === "log" || l.type === "info").length})
              </button>
              <button 
                onClick={() => setLogFilter("warn")}
                className={`btn-minimal ${logFilter === "warn" ? "active" : ""}`}
                style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem" }}
              >
                Warnings ({consoleLogs.filter(l => l.type === "warn").length})
              </button>
              <button 
                onClick={() => setLogFilter("error")}
                className={`btn-minimal ${logFilter === "error" ? "active" : ""}`}
                style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem" }}
              >
                Errors ({consoleLogs.filter(l => l.type === "error").length})
              </button>
            </div>

            {/* Console Log Search Input */}
            <input 
              type="text"
              placeholder="Filter console logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                fontSize: "0.65rem",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: "4px",
                padding: "2px 8px",
                width: "140px",
                outline: "none"
              }}
            />
          </div>
        )}
        
        {/* Logs Area */}
        <div 
          className="console-logs" 
          style={{ 
            flexGrow: 1, 
            overflowY: "auto", 
            padding: "10px 14px", 
            fontFamily: "var(--code-font)", 
            fontSize: "0.75rem",
            backgroundColor: "var(--bg-primary)"
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", opacity: 0.6, fontSize: "0.7rem", fontStyle: "italic", textAlign: "center", marginTop: "10px" }}>
              {searchTerm ? "No logs matching filter query" : "Console empty"}
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              let color = "var(--text-primary)";
              let icon = <Info size={10} style={{ color: "var(--accent-color)" }} />;
              
              if (log.type === "warn") {
                color = "#eab308";
                icon = <AlertCircle size={10} style={{ color: "#eab308" }} />;
              } else if (log.type === "error") {
                color = "var(--neon-red)";
                icon = <XCircle size={10} style={{ color: "var(--neon-red)" }} />;
              } else if (log.type === "success") {
                color = "var(--neon-green)";
                icon = <CheckCircle2 size={10} style={{ color: "var(--neon-green)" }} />;
              }

              let renderContent = <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{log.message}</span>;
              
              // Inspect and render object/array JSON strings
              const trimmed = log.message.trim();
              if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || 
                  (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                  const parsed = JSON.parse(trimmed);
                  renderContent = <JsonInspector data={parsed} />;
                } catch (e) {}
              }
              
              return (
                <div 
                  key={index} 
                  style={{ 
                    display: "flex", 
                    gap: "8px", 
                    alignItems: "flex-start", 
                    marginBottom: "4px", 
                    borderBottom: "1px solid rgba(255, 255, 255, 0.02)", 
                    paddingBottom: "4px",
                    color: color
                  }}
                >
                  <span style={{ marginTop: "2px", flexShrink: 0 }}>{icon}</span>
                  {renderContent}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;
