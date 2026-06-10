import { useState } from "react";
import { Sparkles } from "lucide-react";
import CreatorWorkspace from "../components/CreatorWorkspace";
import DEFAULT_QUESTIONS from "../constants/challenges.json";

const CreatorPage = () => {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem("ppa_custom_challenges");
      return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
    } catch {
      return DEFAULT_QUESTIONS;
    }
  });

  const [toasts, setToasts] = useState([]);
  const [tabSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem("ppa_setting_tabsize") || "2", 10);
    } catch {
      return 2;
    }
  });

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      {/* Creator Specific Header */}
      <header className="modern-header creator-glass-header mb-5 px-6 shrink-0 h-[70px] flex items-center justify-between">
        <div className="header-title-container flex items-center gap-3">
          <div className="p-2.5 rounded-[10px] flex border" style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(99,102,241,0.15))",
            borderColor: "rgba(79,70,229,0.25)",
            boxShadow: "0 2px 8px rgba(79,70,229,0.1)"
          }}>
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-family-ui)] text-[1.15rem] font-extrabold m-0 tracking-tight"
              style={{ background: "linear-gradient(135deg, var(--color-text-primary), var(--color-accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ASSESSMENT CREATOR &amp; QUESTION MANAGER
            </h1>
            <p className="text-[0.75rem] text-text-secondary mt-0.5 font-medium">
              Build custom challenges, import text outlines, or manage questions in fullscreen
            </p>
          </div>
        </div>

        <button
          className="btn-minimal font-bold rounded-lg px-4 py-2 cursor-pointer"
          style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("mode");
            window.location.href = url.pathname + url.search;
          }}
          title="Return to Playground"
        >
          <span>Exit Creator &amp; Back to Playground</span>
        </button>
      </header>

      {/* Spacious Creator Panel Workspace */}
      <CreatorWorkspace
        questions={questions}
        setQuestions={setQuestions}
        showToast={showToast}
        tabSize={tabSize}
        activeIndex={null}
        loadQuestion={null}
      />

      {/* Floating Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type || "info"}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorPage;
