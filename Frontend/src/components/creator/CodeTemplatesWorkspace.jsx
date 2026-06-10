import { FileText, Code2, CheckCircle2, Zap } from "lucide-react";
import Editor from "@monaco-editor/react";

const CodeTemplatesWorkspace = ({
  creatorCodeTab,
  setCreatorCodeTab,
  form,
  updateForm,
  tabSize,
  onAutoGenerate
}) => {
  const getLanguage = () => {
    if (creatorCodeTab === "html") return "html";
    if (creatorCodeTab === "css") return "css";
    return "javascript";
  };

  const initialCodeValue = creatorCodeTab === "html" ? form.html : creatorCodeTab === "css" ? form.css : form.js;
  const solutionCodeValue = creatorCodeTab === "html" ? form.solHtml : creatorCodeTab === "css" ? form.solCss : form.solJs;

  const handleInitialChange = (val) => {
    updateForm({ [creatorCodeTab]: val });
  };

  const handleSolutionChange = (val) => {
    const key = `sol${creatorCodeTab.charAt(0).toUpperCase() + creatorCodeTab.slice(1)}`;
    updateForm({ [key]: val });
  };

  return (
    <div className="creator-glass-card p-6 flex flex-col gap-5">
      <div className="flex justify-between items-center border-b border-border pb-3.5 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-accent" />
          <span className="text-[0.85rem] font-bold text-text-primary">Starter & Solution Templates</span>
        </div>
        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-xl border border-border">
          {["html", "css", "js"].map(tab => (
            <button 
              key={tab} 
              type="button"
              onClick={() => setCreatorCodeTab(tab)} 
              className={`px-3.5 py-1.5 text-[0.72rem] font-bold border-none rounded-lg cursor-pointer transition-all duration-150 ${
                creatorCodeTab === tab 
                  ? "text-text-primary bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)]" 
                  : "text-text-secondary bg-transparent hover:text-text-primary"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 h-[340px] shrink-0">
        {/* Boilerplate Editor */}
        <div className="flex flex-col gap-2 h-full min-w-0">
          <span className="text-[0.65rem] font-extrabold text-text-secondary tracking-wider uppercase flex items-center gap-1.5">
            <FileText size={12} />
            <span>INITIAL BOILERPLATE TEMPLATE</span>
          </span>
          <div className="grow border border-border rounded-xl overflow-hidden shadow-sm bg-white">
            <Editor 
              height="100%" 
              language={getLanguage()} 
              value={initialCodeValue} 
              onChange={handleInitialChange} 
              theme="vs"
              options={{ 
                fontSize: 12, 
                minimap: { enabled: false }, 
                tabSize,
                fontFamily: "var(--font-family-code)",
                lineNumbersMinChars: 3,
                padding: { top: 8, bottom: 8 }
              }} 
            />
          </div>
        </div>

        {/* Solution Editor */}
        <div className="flex flex-col gap-2 h-full min-w-0">
          <span className="text-[0.65rem] font-extrabold text-accent tracking-wider uppercase flex items-center gap-1.5">
            <CheckCircle2 size={12} />
            <span>COMPLETED SOLUTION CODE</span>
          </span>
          <div className="grow border border-border rounded-xl overflow-hidden shadow-sm bg-white">
            <Editor 
              height="100%" 
              language={getLanguage()} 
              value={solutionCodeValue} 
              onChange={handleSolutionChange} 
              theme="vs"
              options={{ 
                fontSize: 12, 
                minimap: { enabled: false }, 
                tabSize,
                fontFamily: "var(--font-family-code)",
                lineNumbersMinChars: 3,
                padding: { top: 8, bottom: 8 }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Auto generator Banner */}
      <div className="flex gap-3 items-center bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 shrink-0">
        <button 
          type="button"
          onClick={onAutoGenerate} 
          className="btn-minimal border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300 px-3.5 py-2 rounded-lg text-[0.72rem] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-sm"
        >
          <Zap size={13} className="fill-emerald-700" /> 
          <span>Auto-Draft Boilerplates</span>
        </button>
        <span className="text-[0.7rem] text-text-secondary font-semibold leading-relaxed">
          Generates default starter template and sample solution DOM nodes automatically matching your defined Checkpoint ID and Element rules.
        </span>
      </div>
    </div>
  );
};

export default CodeTemplatesWorkspace;
