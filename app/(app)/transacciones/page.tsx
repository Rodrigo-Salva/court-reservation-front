import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { refundPayment } from "@/app/actions/payments";
import { Pagination } from "@/components/Pagination";
import type { PaymentPageResponse, PaymentResponseDTO } from "@/lib/definitions";

const STATUS_STYLE: Record<PaymentResponseDTO["status"], string> = {
  APROBADO: "bg-emerald-100 text-emerald-700",
  RECHAZADO: "bg-red-100 text-red-700",
  REEMBOLSADO: "bg-amber-100 text-amber-700",
};
const STATUSES = ["APROBADO", "RECHAZADO", "REEMBOLSADO"] as const;

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string; q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const { success, error, status, q, page } = await searchParams;

  const query = new URLSearchParams({ size: "15", page: String(Math.max(0, Number(page) || 0)) });
  if (status) query.set("status", status);
  if (q?.trim()) query.set("q", q.trim());

  let result: PaymentPageResponse | null = null;
  let loadError = "";
  try {
    result = await apiFetch<PaymentPageResponse>(`/api/payments?${query}`, { token: session.token });
  } catch {
    loadError = "No se pudieron cargar las transacciones.";
  }
  const payments: PaymentResponseDTO[] = result?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Administración</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Transacciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consulta los pagos registrados y reembolsa los aprobados.</p>
      </div>

      {success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Reembolso registrado correctamente.</p>}
      {(error || loadError) && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error || loadError}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Transacciones (filtro actual)" value={String(result?.totalElements ?? 0)} />
        <Stat label="Cobrado total" value={`S/ ${Number(result?.approvedTotal ?? 0).toFixed(2)}`} />
        <Stat label="Reembolsado total" value={`S/ ${Number(result?.refundedTotal ?? 0).toFixed(2)}`} />
      </div>

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar por cliente, cancha u operación" className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Filtrar</button>
      </form>

      {payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No hay transacciones para mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Operación</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Cancha</th>
                <th className="px-4 py-3">Método</th><th className="px-4 py-3 text-right">Monto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2"><ReceiptText size={16} className="text-muted-foreground" /><span className="font-mono text-xs">{payment.operationCode}</span></div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{payment.createdAt?.replace("T", " ").slice(0, 16)}</p>
                  </td>
                  <td className="px-4 py-3">{payment.userName ?? "—"}</td>
                  <td className="px-4 py-3">{payment.courtName}</td>
                  <td className="px-4 py-3">{payment.method.replace("_", " / ")}</td>
                  <td className="px-4 py-3 text-right font-semibold">S/ {Number(payment.amount).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_STYLE[payment.status]}`}>{payment.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === "APROBADO" && (
                      <form action={refundPayment}>
                        <input type="hidden" name="id" value={payment.id} />
                        <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary">Reembolsar</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && <Pagination basePath="/transacciones" page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} params={{ status, q }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
