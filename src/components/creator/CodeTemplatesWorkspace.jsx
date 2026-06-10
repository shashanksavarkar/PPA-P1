import { FileText } from "lucide-react";
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
    <div className="creator-glass-card p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-accent" />
          <span className="text-[0.85rem] font-bold text-text-primary">Code Workspace Templates</span>
        </div>
        <div className="flex gap-1 bg-bg-tertiary p-0.5 rounded-md">
          {["html", "css", "js"].map(tab => (
            <button 
              key={tab} 
              type="button"
              onClick={() => setCreatorCodeTab(tab)} 
              className={`px-3 py-1 text-[0.7rem] font-bold border-none rounded cursor-pointer transition-all duration-150 ${
                creatorCodeTab === tab 
                  ? "text-text-primary bg-bg-secondary shadow-[0_1px_4px_rgba(0,0,0,0.05)]" 
                  : "text-text-secondary bg-transparent"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[300px]">
        <div className="flex flex-col gap-1.5 h-full">
          <span className="text-[0.68rem] font-bold text-text-secondary tracking-wide">
            INITIAL BOILERPLATE TEMPLATE
          </span>
          <div className="grow border border-border rounded-lg overflow-hidden">
            <Editor 
              height="100%" 
              language={getLanguage()} 
              value={initialCodeValue} 
              onChange={handleInitialChange} 
              options={{ fontSize: 12, minimap: { enabled: false }, tabSize }} 
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 h-full">
          <span className="text-[0.68rem] font-bold text-accent tracking-wide">
            COMPLETED SOLUTION CODE
          </span>
          <div className="grow border border-border rounded-lg overflow-hidden">
            <Editor 
              height="100%" 
              language={getLanguage()} 
              value={solutionCodeValue} 
              onChange={handleSolutionChange} 
              options={{ fontSize: 12, minimap: { enabled: false }, tabSize }} 
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-center mt-1 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-lg px-3.5 py-2.5">
        <button 
          type="button"
          onClick={onAutoGenerate} 
          className="btn-minimal border-neon-green text-neon-green hover:bg-neon-green/5 hover:border-neon-green bg-bg-secondary px-3 py-1.5 rounded-md text-[0.75rem] font-bold cursor-pointer transition-all"
        >
          ⚡ Auto-Generate Boilerplates
        </button>
        <span className="text-[0.7rem] text-text-secondary font-medium">
          Automatically drafts initial & solution templates based on your Assessment Checkpoints.
        </span>
      </div>
    </div>
  );
};

export default CodeTemplatesWorkspace;
