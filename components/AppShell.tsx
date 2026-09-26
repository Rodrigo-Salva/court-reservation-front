"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

/** Estructura de las pantallas con sesión: menú fijo en escritorio y cajón lateral en móvil. */
export function AppShell({ name, email, role, children }: { name: string; email: string; role: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar name={name} email={email} role={role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={name} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
