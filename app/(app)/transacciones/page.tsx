import { ConfirmButton } from "@/components/forms";
import { redirect } from "next/navigation";
import { Banknote, CreditCard, ReceiptText, Search, Smartphone, TrendingUp, Undo2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { refundPayment } from "@/app/actions/payments";
import { Pagination } from "@/components/Pagination";
import { Avatar, EmptyState, FilterTabs, Notice, PageHeader, StatCard, StatusPill, cardClass, inputClass, primaryButton, secondaryButton, type PillTone } from "@/components/ui";
import type { PaymentPageResponse, PaymentResponseDTO } from "@/lib/definitions";

const PAGE_SIZE = 10;
const STATUS_TONE: Record<PaymentResponseDTO["status"], PillTone> = { APROBADO: "success", RECHAZADO: "danger", REEMBOLSADO: "warning" };
const STATUS_TABS = [
  { label: "Todos", value: "" },
  { label: "Aprobados", value: "APROBADO" },
  { label: "Rechazados", value: "RECHAZADO" },
  { label: "Reembolsados", value: "REEMBOLSADO" },
] as const;
const METHOD: Record<PaymentResponseDTO["method"], { label: string; icon: typeof CreditCard }> = {
  TARJETA: { label: "Tarjeta", icon: CreditCard },
  YAPE_PLIN: { label: "Yape / Plin", icon: Smartphone },
  EFECTIVO: { label: "Efectivo", icon: Banknote },
};

const money = (value: number | undefined) => `S/ ${Number(value ?? 0).toFixed(2)}`;
const when = (value?: string) => value?.replace("T", " ").slice(0, 16) ?? "—";

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string; q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const { success, error, status, q, page } = await searchParams;

  const query = new URLSearchParams({ size: String(PAGE_SIZE), page: String(Math.max(0, Number(page) || 0)) });
  if (status) query.set("status", status);
  if (q?.trim()) query.set("q", q.trim());

  let result: PaymentPageResponse | null = null;
  let loadError = "";
  try {
    result = await apiFetch<PaymentPageResponse>(`/api/payments?${query}`, { token: session.token });
  } catch {
    loadError = "No se pudieron cargar las transacciones.";
  }
  const payments = result?.content ?? [];
  const tabHref = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q?.trim()) params.set("q", q.trim());
    const text = params.toString();
    return text ? `/transacciones?${text}` : "/transacciones";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Gestión" title="Transacciones" description="Consulta los pagos registrados, filtra por estado y reembolsa los aprobados." />

      {success && <Notice tone="success">Reembolso registrado correctamente.</Notice>}
      {(error || loadError) && <Notice tone="error">{error || loadError}</Notice>}

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen">
        <StatCard icon={ReceiptText} tone="slate" label="Transacciones" value={String(result?.totalElements ?? 0)} hint="con el filtro actual" />
        <StatCard icon={TrendingUp} tone="green" label="Cobrado" value={money(result?.approvedTotal)} hint="total de pagos aprobados" />
        <StatCard icon={Undo2} tone="amber" label="Reembolsado" value={money(result?.refundedTotal)} hint="total devuelto" />
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <FilterTabs items={STATUS_TABS.map((tab) => ({ label: tab.label, href: tabHref(tab.value), active: (status ?? "") === tab.value }))} />
          <form className="flex min-w-65 flex-1 gap-2 sm:max-w-md">
            {status && <input type="hidden" name="status" value={status} />}
            <label className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="q" defaultValue={q ?? ""} placeholder="Cliente, cancha u operación" aria-label="Buscar" className={`${inputClass} pl-9`} />
            </label>
            <button className={primaryButton}>Buscar</button>
          </form>
        </div>

        {payments.length === 0 ? (
          <div className="p-6"><EmptyState icon={ReceiptText} title="No hay transacciones" description="Prueba con otro estado o con otro texto de búsqueda." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-bold">Operación</th>
                  <th className="px-5 py-3 font-bold">Cliente</th>
                  <th className="px-5 py-3 font-bold">Cancha</th>
                  <th className="px-5 py-3 font-bold">Método</th>
                  <th className="px-5 py-3 text-right font-bold">Monto</th>
                  <th className="px-5 py-3 font-bold">Estado</th>
                  <th className="px-5 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => {
                  const method = METHOD[payment.method];
                  const MethodIcon = method.icon;
                  return (
                    <tr key={payment.id} className="transition hover:bg-secondary/40">
                      <td className="px-5 py-3.5">
                        <p className="whitespace-nowrap font-mono text-xs font-semibold">{payment.operationCode}</p>
                        <p className="whitespace-nowrap text-[11px] text-muted-foreground">{when(payment.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2.5"><Avatar name={payment.userName} /><span className="font-medium">{payment.userName ?? "—"}</span></span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{payment.courtName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><MethodIcon size={14} />{method.label}</span></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums">{money(payment.amount)}</td>
                      <td className="px-5 py-3.5"><StatusPill tone={STATUS_TONE[payment.status]}>{payment.status}</StatusPill></td>
                      <td className="px-5 py-3.5 text-right">
                        {payment.status === "APROBADO" && (
                          <form action={refundPayment}>
                            <input type="hidden" name="id" value={payment.id} />
                            <ConfirmButton message="Se reembolsará este pago al cliente. Esta acción no se puede deshacer." tone="danger" confirmLabel="Sí, reembolsar" className={secondaryButton}><Undo2 size={13} />Reembolsar</ConfirmButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {result && (
          <div className="border-t border-border p-4">
            <Pagination basePath="/transacciones" page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} params={{ status, q }} />
          </div>
        )}
      </section>
    </div>
  );
}
