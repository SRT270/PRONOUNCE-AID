import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { speak } from "@/utils/speech";

type Ctx = {
  enabled: boolean;
  toggle: () => void;
  speakHint: (text: string) => void;
};

const AudioAssistContext = createContext<Ctx | null>(null);

export const AudioAssistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("pa_audio_assist_v1");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("pa_audio_assist_v1", JSON.stringify(enabled));
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((e) => !e), []);

  const speakHint = useCallback((text: string) => {
    if (!enabled) return;
    speak(text).catch(() => {});
  }, [enabled]);

  const value = useMemo(() => ({ enabled, toggle, speakHint }), [enabled, toggle, speakHint]);

  return <AudioAssistContext.Provider value={value}>{children}</AudioAssistContext.Provider>;
};

export const useAudioAssist = () => {
  const ctx = useContext(AudioAssistContext);
  if (!ctx) throw new Error("useAudioAssist must be used within AudioAssistProvider");
  return ctx;
};
