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
  RefreshCw 
} from "lucide-react";

const OutputPanel = ({
  env,
  srcDoc,
  consoleLogs,
  setConsoleLogs,
  terminalLogs,
  isCompiling,
  showConsole,
  setShowConsole,
  consoleMaximized,
  setConsoleMaximized
}) => {
  return (
    <div className="modern-card">
      <div className="panel-header-controls">
        <h2 className="font-ui panel-title">
          {env === "web" ? "LIVE PREVIEW" : "OUTPUT TERMINAL"}
        </h2>
        {env === "web" && (
          <button 
            className={`btn-minimal ${showConsole ? "active" : ""}`}
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
            onClick={() => setShowConsole(!showConsole)}
          >
            <Terminal size={12} />
            <span>Console ({consoleLogs.length})</span>
          </button>
        )}
      </div>

      {env === "web" ? (
        /* HTML Preview Output */
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <div className="output-wrapper">
            <iframe
              srcDoc={srcDoc}
              title="Web Sandbox Preview Output"
              className="preview-iframe"
              sandbox="allow-scripts"
            />
          </div>

          {/* Collapsible logs panel */}
          {showConsole && (
            <div className="console-panel" style={{
              marginTop: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              height: consoleMaximized ? "280px" : "150px",
              transition: "height 0.2s"
            }}>
              <div className="console-header">
                <div className="console-title">
                  <Terminal size={12} />
                  <span>Console Logs</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button 
                    onClick={() => setConsoleLogs([])}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="Clear Logs"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button 
                    onClick={() => setConsoleMaximized(!consoleMaximized)}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {consoleMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>
              </div>
              
              <div className="console-logs" style={{ flexGrow: 1, overflowY: "auto" }}>
                {consoleLogs.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", fontSize: "0.75rem", fontStyle: "italic" }}>
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
                      <div key={i} className="console-log-item" style={{ color }}>
                        <span className="console-log-time">[{log.time}]</span>
                        <span style={{ display: "flex", alignItems: "center", marginTop: "1px" }}>{logIcon}</span>
                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "var(--code-font)", fontSize: "0.75rem" }}>{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standalone Code Terminal Output */
        <div className="terminal-container">
          {isCompiling ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
              <RefreshCw className="animate-spin" size={14} />
              <span>Compiling and assembling binary...</span>
            </div>
          ) : terminalLogs.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.8rem" }}>
              Terminal is empty. Press Run or Ctrl+S to execute the code.
            </div>
          ) : (
            terminalLogs.map((log, index) => {
              let cls = "terminal-line log";
              if (log.type === "info") cls = "terminal-line info";
              else if (log.type === "sys") cls = "terminal-line sys";
              else if (log.type === "error") cls = "terminal-line error";

              return (
                <div key={index} className={cls}>
                  {log.message}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
