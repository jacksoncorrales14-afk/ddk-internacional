"use client";

import { useState, ReactNode } from "react";

interface AcordeonPuestoProps {
  titulo: string;
  subtitulo?: string;
  stats?: { label: string; value: string | number; color?: string }[];
  color?: "primary" | "green" | "amber" | "red";
  children: ReactNode;
  defaultOpen?: boolean;
}

const COLORES = {
  primary: { header: "bg-primary-600", accent: "text-primary-100" },
  green: { header: "bg-green-600", accent: "text-green-100" },
  amber: { header: "bg-amber-500", accent: "text-amber-50" },
  red: { header: "bg-red-600", accent: "text-red-100" },
};

export default function AcordeonPuesto({
  titulo,
  subtitulo,
  stats,
  color = "primary",
  children,
  defaultOpen = false,
}: AcordeonPuestoProps) {
  const [open, setOpen] = useState(defaultOpen);
  const c = COLORES[color];

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between ${c.header} px-5 py-4 text-left text-white transition-colors hover:brightness-110`}
      >
        <div className="flex-1">
          <h3 className="text-base font-bold">{titulo}</h3>
          {subtitulo && <p className={`mt-0.5 text-xs ${c.accent}`}>{subtitulo}</p>}
        </div>

        {stats && stats.length > 0 && (
          <div className="hidden items-center gap-6 pr-4 sm:flex">
            {stats.map((s, i) => (
              <div key={i} className="text-right">
                <p className="text-2xl font-bold leading-tight">{s.value}</p>
                <p className={`text-[10px] uppercase tracking-wide ${c.accent}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <svg
          className={`h-5 w-5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 sm:hidden">
          {stats.map((s, i) => (
            <div key={i} className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
              <p className="text-[10px] uppercase text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {open && <div className="animate-in fade-in">{children}</div>}
    </div>
  );
}
