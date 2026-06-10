import { CheckCircle2, Plus, Trash2 } from "lucide-react";

const AssessmentCheckpoints = ({
  steps,
  onUpdateSteps,
  advancedSteps,
  setAdvancedSteps
}) => {
  const addCheckpoint = () => {
    const newSteps = [
      ...steps,
      { task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }
    ];
    onUpdateSteps(newSteps);
  };

  const removeCheckpoint = (idx) => {
    const newSteps = steps.filter((_, i) => i !== idx);
    onUpdateSteps(newSteps);
  };

  const updateStepField = (idx, field, val) => {
    const newSteps = [...steps];
    newSteps[idx] = { ...newSteps[idx], [field]: val };
    onUpdateSteps(newSteps);
  };

  return (
    <div className="creator-glass-card p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-accent" />
          <span className="text-[0.85rem] font-bold text-text-primary">
            Assessment Checkpoints (Verification Rules)
          </span>
        </div>
        <button 
          onClick={addCheckpoint} 
          className="bg-transparent border-none text-accent cursor-pointer text-[0.75rem] font-semibold flex items-center gap-1 hover:underline"
        >
          <Plus size={14} /> Add Checkpoint
        </button>
      </div>

      <div className="timeline-container">
        {steps.length > 0 && <div className="timeline-track"></div>}
        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pl-2.5 pr-1">
          {steps.map((step, idx) => (
            <div key={idx} className="timeline-step-card">
              <div className="timeline-step-badge">{idx + 1}</div>
              <div className="flex gap-2.5 items-center">
                <input 
                  type="text" 
                  value={step.task} 
                  onChange={e => updateStepField(idx, "task", e.target.value)} 
                  className="creator-input-text-sec font-semibold text-[0.78rem]" 
                  placeholder="e.g. Verify that a button with id 'increment-btn' is created" 
                />
                <button 
                  onClick={() => removeCheckpoint(idx)} 
                  className="border-none bg-transparent text-neon-red cursor-pointer opacity-70 p-1 hover:opacity-100 transition-opacity"
                  title="Remove Checkpoint"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex gap-2.5 flex-wrap items-center text-[0.72rem] mt-2.5 border-t border-black/5 pt-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.6rem] font-bold text-text-secondary">CRITERIA TYPE</span>
                  <select 
                    value={step.type} 
                    onChange={e => updateStepField(idx, "type", e.target.value)} 
                    className="creator-select text-[0.72rem] py-1 px-2"
                  >
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.6rem] font-bold text-text-secondary">ELEMENT TYPE</span>
                      <select 
                        value={step.elType} 
                        onChange={e => updateStepField(idx, "elType", e.target.value)} 
                        className="creator-select text-[0.72rem] py-1 px-2"
                      >
                        <option value="button">Button</option>
                        <option value="heading">Heading (h1)</option>
                        <option value="input">Input</option>
                        <option value="div">Div / Box</option>
                        <option value="custom">Custom Selector</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.6rem] font-bold text-text-secondary">ID / SELECTOR</span>
                      <input 
                        type="text" 
                        value={step.elId || ""} 
                        onChange={e => updateStepField(idx, "elId", e.target.value)} 
                        placeholder="e.g. counter" 
                        className="creator-input-small text-[0.72rem] py-1 px-2" 
                      />
                    </div>
                  </>
                )}

                {["CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.6rem] font-bold text-text-secondary">TARGET ELEMENT ID</span>
                    <input 
                      type="text" 
                      value={step.targetId || ""} 
                      onChange={e => updateStepField(idx, "targetId", e.target.value)} 
                      placeholder="e.g. result" 
                      className="creator-input-small text-[0.72rem] py-1 px-2" 
                    />
                  </div>
                )}

                {step.type !== "CONSOLE_NO_ERRORS" && step.type !== "TAG_EXISTS" && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.6rem] font-bold text-text-secondary">EXPECTED VALUE</span>
                    <input 
                      type="text" 
                      value={step.value || ""} 
                      onChange={e => updateStepField(idx, "value", e.target.value)} 
                      placeholder="e.g. 1" 
                      className="creator-input-small text-[0.72rem] py-1 px-2" 
                    />
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => setAdvancedSteps(p => ({ ...p, [idx]: !p[idx] }))} 
                  className="border-none bg-transparent underline text-text-secondary cursor-pointer ml-auto text-[0.65rem] font-semibold mt-2.5 hover:text-text-primary"
                >
                  {advancedSteps[idx] ? "Hide failure msg" : "Add failure msg"}
                </button>
              </div>

              {advancedSteps[idx] && (
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[0.6rem] font-bold text-text-secondary">CUSTOM FAILURE MESSAGE</span>
                  <input 
                    type="text" 
                    value={step.errorMessage || ""} 
                    onChange={e => updateStepField(idx, "errorMessage", e.target.value)} 
                    className="creator-input-text-sec text-[0.72rem] py-1 px-2" 
                    placeholder="Optional error text if checkpoint fails..." 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentCheckpoints;
