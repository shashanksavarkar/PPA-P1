import { useState } from "react";
import { Sparkles } from "lucide-react";
import CreatorWorkspace from "../components/CreatorWorkspace";
import DEFAULT_QUESTIONS from "../constants/challenges.json";

const CreatorPage = () => {
  // Questions database loaded from localStorage or challenges.json
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Creator Specific Header */}
      <header className="modern-header" style={{ marginBottom: "20px", flexShrink: 0 }}>
        <div className="header-title-container">
          <div style={{ padding: "8px", background: "rgba(79, 70, 229, 0.1)", borderRadius: "8px", display: "flex", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
            <Sparkles size={20} style={{ color: "var(--accent-color)" }} />
          </div>
          <div>
            <h1 className="font-ui" style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              ASSESSMENT CREATOR & QUESTION MANAGER
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1px" }}>
              Build custom challenges, import text outlines, or manage questions in fullscreen
            </p>
          </div>
        </div>
        
        <button 
          className="btn-minimal"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("mode");
            window.location.href = url.pathname + url.search;
          }}
          title="Return to Playground"
          style={{ fontWeight: 600, color: "var(--accent-color)", borderColor: "var(--accent-color)" }}
        >
          <span>Exit Creator & Back to Playground</span>
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

      {/* Floating Toast Notifications Container */}
      <div style={{
        position: "fixed",
        bottom: "35px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 99999,
        pointerEvents: "none"
      }}>
        {toasts.map(toast => {
          let bgColor = "rgba(59, 130, 246, 0.95)"; // info
          if (toast.type === "success") bgColor = "rgba(16, 185, 129, 0.95)";
          if (toast.type === "error") bgColor = "rgba(239, 68, 68, 0.95)";
          
          return (
            <div key={toast.id} style={{
              padding: "10px 16px",
              borderRadius: "6px",
              backgroundColor: bgColor,
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: "auto",
              animation: "slideIn 0.2s ease"
            }}>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreatorPage;
