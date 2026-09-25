import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const FORMATS = ["csv", "xlsx", "pdf"];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) return new Response("No autorizado", { status: 401 });
  const params = request.nextUrl.searchParams;
  const format = params.get("format") ?? "csv";
  if (!FORMATS.includes(format)) return new Response("Formato no soportado", { status: 400 });

  const query = new URLSearchParams({ startDate: params.get("from") ?? "", endDate: params.get("to") ?? "", format });
  for (const key of ["venueId", "courtId", "sportType"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  const response = await fetch(`${process.env.API_URL ?? "http://localhost:8080"}/api/reports/operational/export?${query}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename=reporte-operativo.${format}`,
    },
  });
}
