import Editor, { DiffEditor } from "@monaco-editor/react";
import { GitCompare, Keyboard, Sparkles, Check, Copy, RefreshCw, Maximize2, Minimize2, Settings } from "lucide-react";

const WorkspaceEditor = ({
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
  const actionBtnClass = (active) =>
    `bg-transparent border-none cursor-pointer p-1 flex items-center justify-center ${active ? "text-accent" : "text-text-secondary"}`;

  return (
    <div className="modern-card !p-0 !flex-row !overflow-hidden !border !border-border !bg-bg-secondary w-full h-full shrink-0">
      <div className="grow flex flex-col min-w-0">
        {/* Editor Tabs Bar */}
        <div className="h-9 bg-bg-primary border-b border-border flex justify-between items-center shrink-0 select-none">
          <div className="flex h-full">
            {[
              { id: "html", label: "index.html", sym: "<>", color: "#e34c26" },
              { id: "css", label: "styles.css", sym: "#", color: "#0284c7" },
              { id: "js", label: "index.js", sym: "JS", color: "#eab308" }
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => setWebSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 h-full text-xs cursor-pointer border-r border-border ${
                  webSubTab === tab.id
                    ? "bg-bg-secondary text-text-primary font-semibold border-t-2 border-t-accent"
                    : "bg-transparent text-text-secondary font-normal border-t-0"
                }`}
              >
                <span className="font-bold" style={{ color: tab.color }}>{tab.sym}</span>
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 pr-3 items-center">
            {[
              { onClick: () => setDiffView(!diffView), active: diffView, title: "Toggle Side-by-Side Diff", icon: <GitCompare size={14} /> },
              { onClick: () => setShowShortcutsModal(true), title: "Keyboard Shortcuts", icon: <Keyboard size={14} /> },
              { onClick: handleFormatCode, title: "Format Document", icon: <Sparkles size={14} /> },
              { onClick: handleCopyCode, title: "Copy Code", icon: copied ? <Check size={14} className="text-neon-green" /> : <Copy size={14} /> },
              { onClick: handleResetCode, title: "Reset to Template", icon: <RefreshCw size={14} /> }
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} className={actionBtnClass(btn.active)} title={btn.title}>{btn.icon}</button>
            ))}

            <div className="w-px h-[18px] bg-border" />

            <button
              onClick={() => setIsEditorFullscreen?.(!isEditorFullscreen)}
              className={actionBtnClass(isEditorFullscreen)}
              title="Toggle Fullscreen Editor"
            >
              {isEditorFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={() => setShowSettings?.(true)}
              className={actionBtnClass(false)}
              title="Editor Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Breadcrumb Bar */}
        <div className="h-[22px] bg-bg-secondary border-b border-border flex items-center px-4 text-[0.68rem] text-text-secondary gap-2 select-none">
          <span>src</span><span>&gt;</span><span className="text-text-primary">{`index.${webSubTab}`}</span>
        </div>

        {/* Monaco Editor Container */}
        <div className="editor-wrapper !border-none !rounded-none grow">
          {diffView ? (
            <DiffEditor height="100%" language={getMonacoLanguage()} original={getOriginalCode()} modified={getActiveCode()} onMount={handleDiffMount} theme="light" options={{ fontSize, fontFamily: "var(--font-family-code)", minimap: { enabled: false }, wordWrap, readOnly: false, automaticLayout: true, renderSideBySide: true }} />
          ) : (
            <Editor height="100%" language={getMonacoLanguage()} value={getActiveCode()} onChange={handleEditorChange} onMount={handleEditorDidMount} theme="light" options={{ fontSize, fontFamily: "var(--font-family-code)", minimap: { enabled: minimap }, wordWrap, lineNumbers: "on", readOnly: false, automaticLayout: true, padding: { top: 12, bottom: 12 }, tabSize, scrollBeyondLastLine: false, bracketPairColorization: { enabled: true } }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceEditor;
