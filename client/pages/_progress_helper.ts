export function loadProgress(){
  const key = 'pa_progress_v1';
  try{
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
  }catch{}
  return { xp:0, level:1, attempts:0, correct:0, timeSpent:0, phonemes: {}, badges: [] };
}
