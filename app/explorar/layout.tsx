import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { PublicNav } from "@/components/PublicNav";

export default async function ExplorarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Explorar es publico a proposito: se puede navegar sin sesion.
  // Cualquier accion real (reservar, comprar, etc.) exige login en su propia ruta.
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PublicNav />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar name={session.name} email={session.email || ""} role={session.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header name={session.name} />

        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
