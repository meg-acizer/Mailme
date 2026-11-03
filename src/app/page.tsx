"use client";

import React, { useState, useEffect } from "react";
import { Workspace, type WorkspaceUser } from "@/components/workspace";
import { AuthView } from "@/components/auth-view";

const STORAGE_KEY = "mailme_session_user";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse saved session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: WorkspaceUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear session", e);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground text-xs font-mono">
        Cargando MailMe...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onSuccess={handleLoginSuccess} />;
  }

  return <Workspace user={currentUser} onLogout={handleLogout} />;
}
