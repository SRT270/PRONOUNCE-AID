import "./global.css";

import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import Games from "./pages/Games";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SoundMatchGame from "./pages/SoundMatchGame";
import RepeatRaceGame from "./pages/RepeatRaceGame";
import MysteryWordGame from "./pages/MysteryWordGame";
import SpellingLearningGame from "./pages/SpellingLearningGame";
import { AudioAssistProvider, useAudioAssist } from "@/hooks/useAudioAssist";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function Header() {
  const { enabled, toggle } = useAudioAssist();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 rounded-md border" onClick={() => setOpen((v) => !v)} aria-label="Open menu">☰</button>
          <a href="https://ab2855b806d147eab3e9d0d7f96ba315-0b4817d522b64b138031d9192.fly.dev/" className="flex items-center gap-3 font-extrabold text-xl">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F080cf57573a24379b69ef19b0ad23723%2Fad41e765bc2c4c1e9957e9c73ab25318" alt="Pronounce Aid logo" loading="lazy" className="w-16 h-16" />
            <span>Pronounce Aid</span>
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-3" aria-label="Primary">
          <Link to="/" className={location.pathname === '/' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Home</Link>
          <Link to="/practice" className={location.pathname === '/practice' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Practice</Link>
          <Link to="/games" className={location.pathname === '/games' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Games</Link>
          <Link to="/progress" className={location.pathname === '/progress' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Progress</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Teacher/Parent</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold' : 'px-3 py-2 rounded-md hover:bg-muted'}>Settings</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button aria-pressed={enabled} onClick={toggle} className={`text-sm px-3 py-1.5 rounded-full border ${enabled ? "bg-primary text-primary-foreground" : "bg-background"}`}>
            {enabled ? "Audio: On" : "Audio: Off"}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-primary hover:underline hidden md:inline">Sign in</Link>
          )}
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Home</Link>
            <Link to="/practice" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Practice</Link>
            <Link to="/games" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Games</Link>
            <Link to="/progress" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Progress</Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Teacher/Parent</Link>
            <Link to="/settings" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Settings</Link>
            {!user && <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md">Sign in</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <footer className="mt-16 py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Pronounce Aid</footer>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AudioAssistProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/games" element={<Games />} />
                <Route path="/games/sound-match" element={<SoundMatchGame />} />
                <Route path="/games/repeat-race" element={<RepeatRaceGame />} />
                <Route path="/games/mystery-word" element={<MysteryWordGame />} />
                <Route path="/games/spelling-learning" element={<SpellingLearningGame />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AudioAssistProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
