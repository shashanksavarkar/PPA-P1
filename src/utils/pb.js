import PocketBase from 'pocketbase';
import DEFAULT_QUESTIONS from '../constants/challenges.json';

// Initialize PocketBase client using environment variable or fallback to local port 8090
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Local storage key for offline syncing
const LOCAL_STORAGE_KEY = 'ppa_custom_challenges';

// Helper to check if PocketBase is online and reachable
export const isPocketBaseOnline = async () => {
  try {
    await pb.send('/api/health', {});
    return true;
  } catch (error) {
    return false;
  }
};

// Fetch all challenges from PocketBase (falling back to localStorage if offline)
export const getChallenges = async () => {
  const isOnline = await isPocketBaseOnline();
  if (isOnline) {
    try {
      let records = await pb.collection('challenges').getFullList({
        sort: 'created',
      });
      
      // Auto-seeding: If PocketBase is online but blank, seed it with default questions
      if (records.length === 0) {
        console.info("PocketBase 'challenges' collection is empty. Seeding defaults...");
        for (const q of DEFAULT_QUESTIONS) {
          const payload = {
            title: q.title,
            difficulty: q.difficulty,
            type: q.type,
            duration: q.duration,
            topics: q.topics,
            companies: q.companies,
            description: q.description,
            changesToBeDone: q.changesToBeDone,
            hints: q.hints,
            rules: q.rules,
            initialHtml: q.initialHtml,
            initialCss: q.initialCss,
            initialJs: q.initialJs,
            solutionHtml: q.solutionHtml,
            solutionCss: q.solutionCss,
            solutionJs: q.solutionJs,
            env: q.env || 'web',
          };
          try {
            await pb.collection('challenges').create(payload);
          } catch (createErr) {
            console.error("Failed to seed challenge:", q.title, createErr);
          }
        }
        // Fetch the seeded records
        records = await pb.collection('challenges').getFullList({
          sort: 'created',
        });
      }

      // Map pocketbase schema back to application state challenge properties
      return records.map(r => ({
        id: r.id,
        dbId: r.id,
        env: r.env || 'web',
        title: r.title,
        difficulty: r.difficulty,
        type: r.type,
        duration: r.duration,
        topics: r.topics || [],
        companies: r.companies || [],
        description: r.description,
        changesToBeDone: r.changesToBeDone || [],
        hints: r.hints || [],
        rules: r.rules || [],
        initialHtml: r.initialHtml || '',
        initialCss: r.initialCss || '',
        initialJs: r.initialJs || '',
        solutionHtml: r.solutionHtml || '',
        solutionCss: r.solutionCss || '',
        solutionJs: r.solutionJs || '',
      }));
    } catch (e) {
      console.warn("PocketBase fetch failed, falling back to local storage:", e);
    }
  }

  // Offline Fallback
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
  } catch {
    return DEFAULT_QUESTIONS;
  }
};

// Save a challenge (updates/creates in PocketBase if online and always updates local storage)
export const saveChallenge = async (q) => {
  const isOnline = await isPocketBaseOnline();
  
  const payload = {
    title: q.title,
    difficulty: q.difficulty,
    type: q.type,
    duration: q.duration,
    topics: q.topics,
    companies: q.companies,
    description: q.description,
    changesToBeDone: q.changesToBeDone,
    hints: q.hints,
    rules: q.rules,
    initialHtml: q.initialHtml,
    initialCss: q.initialCss,
    initialJs: q.initialJs,
    solutionHtml: q.solutionHtml,
    solutionCss: q.solutionCss,
    solutionJs: q.solutionJs,
    env: q.env || 'web',
  };

  let savedRecord = null;

  if (isOnline) {
    try {
      // Detect if ID is a valid PocketBase ID format (15 characters alphanumeric)
      const isPocketBaseId = q.id && q.id.length === 15 && /^[a-z0-9]+$/i.test(q.id);
      
      if (isPocketBaseId) {
        savedRecord = await pb.collection('challenges').update(q.id, payload);
      } else {
        savedRecord = await pb.collection('challenges').create(payload);
      }
    } catch (e) {
      console.error("Failed to save to PocketBase database:", e);
    }
  }

  // Sync to local storage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentQuestions = saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
    
    const mappedQ = savedRecord ? {
      ...q,
      id: savedRecord.id,
      dbId: savedRecord.id
    } : q;

    const exists = currentQuestions.some(x => x.id === q.id);
    const updatedQuestions = exists 
      ? currentQuestions.map(x => x.id === q.id ? mappedQ : x)
      : [...currentQuestions, mappedQ];

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedQuestions));
    return { success: true, question: mappedQ, online: !!savedRecord };
  } catch (e) {
    console.error("LocalStorage sync failed:", e);
    return { success: false, error: e.message };
  }
};

// Delete a challenge
export const deleteChallenge = async (id) => {
  const isOnline = await isPocketBaseOnline();
  const isPocketBaseId = id && id.length === 15 && /^[a-z0-9]+$/i.test(id);

  if (isOnline && isPocketBaseId) {
    try {
      await pb.collection('challenges').delete(id);
    } catch (e) {
      console.error("Failed to delete from PocketBase database:", e);
    }
  }

  // Sync delete locally
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const currentQuestions = JSON.parse(saved);
      const updated = currentQuestions.filter(x => x.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
