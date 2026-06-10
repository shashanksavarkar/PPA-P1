import { useState } from "react";
import { FileText, Terminal } from "lucide-react";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { challengeToSteps, stepsToRulesAndTasks, parseChallengeText, generateStarterCode } from "../utils/challengeHelpers";
import CustomDropdown from "./creator/CustomDropdown";
import QuestionLibraryModal from "./creator/QuestionLibraryModal";
import AssessmentCheckpoints from "./creator/AssessmentCheckpoints";
import CodeTemplatesWorkspace from "./creator/CodeTemplatesWorkspace";
import { CHALLENGE_PRESETS } from "../constants/challengePresets";

const CreatorWorkspace = ({ questions, setQuestions, showToast, tabSize, activeIndex, loadQuestion }) => {
  const [form, setForm] = useState({
    id: "", title: "", difficulty: "", type: "", duration: 0, topics: [], companies: [], description: "",
    steps: [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
    html: "", css: "", js: "", solHtml: "", solCss: "", solJs: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const [advancedSteps, setAdvancedSteps] = useState({});
  const [importText, setImportText] = useState("");
  const [rawJsonText, setRawJsonText] = useState("");
  const [creatorCodeTab, setCreatorCodeTab] = useState("html");
  const [creatorTab, setCreatorTab] = useState("form");

  const updateForm = (fields) => setForm(prev => ({ ...prev, ...fields }));

  const handleAutoGenerateCode = () => {
    const generated = generateStarterCode(form.steps, form.title);
    updateForm(generated);
    showToast("Starter code auto-generated!", "success");
  };

  const handleEditChallenge = (q) => {
    setForm({
      id: q.id, 
      title: q.title || "", 
      difficulty: q.difficulty || "", 
      type: q.type || "",
      duration: q.duration || 0,
      topics: q.topics || [],
      companies: q.companies || [],
      description: q.description || "",
      steps: challengeToSteps(q).length ? challengeToSteps(q) : [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
      html: q.initialHtml || "", css: q.initialCss || "", js: q.initialJs || "",
      solHtml: q.solutionHtml || "", solCss: q.solutionCss || "", solJs: q.solutionJs ||  ""
    });
    setCreatorTab("form");
    setValidationErrors([]);
  };

  const handleSaveChallenge = () => {
    const errors = [];
    if (!form.title || form.title.trim().length < 8) {
      errors.push("Question name too short (< 8 chars)");
    }
    if (!form.type) {
      errors.push("Question type not selected");
    }
    if (!form.difficulty) {
      errors.push("Difficulty level not selected");
    }
    if (!form.topics || form.topics.length === 0) {
      errors.push("No topics selected");
    }
    if (!form.companies || form.companies.length === 0) {
      errors.push("No companies selected");
    }
    if (!form.duration || form.duration <= 0) {
      errors.push("Duration is 0 minutes or negative or empty");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast("Please fix the validation errors first!", "error");
      return;
    }

    setValidationErrors([]);

    const cleanSteps = form.steps.filter(s => s.task.trim() !== "");
    if (!cleanSteps.length) return showToast("At least one checkpoint step is required!", "error");

    const { changesToBeDone, rules } = stepsToRulesAndTasks(cleanSteps);
    const newId = form.id || `custom-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    
    const q = {
      id: newId, env: "web", title: form.title, difficulty: form.difficulty, type: form.type, duration: parseInt(form.duration, 10), topics: form.topics, companies: form.companies, description: form.description,
      changesToBeDone, hints: changesToBeDone.map(t => `Hint for: ${t}`), rules,
      initialHtml: form.html, initialCss: form.css, initialJs: form.js,
      solutionHtml: form.solHtml, solutionCss: form.solCss, solutionJs: form.solJs
    };

    const updated = form.id ? questions.map(x => x.id === form.id ? q : x) : [...questions, q];
    showToast(form.id ? "Question saved successfully!" : "Question created successfully!", "success");
    setQuestions(updated);
    localStorage.setItem("ppa_custom_challenges", JSON.stringify(updated));
    if (loadQuestion) loadQuestion(form.id ? activeIndex : updated.length - 1);
  };

  const handleDeleteChallenge = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this question?")) {
      const updated = questions.filter(q => q.id !== id);
      setQuestions(updated);
      localStorage.setItem("ppa_custom_challenges", JSON.stringify(updated));
      showToast("Question deleted", "info");
      if (loadQuestion && activeIndex !== null) {
        loadQuestion(activeIndex >= updated.length ? (updated.length > 0 ? updated.length - 1 : null) : activeIndex);
      }
    }
  };

  const handleLoadPreset = (name) => {
    if (CHALLENGE_PRESETS[name]) { 
      setForm({ id: "", ...CHALLENGE_PRESETS[name] }); 
      showToast(`${name} preset loaded!`, "info"); 
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex grow px-6 pb-6 gap-6 overflow-hidden text-text-primary min-h-0">
      {/* Main Content Area */}
      <div className="grow flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Modern Pill Tab Switcher */}
        <div className="flex bg-bg-tertiary p-1 rounded-lg gap-1 w-fit mb-5 border border-border shrink-0">
          {[
            { id: "form", label: "Wizard Form" },
            { id: "text", label: "Markdown Outline Parser" },
            { id: "json", label: "Raw JSON Database" }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setCreatorTab(t.id)} 
              className={`px-4 py-1.5 text-[0.8rem] rounded-md cursor-pointer transition-all duration-150 ${
                creatorTab === t.id 
                  ? "font-bold text-text-primary bg-bg-secondary shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
                  : "font-medium text-text-secondary bg-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Top Header Buttons and Toggles */}
        <div className="flex justify-between items-center mb-5 shrink-0 flex-wrap gap-3">
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="btn-minimal bg-blue-600 hover:bg-blue-700 text-white border-none rounded px-4 py-2 font-bold shadow-[0_2px_4px_rgba(37, 99, 235, 0.2)]"
          >
            Question Library
          </button>

          {/* Bulk Upload Toggle Switch */}
          <div className="flex items-center gap-2.5">
            <span className="text-[0.82rem] font-bold text-text-primary">Bulk Upload Mode</span>
            <div 
              onClick={() => setBulkUploadMode(!bulkUploadMode)}
              className={`w-[42px] h-[22px] rounded-[11px] relative cursor-pointer transition-colors duration-200 ${
                bulkUploadMode ? "bg-accent" : "bg-bg-quaternary"
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${
                  bulkUploadMode ? "left-[23px]" : "left-[3px]"
                }`}
              />
            </div>
            <span className="text-[0.78rem] text-text-secondary font-semibold min-w-[24px]">{bulkUploadMode ? "On" : "Off"}</span>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="grow overflow-y-auto pr-2 min-h-0">
          
          {bulkUploadMode ? (
            <div className="creator-glass-card p-5 flex flex-col gap-4">
              <span className="text-[0.8rem] font-bold text-text-secondary">BULK JSON DATABASE UPLOAD</span>
              <span className="text-[0.75rem] text-text-secondary font-medium leading-relaxed">
                Paste the full JSON array of challenges/questions to completely overwrite the current questions list database.
              </span>
              <textarea 
                value={rawJsonText} 
                onChange={e => setRawJsonText(e.target.value)} 
                rows={14} 
                className="creator-input-text font-[family-name:var(--font-family-code)] text-[0.78rem] p-3 rounded-lg border border-border bg-bg-tertiary" 
                placeholder="[ { 'id': 'challenge-1', ... } ]"
              />
              <button 
                onClick={() => {
                  try {
                    const parsed = JSON.parse(rawJsonText);
                    if (!Array.isArray(parsed)) throw new Error("JSON must be array.");
                    setQuestions(parsed);
                    localStorage.setItem("ppa_custom_challenges", JSON.stringify(parsed));
                    showToast("Database imported successfully!", "success");
                    setBulkUploadMode(false);
                  } catch(e) { showToast("Invalid JSON: " + e.message, "error"); }
                }} 
                className="btn-minimal creator-btn-gradient w-full justify-center p-3 rounded-lg"
              >
                Import database array
              </button>
            </div>
          ) : (
            <>
              {creatorTab === "form" && (
                <div className="flex flex-col gap-5">
                  
                  {/* Card 1: Question Form Inputs */}
                  <div className="creator-glass-card p-5 flex flex-col gap-4">
                    
                    {/* Question Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Question Name</label>
                      <input 
                        type="text" 
                        value={form.title} 
                        onChange={e => updateForm({ title: e.target.value })} 
                        className="creator-input-text w-full" 
                        placeholder="Enter question name"
                      />
                    </div>

                    {/* Max Score */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Max Score (Auto-calculated by system)</label>
                      <input 
                        type="text" 
                        value={form.steps.filter(s => s.task.trim() !== "").length * 10} 
                        disabled 
                        className="creator-input-text w-full cursor-not-allowed font-semibold bg-bg-tertiary"
                      />
                    </div>

                    {/* Question Type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Question Type</label>
                      <CustomDropdown
                        value={form.type}
                        onChange={val => updateForm({ type: val })}
                        placeholder="Select type"
                        options={[
                          { value: "HTML/CSS/JS", label: "HTML/CSS/JS" },
                          { value: "Coding", label: "CODING" },
                          { value: "MCQ", label: "MCQ" }
                        ]}
                      />
                    </div>

                    {/* Difficulty Level */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Difficulty Level</label>
                      <CustomDropdown
                        value={form.difficulty}
                        onChange={val => updateForm({ difficulty: val })}
                        placeholder="Select difficulty"
                        options={[
                          { value: "Easy", label: "EASY" },
                          { value: "Medium", label: "MEDIUM" },
                          { value: "Hard", label: "HARD" }
                        ]}
                      />
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Duration</label>
                      <input 
                        type="number" 
                        value={form.duration === 0 ? "" : form.duration} 
                        onChange={e => updateForm({ duration: e.target.value === "" ? 0 : parseInt(e.target.value, 10) })} 
                        className="creator-input-text w-full" 
                        placeholder="0"
                      />
                    </div>

                    {/* Topics Tag Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Topics</label>
                      <div className="flex flex-wrap gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-bg-secondary min-h-[42px] items-center">
                        {form.topics.map(topic => (
                          <span key={topic} className="inline-flex items-center gap-1 bg-bg-tertiary border border-border px-2 py-1 rounded-md text-[0.72rem] font-semibold">
                            {topic}
                            <button 
                              type="button" 
                              onClick={() => updateForm({ topics: form.topics.filter(t => t !== topic) })} 
                              className="bg-transparent border-none text-text-secondary cursor-pointer text-[0.75rem] p-0 flex items-center"
                            >✕</button>
                          </span>
                        ))}
                        <input 
                          type="text" 
                          placeholder="select topics (Type and press Enter)" 
                          value={topicInput}
                          onChange={e => setTopicInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && topicInput.trim()) {
                              e.preventDefault();
                              if (!form.topics.includes(topicInput.trim())) {
                                updateForm({ topics: [...form.topics, topicInput.trim()] });
                              }
                              setTopicInput("");
                            }
                          }}
                          className="border-none outline-none grow py-1 text-[0.82rem] bg-transparent min-w-[180px]"
                        />
                      </div>
                    </div>

                    {/* Companies Tag Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.8rem] font-bold text-text-primary">Companies</label>
                      <div className="flex flex-wrap gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-bg-secondary min-h-[42px] items-center">
                        {form.companies.map(company => (
                          <span key={company} className="inline-flex items-center gap-1 bg-bg-tertiary border border-border px-2 py-1 rounded-md text-[0.72rem] font-semibold">
                            {company}
                            <button 
                              type="button" 
                              onClick={() => updateForm({ companies: form.companies.filter(c => c !== company) })} 
                              className="bg-transparent border-none text-text-secondary cursor-pointer text-[0.75rem] p-0 flex items-center"
                            >✕</button>
                          </span>
                        ))}
                        <input 
                          type="text" 
                          placeholder="Select companies (Type and press Enter)" 
                          value={companyInput}
                          onChange={e => setCompanyInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && companyInput.trim()) {
                              e.preventDefault();
                              if (!form.companies.includes(companyInput.trim())) {
                                updateForm({ companies: [...form.companies, companyInput.trim()] });
                              }
                              setCompanyInput("");
                            }
                          }}
                          className="border-none outline-none grow py-1 text-[0.82rem] bg-transparent min-w-[180px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Description and Rich Text Editor Toolbar */}
                  <div className="flex flex-col gap-3 mt-2.5">
                    <h2 className="text-[1.1rem] font-bold text-center text-text-primary">Question Description</h2>
                    
                    <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-bg-secondary">
                      {/* Editor Formatting Toolbar */}
                      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-bg-tertiary items-center">
                        {[
                          { icon: "Normal", label: "Normal", cmd: () => {} },
                          { icon: "B", label: "Bold", cmd: () => updateForm({ description: form.description + "**bold**" }) },
                          { icon: "I", label: "Italic", cmd: () => updateForm({ description: form.description + "*italic*" }) },
                          { icon: "U", label: "Underline", cmd: () => updateForm({ description: form.description + "<u>underline</u>" }) },
                          { icon: "S", label: "Strikethrough", cmd: () => updateForm({ description: form.description + "~~strike~~" }) },
                          { icon: "Code", label: "Inline Code", cmd: () => updateForm({ description: form.description + "`code`" }) },
                          { icon: "H1", label: "Heading 1", cmd: () => updateForm({ description: form.description + "\n# Heading" }) },
                          { icon: "UL", label: "Unordered List", cmd: () => updateForm({ description: form.description + "\n- Item" }) },
                          { icon: "OL", label: "Ordered List", cmd: () => updateForm({ description: form.description + "\n1. Item" }) },
                          { icon: "Quote", label: "Blockquote", cmd: () => updateForm({ description: form.description + "\n> Quote" }) },
                          { icon: "Link", label: "Insert Hyperlink", cmd: () => updateForm({ description: form.description + "[Label](url)" }) },
                          { icon: "Img", label: "Insert Image", cmd: () => updateForm({ description: form.description + "![Alt text](url)" }) },
                          { icon: "Clear", label: "Clear formatting", cmd: () => {} }
                        ].map(t => (
                          <button 
                            key={t.label} 
                            type="button"
                            onClick={t.cmd}
                            className="px-2 py-1 text-[0.7rem] font-bold border border-border rounded bg-bg-secondary cursor-pointer text-text-primary transition-colors duration-150 hover:bg-bg-tertiary"
                            title={t.label}
                          >
                            {t.icon}
                          </button>
                        ))}
                      </div>
                      
                      {/* Text Area */}
                      <textarea 
                        value={form.description} 
                        onChange={e => updateForm({ description: e.target.value })} 
                        rows={6} 
                        className="border-none p-3 outline-none resize-y text-[0.85rem] w-full bg-transparent"
                        placeholder="Enter description here..."
                      />
                    </div>
                  </div>

                  {/* Assessment Checkpoints Component */}
                  <AssessmentCheckpoints 
                    steps={form.steps}
                    onUpdateSteps={newSteps => updateForm({ steps: newSteps })}
                    advancedSteps={advancedSteps}
                    setAdvancedSteps={setAdvancedSteps}
                  />

                  {/* Code Templates Workspace Component */}
                  <CodeTemplatesWorkspace 
                    creatorCodeTab={creatorCodeTab}
                    setCreatorCodeTab={setCreatorCodeTab}
                    form={form}
                    updateForm={updateForm}
                    tabSize={tabSize}
                    onAutoGenerate={handleAutoGenerateCode}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-center mt-3 shrink-0">
                    <button 
                      onClick={handleSaveChallenge} 
                      className="btn-minimal creator-btn-gradient px-10 py-3 rounded-lg text-[0.85rem] font-bold cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>

                  {/* Validation Error checklist box */}
                  {validationErrors.length > 0 && (
                    <div className="mt-2.5 p-4 bg-neon-red/5 border border-neon-red/15 rounded-lg shrink-0">
                      <h3 className="text-[0.82rem] font-bold text-neon-red mb-2">Please fix the following issues:</h3>
                      <ul className="list-none pl-4 text-[0.78rem] text-neon-red flex flex-col gap-1 m-0">
                        {validationErrors.map((err, i) => (
                          <li key={i} className="font-semibold">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}

              {creatorTab === "text" && (
                <div className="creator-glass-card p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <FileText size={16} className="text-accent" />
                    <span className="text-[0.85rem] font-bold text-text-primary">Markdown Outline Parser</span>
                  </div>
                  <span className="text-[0.75rem] text-text-secondary font-medium leading-relaxed">
                    Draft your challenge as a structured text outline. Our parser will instantly process the structure and populate the wizard form.
                  </span>
                  <textarea 
                    value={importText} 
                    onChange={e => setImportText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text font-[family-name:var(--font-family-code)] text-[0.78rem] p-3 rounded-lg border border-border bg-bg-tertiary" 
                    placeholder={`Title: Click Action\nDifficulty: Easy\nDescription: Make updates on counter click.\nTasks:\n- Create h1 with ID 'counter'\n- Create button with ID 'increment-btn'`} 
                  />
                  <button 
                    onClick={() => {
                      if (!importText.trim()) return showToast("Outline cannot be empty!", "error");
                      const parsed = parseChallengeText(importText);
                      setForm({
                        id: "", title: parsed.title, difficulty: parsed.difficulty, type: "HTML/CSS/JS", duration: 15, topics: ["HTML", "CSS"], companies: ["Google"], description: parsed.description, steps: parsed.steps,
                        html: parsed.initialHtml, css: parsed.initialCss, js: parsed.initialJs,
                        solHtml: parsed.solutionHtml, solCss: parsed.solutionCss, solJs: parsed.solutionJs
                      });
                      setCreatorTab("form");
                      showToast("Outline parsed successfully!", "success");
                    }} 
                    className="btn-minimal creator-btn-gradient w-full justify-center p-3 rounded-lg"
                  >
                    Parse &amp; Load into Wizard
                  </button>
                </div>
              )}

              {creatorTab === "json" && (
                <div className="creator-glass-card p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Terminal size={16} className="text-accent" />
                    <span className="text-[0.85rem] font-bold text-text-primary">Raw JSON Database manager</span>
                  </div>
                  <span className="text-[0.75rem] text-text-secondary font-medium leading-relaxed">
                    Directly import or export the entire questions database payload. Use this tab to back up custom challenges.
                  </span>
                  <textarea 
                    value={rawJsonText} 
                    onChange={e => setRawJsonText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text font-[family-name:var(--font-family-code)] text-[0.78rem] p-3 rounded-lg border border-border bg-bg-tertiary" 
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(rawJsonText);
                          if (!Array.isArray(parsed)) throw new Error("JSON must be array.");
                          setQuestions(parsed);
                          localStorage.setItem("ppa_custom_challenges", JSON.stringify(parsed));
                          showToast("Database imported successfully!", "success");
                        } catch(e) { showToast("Invalid JSON: " + e.message, "error"); }
                      }} 
                      className="btn-minimal grow justify-center p-2.5 rounded-lg font-semibold"
                    >
                      Import DB
                    </button>
                    <button 
                      onClick={() => { 
                        const val = JSON.stringify(questions, null, 2); 
                        setRawJsonText(val); 
                        navigator.clipboard.writeText(val); 
                        showToast("Copied to clipboard!", "success"); 
                      }} 
                      className="btn-minimal grow justify-center p-2.5 rounded-lg font-semibold"
                    >
                      Export DB to Clipboard
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm("Restore defaults? Overwrites custom edits.")) {
                          localStorage.removeItem("ppa_custom_challenges");
                          setQuestions(DEFAULT_QUESTIONS);
                          showToast("Restored original database", "info");
                        }
                      }} 
                      className="btn-minimal border-neon-red text-neon-red hover:bg-neon-red/5 p-2.5 rounded-lg font-semibold"
                    >
                      Reset original DB
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question Library Modal Component */}
      <QuestionLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredQuestions={filteredQuestions}
        questions={questions}
        formId={form.id}
        onEditChallenge={handleEditChallenge}
        onDeleteChallenge={handleDeleteChallenge}
        onLoadBlankPreset={() => handleLoadPreset("blank")}
      />
    </div>
  );
};

export default CreatorWorkspace;
