import { CheckCircle2, Plus, Trash2, HelpCircle } from "lucide-react";

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
    <div className="creator-glass-card p-6 flex flex-col gap-5">
      <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-accent" />
          <span className="text-[0.85rem] font-bold text-text-primary">
            Assessment Checkpoints (Verification Rules)
          </span>
        </div>
        <button 
          onClick={addCheckpoint} 
          className="btn-minimal border-accent text-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded-lg text-[0.72rem] font-bold flex items-center gap-1 transition-all duration-150"
        >
          <Plus size={14} /> 
          <span>Add Checkpoint</span>
        </button>
      </div>

      <div className="timeline-container">
        <div className="flex flex-col gap-0 max-h-[380px] overflow-y-auto pl-1 pr-2 scrollbar">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4.5 items-stretch relative min-h-0">
              
              {/* Left Column: Timeline badge and track segment */}
              <div className="flex flex-col items-center shrink-0 w-8">
                {/* Timeline badge */}
                <div className="timeline-step-badge">
                  {idx + 1}
                </div>
                {/* Connecting vertical segment line */}
                {idx < steps.length - 1 ? (
                  <div className="timeline-track-segment"></div>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>

              {/* Right Column: Step details card */}
              <div className="timeline-step-card grow mb-4">
                {/* Task name & delete */}
                <div className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={step.task} 
                    onChange={e => updateStepField(idx, "task", e.target.value)} 
                    className="creator-input-text-sec font-bold text-[0.8rem] grow" 
                    placeholder="e.g. Verify that a button with id 'increment-btn' is created" 
                  />
                  <button 
                    onClick={() => removeCheckpoint(idx)} 
                    className="border-none bg-transparent text-neon-red cursor-pointer opacity-60 p-1.5 hover:opacity-100 hover:bg-rose-50 rounded-lg transition-all duration-150"
                    title="Remove Checkpoint"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Checkpoint criteria dropdowns & inputs */}
                <div className="grid grid-cols-4 gap-3 text-[0.72rem] mt-3 border-t border-black/5 pt-3.5">
                  
                  {/* Criteria Type */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider">CRITERIA TYPE</span>
                    <select 
                      value={step.type} 
                      onChange={e => updateStepField(idx, "type", e.target.value)} 
                      className="creator-select py-1.5 px-2 bg-white"
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

                  {/* Element Type (conditional) */}
                  {["TAG_EXISTS", "TEXT_EQUALS", "TEXT_CONTAINS", "CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                    <>
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider">ELEMENT TYPE</span>
                        <select 
                          value={step.elType} 
                          onChange={e => updateStepField(idx, "elType", e.target.value)} 
                          className="creator-select py-1.5 px-2 bg-white"
                        >
                          <option value="button">Button</option>
                          <option value="heading">Heading (h1)</option>
                          <option value="input">Input</option>
                          <option value="div">Div / Box</option>
                          <option value="custom">Custom Selector</option>
                        </select>
                      </div>
                      
                      {/* ID / Selector */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider">ID / SELECTOR</span>
                        <input 
                          type="text" 
                          value={step.elId || ""} 
                          onChange={e => updateStepField(idx, "elId", e.target.value)} 
                          placeholder="e.g. counter" 
                          className="creator-input-small w-full text-[0.76rem] py-1.5 px-2.5" 
                        />
                      </div>
                    </>
                  )}

                  {/* Target Element (conditional) */}
                  {["CLICK_AND_ASSERT", "INPUT_AND_ASSERT"].includes(step.type) && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider">TARGET ELEMENT ID</span>
                      <input 
                        type="text" 
                        value={step.targetId || ""} 
                        onChange={e => updateStepField(idx, "targetId", e.target.value)} 
                        placeholder="e.g. result" 
                        className="creator-input-small w-full text-[0.76rem] py-1.5 px-2.5" 
                      />
                    </div>
                  )}

                  {/* Expected Value (conditional) */}
                  {step.type !== "CONSOLE_NO_ERRORS" && step.type !== "TAG_EXISTS" && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider">EXPECTED VALUE</span>
                      <input 
                        type="text" 
                        value={step.value || ""} 
                        onChange={e => updateStepField(idx, "value", e.target.value)} 
                        placeholder="e.g. 1" 
                        className="creator-input-small w-full text-[0.76rem] py-1.5 px-2.5" 
                      />
                    </div>
                  )}

                  {/* Advanced failures message trigger */}
                  <div className="col-span-4 flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setAdvancedSteps(p => ({ ...p, [idx]: !p[idx] }))} 
                      className="border-none bg-transparent underline text-text-secondary cursor-pointer text-[0.68rem] font-bold hover:text-text-primary transition-colors mt-2"
                    >
                      {advancedSteps[idx] ? "Hide Custom Fail Message" : "Add Custom Fail Message"}
                    </button>
                  </div>
                </div>

                {/* Advanced Custom Failure Message Field */}
                {advancedSteps[idx] && (
                  <div className="flex flex-col gap-1 mt-3.5 bg-bg-primary/50 p-3 rounded-lg border border-dashed border-border animate-[slideIn_0.15s_ease]">
                    <span className="text-[0.62rem] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle size={10} />
                      <span>CUSTOM FAILURE MESSAGE</span>
                    </span>
                    <input 
                      type="text" 
                      value={step.errorMessage || ""} 
                      onChange={e => updateStepField(idx, "errorMessage", e.target.value)} 
                      className="creator-input-text-sec text-[0.75rem] py-1.5 px-2.5" 
                      placeholder="Optional error text shown to students if checkpoint fails..." 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentCheckpoints;
