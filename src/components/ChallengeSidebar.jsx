import { useEffect, useState } from "react";
import {
  BookOpen, CheckSquare, Check, XCircle, HelpCircle
} from "lucide-react";

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
  const [solutionLang, setSolutionLang] = useState("html");
  const [notes, setNotes] = useState(() => {
    return activeQuestion?.id ? localStorage.getItem(`ppa_notes_${activeQuestion.id}`) || "" : "";
  });

  useEffect(() => {
    queueMicrotask(() => {
      setNotes(activeQuestion?.id ? localStorage.getItem(`ppa_notes_${activeQuestion.id}`) || "" : "");
    });
  }, [activeQuestion?.id]);

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (activeQuestion?.id) {
      localStorage.setItem(`ppa_notes_${activeQuestion.id}`, val);
    }
  };

  if (!activeQuestion) {
    return (
      <div className="bg-white border-r border-gray-200 flex items-center justify-center p-6 text-gray-500" style={{ width: isDesktop ? `${sidebarWidth}%` : "100%" }}>
        <span>No active challenge selected</span>
      </div>
    );
  }

  const renderListOrText = (data, fallback) => {
    if (!data) return <p className="my-1">{fallback}</p>;
    return Array.isArray(data) ? (
      <ul className="pl-4 my-1 leading-relaxed">
        {data.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    ) : <p className="my-1">{data}</p>;
  };

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
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full min-w-0 shrink-0 grow-0 font-[family-name:var(--font-family-ui)]">

      {/* Sidebar Top Nav Tabs */}
      <div className="h-9 border-b border-gray-200 bg-gray-50 flex items-center px-1.5 shrink-0 select-none">
        <div className="flex h-full gap-1">
          {[
            { id: "problem", label: "Problem", icon: <BookOpen size={13} /> },
            { id: "verification", label: "Submissions", icon: <CheckSquare size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bg-transparent border-none cursor-pointer h-full flex items-center gap-1 px-2 text-[0.72rem] ${
                activeTab === tab.id
                  ? "text-accent font-bold border-b-2 border-b-accent"
                  : "text-gray-500 font-medium border-b-0"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prev / Next Question Navigation */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={handleNavPrev}
          disabled={activeIndex === 0}
          className={`px-3 py-1 text-[0.72rem] font-semibold rounded-[5px] border border-gray-200 flex items-center gap-1 ${
            activeIndex === 0 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "cursor-pointer bg-white text-gray-700"
          }`}
        >
          ← Prev
        </button>
        <span className="text-[0.72rem] text-gray-500 font-semibold">
          {activeIndex + 1} / {totalQuestions}
        </span>
        <button
          onClick={handleNavNext}
          disabled={activeIndex === totalQuestions - 1}
          className={`px-3 py-1 text-[0.72rem] font-semibold rounded-[5px] border border-gray-200 flex items-center gap-1 ${
            activeIndex === totalQuestions - 1 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "cursor-pointer bg-white text-gray-700"
          }`}
        >
          Next →
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grow overflow-y-auto p-5 flex flex-col text-gray-800 text-[0.85rem]">

        {activeTab === "problem" && (
          <div className="flex flex-col gap-[18px]">
            <div>
              {/* Title & Bookmark Row */}
              <div className="flex justify-center items-center mb-2">
                <h2 className="text-[1.3rem] font-bold text-gray-900 m-0">
                  {activeQuestion.title}
                </h2>
              </div>              
            </div>

            <div className="leading-relaxed text-gray-700">{activeQuestion.description}</div>

            <div>
              <h3 className="text-[0.82rem] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Input Format</h3>
              <div className="text-gray-600 text-[0.8rem]">
                {renderListOrText(activeQuestion.inputFormat, "Standard HTML input form elements and DOM event listeners.")}
              </div>
            </div>

            <div>
              <h3 className="text-[0.82rem] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Output Format</h3>
              <div className="text-gray-600 text-[0.8rem]">
                {renderListOrText(activeQuestion.outputFormat, "Updates to the sandbox DOM hierarchy and corresponding console logs.")}
              </div>
            </div>

            <div>
              <h3 className="text-[0.82rem] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Constraints</h3>
              <ul className="pl-4 m-0 flex flex-col gap-1 text-gray-600 text-[0.8rem] leading-relaxed">
                {renderListOrText(activeQuestion.constraints, ["Follow correct HTML semantic elements structure.", "Ensure all required tasks validate and check off successfully."])}
              </ul>
            </div>

            {activeQuestion.examples?.length > 0 && (
              <div>
                <h3 className="text-[0.82rem] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Examples</h3>
                <div className="flex flex-col gap-2.5">
                  {activeQuestion.examples.map((ex, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-md px-3.5 py-2.5 font-mono text-[0.76rem] text-gray-700">
                      <div className="mb-1.5">
                        <span className="font-bold text-gray-600">Input:</span>
                        <pre className="mt-0.5 mb-0 whitespace-pre-wrap text-gray-800">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="font-bold text-gray-600">Output:</span>
                        <pre className="mt-0.5 mb-0 whitespace-pre-wrap text-gray-800">{ex.output}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "verification" && (
          <div className="flex flex-col min-h-0">
            <div className="flex flex-col gap-2 px-4 py-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-600">REQUIRED TASKS VERIFICATION</span>
                <span style={{ color: progressPercent === 100 ? "#10b981" : "var(--color-accent)" }}>{passedStepsCount} / {totalSteps} Passed ({progressPercent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full transition-[width] duration-400 ease-in-out" style={{ width: `${progressPercent}%`, backgroundColor: progressPercent === 100 ? "#10b981" : "var(--color-accent)" }} />
              </div>
            </div>

            <ul className="flex flex-col gap-2 list-none m-0 p-0">
              {activeQuestion.changesToBeDone?.map((change, idx) => {
                const stepResult = validationResult?.stepResults?.[idx];
                const hasRule = activeQuestion.rules?.some((r, rIdx) => (r.stepIndex ?? Math.min(rIdx, totalSteps - 1)) === idx);
                const isPassed = hasRule ? stepResult?.success : validationResult?.success;

                const stepIcon = isPassed
                  ? <Check size={14} className="text-emerald-500" />
                  : (hasRule && stepResult)
                    ? <XCircle size={14} className="text-red-500" />
                    : <span className="text-gray-400 text-[0.85rem]">○</span>;

                const textColor = isPassed ? "text-gray-800" : (hasRule && stepResult) ? "text-red-500" : "text-gray-500";
                const itemBg = isPassed ? "bg-green-50" : (hasRule && stepResult) ? "bg-red-50" : "bg-transparent";
                const itemBorder = isPassed ? "border-green-100" : (hasRule && stepResult) ? "border-red-100" : "border-transparent";

                return (
                  <li
                    key={idx}
                    onClick={() => handleStepClick?.(idx)}
                    className={`flex flex-col gap-1 text-[0.78rem] leading-relaxed px-3 py-2.5 rounded-md border transition-all duration-150 ${textColor} ${itemBg} ${itemBorder} ${handleStepClick ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="flex items-center h-[18px] shrink-0">{stepIcon}</span>
                      <div className="grow">
                        <span className="font-medium">{change}</span>
                        {stepResult && !stepResult.success && stepResult.messages.length > 0 && (
                          <div className="text-[0.72rem] text-red-500 mt-1 font-medium">{stepResult.messages[0]}</div>
                        )}
                      </div>
                      {activeQuestion.hints?.[idx] && isAuthorMode && toggleHint && (
                        <button onClick={(e) => { e.stopPropagation(); toggleHint(idx); }} className={`bg-transparent border-none cursor-pointer flex opacity-75 ${visibleHints[idx] ? "text-accent" : "text-gray-500"}`}>
                          <HelpCircle size={14} />
                        </button>
                      )}
                    </div>
                    {visibleHints[idx] && activeQuestion.hints?.[idx] && isAuthorMode && (
                      <div onClick={(e) => e.stopPropagation()} className="mt-1.5 px-2.5 py-2 bg-gray-100 border-l-[3px] border-l-accent rounded text-[0.72rem] text-gray-800">
                        <span className="font-bold block text-accent">HINT:</span>{activeQuestion.hints[idx]}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === "solution" && (
          <div className="flex flex-col">
            <div className="flex border-b border-gray-200 mb-3 gap-3">
              {[
                { id: "html", label: "index.html" },
                { id: "css", label: "style.css" },
                { id: "js", label: "index.js" }
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSolutionLang(lang.id)}
                  className={`bg-transparent border-none cursor-pointer text-xs px-0.5 py-1.5 ${
                    solutionLang === lang.id
                      ? "text-accent font-bold border-b-2 border-b-accent"
                      : "text-gray-500 font-medium border-b-0"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="bg-zinc-100 border border-zinc-200 rounded-md p-3 font-[family-name:var(--font-family-code)] text-[0.76rem] overflow-x-auto whitespace-pre-wrap text-gray-800 max-h-[400px]">
                {solutionLang === "html" ? activeQuestion.solutionHtml : solutionLang === "css" ? activeQuestion.solutionCss : activeQuestion.solutionJs}
              </pre>
              <button
                onClick={() => {
                  const txt = solutionLang === "html" ? activeQuestion.solutionHtml : solutionLang === "css" ? activeQuestion.solutionCss : activeQuestion.solutionJs;
                  navigator.clipboard.writeText(txt);
                  alert("Solution code copied to clipboard!");
                }}
                className="absolute top-2 right-2 px-2 py-1 text-[0.65rem] bg-white/80 border border-zinc-300 rounded cursor-pointer font-semibold"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="flex flex-col gap-3 h-full">
            <p className="text-xs text-gray-500 italic">
              Your notes are saved automatically to the browser's local storage.
            </p>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Write your notes or scratchpad items here..."
              className="w-full h-[280px] border border-slate-300 rounded-lg p-3 text-[0.8rem] font-[family-name:var(--font-family-ui)] outline-none resize-y leading-relaxed"
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default ChallengeSidebar;
