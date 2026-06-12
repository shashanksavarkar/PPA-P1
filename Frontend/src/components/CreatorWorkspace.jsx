import { useState } from "react";
import { FileText, Search, Trash2, BookOpen, AlertCircle } from "lucide-react";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { challengeToSteps, stepsToRulesAndTasks, parseChallengeText, generateStarterCode } from "../utils/challengeHelpers";
import CustomDropdown from "./creator/CustomDropdown";
import AssessmentCheckpoints from "./creator/AssessmentCheckpoints";
import CodeTemplatesWorkspace from "./creator/CodeTemplatesWorkspace";
import { CHALLENGE_PRESETS } from "../constants/challengePresets";
import { saveChallenge, deleteChallenge, isPocketBaseOnline, getChallenges } from "../utils/pb";


const CreatorWorkspace = ({ questions, setQuestions, showToast, tabSize, activeIndex, loadQuestion }) => {
  const [form, setForm] = useState({
    id: "", title: "", difficulty: "", type: "", duration: 0, topics: [], companies: [], description: "",
    steps: [{ task: "", type: "TAG_EXISTS", selector: "", targetId: "", value: "", errorMessage: "" }],
    html: "", css: "", js: "", solHtml: "", solCss: "", solJs: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  const [advancedSteps, setAdvancedSteps] = useState({});
  const [importText, setImportText] = useState("");
  const [bulkJsonText, setBulkJsonText] = useState("");
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
      steps: challengeToSteps(q).length ? challengeToSteps(q) : [{ task: "", type: "TAG_EXISTS", selector: "", targetId: "", value: "", errorMessage: "" }],
      html: q.initialHtml || "", css: q.initialCss || "", js: q.initialJs || "",
      solHtml: q.solutionHtml || "", solCss: q.solutionCss || "", solJs: q.solutionJs ||  ""
    });
    setCreatorTab("form");
    setValidationErrors([]);
  };

  const handleSaveChallenge = async () => {
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
      errors.push("At least one topic tag is required");
    }
    if (!form.companies || form.companies.length === 0) {
      errors.push("At least one target company is required");
    }
    if (!form.duration || form.duration <= 0) {
      errors.push("Duration must be a positive number of minutes");
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

    const result = await saveChallenge(q);
    if (result.success) {
      const savedQ = result.question;
      const updated = form.id ? questions.map(x => x.id === form.id ? savedQ : x) : [...questions, savedQ];
      setQuestions(updated);
      showToast(form.id ? "Question saved successfully!" : "Question created successfully!", "success");
      
      handleEditChallenge(savedQ);
      
      if (loadQuestion) {
        loadQuestion(form.id ? activeIndex : updated.length - 1);
      }
    } else {
      showToast("Failed to save challenge: " + result.error, "error");
    }
  };

  const handleDeleteChallenge = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this question?")) {
      const result = await deleteChallenge(id);
      if (result.success) {
        const updated = questions.filter(q => q.id !== id);
        setQuestions(updated);
        showToast("Question deleted", "info");
        
        if (form.id === id) {
          handleLoadPreset("blank");
        }

        if (loadQuestion && activeIndex !== null) {
          loadQuestion(activeIndex >= updated.length ? (updated.length > 0 ? updated.length - 1 : null) : activeIndex);
        }
      } else {
        showToast("Failed to delete challenge", "error");
      }
    }
  };

  const handleLoadPreset = (name) => {
    if (name === "blank") {
      setForm({
        id: "", title: "", difficulty: "", type: "", duration: 0, topics: [], companies: [], description: "",
        steps: [{ task: "", type: "TAG_EXISTS", selector: "", targetId: "", value: "", errorMessage: "" }],
        html: "", css: "", js: "", solHtml: "", solCss: "", solJs: "",
      });
      setCreatorTab("form");
      setValidationErrors([]);
      showToast("Cleared form for new challenge", "info");
      return;
    }
    if (CHALLENGE_PRESETS[name]) { 
      setForm({ id: "", ...CHALLENGE_PRESETS[name] }); 
      showToast(`${name} preset loaded!`, "info"); 
    }
  };
  
  const handleBulkImport = async () => {
    if (!bulkJsonText.trim()) {
      showToast("JSON input cannot be empty!", "error");
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(bulkJsonText);
    } catch (err) {
      showToast("Invalid JSON format! Please check syntax.", "error");
      return;
    }

    if (!Array.isArray(parsedData)) {
      showToast("JSON must be an array of challenge objects!", "error");
      return;
    }

    if (parsedData.length === 0) {
      showToast("The array is empty. No challenges to import.", "info");
      return;
    }

    let successCount = 0;
    const importedQuestions = [];
    const errors = [];

    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];
      const challengeTitle = item.title || `Bulk Challenge ${i + 1}`;
      
      try {
        const difficulty = item.difficulty || "Easy";
        const type = item.type || "HTML/CSS/JS";
        const duration = parseInt(item.duration, 10) || 15;
        const topics = Array.isArray(item.topics) ? item.topics : ["HTML"];
        const companies = Array.isArray(item.companies) ? item.companies : ["General"];
        const description = item.description || "";
        const initialHtml = item.initialHtml || item.html || "";
        const initialCss = item.initialCss || item.css || "";
        const initialJs = item.initialJs || item.js || "";
        const solutionHtml = item.solutionHtml || item.solHtml || "";
        const solutionCss = item.solutionCss || item.solCss || "";
        const solutionJs = item.solutionJs || item.solJs || "";

        let changesToBeDone = item.changesToBeDone || [];
        let rules = item.rules || [];

        if ((!changesToBeDone.length || !rules.length) && Array.isArray(item.steps) && item.steps.length > 0) {
          const parsedSteps = stepsToRulesAndTasks(item.steps);
          changesToBeDone = parsedSteps.changesToBeDone;
          rules = parsedSteps.rules;
        }

        if (!changesToBeDone.length) {
          changesToBeDone = ["Complete the tasks."];
        }

        const newId = item.id || `custom-${challengeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

        const q = {
          id: newId,
          env: item.env || "web",
          title: challengeTitle,
          difficulty,
          type,
          duration,
          topics,
          companies,
          description,
          changesToBeDone,
          hints: Array.isArray(item.hints) ? item.hints : changesToBeDone.map(t => `Hint for: ${t}`),
          rules,
          initialHtml,
          initialCss,
          initialJs,
          solutionHtml,
          solutionCss,
          solutionJs
        };

        const result = await saveChallenge(q);
        if (result.success) {
          successCount++;
          importedQuestions.push(result.question);
        } else {
          errors.push(`"${challengeTitle}": ${result.error}`);
        }
      } catch (err) {
        errors.push(`"${challengeTitle}": ${err.message}`);
      }
    }

    if (successCount > 0) {
      setQuestions(prev => {
        let updated = [...prev];
        importedQuestions.forEach(newQ => {
          const existsIdx = updated.findIndex(x => x.id === newQ.id);
          if (existsIdx !== -1) {
            updated[existsIdx] = newQ;
          } else {
            updated.push(newQ);
          }
        });
        return updated;
      });

      setBulkJsonText("");
      showToast(`Imported ${successCount} challenges successfully!`, "success");
    }

    if (errors.length > 0) {
      console.error("Errors during bulk import:", errors);
      showToast(`Failed to import ${errors.length} challenges. Check console for details.`, "error");
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex grow px-8 pb-6 gap-6 overflow-hidden text-text-primary min-h-0">
      
      {/* Left Sidebar: Persistent Question Library */}
      <div className="w-[310px] shrink-0 flex flex-col h-full bg-white border border-border rounded-2xl p-5 shadow-sm min-w-0">
        <div className="flex justify-between items-center mb-4.5 shrink-0">
          <h2 className="text-[0.78rem] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <span>Challenges</span>
            <span className="bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-full text-[0.68rem] font-bold">
              {filteredQuestions.length}
            </span>
          </h2>
          <button 
            onClick={() => handleLoadPreset("blank")}
            className="btn-minimal creator-btn-gradient px-3 py-1.5 rounded-lg flex items-center gap-1 text-[0.72rem] font-extrabold"
          >
            + Add New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search challenges..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="creator-search-input pl-9.5 text-[0.8rem]"
          />
        </div>

        {/* Scrollable List of Challenges */}
        <div className="grow overflow-y-auto flex flex-col gap-2.5 pr-1.5 scrollbar">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-[0.78rem] font-semibold">
              No challenges found.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const originalIndex = questions.findIndex(x => x.id === q.id);
              const difficultyLower = (q.difficulty || "easy").toLowerCase();
              const isActive = form.id === q.id;
              const stepCount = (q.changesToBeDone || []).length || (q.rules || []).length || (q.constraints || []).length || 0;
              return (
                <div 
                  key={q.id} 
                  onClick={() => handleEditChallenge(q)} 
                  className={`creator-sidebar-card cursor-pointer ${isActive ? "active" : ""}`}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="font-bold text-[0.78rem] line-clamp-2 grow text-text-primary leading-snug">
                      {originalIndex + 1}. {q.title}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteChallenge(q.id, e)} 
                      className="bg-transparent border-none text-neon-red cursor-pointer flex p-1 hover:bg-rose-50 rounded-md transition-all delete-btn"
                      title="Delete Challenge"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`challenge-difficulty ${difficultyLower} text-[0.58rem]`}>
                      {q.difficulty || "Easy"}
                    </span>
                    <span className="text-[0.62rem] text-text-secondary font-bold">
                      {stepCount > 0 ? `${stepCount} checks` : "Template"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="grow flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Modern Pill Tab Switcher */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div className="flex bg-bg-tertiary p-1 rounded-xl gap-1 border border-border shrink-0">
            {[
              { id: "form", label: "Wizard Form" },
              { id: "text", label: "Markdown Outline Parser" },
              { id: "bulk", label: "Bulk Mode (JSON)" }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setCreatorTab(t.id)} 
                className={`px-4 py-2 text-[0.8rem] rounded-lg cursor-pointer transition-all duration-150 ${
                  creatorTab === t.id 
                    ? "font-bold text-text-primary bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
                    : "font-semibold text-text-secondary bg-transparent hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="grow overflow-y-auto pr-1 min-h-0 scrollbar">
          {creatorTab === "form" && (
            <div className="flex flex-col gap-6">
                  
                  {/* Card 1: Question Form Inputs */}
                  <div className="creator-glass-card p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <BookOpen size={16} className="text-accent" />
                      <span className="text-[0.85rem] font-bold text-text-primary">General Challenge Details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Question Name */}
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Question Name</label>
                        <input 
                          type="text" 
                          value={form.title} 
                          onChange={e => updateForm({ title: e.target.value })} 
                          className="creator-input-text w-full" 
                          placeholder="e.g. Build a Responsive Pricing Card Grid"
                        />
                      </div>

                      {/* Question Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Question Type</label>
                        <CustomDropdown
                          value={form.type}
                          onChange={val => updateForm({ type: val })}
                          placeholder="Select type"
                          options={[
                            { value: "HTML/CSS/JS", label: "HTML/CSS/JS Question" },
                            { value: "Coding", label: "JS Coding" },
                            { value: "MCQ", label: "MCQ" }
                          ]}
                        />
                      </div>

                      {/* Difficulty Level */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Difficulty Level</label>
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
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Duration (Minutes)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={form.duration === 0 ? "" : form.duration} 
                            onChange={e => updateForm({ duration: e.target.value === "" ? 0 : parseInt(e.target.value, 10) })} 
                            className="creator-input-text w-full pr-10" 
                            placeholder="e.g. 15"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.72rem] font-bold text-text-secondary">min</span>
                        </div>
                      </div>

                      {/* Max Score */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Max Score (Auto-calculated)</label>
                        <input 
                          type="text" 
                          value={form.steps.filter(s => s.task.trim() !== "").length * 10} 
                          disabled 
                          className="creator-input-text w-full cursor-not-allowed font-bold bg-bg-tertiary/50 border-dashed border-border"
                        />
                      </div>

                      {/* Topics Tag Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Topics</label>
                        <div className="flex flex-wrap gap-1.5 px-3.5 py-2 border border-border rounded-xl bg-white min-h-[42px] items-center">
                          {form.topics.map(topic => (
                            <span key={topic} className="inline-flex items-center gap-1.5 bg-bg-tertiary border border-border px-2.5 py-1 rounded-lg text-[0.72rem] font-bold text-text-primary">
                              {topic}
                              <button 
                                type="button" 
                                onClick={() => updateForm({ topics: form.topics.filter(t => t !== topic) })} 
                                className="bg-transparent border-none text-text-secondary cursor-pointer text-[0.75rem] p-0 flex items-center hover:text-text-primary"
                              >✕</button>
                            </span>
                          ))}
                          <input 
                            type="text" 
                            placeholder="Add topic..." 
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
                            className="border-none outline-none grow py-1 text-[0.78rem] bg-transparent min-w-[120px]"
                          />
                        </div>
                      </div>

                      {/* Companies Tag Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.75rem] font-bold text-text-primary uppercase tracking-wider">Target Companies</label>
                        <div className="flex flex-wrap gap-1.5 px-3.5 py-2 border border-border rounded-xl bg-white min-h-[42px] items-center">
                          {form.companies.map(company => (
                            <span key={company} className="inline-flex items-center gap-1.5 bg-bg-tertiary border border-border px-2.5 py-1 rounded-lg text-[0.72rem] font-bold text-text-primary">
                              {company}
                              <button 
                                type="button" 
                                onClick={() => updateForm({ companies: form.companies.filter(c => c !== company) })} 
                                className="bg-transparent border-none text-text-secondary cursor-pointer text-[0.75rem] p-0 flex items-center hover:text-text-primary"
                              >✕</button>
                            </span>
                          ))}
                          <input 
                            type="text" 
                            placeholder="Add company..." 
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
                            className="border-none outline-none grow py-1 text-[0.78rem] bg-transparent min-w-[120px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Description and Rich Text Editor Toolbar */}
                  <div className="creator-glass-card p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <FileText size={16} className="text-accent" />
                      <span className="text-[0.85rem] font-bold text-text-primary">Question Description (Markdown)</span>
                    </div>
                    
                    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-white">
                      {/* Text Area */}
                      <textarea 
                        value={form.description} 
                        onChange={e => updateForm({ description: e.target.value })} 
                        rows={6} 
                        className="border-none p-3.5 outline-none resize-y text-[0.82rem] w-full bg-transparent font-medium"
                        placeholder="Enter challenge instructions, task description, and formatting rules here..."
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
                      className="btn-minimal creator-btn-gradient px-12 py-3.5 rounded-xl text-[0.85rem] font-extrabold shadow-md hover:shadow-indigo-500/10 cursor-pointer"
                    >
                      {form.id ? "Save Challenge Updates" : "Create New Challenge"}
                    </button>
                  </div>

                  {/* Validation Error checklist box */}
                  {validationErrors.length > 0 && (
                    <div className="mt-2.5 p-4.5 bg-rose-50 border border-rose-100 rounded-xl shrink-0 flex gap-3 items-start animate-[slideIn_0.2s_ease]">
                      <AlertCircle className="text-neon-red shrink-0 mt-0.5" size={16} />
                      <div>
                        <h3 className="text-[0.82rem] font-bold text-neon-red mb-1.5">Please fix the following issues:</h3>
                        <ul className="list-none pl-0 text-[0.78rem] text-neon-red flex flex-col gap-1 m-0">
                          {validationErrors.map((err, i) => (
                            <li key={i} className="font-semibold">• {err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {creatorTab === "text" && (
                <div className="creator-glass-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <FileText size={16} className="text-accent" />
                    <span className="text-[0.85rem] font-bold text-text-primary">Markdown Outline Parser</span>
                  </div>
                  <span className="text-[0.75rem] text-text-secondary font-semibold leading-relaxed">
                    Draft your challenge as a structured text outline. Our parser will instantly process the structure and populate the wizard form.
                  </span>
                  <textarea 
                    value={importText} 
                    onChange={e => setImportText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text font-[family-name:var(--font-family-code)] text-[0.78rem] p-3.5 rounded-xl border border-border bg-bg-primary" 
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
                    className="btn-minimal creator-btn-gradient w-full justify-center p-3.5 rounded-xl"
                  >
                    Parse &amp; Load into Wizard
                  </button>
                </div>
              )}

              {creatorTab === "bulk" && (
                <div className="creator-glass-card p-6 flex flex-col gap-4 animate-[slideIn_0.2s_ease]">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <FileText size={16} className="text-accent" />
                    <span className="text-[0.85rem] font-bold text-text-primary">Bulk Mode (JSON Outline)</span>
                  </div>
                  <span className="text-[0.75rem] text-text-secondary font-semibold leading-relaxed">
                    Paste a JSON array of challenge configurations to import them in bulk. Supported formats include standard properties, schema properties, or a <code>steps</code> array representation.
                  </span>
                  <textarea 
                    value={bulkJsonText} 
                    onChange={e => setBulkJsonText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text font-[family-name:var(--font-family-code)] text-[0.78rem] p-3.5 rounded-xl border border-border bg-bg-primary w-full h-[320px] resize-y" 
                    placeholder={`[\n  {\n    "title": "Bulk Challenge 1",\n    "difficulty": "Easy",\n    "type": "HTML/CSS/JS",\n    "duration": 15,\n    "topics": ["HTML", "CSS"],\n    "companies": ["Google"],\n    "description": "Create a division with content hello",\n    "steps": [\n      {\n        "task": "Create h1 with class name 'heading'",\n        "type": "TAG_EXISTS",\n        "selector": "h1.heading"\n      }\n    ]\n  }\n]`} 
                  />
                  <button 
                    onClick={handleBulkImport} 
                    className="btn-minimal creator-btn-gradient w-full justify-center p-3.5 rounded-xl text-[0.82rem] font-extrabold cursor-pointer"
                  >
                    Import Bulk Challenges
                  </button>
                </div>
              )}

        </div>
      </div>
    </div>
  );
};

export default CreatorWorkspace;
