"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  link: string | null;
  leida: boolean;
  createdAt: string;
}

interface NotifResponse {
  items: Notificacion[];
  noLeidas: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function colorDot(tipo: string): string {
  if (tipo === "candidato_nuevo") return "bg-blue-500";
  if (tipo === "trabajador_creado") return "bg-green-500";
  if (tipo === "trabajador_ausente") return "bg-red-500";
  if (tipo === "ronda_incompleta") return "bg-amber-500";
  return "bg-gray-400";
}

export default function NotificacionesBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<NotifResponse>(
    "/api/admin/notificaciones",
    fetcher,
    { refreshInterval: 300000 }
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const noLeidas = data?.noLeidas || 0;

  async function marcarLeida(id: string) {
    await fetch("/api/admin/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  async function marcarTodas() {
    await fetch("/api/admin/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todas: true }),
    });
    mutate();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-primary-100 transition-colors hover:bg-primary-600 hover:text-white"
        aria-label="Notificaciones"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Marcar todas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!data?.items.length ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Sin notificaciones</p>
            ) : (
              data.items.map((n) => {
                const content = (
                  <div className="flex gap-3 px-4 py-3">
                    <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${colorDot(n.tipo)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.mensaje}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{tiempoRelativo(n.createdAt)}</p>
                    </div>
                    {!n.leida && <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                );
                const classes = `block border-b border-gray-50 transition-colors hover:bg-gray-50 ${n.leida ? "" : "bg-blue-50/40"}`;
                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        if (!n.leida) marcarLeida(n.id);
                        setOpen(false);
                      }}
                      className={classes}
                    >
                      {content}
                    </Link>
                  );
                }
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.leida && marcarLeida(n.id)}
                    className={`w-full text-left ${classes}`}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
