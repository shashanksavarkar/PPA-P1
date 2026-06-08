import Editor, { DiffEditor } from "@monaco-editor/react";
import { GitCompare, Keyboard, Sparkles, Check, Copy, RefreshCw, Maximize2, Minimize2, Settings } from "lucide-react";

const actionBtnStyle = (active) => ({
  background: "none",
  border: "none",
  color: active ? "var(--accent-color)" : "var(--text-secondary)",
  cursor: "pointer",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
});

const WorkspaceEditor = ({
  isDesktop,
  webSubTab,
  setWebSubTab,
  diffView,
  setDiffView,
  setShowShortcutsModal,
  handleFormatCode,
  handleCopyCode,
  copied,
  handleResetCode,
  getMonacoLanguage,
  getOriginalCode,
  getActiveCode,
  handleEditorChange,
  handleEditorDidMount,
  handleDiffMount,
  fontSize,
  wordWrap,
  minimap,
  tabSize,
  isEditorFullscreen = false,
  setIsEditorFullscreen,
  setShowSettings
}) => {
  return (
    <div className="modern-card" style={{
      width: "100%",
      height: "100%",
      flexShrink: 0,
      display: "flex",
      flexDirection: "row",
      overflow: "hidden",
      padding: 0,
      border: "1px solid var(--border-color)",
      backgroundColor: "var(--bg-secondary)"
    }}>
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Editor Tabs Bar */}
        <div style={{ height: "36px", backgroundColor: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, userSelect: "none" }}>
          <div style={{ display: "flex", height: "100%" }}>
            {[
              { id: "html", label: "index.html", sym: "<>", color: "#e34c26" },
              { id: "css", label: "styles.css", sym: "#", color: "#0284c7" },
              { id: "js", label: "index.js", sym: "JS", color: "#eab308" }
            ].map(tab => (
              <div key={tab.id} onClick={() => setWebSubTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", height: "100%", fontSize: "0.75rem", cursor: "pointer",
                backgroundColor: webSubTab === tab.id ? "var(--bg-secondary)" : "transparent",
                color: webSubTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                borderRight: "1px solid var(--border-color)", borderTop: webSubTab === tab.id ? "2px solid var(--accent-color)" : "none",
                fontWeight: webSubTab === tab.id ? 600 : 400
              }}>
                <span style={{ color: tab.color, fontWeight: 700 }}>{tab.sym}</span>
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", paddingRight: "12px", alignItems: "center" }}>
            {[
              { onClick: () => setDiffView(!diffView), active: diffView, title: "Toggle Side-by-Side Diff", icon: <GitCompare size={14} /> },
              { onClick: () => setShowShortcutsModal(true), title: "Keyboard Shortcuts", icon: <Keyboard size={14} /> },
              { onClick: handleFormatCode, title: "Format Document", icon: <Sparkles size={14} /> },
              { onClick: handleCopyCode, title: "Copy Code", icon: copied ? <Check size={14} style={{ color: "var(--neon-green)" }} /> : <Copy size={14} /> },
              { onClick: handleResetCode, title: "Reset to Template", icon: <RefreshCw size={14} /> }
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} style={actionBtnStyle(btn.active)} title={btn.title}>{btn.icon}</button>
            ))}

            <div style={{ width: "1px", height: "18px", backgroundColor: "var(--border-color)" }} />

            <button 
              onClick={() => setIsEditorFullscreen?.(!isEditorFullscreen)} 
              style={actionBtnStyle(isEditorFullscreen)} 
              title="Toggle Fullscreen Editor"
            >
              {isEditorFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button 
              onClick={() => setShowSettings?.(true)} 
              style={actionBtnStyle(false)} 
              title="Editor Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Breadcrumb Bar */}
        <div style={{ height: "22px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", padding: "0 16px", fontSize: "0.68rem", color: "var(--text-secondary)", gap: "8px", userSelect: "none" }}>
          <span>src</span><span>&gt;</span><span style={{ color: "var(--text-primary)" }}>{`index.${webSubTab}`}</span>
        </div>

        {/* Monaco Editor Container */}
        <div className="editor-wrapper" style={{ flexGrow: 1, border: "none", borderRadius: 0 }}>
          {diffView ? (
            <DiffEditor height="100%" language={getMonacoLanguage()} original={getOriginalCode()} modified={getActiveCode()} onMount={handleDiffMount} theme="light" options={{ fontSize, fontFamily: "var(--code-font)", minimap: { enabled: false }, wordWrap, readOnly: false, automaticLayout: true, renderSideBySide: true }} />
          ) : (
            <Editor height="100%" language={getMonacoLanguage()} value={getActiveCode()} onChange={handleEditorChange} onMount={handleEditorDidMount} theme="light" options={{ fontSize, fontFamily: "var(--code-font)", minimap: { enabled: minimap }, wordWrap, lineNumbers: "on", readOnly: false, automaticLayout: true, padding: { top: 12, bottom: 12 }, tabSize, scrollBeyondLastLine: false, bracketPairColorization: { enabled: true } }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceEditor;
