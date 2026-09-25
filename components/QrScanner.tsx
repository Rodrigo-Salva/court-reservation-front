"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
import { checkInByCode } from "@/app/actions/checkin";
import { extractCheckInCode } from "@/lib/checkinCode";

type ScanEntry = { id: number; ok: boolean; message: string };

const READER_ID = "checkin-qr-reader";
const REPEAT_WINDOW_MS = 4000;

function cameraErrorMessage(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  const text = String(error);
  if (name === "NotAllowedError" || /permission|denied/i.test(text)) return "Permite el acceso a la cámara en el navegador para escanear.";
  if (name === "NotFoundError" || /no camera|not found/i.test(text)) return "No se encontró ninguna cámara en este dispositivo.";
  if (typeof window !== "undefined" && !window.isSecureContext) return "La cámara solo funciona en HTTPS o en localhost.";
  return "No se pudo iniciar la cámara. Ingresa el código manualmente.";
}

/** Lector de QR con cámara para Recepción: cada código leído registra el check-in de inmediato. */
export function QrScanner() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const busy = useRef(false);
  const counter = useRef(0);

  const handleDecoded = useCallback((text: string) => {
    const code = extractCheckInCode(text);
    if (!code || busy.current) return;
    const now = Date.now();
    if (lastScan.current && lastScan.current.code === code && now - lastScan.current.at < REPEAT_WINDOW_MS) return;
    lastScan.current = { code, at: now };
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await checkInByCode(code);
        setEntries((current) => [{ id: ++counter.current, ...result }, ...current].slice(0, 5));
      } finally {
        busy.current = false;
      }
    });
  }, []);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* La cámara ya estaba detenida. */
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleDecoded,
          () => undefined,
        );
        if (cancelled) await stop();
      } catch (cause) {
        if (!cancelled) {
          setError(cameraErrorMessage(cause));
          setActive(false);
        }
        await stop();
      }
    })();
    return () => {
      cancelled = true;
      void stop();
    };
  }, [active, handleDecoded, stop]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Escanear QR con la cámara</h2>
          <p className="mt-1 text-sm text-muted-foreground">Apunta al QR de la reserva: el ingreso se registra al leerlo.</p>
        </div>
        <button
          type="button"
          onClick={() => { setError(""); setActive((value) => !value); }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${active ? "border border-border hover:bg-secondary" : "bg-primary text-primary-foreground"}`}
        >
          {active ? <><CameraOff size={16} /> Detener cámara</> : <><Camera size={16} /> Activar cámara</>}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <div id={READER_ID} className={active ? "mt-4 overflow-hidden rounded-xl bg-black" : "hidden"} />
      {active && pending && <p className="mt-3 text-xs text-muted-foreground">Registrando ingreso…</p>}

      {entries.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {entries.map((entry) => (
            <li key={entry.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${entry.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
              {entry.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
              <span>{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
