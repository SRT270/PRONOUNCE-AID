import React, { useEffect, useState } from "react";

export default function Settings(){
  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(() => {
    try{ return JSON.parse(localStorage.getItem('pa_dyslexia_font') || 'false'); }catch{return false}
  });
  const [dark, setDark] = useState<boolean>(()=>{
    try{ return JSON.parse(localStorage.getItem('pa_dark_mode') || 'false'); }catch{return false}
  });
  const [speechRate, setSpeechRate] = useState<number>(()=>{
    try{ return Number(localStorage.getItem('pa_speech_rate') || '0.95'); }catch{return 0.95}
  });

  useEffect(()=>{
    try{ localStorage.setItem('pa_dyslexia_font', JSON.stringify(dyslexiaFont)); }catch{}
    if(dyslexiaFont) document.documentElement.classList.add('lexend'); else document.documentElement.classList.remove('lexend');
  },[dyslexiaFont]);

  useEffect(()=>{
    try{ localStorage.setItem('pa_dark_mode', JSON.stringify(dark)); }catch{}
    if(dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  },[dark]);

  useEffect(()=>{
    try{ localStorage.setItem('pa_speech_rate', String(speechRate)); }catch{}
  },[speechRate]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize accessibility and audio options for your experience.</p>

        <section className="mt-6 card-soft p-6">
          <h2 className="font-semibold">Accessibility</h2>
          <div className="mt-4 grid gap-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Dyslexia-friendly font</div>
                <div className="text-sm text-muted-foreground">Use Lexend for improved readability</div>
              </div>
              <input type="checkbox" checked={dyslexiaFont} onChange={(e)=>setDyslexiaFont(e.target.checked)} aria-label="Enable dyslexia-friendly font" />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Dark mode</div>
                <div className="text-sm text-muted-foreground">Reduce glare for low-light environments</div>
              </div>
              <input type="checkbox" checked={dark} onChange={(e)=>setDark(e.target.checked)} aria-label="Toggle dark mode" />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Audio navigation</div>
                <div className="text-sm text-muted-foreground">Enable spoken hints and TTS navigation</div>
              </div>
              <input type="checkbox" checked={JSON.parse(localStorage.getItem('pa_audio_assist_v1')||'false')} onChange={(e)=>{ localStorage.setItem('pa_audio_assist_v1', JSON.stringify(e.target.checked)); window.location.reload(); }} aria-label="Toggle audio navigation" />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Speech rate: {speechRate.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Adjust how fast text-to-speech speaks (0.5 - 1.5)</div>
              </div>
              <input type="range" min={0.5} max={1.5} step={0.05} value={speechRate} onChange={(e)=>setSpeechRate(Number(e.target.value))} aria-label="Speech rate" />
            </label>
          </div>
        </section>

        <div className="mt-6 flex gap-3">
          <a className="px-4 py-2 rounded-md bg-primary text-primary-foreground" href="/">Back to Home</a>
        </div>
      </main>
    </div>
  );
}
