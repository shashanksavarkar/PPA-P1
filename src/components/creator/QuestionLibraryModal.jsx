import { Search, Plus, Trash2 } from "lucide-react";

const QuestionLibraryModal = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredQuestions,
  questions,
  formId,
  onEditChallenge,
  onDeleteChallenge,
  onLoadBlankPreset
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content w-[550px] max-w-[90vw] max-h-[80vh] p-6 flex flex-col gap-4 bg-white rounded-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h2 className="text-[1.2rem] font-bold m-0 text-text-primary">Question Library</h2>
          <button 
            onClick={onClose} 
            className="bg-transparent border-none text-[1.2rem] cursor-pointer text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Top Search & Create Bar inside Modal */}
        <div className="flex gap-3 items-center">
          <div className="relative grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="creator-search-input pl-9"
            />
          </div>
          <button 
            onClick={() => {
              onLoadBlankPreset();
              onClose();
            }} 
            className="btn-minimal creator-btn-gradient px-4 py-2.5 flex items-center gap-2 rounded-lg shrink-0"
          >
            <Plus size={16} />
            <span>New Question</span>
          </button>
        </div>

        {/* Question Cards List */}
        <div className="grow overflow-y-auto flex flex-col gap-2.5 pr-1">
          <span className="text-[0.7rem] font-bold text-text-secondary tracking-wider mb-1">
            AVAILABLE QUESTIONS ({filteredQuestions.length})
          </span>
          {filteredQuestions.length === 0 ? (
            <div className="text-center p-5 text-text-secondary text-[0.82rem]">
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
                    onEditChallenge(q);
                    onClose();
                  }} 
                  className={`creator-sidebar-card cursor-pointer ${formId === q.id ? "active" : ""}`}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="font-semibold text-[0.78rem] line-clamp-2 grow text-text-primary">
                      {originalIndex + 1}. {q.title}
                    </span>
                    <button 
                      onClick={(e) => onDeleteChallenge(q.id, e)} 
                      className="bg-transparent border-none text-neon-red cursor-pointer flex opacity-60 p-0.5 hover:opacity-100 transition-opacity"
                      title="Delete Challenge"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`challenge-difficulty ${difficultyLower} text-[0.6rem]`}>
                      {q.difficulty || "Easy"}
                    </span>
                    <span className="text-[0.62rem] text-text-secondary">
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
  );
};

export default QuestionLibraryModal;
