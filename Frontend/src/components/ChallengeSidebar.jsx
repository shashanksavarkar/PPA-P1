import { useEffect, useState } from "react";
import {
  BookOpen, CheckSquare, Check, XCircle, HelpCircle, FlaskConical
} from "lucide-react";

const formatCodeText = (text) => {
  if (!text) return "";
  // Match tag-like strings <...> or text inside single quotes '...'
  const parts = text.split(/(<[^>]+>|'[^']+')/g);
  return parts.map((part, index) => {
    const isTag = part.startsWith("<") && part.endsWith(">");
    const isQuote = part.startsWith("'") && part.endsWith("'");
    if (isTag || isQuote) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[0.74rem] text-gray-800 font-semibold mx-0.5 break-all"
        >
          {part}
        </code>
      );
    }
    return part;
  });
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
  totalQuestions = 1,
  expectedSrcDoc
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

            {/* Expected Output Section */}
            <div className="border-t border-gray-200/80 pt-5 mt-2">
              <h3 className="text-[0.9rem] font-bold text-gray-900 mb-3 tracking-wide">
                Expected Output:
              </h3>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-bg-primary">
                <iframe
                  srcDoc={expectedSrcDoc}
                  title="Expected Final Preview"
                  className="w-full h-[220px] border-none bg-white"
                  sandbox="allow-scripts"
                />
              </div>
            </div>

            {/* Tests Section */}
            {activeQuestion.changesToBeDone?.length > 0 && (
              <div className="border-t border-gray-200/80 pt-5 mt-2">
                <h3 className="text-[0.9rem] font-bold text-gray-900 mb-3 tracking-wide flex items-center gap-1.5">
                  <span>Tests:</span>
                </h3>
                <div className="flex flex-col gap-2.5">
                  {activeQuestion.changesToBeDone.map((change, idx) => {
                    const stepResult = validationResult?.stepResults?.[idx];
                    const hasRule = activeQuestion.rules?.some((r, rIdx) => (r.stepIndex ?? Math.min(rIdx, totalSteps - 1)) === idx);
                    const isPassed = hasRule ? stepResult?.success : validationResult?.success;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3.5 py-3.5 px-4 rounded-xl border transition-all duration-200 ${
                          isPassed
                            ? "bg-emerald-50/30 border-emerald-100/80 text-gray-700"
                            : "bg-slate-50/50 border-slate-100/70 text-slate-600"
                        }`}
                      >
                        {/* Beaker Circle Icon */}
                        <div
                          className={`flex items-center justify-center rounded-full shrink-0 w-7 h-7 border shadow-sm transition-all duration-200 ${
                            isPassed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-slate-300 text-slate-700"
                          }`}
                        >
                          {isPassed ? (
                            <Check size={14} className="stroke-[3]" />
                          ) : (
                            <FlaskConical size={13} className="stroke-[2.5]" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="text-[0.8rem] leading-relaxed font-medium">
                          {idx + 1}. {formatCodeText(change)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
