import { useState, useEffect } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import CreatorWorkspace from "../components/CreatorWorkspace";
import DEFAULT_QUESTIONS from "../constants/challenges.json";
import { getChallenges } from "../utils/pb";

const CreatorPage = () => {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem("ppa_custom_challenges");
      const list = saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
      return list.filter(q => q.type !== 'MCQ' && q.type !== 'Coding' && q.id !== 'js-counter-app');
    } catch {
      return DEFAULT_QUESTIONS.filter(q => q.type !== 'MCQ' && q.type !== 'Coding' && q.id !== 'js-counter-app');
    }
  });

  useEffect(() => {
    const load = async () => {
      const data = await getChallenges();
      setQuestions(data);
    };
    load();
  }, []);

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
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Creator Header */}
      <header className="creator-glass-header px-8 shrink-0 h-[72px] flex items-center justify-between z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl flex border shadow-sm" style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(99,102,241,0.08))",
            borderColor: "rgba(79,70,229,0.15)",
          }}>
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-family-ui)] text-[1.2rem] font-[900] m-0 tracking-tight"
              style={{ background: "linear-gradient(135deg, #1e293b, var(--color-accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Challenge Creator
            </h1>
            <p className="text-[0.72rem] text-text-secondary mt-0.5 font-semibold">
              Design verification checks, edit initial boilerplates, or import outlines
            </p>
          </div>
        </div>

        <button
          className="btn-minimal font-bold rounded-xl px-4 py-2.5 cursor-pointer flex items-center gap-2 transition-all duration-200 border-accent text-accent hover:bg-accent hover:text-white"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("mode");
            window.location.href = url.pathname + url.search;
          }}
          title="Return to Playground"
        >
          <ArrowLeft size={15} />
          <span>Exit to Playground</span>
        </button>
      </header>

      {/* Spacious Creator Workspace Dashboard */}
      <main className="grow overflow-hidden flex flex-col min-h-0 pt-6">
        <CreatorWorkspace
          questions={questions}
          setQuestions={setQuestions}
          showToast={showToast}
          tabSize={tabSize}
          activeIndex={null}
          loadQuestion={null}
        />
      </main>

      {/* Toast System */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type || "info"} shadow-lg rounded-xl`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorPage;
