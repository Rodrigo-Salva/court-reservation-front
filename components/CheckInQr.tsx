"use client";

import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

export function CheckInQr({ code, bookingId }: { code?: string; bookingId: number }) {
  if (!code) return null;
  return <details className="relative w-full sm:w-auto"><summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-secondary"><QrCode size={15}/> Ver QR</summary><div className="absolute right-0 z-10 mt-2 rounded-2xl border border-border bg-card p-4 text-center shadow-xl"><QRCodeSVG value={code} size={160} level="M" includeMargin/><p className="mt-2 text-[10px] text-muted-foreground">Reserva #{bookingId}</p><code className="mt-1 block max-w-40 break-all text-[10px]">{code}</code></div></details>;
}
