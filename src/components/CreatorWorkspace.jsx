import { useState } from "react";
import Editor from "@monaco-editor/react";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { challengeToSteps, stepsToRulesAndTasks, parseChallengeText } from "../utils/challengeHelpers";

const CreatorWorkspace = ({ questions, setQuestions, showToast, tabSize, activeIndex, loadQuestion }) => {
  const [form, setForm] = useState({
    id: "", title: "", difficulty: "Easy", description: "",
    steps: [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
    html: "", css: "", js: "", solHtml: "", solCss: "", solJs: "",
  });

  const [advancedSteps, setAdvancedSteps] = useState({});
  const [importText, setImportText] = useState("");
  const [rawJsonText, setRawJsonText] = useState("");
  const [creatorCodeTab, setCreatorCodeTab] = useState("html");
  const [creatorTab, setCreatorTab] = useState("form");

  const updateForm = (fields) => setForm(prev => ({ ...prev, ...fields }));

  const handleAutoGenerateCode = () => {
    const elementsMap = {};
    const jsLines = [], solJsLines = [];
    
    form.steps.forEach(step => {
      if (step.elId || step.elClass || (step.elType && step.elType !== "custom")) {
        const key = step.elId || step.elClass || step.elType;
        if (!elementsMap[key]) {
          elementsMap[key] = { id: step.elId, className: step.elClass, type: step.elType, value: step.type === "CLICK_AND_ASSERT" ? (step.value || "Click Me") : step.value };
        }
      }
      
      if (step.targetId && !elementsMap[step.targetId]) {
        let type = "div", val = "";
        const lower = step.targetId.toLowerCase();
        if (lower.includes("count") || lower.includes("number")) { type = "heading"; val = "0"; }
        else if (lower.includes("input") || lower.includes("field")) type = "input";
        else if (lower.includes("title") || lower.includes("heading")) { type = "heading"; val = "Initial Text"; }
        else if (lower.includes("list") || lower.includes("items")) type = "list";
        elementsMap[step.targetId] = { id: step.targetId, className: "", type, value: val };
      }
      
      if (step.elId && step.targetId) {
        if (step.type === "CLICK_AND_ASSERT") {
          jsLines.push(`// Listen for clicks on '#${step.elId}'\ndocument.getElementById('${step.elId}').addEventListener('click', () => {\n  // TODO: Update '#${step.targetId}'\n});\n`);
          solJsLines.push(`document.getElementById('${step.elId}').addEventListener('click', () => {\n  const target = document.getElementById('${step.targetId}');\n  if (target.tagName === 'INPUT') target.value = "${step.value}";\n  else target.textContent = "${step.value}";\n});\n`);
        } else if (step.type === "INPUT_AND_ASSERT") {
          jsLines.push(`// Listen for input on '#${step.elId}'\ndocument.getElementById('${step.elId}').addEventListener('input', (event) => {\n  // TODO\n});\n`);
          solJsLines.push(`document.getElementById('${step.elId}').addEventListener('input', (event) => {\n  document.getElementById('${step.targetId}').textContent = event.target.value;\n});\n`);
        }
      }
    });
    
    const templateMap = {
      button: (id, cls, val) => `<button${id}${cls}>${val || 'Click'}</button>`,
      heading: (id, cls, val) => `<h1${id}${cls}>${val !== undefined && val !== "" ? val : 'Heading'}</h1>`,
      input: (id, cls, val) => `<input type="text"${id}${cls} placeholder="${val || 'Type...'}">`,
      list: (id, cls) => `<ul${id}${cls}>\n  </ul>`,
      div: (id, cls) => `<div${id}${cls}></div>`
    };

    const htmlElements = Object.values(elementsMap).map(el => {
      const id = el.id ? ` id="${el.id}"` : '';
      const cls = el.className ? ` class="${el.className}"` : '';
      return '  ' + (templateMap[el.type] || ((id, cls, val) => `<div${id}${cls}>${val || ''}</div>`))(id, cls, el.value);
    });
    
    const startHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${form.title || 'Challenge'}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main>\n    <h1>${form.title || 'Challenge'}</h1>\n  ${htmlElements.join('\n  ')}\n  </main>\n  <script src="index.js"></script>\n</body>\n</html>`;
    const startCss = `body { font-family: sans-serif; margin: 30px; }`;

    updateForm({
      html: startHtml, css: startCss,
      js: jsLines.length ? jsLines.join('\n') : `console.log("App ready!");`,
      solHtml: startHtml, solCss: startCss,
      solJs: solJsLines.length ? solJsLines.join('\n') : `console.log("App solved!");`
    });
    showToast("Starter code auto-generated!", "success");
  };

  const handleEditChallenge = (q) => {
    setForm({
      id: q.id, title: q.title || "", difficulty: q.difficulty || "Easy", description: q.description || "",
      steps: challengeToSteps(q).length ? challengeToSteps(q) : [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
      html: q.initialHtml || "", css: q.initialCss || "", js: q.initialJs || "",
      solHtml: q.solutionHtml || "", solCss: q.solutionCss || "", solJs: q.solutionJs || ""
    });
    setCreatorTab("form");
  };

  const handleSaveChallenge = () => {
    if (!form.title.trim()) return showToast("Question title is required!", "error");
    const cleanSteps = form.steps.filter(s => s.task.trim() !== "");
    if (!cleanSteps.length) return showToast("At least one step is required!", "error");

    const { changesToBeDone, rules } = stepsToRulesAndTasks(cleanSteps);
    const newId = form.id || `custom-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    
    const q = {
      id: newId, env: "web", title: form.title, difficulty: form.difficulty, description: form.description,
      changesToBeDone, hints: changesToBeDone.map(t => `Hint for: ${t}`), rules,
      initialHtml: form.html, initialCss: form.css, initialJs: form.js,
      solutionHtml: form.solHtml, solutionCss: form.solCss, solutionJs: form.solJs
    };

    const updated = form.id ? questions.map(x => x.id === form.id ? q : x) : [...questions, q];
    showToast(form.id ? "Question updated!" : "Question added!", "success");
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

  return (
    <div style={{ display: "flex", flexGrow: 1, padding: "0 20px 20px 20px", gap: "24px", overflow: "hidden", color: "var(--text-primary)", minHeight: 0 }}>
      {/* Left Sidebar: Challenges List */}
      <div style={{ width: "280px", flexShrink: 0, borderRight: "1px solid var(--border-color)", paddingRight: "20px", display: "flex", flexDirection: "column", gap: "14px", height: "100%", overflow: "hidden" }}>
        <button onClick={() => handleLoadPreset("blank")} className="btn-minimal active" style={{ width: "100%", justifyContent: "center", padding: "10px" }}>
          + New Question
        </button>
        <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)" }}>EXISTING QUESTIONS ({questions.length})</span>
          {questions.map((q, idx) => (
            <div key={q.id} onClick={() => handleEditChallenge(q)} style={{
              padding: "8px 12px", borderRadius: "8px", border: "1px solid",
              borderColor: form.id === q.id ? "var(--accent-color)" : "var(--border-color)",
              backgroundColor: form.id === q.id ? "rgba(79, 70, 229, 0.05)" : "var(--bg-tertiary)",
              cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem"
            }}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idx + 1}. {q.title}</span>
              <button onClick={(e) => handleDeleteChallenge(q.id, e)} style={{ background: "none", border: "none", color: "var(--neon-red)", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Tabs */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "16px", gap: "16px", flexShrink: 0 }}>
          {[
            { id: "form", label: "Wizard Form" },
            { id: "text", label: "Markdown Outline Parser" },
            { id: "json", label: "Raw JSON Database" }
          ].map(t => (
            <button key={t.id} onClick={() => setCreatorTab(t.id)} style={{
              padding: "8px 4px", fontSize: "0.85rem", fontWeight: creatorTab === t.id ? 600 : 400,
              color: creatorTab === t.id ? "var(--accent-color)" : "var(--text-secondary)",
              border: "none", background: "none", borderBottom: creatorTab === t.id ? "2px solid var(--accent-color)" : "none", cursor: "pointer"
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ flexGrow: 1, overflowY: "auto", paddingRight: "8px", minHeight: 0 }}>
          {creatorTab === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Question Title</label>
                  <input type="text" value={form.title} onChange={e => updateForm({ title: e.target.value })} className="creator-input-text" />
                </div>
                <div style={{ width: "120px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Difficulty</label>
                  <select value={form.difficulty} onChange={e => updateForm({ difficulty: e.target.value })} className="creator-select">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div style={{ width: "180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Load Presets</label>
                  <select onChange={e => handleLoadPreset(e.target.value)} className="creator-select" style={{ color: "var(--accent-color)" }}>
                    <option value="">-- Choose Template --</option>
                    <option value="counter">Counter App</option>
                    <option value="mirror">Input Mirror</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Description</label>
                <textarea value={form.description} onChange={e => updateForm({ description: e.target.value })} rows={2} className="creator-input-text" style={{ resize: "vertical" }} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Assessment Checkpoints</span>
                  <button onClick={() => updateForm({ steps: [...form.steps, { task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }] })} style={{ background: "none", border: "none", color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem" }}>+ Add Checkpoint</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                  {form.steps.map((step, idx) => (
                    <div key={idx} style={{ padding: "10px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>Step {idx + 1}</span>
                        <input type="text" value={step.task} onChange={e => { const s = [...form.steps]; s[idx].task = e.target.value; updateForm({ steps: s }); }} className="creator-input-text-sec" placeholder="Instruction description..." />
                        <button onClick={() => updateForm({ steps: form.steps.filter((_, i) => i !== idx) })} style={{ border: "none", background: "none", color: "var(--neon-red)", cursor: "pointer" }}>✕</button>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", fontSize: "0.7rem" }}>
                        <select value={step.type} onChange={e => { const s = [...form.steps]; s[idx].type = e.target.value; updateForm({ steps: s }); }} className="creator-select">
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

                        {["TAG_EXISTS", "TEXT_EQUALS", "TEXT_CONTAINS", "CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                          <>
                            <select value={step.elType} onChange={e => { const s = [...form.steps]; s[idx].elType = e.target.value; updateForm({ steps: s }); }} className="creator-select">
                              <option value="button">Button</option>
                              <option value="heading">Heading (h1)</option>
                              <option value="input">Input</option>
                              <option value="div">Div / Box</option>
                              <option value="custom">Custom Selector</option>
                            </select>
                            <input type="text" value={step.elId} onChange={e => { const s = [...form.steps]; s[idx].elId = e.target.value; updateForm({ steps: s }); }} placeholder="ID/Selector" className="creator-input-small" />
                          </>
                        )}

                        {["CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                          <input type="text" value={step.targetId} onChange={e => { const s = [...form.steps]; s[idx].targetId = e.target.value; updateForm({ steps: s }); }} placeholder="Target ID" className="creator-input-small" />
                        )}

                        {step.type !== "CONSOLE_NO_ERRORS" && step.type !== "TAG_EXISTS" && (
                          <input type="text" value={step.value} onChange={e => { const s = [...form.steps]; s[idx].value = e.target.value; updateForm({ steps: s }); }} placeholder="Value check" className="creator-input-small" />
                        )}

                        <button onClick={() => setAdvancedSteps(p => ({ ...p, [idx]: !p[idx] }))} style={{ border: "none", background: "none", textDecoration: "underline", color: "var(--text-secondary)", cursor: "pointer", marginLeft: "auto" }}>
                          {advancedSteps[idx] ? "Hide Custom Fail" : "Custom Failure Msg"}
                        </button>
                      </div>

                      {advancedSteps[idx] && (
                        <input type="text" value={step.errorMessage} onChange={e => { const s = [...form.steps]; s[idx].errorMessage = e.target.value; updateForm({ steps: s }); }} className="creator-input-text-sec" placeholder="Failure notification output text..." />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button onClick={handleAutoGenerateCode} className="btn-minimal" style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)" }}>⚡ Auto-Generate Starter templates</button>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Creates standard setup based on steps configuration.</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Code Workspace Setup</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["html", "css", "js"].map(tab => (
                      <button key={tab} onClick={() => setCreatorCodeTab(tab)} className="btn-minimal" style={{
                        padding: "3px 8px", fontSize: "0.7rem",
                        borderColor: creatorCodeTab === tab ? "var(--accent-color)" : "var(--border-color)",
                        backgroundColor: creatorCodeTab === tab ? "rgba(79, 70, 229, 0.05)" : "transparent"
                      }}>{tab.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", height: "240px" }}>
                  <div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)" }}>INITIAL TEMPLATE</span>
                    <div style={{ height: "100%", border: "1px solid var(--border-color)" }}>
                      <Editor height="100%" language={creatorCodeTab === "html" ? "html" : creatorCodeTab === "css" ? "css" : "javascript"} value={creatorCodeTab === "html" ? form.html : creatorCodeTab === "css" ? form.css : form.js} onChange={val => updateForm({ [creatorCodeTab]: val })} options={{ fontSize: 11, minimap: { enabled: false }, tabSize }} />
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-color)" }}>SOLUTION CODE</span>
                    <div style={{ height: "100%", border: "1px solid var(--border-color)" }}>
                      <Editor height="100%" language={creatorCodeTab === "html" ? "html" : creatorCodeTab === "css" ? "css" : "javascript"} value={creatorCodeTab === "html" ? form.solHtml : creatorCodeTab === "css" ? form.solCss : form.solJs} onChange={val => updateForm({ [`sol${creatorCodeTab.charAt(0).toUpperCase() + creatorCodeTab.slice(1)}`]: val })} options={{ fontSize: 11, minimap: { enabled: false }, tabSize }} />
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveChallenge} className="btn-minimal active" style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "10px" }}>
                {form.id ? "Save Changes" : "Create Challenge Question"}
              </button>
            </div>
          )}

          {creatorTab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Write a challenge description outline and our parser will configure the steps builder.</span>
              <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={12} className="creator-input-text" style={{ fontFamily: "monospace", fontSize: "0.75rem" }} placeholder={`Title: Click Action\nDifficulty: Easy\nDescription: Make updates on counter click.\nSteps:\n- Create h1 with ID 'counter'\n- Create button with ID 'increment-btn'`} />
              <button onClick={() => {
                if (!importText.trim()) return showToast("Outline cannot be empty!", "error");
                const parsed = parseChallengeText(importText);
                setForm({
                  id: "", title: parsed.title, difficulty: parsed.difficulty, description: parsed.description, steps: parsed.steps,
                  html: parsed.initialHtml, css: parsed.initialCss, js: parsed.initialJs,
                  solHtml: parsed.solutionHtml, solCss: parsed.solutionCss, solJs: parsed.solutionJs
                });
                setCreatorTab("form");
                showToast("Outline parsed successfully!", "success");
              }} className="btn-minimal active" style={{ width: "100%", justifyContent: "center", padding: "10px" }}>Parse & Load into Wizard</button>
            </div>
          )}

          {creatorTab === "json" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Copy or import questions database payload.</span>
              <textarea value={rawJsonText} onChange={e => setRawJsonText(e.target.value)} rows={12} className="creator-input-text" style={{ fontFamily: "monospace", fontSize: "0.75rem" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => {
                  try {
                    const parsed = JSON.parse(rawJsonText);
                    if (!Array.isArray(parsed)) throw new Error("JSON must be array.");
                    setQuestions(parsed);
                    localStorage.setItem("ppa_custom_challenges", JSON.stringify(parsed));
                    showToast("Database imported successfully!", "success");
                  } catch(e) { showToast("Invalid JSON: " + e.message, "error"); }
                }} className="btn-minimal" style={{ flexGrow: 1, justifyContent: "center" }}>Import DB</button>
                <button onClick={() => { const val = JSON.stringify(questions, null, 2); setRawJsonText(val); navigator.clipboard.writeText(val); showToast("Copied to clipboard!", "success"); }} className="btn-minimal" style={{ flexGrow: 1, justifyContent: "center" }}>Export clipboard</button>
                <button onClick={() => {
                  if (window.confirm("Restore defaults? Overwrites custom edits.")) {
                    localStorage.removeItem("ppa_custom_challenges");
                    setQuestions(DEFAULT_QUESTIONS);
                    showToast("Restored original database", "info");
                  }
                }} className="btn-minimal" style={{ borderColor: "var(--neon-red)", color: "var(--neon-red)" }}>Reset original DB</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorWorkspace;
