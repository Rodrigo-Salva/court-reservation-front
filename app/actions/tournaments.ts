"use server";
import { revalidatePath } from "next/cache"; import { redirect } from "next/navigation"; import { apiFetch, ApiError } from "@/lib/api"; import { getSession } from "@/lib/session";
async function admin(){const s=await getSession();if(!s)redirect("/login");if(!["ADMIN","SUPER_ADMIN","VENUE_ADMIN"].includes(s.role))redirect("/explorar");return s;}
export async function createTournament(f:FormData){const s=await admin();try{await apiFetch("/api/tournaments",{method:"POST",token:s.token,body:{name:String(f.get("name")).trim(),sportType:String(f.get("sportType")),startDate:String(f.get("startDate")),maxParticipants:Number(f.get("maxParticipants")),venueId:f.get("venueId")?Number(f.get("venueId")):undefined}})}catch(e){const m=e instanceof ApiError?e.message:"No se pudo crear el torneo";redirect(`/torneos?error=${encodeURIComponent(m)}`)}revalidatePath("/torneos");revalidatePath("/comunidad");redirect("/torneos?success=1")}
export async function generateFixtures(f:FormData){const s=await admin();const id=Number(f.get("id"));try{await apiFetch(`/api/tournaments/${id}/fixtures`,{method:"POST",token:s.token})}catch(e){const m=e instanceof ApiError?e.message:"No se pudieron generar fixtures";redirect(`/torneos?error=${encodeURIComponent(m)}`)}revalidatePath("/torneos");revalidatePath("/comunidad")}

export async function registerMatchResult(f: FormData) {
  const s = await admin();
  const tournamentId = Number(f.get("tournamentId"));
  const matchId = Number(f.get("matchId"));
  const scoreOne = Number(f.get("scoreOne"));
  const scoreTwo = Number(f.get("scoreTwo"));
  const back = `/torneos/${tournamentId}`;
  if (!tournamentId || !matchId || !Number.isInteger(scoreOne) || !Number.isInteger(scoreTwo) || scoreOne < 0 || scoreTwo < 0) {
    redirect(`${back}?error=${encodeURIComponent("Ingresa marcadores válidos")}`);
  }
  try {
    await apiFetch(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, { method: "PATCH", token: s.token, body: { scoreOne, scoreTwo } });
  } catch (e) {
    const m = e instanceof ApiError ? e.message : "No se pudo registrar el resultado";
    redirect(`${back}?error=${encodeURIComponent(m)}`);
  }
  revalidatePath(back);
  redirect(back);
}
