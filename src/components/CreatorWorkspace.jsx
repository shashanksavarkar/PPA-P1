import { useState, useRef, useEffect } from "react";
import { Search, Trash2, Plus, FileText, CheckCircle2, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import Editor from "@monaco-editor/react";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { challengeToSteps, stepsToRulesAndTasks, parseChallengeText, generateStarterCode } from "../utils/challengeHelpers";

const CustomDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "10px 12px",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: selectedOption ? "var(--text-primary)" : "var(--text-secondary)",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          outline: "none"
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-color)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        {isOpen ? (
          <ChevronUp size={16} style={{ color: "var(--text-secondary)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />
        )}
      </button>
      
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          width: "100%",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          marginTop: "6px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
          zIndex: 1000,
          maxHeight: "240px",
          overflowY: "auto"
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: "10px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                cursor: "pointer",
                backgroundColor: value === opt.value ? "var(--bg-tertiary)" : "transparent",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
    const presets = {
      counter: {
        title: "Interactive Click Counter", difficulty: "Easy",
        description: "Create a page with a counter initialized to '0' and a button showing '+'. Clicking updates counter to '1'.",
        steps: [
          { task: "Create h1 with ID 'counter' initialized to '0'.", type: "TEXT_EQUALS", elType: "heading", elId: "counter", elClass: "", targetId: "", value: "0", errorMessage: "" },
          { task: "Create button with ID 'increment-btn' and text '+'.", type: "TAG_EXISTS", elType: "button", elId: "increment-btn", elClass: "", targetId: "", value: "", errorMessage: "" },
          { task: "Ensure clicking updates counter to '1'.", type: "CLICK_AND_ASSERT", elType: "button", elId: "increment-btn", elClass: "", targetId: "counter", value: "1", errorMessage: "" }
        ],
        html: "<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>", css: "body { font-family: sans-serif; text-align: center; }", js: "",
        solHtml: "<!DOCTYPE html>\n<html>\n<body>\n  <h1 id=\"counter\">0</h1>\n  <button id=\"increment-btn\">+</button>\n</body>\n</html>",
        solCss: "body { font-family: sans-serif; text-align: center; }",
        solJs: "document.getElementById('increment-btn').addEventListener('click', () => {\n  const c = document.getElementById('counter');\n  c.textContent = parseInt(c.textContent) + 1;\n});"
      },
      mirror: {
        title: "Input Mirror Reflection", difficulty: "Easy",
        description: "Create an input with class 'text-input' mirrored inside an h2 with class 'mirror-text'.",
        steps: [
          { task: "Create input with class 'text-input'.", type: "TAG_EXISTS", elType: "input", elId: "", elClass: "text-input", targetId: "", value: "", errorMessage: "" },
          { task: "Create h2 with class 'mirror-text'.", type: "TAG_EXISTS", elType: "heading", elId: "", elClass: "mirror-text", targetId: "", value: "", errorMessage: "" },
          { task: "Mirror input value into mirror-text.", type: "INPUT_AND_ASSERT", elType: "input", elId: "", elClass: "text-input", targetId: "mirror-text", value: "Hello", errorMessage: "" }
        ],
        html: "<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>", css: "body { font-family: sans-serif; }", js: "",
        solHtml: "<!DOCTYPE html>\n<html>\n<body>\n  <input type=\"text\" class=\"text-input\">\n  <h2 class=\"mirror-text\"></h2>\n</body>\n</html>",
        solCss: "body { font-family: sans-serif; }",
        solJs: "document.querySelector('.text-input').addEventListener('input', (e) => {\n  document.querySelector('.mirror-text').textContent = e.target.value;\n});"
      },
      blank: {
        title: "", difficulty: "Easy", description: "",
        steps: [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
        html: "<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>", css: "body { font-family: sans-serif; }", js: "",
        solHtml: "", solCss: "", solJs: ""
      }
    };
    if (presets[name]) { setForm({ id: "", ...presets[name] }); showToast(`${name} preset loaded!`, "info"); }
  };

  const filteredQuestions = questions.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexGrow: 1, padding: "0 24px 24px 24px", gap: "24px", overflow: "hidden", color: "var(--text-primary)", minHeight: 0 }}>
      {/* Main Content Area */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0, overflow: "hidden" }}>
        
        {/* Modern Pill Tab Switcher */}
        <div style={{ display: "flex", backgroundColor: "var(--bg-tertiary)", padding: "4px", borderRadius: "8px", gap: "4px", width: "fit-content", marginBottom: "20px", border: "1px solid var(--border-color)", flexShrink: 0 }}>
          {[
            { id: "form", label: "Wizard Form" },
            { id: "text", label: "Markdown Outline Parser" },
            { id: "json", label: "Raw JSON Database" }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setCreatorTab(t.id)} 
              style={{
                padding: "6px 16px", 
                fontSize: "0.8rem", 
                fontWeight: creatorTab === t.id ? 700 : 500,
                color: creatorTab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                border: "none", 
                borderRadius: "6px",
                backgroundColor: creatorTab === t.id ? "var(--bg-secondary)" : "transparent",
                boxShadow: creatorTab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer", 
                transition: "all 0.15s ease"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Top Header Buttons and Toggles (from Screenshot) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0, flexWrap: "wrap", gap: "12px" }}>
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="btn-minimal"
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
            }}
          >
            Question Library
          </button>

          {/* Bulk Upload Toggle Switch */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Bulk Upload Mode</span>
            <div 
              onClick={() => setBulkUploadMode(!bulkUploadMode)}
              style={{
                width: "42px",
                height: "22px",
                borderRadius: "11px",
                backgroundColor: bulkUploadMode ? "var(--accent-color)" : "var(--bg-quaternary)",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
            >
              <div 
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  position: "absolute",
                  top: "3px",
                  left: bulkUploadMode ? "23px" : "3px",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                }}
              />
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, minWidth: "24px" }}>{bulkUploadMode ? "On" : "Off"}</span>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div style={{ flexGrow: 1, overflowY: "auto", paddingRight: "8px", minHeight: 0 }}>
          
          {bulkUploadMode ? (
            <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>BULK JSON DATABASE UPLOAD</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>
                Paste the full JSON array of challenges/questions to completely overwrite the current questions list database.
              </span>
              <textarea 
                value={rawJsonText} 
                onChange={e => setRawJsonText(e.target.value)} 
                rows={14} 
                className="creator-input-text" 
                style={{ fontFamily: "var(--code-font)", fontSize: "0.78rem", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }} 
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
                className="btn-minimal creator-btn-gradient" 
                style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "8px" }}
              >
                Import database array
              </button>
            </div>
          ) : (
            <>
              {creatorTab === "form" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Card 1: Question Form Inputs (Screenshot style) */}
                  <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* Question Name */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Question Name</label>
                      <input 
                        type="text" 
                        value={form.title} 
                        onChange={e => updateForm({ title: e.target.value })} 
                        className="creator-input-text" 
                        placeholder="Enter question name"
                        style={{ padding: "10px 12px", fontSize: "0.82rem", width: "100%" }}
                      />
                    </div>

                    {/* Max Score */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Max Score (Auto-calculated by system)</label>
                      <input 
                        type="text" 
                        value={form.steps.filter(s => s.task.trim() !== "").length * 10} 
                        disabled 
                        className="creator-input-text" 
                        style={{ padding: "10px 12px", fontSize: "0.82rem", width: "100%", backgroundColor: "var(--bg-tertiary)", cursor: "not-allowed", fontWeight: 600 }}
                      />
                    </div>

                    {/* Question Type */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Question Type</label>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Difficulty Level</label>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Duration</label>
                      <input 
                        type="number" 
                        value={form.duration === 0 ? "" : form.duration} 
                        onChange={e => updateForm({ duration: e.target.value === "" ? 0 : parseInt(e.target.value, 10) })} 
                        className="creator-input-text" 
                        placeholder="0"
                        style={{ padding: "10px 12px", fontSize: "0.82rem", width: "100%" }}
                      />
                    </div>

                    {/* Topics Tag Input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Topics</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "6px 12px", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", minHeight: "42px", alignItems: "center" }}>
                        {form.topics.map(topic => (
                          <span key={topic} style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600 }}>
                            {topic}
                            <button 
                              type="button" 
                              onClick={() => updateForm({ topics: form.topics.filter(t => t !== topic) })} 
                              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.75rem", padding: 0, display: "flex", alignItems: "center" }}
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
                          style={{ border: "none", outline: "none", flexGrow: 1, padding: "4px 0", fontSize: "0.82rem", background: "transparent", minWidth: "180px" }}
                        />
                      </div>
                    </div>

                    {/* Companies Tag Input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Companies</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "6px 12px", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", minHeight: "42px", alignItems: "center" }}>
                        {form.companies.map(company => (
                          <span key={company} style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600 }}>
                            {company}
                            <button 
                              type="button" 
                              onClick={() => updateForm({ companies: form.companies.filter(c => c !== company) })} 
                              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.75rem", padding: 0, display: "flex", alignItems: "center" }}
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
                          style={{ border: "none", outline: "none", flexGrow: 1, padding: "4px 0", fontSize: "0.82rem", background: "transparent", minWidth: "180px" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Description and Rich Text Editor Toolbar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, textAlign: "center", color: "var(--text-primary)" }}>Question Description</h2>
                    
                    <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
                      {/* Editor Formatting Toolbar */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "8px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)", alignItems: "center" }}>
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
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              border: "1px solid var(--border-color)",
                              borderRadius: "4px",
                              backgroundColor: "var(--bg-secondary)",
                              cursor: "pointer",
                              color: "var(--text-primary)",
                              transition: "background-color 0.15s ease"
                            }}
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
                        className="creator-input-text-sec" 
                        placeholder="Enter description here..."
                        style={{ border: "none", padding: "12px", outline: "none", resize: "vertical", fontSize: "0.85rem", width: "100%" }}
                      />
                    </div>
                  </div>

                  {/* Card 2: Assessment Checkpoints (Timeline) */}
                  <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CheckCircle2 size={16} style={{ color: "var(--accent-color)" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Assessment Checkpoints (Verification Rules)</span>
                      </div>
                      <button 
                        onClick={() => updateForm({ steps: [...form.steps, { task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }] })} 
                        style={{ background: "none", border: "none", color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus size={14} /> Add Checkpoint
                      </button>
                    </div>

                    <div className="timeline-container">
                      {form.steps.length > 0 && <div className="timeline-track"></div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "300px", overflowY: "auto", paddingLeft: "10px", paddingRight: "4px" }}>
                        {form.steps.map((step, idx) => (
                          <div key={idx} className="timeline-step-card">
                            <div className="timeline-step-badge">{idx + 1}</div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <input type="text" value={step.task} onChange={e => { const s = [...form.steps]; s[idx].task = e.target.value; updateForm({ steps: s }); }} className="creator-input-text-sec" style={{ fontWeight: 600, fontSize: "0.78rem" }} placeholder="e.g. Verify that a button with id 'increment-btn' is created" />
                              <button 
                                onClick={() => updateForm({ steps: form.steps.filter((_, i) => i !== idx) })} 
                                style={{ border: "none", background: "none", color: "var(--neon-red)", cursor: "pointer", opacity: 0.7, padding: "4px" }}
                                title="Remove Checkpoint"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", fontSize: "0.72rem", marginTop: "10px", borderTop: "1px solid rgba(0,0,0,0.03)", paddingTop: "10px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>CRITERIA TYPE</span>
                                <select value={step.type} onChange={e => { const s = [...form.steps]; s[idx].type = e.target.value; updateForm({ steps: s }); }} className="creator-select" style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
                                  <option value="TAG_EXISTS">Element exists</option>
                                  <option value="TEXT_EQUALS">Text equals</option>
                                  <option value="TEXT_CONTAINS">Text contains</option>
                                  <option value="CLICK_AND_ASSERT">Click triggers change</option>
                                  <option value="INPUT_AND_ASSERT">Type triggers change</option>
                                  <option value="JS_CODE_INCLUDES">JS contains string</option>
                                  <option value="JS_CODE_EXCLUDES">JS excludes string</option>
                                  <option value="CONSOLE_LOG_CONTAINS">Console logs string</option>
                                  <option value="CONSOLE_NO_ERRORS">No errors check</option>
                                </select>
                              </div>

                              {["TAG_EXISTS", "TEXT_EQUALS", "TEXT_CONTAINS", "CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                                <>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>ELEMENT TYPE</span>
                                    <select value={step.elType} onChange={e => { const s = [...form.steps]; s[idx].elType = e.target.value; updateForm({ steps: s }); }} className="creator-select" style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
                                      <option value="button">Button</option>
                                      <option value="heading">Heading (h1)</option>
                                      <option value="input">Input</option>
                                      <option value="div">Div / Box</option>
                                      <option value="custom">Custom Selector</option>
                                    </select>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>ID / SELECTOR</span>
                                    <input type="text" value={step.elId} onChange={e => { const s = [...form.steps]; s[idx].elId = e.target.value; updateForm({ steps: s }); }} placeholder="e.g. counter" className="creator-input-small" style={{ fontSize: "0.72rem", padding: "4px 8px" }} />
                                  </div>
                                </>
                              )}

                              {["CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>TARGET ELEMENT ID</span>
                                  <input type="text" value={step.targetId} onChange={e => { const s = [...form.steps]; s[idx].targetId = e.target.value; updateForm({ steps: s }); }} placeholder="e.g. result" className="creator-input-small" style={{ fontSize: "0.72rem", padding: "4px 8px" }} />
                                </div>
                              )}

                              {step.type !== "CONSOLE_NO_ERRORS" && step.type !== "TAG_EXISTS" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>EXPECTED VALUE</span>
                                  <input type="text" value={step.value} onChange={e => { const s = [...form.steps]; s[idx].value = e.target.value; updateForm({ steps: s }); }} placeholder="e.g. 1" className="creator-input-small" style={{ fontSize: "0.72rem", padding: "4px 8px" }} />
                                </div>
                              )}

                              <button 
                                onClick={() => setAdvancedSteps(p => ({ ...p, [idx]: !p[idx] }))} 
                                style={{ border: "none", background: "none", textDecoration: "underline", color: "var(--text-secondary)", cursor: "pointer", marginLeft: "auto", fontSize: "0.65rem", fontWeight: 600, marginTop: "10px" }}
                              >
                                {advancedSteps[idx] ? "Hide failure msg" : "Add failure msg"}
                              </button>
                            </div>

                            {advancedSteps[idx] && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)" }}>CUSTOM FAILURE MESSAGE</span>
                                <input type="text" value={step.errorMessage} onChange={e => { const s = [...form.steps]; s[idx].errorMessage = e.target.value; updateForm({ steps: s }); }} className="creator-input-text-sec" style={{ fontSize: "0.72rem", padding: "4px 8px" }} placeholder="Optional error text if checkpoint fails..." />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Code Templates Workspace */}
                  <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={16} style={{ color: "var(--accent-color)" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Code Workspace Templates</span>
                      </div>
                      <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg-tertiary)", padding: "3px", borderRadius: "6px" }}>
                        {["html", "css", "js"].map(tab => (
                          <button 
                            key={tab} 
                            onClick={() => setCreatorCodeTab(tab)} 
                            style={{
                              padding: "4px 12px", 
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              border: "none",
                              borderRadius: "4px",
                              color: creatorCodeTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
                              backgroundColor: creatorCodeTab === tab ? "var(--bg-secondary)" : "transparent",
                              boxShadow: creatorCodeTab === tab ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
                              cursor: "pointer"
                            }}
                          >
                            {tab.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", height: "300px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", height: "100%" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.03em" }}>INITIAL BOILERPLATE TEMPLATE</span>
                        <div style={{ flexGrow: 1, border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                          <Editor height="100%" language={creatorCodeTab === "html" ? "html" : creatorCodeTab === "css" ? "css" : "javascript"} value={creatorCodeTab === "html" ? form.html : creatorCodeTab === "css" ? form.css : form.js} onChange={val => updateForm({ [creatorCodeTab]: val })} options={{ fontSize: 12, minimap: { enabled: false }, tabSize }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", height: "100%" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-color)", letterSpacing: "0.03em" }}>COMPLETED SOLUTION CODE</span>
                        <div style={{ flexGrow: 1, border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                          <Editor height="100%" language={creatorCodeTab === "html" ? "html" : creatorCodeTab === "css" ? "css" : "javascript"} value={creatorCodeTab === "html" ? form.solHtml : creatorCodeTab === "css" ? form.solCss : form.solJs} onChange={val => updateForm({ [`sol${creatorCodeTab.charAt(0).toUpperCase() + creatorCodeTab.slice(1)}`]: val })} options={{ fontSize: 12, minimap: { enabled: false }, tabSize }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px", backgroundColor: "rgba(16, 185, 129, 0.04)", border: "1px dashed rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "10px 14px" }}>
                      <button 
                        onClick={handleAutoGenerateCode} 
                        className="btn-minimal" 
                        style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease", backgroundColor: "var(--bg-secondary)", padding: "6px 12px" }}
                      >
                        ⚡ Auto-Generate Boilerplates
                      </button>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                        Automatically drafts initial & solution templates based on your Assessment Checkpoints.
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "12px", flexShrink: 0 }}>
                    <button 
                      onClick={handleSaveChallenge} 
                      className="btn-minimal creator-btn-gradient" 
                      style={{ padding: "12px 40px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Submit
                    </button>
                  </div>

                  {/* Validation Error checklist box (Screenshot style) */}
                  {validationErrors.length > 0 && (
                    <div style={{ marginTop: "10px", padding: "16px", backgroundColor: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px", flexShrink: 0 }}>
                      <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--neon-red)", marginBottom: "8px" }}>Please fix the following issues:</h3>
                      <ul style={{ paddingLeft: "16px", fontSize: "0.78rem", color: "var(--neon-red)", display: "flex", flexDirection: "column", gap: "4px", margin: 0 }}>
                        {validationErrors.map((err, i) => (
                          <li key={i} style={{ fontWeight: 600 }}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}

              {creatorTab === "text" && (
                <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <FileText size={16} style={{ color: "var(--accent-color)" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Markdown Outline Parser</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>
                    Draft your challenge as a structured text outline. Our parser will instantly process the structure and populate the wizard form.
                  </span>
                  <textarea 
                    value={importText} 
                    onChange={e => setImportText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text" 
                    style={{ fontFamily: "var(--code-font)", fontSize: "0.78rem", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }} 
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
                    className="btn-minimal creator-btn-gradient" 
                    style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "8px" }}
                  >
                    Parse & Load into Wizard
                  </button>
                </div>
              )}

              {creatorTab === "json" && (
                <div className="creator-glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <Terminal size={16} style={{ color: "var(--accent-color)" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Raw JSON Database manager</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>
                    Directly import or export the entire questions database payload. Use this tab to back up custom challenges.
                  </span>
                  <textarea 
                    value={rawJsonText} 
                    onChange={e => setRawJsonText(e.target.value)} 
                    rows={12} 
                    className="creator-input-text" 
                    style={{ fontFamily: "var(--code-font)", fontSize: "0.78rem", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }} 
                  />
                  <div style={{ display: "flex", gap: "12px" }}>
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
                      className="btn-minimal" 
                      style={{ flexGrow: 1, justifyContent: "center", padding: "10px", borderRadius: "8px", fontWeight: 600 }}
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
                      className="btn-minimal" 
                      style={{ flexGrow: 1, justifyContent: "center", padding: "10px", borderRadius: "8px", fontWeight: 600 }}
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
                      className="btn-minimal" 
                      style={{ borderColor: "var(--neon-red)", color: "var(--neon-red)", padding: "10px", borderRadius: "8px", fontWeight: 600 }}
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

      {/* Question Library Modal */}
      {isLibraryOpen && (
        <div className="modal-backdrop" onClick={() => setIsLibraryOpen(false)}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              width: "550px", 
              maxWidth: "90vw", 
              maxHeight: "80vh", 
              padding: "24px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px",
              backgroundColor: "#ffffff",
              borderRadius: "16px"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Question Library</h2>
              <button 
                onClick={() => setIsLibraryOpen(false)} 
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            {/* Top Search & Create Bar inside Modal */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative", flexGrow: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="creator-search-input"
                  style={{ paddingLeft: "34px" }}
                />
              </div>
              <button 
                onClick={() => {
                  handleLoadPreset("blank");
                  setIsLibraryOpen(false);
                }} 
                className="btn-minimal creator-btn-gradient" 
                style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", flexShrink: 0 }}
              >
                <Plus size={16} />
                <span>New Question</span>
              </button>
            </div>

            {/* Question Cards List */}
            <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "4px" }}>
                AVAILABLE QUESTIONS ({filteredQuestions.length})
              </span>
              {filteredQuestions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                  No questions found matching search query.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const originalIndex = questions.findIndex(x => x.id === q.id);
                  const difficultyLower = (q.difficulty || "easy").toLowerCase();
                  return (
                    <div 
                      key={q.id} 
                      onClick={() => {
                        handleEditChallenge(q);
                        setIsLibraryOpen(false);
                      }} 
                      className={`creator-sidebar-card ${form.id === q.id ? "active" : ""}`}
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", flexGrow: 1, color: "var(--text-primary)" }}>
                          {originalIndex + 1}. {q.title}
                        </span>
                        <button 
                          onClick={(e) => handleDeleteChallenge(q.id, e)} 
                          style={{ background: "none", border: "none", color: "var(--neon-red)", cursor: "pointer", display: "flex", opacity: 0.6, padding: "2px" }}
                          title="Delete Challenge"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                        <span className={`challenge-difficulty ${difficultyLower}`} style={{ fontSize: "0.6rem" }}>
                          {q.difficulty || "Easy"}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                          {(q.changesToBeDone || []).length} steps
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorWorkspace;
