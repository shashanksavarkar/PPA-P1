import { useState, useEffect } from "react";
import { getSession, setSession } from "../utils/storage";

export const useTimer = () => {
  const [timeSpent, setTimeSpent] = useState(() => getSession("ppa_practice_time_spent", 0));
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimeSpent(prev => {
        const next = prev + 1;
        setSession("ppa_practice_time_spent", next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const resetTimer = () => {
    setTimeSpent(0);
    setSession("ppa_practice_time_spent", 0);
  };

  return {
    timeSpent,
    timerRunning,
    setTimerRunning,
    resetTimer
  };
};
