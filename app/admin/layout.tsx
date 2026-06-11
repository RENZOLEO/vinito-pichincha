import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = (session?.user as { role?: "ADMIN1" | "ADMIN2" } | undefined)?.role;
  const isAdmin1 = role === "ADMIN1";

  // Sin sesión = solo renderizar children (el middleware ya redirigió si era necesario)
 if (!session) {
  return <>{children}</>;
}

  return (
    <div className="min-h-screen bg-vinito-cream">
      <nav className="bg-vinito-black text-vinito-cream px-4 py-3 flex items-center justify-between">
        <a href="/admin" className="font-bold text-sm tracking-wide">VINITO Admin</a>
        <div className="flex gap-4 text-xs">
          <a href="/admin/wines" className="hover:text-vinito-red transition-colors">Vinos</a>
          <a href="/admin/dishes" className="hover:text-vinito-red transition-colors">Platos</a>
          <a href="/admin/drinks" className="hover:text-vinito-red transition-colors">Tragos</a>
          <a href="/admin/reservas" className="hover:text-vinito-red transition-colors">Reservas</a>
          {isAdmin1 && (
            <>
              <a href="/admin/import" className="hover:text-vinito-red transition-colors">Importar</a>
              <a href="/admin/stats" className="hover:text-vinito-red transition-colors">Estadísticas</a>
            </>
          )}
          <a href="/carta" className="hover:text-vinito-red transition-colors">Ver carta</a>
          <span className="text-vinito-cream/40">|</span>
          <span className="text-vinito-cream/60 text-[10px] uppercase tracking-wide">
            {session?.user?.name} ({role === "ADMIN1" ? "Socio" : role === "ADMIN2" ? "Operativo" : "—"})
          </span>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
    </div>
  );
}
