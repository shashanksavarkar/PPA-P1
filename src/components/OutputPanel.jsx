import React from "react";
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
  ChevronUp
} from "lucide-react";

const OutputPanel = ({
  srcDoc,
  consoleLogs,
  setConsoleLogs,
  showConsole,
  setShowConsole,
  consoleMaximized,
  setConsoleMaximized
}) => {
  return (
    <div className="modern-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="panel-header-controls">
        <h2 className="font-ui panel-title">LIVE PREVIEW</h2>
      </div>

      {/* HTML Preview Output */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="output-wrapper" style={{ flexGrow: 1, minHeight: 0 }}>
          <iframe
            srcDoc={srcDoc}
            title="Web Sandbox Preview Output"
            className="preview-iframe"
            sandbox="allow-scripts"
          />
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
          {/* Header (Clickable to Collapse/Expand) */}
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
              <span style={{ fontWeight: 500 }}>Console Logs ({consoleLogs.length})</span>
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
          
          {/* Logs Area */}
          <div 
            className="console-logs" 
            style={{ 
              flexGrow: 1, 
              overflowY: "auto", 
              padding: "10px 14px", 
              backgroundColor: "#05070c",
              display: !showConsole ? "none" : "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            {consoleLogs.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", fontSize: "0.75rem", fontStyle: "italic", minHeight: "60px" }}>
                Console is empty
              </div>
            ) : (
              consoleLogs.map((log, i) => {
                let logIcon = <Info size={11} />;
                let color = "#93c5fd";
                if (log.type === "error") {
                  logIcon = <XCircle size={11} />;
                  color = "var(--neon-red)";
                } else if (log.type === "warn") {
                  logIcon = <AlertCircle size={11} />;
                  color = "#fbbf24";
                } else if (log.type === "info") {
                  logIcon = <CheckCircle2 size={11} />;
                  color = "var(--neon-green)";
                }

                return (
                  <div key={i} className="console-log-item" style={{ display: "flex", gap: "8px", color, lineHeight: "1.4" }}>
                    <span className="console-log-time" style={{ color: "#4b5563", fontSize: "0.75rem", userSelect: "none" }}>[{log.time}]</span>
                    <span style={{ display: "flex", alignItems: "center", marginTop: "2px" }}>{logIcon}</span>
                    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "var(--code-font)", fontSize: "0.75rem" }}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;
