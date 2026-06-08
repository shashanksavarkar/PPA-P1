import { useState } from "react";
import { 
  BookOpen, CheckSquare, Edit3, Check, XCircle, HelpCircle,
  Heart, Share2, Bookmark, Eye, Clock, Code, MessageSquare
} from "lucide-react";

const sectionHeaderStyle = { 
  fontSize: "0.82rem", 
  fontWeight: 700, 
  color: "#111827", 
  margin: "0 0 6px 0", 
  textTransform: "uppercase", 
  letterSpacing: "0.03em" 
};



const ChallengeSidebar = ({
  isDesktop,
  sidebarWidth,
  activeQuestion,
  validationResult,
  handleStepClick,
  isAuthorMode,
  visibleHints = {},
  toggleHint,
  handleNavPrev,
  handleNavNext,
  activeIndex = 0,
  totalQuestions = 1
}) => {
  const [activeTab, setActiveTab] = useState("problem");
  const [notes, setNotes] = useState(() => {
    return activeQuestion?.id ? localStorage.getItem(`ppa_notes_${activeQuestion.id}`) || "" : "";
  });


  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (activeQuestion?.id) {
      localStorage.setItem(`ppa_notes_${activeQuestion.id}`, val);
    }
  };

  if (!activeQuestion) {
    return (
      <div style={{ width: isDesktop ? `${sidebarWidth}%` : "100%", backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", color: "#6b7280" }}>
        <span>No active challenge selected</span>
      </div>
    );
  }

  const renderListOrText = (data, fallback) => {
    if (!data) return <p style={{ margin: "4px 0" }}>{fallback}</p>;
    return Array.isArray(data) ? (
      <ul style={{ paddingLeft: "16px", margin: "4px 0", lineHeight: "1.4" }}>
        {data.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    ) : <p style={{ margin: "4px 0" }}>{data}</p>;
  };

  const difficultyColor = activeQuestion.difficulty === "Easy" ? "#10b981" : activeQuestion.difficulty === "Medium" ? "#f59e0b" : "#ef4444";
  const difficultyBg = activeQuestion.difficulty === "Easy" ? "#ecfdf5" : activeQuestion.difficulty === "Medium" ? "#fffbeb" : "#fef2f2";

  // sub-view: Verification Checklist (Submissions)
  const totalSteps = activeQuestion.changesToBeDone?.length || 0;
  const passedStepsCount = activeQuestion.changesToBeDone
    ? activeQuestion.changesToBeDone.filter((_, idx) => {
        const stepResult = validationResult?.stepResults?.[idx];
        const hasRule = activeQuestion.rules?.some((r, rIdx) => (r.stepIndex ?? Math.min(rIdx, totalSteps - 1)) === idx);
        return hasRule ? stepResult?.success : validationResult?.success;
      }).length
    : 0;
  const progressPercent = totalSteps > 0 ? Math.round((passedStepsCount / totalSteps) * 100) : 0;


  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100%", minWidth: 0, flexShrink: 0, flexGrow: 0, fontFamily: "Inter, Roboto, sans-serif" }}>
      
      {/* Sidebar Top Nav Tabs */}
      <div style={{ height: "36px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", padding: "0 6px", flexShrink: 0, userSelect: "none" }}>
        <div style={{ display: "flex", height: "100%", gap: "4px" }}>
          {[
            { id: "problem", label: "Problem", icon: <BookOpen size={13} /> },
            { id: "verification", label: "Submissions", icon: <CheckSquare size={13} /> },
            { id: "notes", label: "Notes", icon: <Edit3 size={13} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: "none", border: "none", color: activeTab === tab.id ? "var(--accent-color)" : "#6b7280",
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "0.72rem", cursor: "pointer",
              height: "100%", display: "flex", alignItems: "center", gap: "4px", padding: "0 8px",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-color)" : "none"
            }}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prev / Next Question Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", flexShrink: 0 }}>
        <button
          onClick={handleNavPrev}
          disabled={activeIndex === 0}
          style={{
            padding: "4px 12px", fontSize: "0.72rem", fontWeight: 600, borderRadius: "5px", cursor: activeIndex === 0 ? "not-allowed" : "pointer",
            border: "1px solid #e5e7eb", backgroundColor: activeIndex === 0 ? "#f3f4f6" : "#ffffff",
            color: activeIndex === 0 ? "#9ca3af" : "#374151", display: "flex", alignItems: "center", gap: "4px"
          }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>
          {activeIndex + 1} / {totalQuestions}
        </span>
        <button
          onClick={handleNavNext}
          disabled={activeIndex === totalQuestions - 1}
          style={{
            padding: "4px 12px", fontSize: "0.72rem", fontWeight: 600, borderRadius: "5px", cursor: activeIndex === totalQuestions - 1 ? "not-allowed" : "pointer",
            border: "1px solid #e5e7eb", backgroundColor: activeIndex === totalQuestions - 1 ? "#f3f4f6" : "#ffffff",
            color: activeIndex === totalQuestions - 1 ? "#9ca3af" : "#374151", display: "flex", alignItems: "center", gap: "4px"
          }}
        >
          Next →
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", color: "#1f2937", fontSize: "0.85rem" }}>
        
        {activeTab === "problem" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              {/* Title & Far-right Bookmark Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                  {activeQuestion.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6b7280" }}>
                  <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", padding: 0 }} title="Favorite">
                    <Heart size={15} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", padding: 0 }} title="Share">
                    <Share2 size={15} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", padding: 0 }} title="Bookmark">
                    <Bookmark size={15} />
                  </button>
                </div>
              </div>

              {/* Tags & Performance Row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "0.72rem", color: "#4b5563" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px", backgroundColor: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                  <span style={{ fontWeight: 800 }}>#</span> HTML/CSS
                </span>
                
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: difficultyColor, backgroundColor: difficultyBg, padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                  <Code size={11} /> {activeQuestion.difficulty}
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  <Eye size={11} style={{ color: "#6b7280" }} /> 14.1K
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  <Heart size={11} style={{ color: "#ef4444" }} /> 131
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  <CheckSquare size={11} style={{ color: "#10b981" }} /> 1939
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  <MessageSquare size={11} style={{ color: "#3b82f6" }} /> 1499
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  <Clock size={11} style={{ color: "#6b7280" }} /> 30 mins
                </span>

                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4b5563", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "6px" }}>
                  100 XP
                </span>
              </div>
            </div>

            <div style={{ lineHeight: "1.5", color: "#374151" }}>
              {activeQuestion.description}
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>Input Format</h3>
              <div style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                {renderListOrText(activeQuestion.inputFormat, "Standard HTML input form elements and DOM event listeners.")}
              </div>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>Output Format</h3>
              <div style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                {renderListOrText(activeQuestion.outputFormat, "Updates to the sandbox DOM hierarchy and corresponding console logs.")}
              </div>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>Constraints</h3>
              <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "4px", color: "#4b5563", fontSize: "0.8rem", lineHeight: "1.4" }}>
                {renderListOrText(activeQuestion.constraints, ["Follow correct HTML semantic elements structure.", "Ensure all required tasks validate and check off successfully."])}
              </ul>
            </div>

            {activeQuestion.examples?.length > 0 && (
              <div>
                <h3 style={sectionHeaderStyle}>Examples</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeQuestion.examples.map((ex, i) => (
                    <div key={i} style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px 14px", fontFamily: "monospace", fontSize: "0.76rem", color: "#374151" }}>
                      <div style={{ marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#4b5563" }}>Input:</span>
                        <pre style={{ margin: "2px 0 0 0", whiteSpace: "pre-wrap", color: "#1f2937" }}>{ex.input}</pre>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: "#4b5563" }}>Output:</span>
                        <pre style={{ margin: "2px 0 0 0", whiteSpace: "pre-wrap", color: "#1f2937" }}>{ex.output}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "verification" && (
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                <span style={{ color: "#4b5563" }}>REQUIRED TASKS VERIFICATION</span>
                <span style={{ color: progressPercent === 100 ? "#10b981" : "var(--accent-color)" }}>{passedStepsCount} / {totalSteps} Passed ({progressPercent}%)</span>
              </div>
              <div style={{ width: "100%", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: progressPercent === 100 ? "#10b981" : "var(--accent-color)", transition: "width 0.4s ease" }} />
              </div>
            </div>

            <ul style={{ display: "flex", flexDirection: "column", gap: "8px", listStyle: "none", margin: 0, padding: 0 }}>
              {activeQuestion.changesToBeDone?.map((change, idx) => {
                const stepResult = validationResult?.stepResults?.[idx];
                const hasRule = activeQuestion.rules?.some((r, rIdx) => (r.stepIndex ?? Math.min(rIdx, totalSteps - 1)) === idx);
                const isPassed = hasRule ? stepResult?.success : validationResult?.success;

                const stepIcon = isPassed
                  ? <Check size={14} style={{ color: "#10b981" }} />
                  : (hasRule && stepResult)
                    ? <XCircle size={14} style={{ color: "#ef4444" }} />
                    : <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>○</span>;

                const textColor = isPassed ? "#1f2937" : (hasRule && stepResult) ? "#ef4444" : "#6b7280";
                const itemBg = isPassed ? "#f0fdf4" : (hasRule && stepResult) ? "#fef2f2" : "transparent";
                const itemBorder = isPassed ? "1px solid #d1fae5" : (hasRule && stepResult) ? "1px solid #fee2e2" : "1px solid transparent";

                return (
                  <li key={idx} onClick={() => handleStepClick?.(idx)} style={{
                    display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem", color: textColor,
                    lineHeight: "1.4", padding: "10px 12px", borderRadius: "6px", backgroundColor: itemBg, border: itemBorder,
                    cursor: handleStepClick ? "pointer" : "default", transition: "all 0.15s ease"
                  }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ display: "flex", alignItems: "center", height: "18px", flexShrink: 0 }}>{stepIcon}</span>
                      <div style={{ flexGrow: 1 }}>
                        <span style={{ fontWeight: 500 }}>{change}</span>
                        {stepResult && !stepResult.success && stepResult.messages.length > 0 && (
                          <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "4px", fontWeight: 500 }}>{stepResult.messages[0]}</div>
                        )}
                      </div>
                      {activeQuestion.hints?.[idx] && isAuthorMode && toggleHint && (
                        <button onClick={(e) => { e.stopPropagation(); toggleHint(idx); }} style={{ background: "none", border: "none", color: visibleHints[idx] ? "var(--accent-color)" : "#6b7280", cursor: "pointer", display: "flex", opacity: 0.75 }}>
                          <HelpCircle size={14} />
                        </button>
                      )}
                    </div>
                    {visibleHints[idx] && activeQuestion.hints?.[idx] && isAuthorMode && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "6px", padding: "8px 10px", backgroundColor: "#f3f4f6", borderLeft: "3px solid var(--accent-color)", borderRadius: "4px", fontSize: "0.72rem", color: "#1f2937" }}>
                        <span style={{ fontWeight: 700, display: "block", color: "var(--accent-color)" }}>HINT:</span>{activeQuestion.hints[idx]}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === "solution" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "12px", gap: "12px" }}>
              {[
                { id: "html", label: "index.html" },
                { id: "css", label: "style.css" },
                { id: "js", label: "index.js" }
              ].map(lang => (
                <button key={lang.id} onClick={() => setSolutionLang(lang.id)} style={{
                  background: "none", border: "none", color: solutionLang === lang.id ? "var(--accent-color)" : "#6b7280",
                  fontWeight: solutionLang === lang.id ? 700 : 500, fontSize: "0.75rem", cursor: "pointer",
                  padding: "6px 2px", borderBottom: solutionLang === lang.id ? "2px solid var(--accent-color)" : "none"
                }}>
                  {lang.label}
                </button>
              ))}
            </div>
            
            <div style={{ position: "relative" }}>
              <pre style={{
                backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: "6px",
                padding: "12px", fontFamily: "var(--code-font)", fontSize: "0.76rem",
                overflowX: "auto", whiteSpace: "pre-wrap", color: "#1f2937", maxHeight: "400px"
              }}>
                {solutionLang === "html" ? activeQuestion.solutionHtml : solutionLang === "css" ? activeQuestion.solutionCss : activeQuestion.solutionJs}
              </pre>
              <button 
                onClick={() => {
                  const txt = solutionLang === "html" ? activeQuestion.solutionHtml : solutionLang === "css" ? activeQuestion.solutionCss : activeQuestion.solutionJs;
                  navigator.clipboard.writeText(txt);
                  alert("Solution code copied to clipboard!");
                }}
                style={{
                  position: "absolute", top: "8px", right: "8px", padding: "4px 8px", fontSize: "0.65rem",
                  backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid #d4d4d8", borderRadius: "4px",
                  cursor: "pointer", fontWeight: 600
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic" }}>
              Your notes are saved automatically to the browser's local storage.
            </p>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Write your notes or scratchpad items here..."
              style={{
                width: "100%", height: "280px", border: "1px solid #cbd5e1", borderRadius: "8px",
                padding: "12px", fontSize: "0.8rem", fontFamily: "var(--ui-font)", outline: "none", resize: "vertical",
                lineHeight: "1.4"
              }}
            />
          </div>
        )}


      </div>
    </div>
  );
};

export default ChallengeSidebar;
