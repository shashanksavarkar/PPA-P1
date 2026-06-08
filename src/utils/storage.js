// Storage helpers shared across pages
const parse = (val) => {
  if (val === null) return undefined;
  try { return JSON.parse(val); } catch { return val === "true" ? true : val === "false" ? false : isNaN(val) ? val : parseFloat(val); }
};

export const getLocal  = (key, fallback) => { try { const v = localStorage.getItem(key);   return v !== null ? (parse(v) ?? fallback) : fallback; } catch { return fallback; } };
export const getSession = (key, fallback) => { try { const v = sessionStorage.getItem(key); return v !== null ? (parse(v) ?? fallback) : fallback; } catch { return fallback; } };
export const setLocal  = (key, val) => { try { localStorage.setItem(key,   typeof val === "object" ? JSON.stringify(val) : String(val)); } catch {} };
export const setSession = (key, val) => { try { sessionStorage.setItem(key, typeof val === "object" ? JSON.stringify(val) : String(val)); } catch {} };

export const formatTime = (s) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export const resolveVal = (valOrFn, currentVal) => typeof valOrFn === "function" ? valOrFn(currentVal) : valOrFn;

