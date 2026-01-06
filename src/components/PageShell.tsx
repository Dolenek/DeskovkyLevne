import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

export const PageShell = ({ children }: PageShellProps) => (
  <div className="relative min-h-screen bg-background text-ink">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 right-[-10%] h-72 w-72 animate-pulse-soft rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute top-[20%] left-[-12%] h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[20%] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_60%)] opacity-70" />
    </div>
    <div className="relative">{children}</div>
  </div>
);
