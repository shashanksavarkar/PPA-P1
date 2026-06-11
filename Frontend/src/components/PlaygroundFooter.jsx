import { Timer as TimerIcon, RefreshCw, Play } from "lucide-react";
import { formatTime } from "../utils/storage";

const PlaygroundFooter = ({
  timerRunning,
  setTimerRunning,
  timeSpent,
  onResetCode,
  onRunCode
}) => {
  return (
    <footer className="h-[50px] bg-gray-900 border-t border-white/[0.08] flex items-center justify-between px-4 font-[family-name:var(--font-family-ui)] text-white shrink-0 select-none z-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTimerRunning(!timerRunning)}
          className="h-8 px-3.5 rounded-md bg-gray-800 border border-white/[0.08] flex items-center gap-2 cursor-pointer text-white text-[0.78rem] font-semibold"
          title={timerRunning ? "Pause timer" : "Start timer"}
        >
          <TimerIcon size={14} style={{ color: timerRunning ? "#10b981" : "#9ca3af" }} />
          <span style={{ color: timerRunning ? "#10b981" : "#ffffff", fontFamily: timerRunning ? "monospace" : "var(--font-family-ui)" }}>
            {timerRunning ? formatTime(timeSpent) : "Start Timer"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onResetCode}
          className="w-8 h-8 rounded-full bg-red-600 border-none flex items-center justify-center cursor-pointer text-white"
          title="Reset code"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={onRunCode}
          className="h-8 px-4 rounded-md bg-orange-600 border-none text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
          title="Run (Ctrl+S)"
        >
          <Play size={12} fill="#ffffff" /><span>Run</span>
        </button>
      </div>
    </footer>
  );
};

export default PlaygroundFooter;
