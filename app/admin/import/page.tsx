import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ImportForm } from "@/components/admin/ImportForm";

export default async function ImportPage() {
  const session = await getSession();
  const role = (session?.user as { role?: "ADMIN1" | "ADMIN2" } | undefined)?.role;
  if (role !== "ADMIN1") redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-6">Importar</h1>
      <ImportForm />
    </div>
  );
}
