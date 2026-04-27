import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [total, available, unavailable, byCategory] = await Promise.all([
    prisma.wine.count(),
    prisma.wine.count({ where: { available: true } }),
    prisma.wine.count({ where: { available: false } }),
    prisma.wine.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-vinito-black/10 text-center">
          <p className="text-3xl font-bold text-vinito-black">{total}</p>
          <p className="text-xs uppercase tracking-wide text-vinito-black/50 mt-1">Total</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-vinito-black/10 text-center">
          <p className="text-3xl font-bold text-green-600">{available}</p>
          <p className="text-xs uppercase tracking-wide text-vinito-black/50 mt-1">Disponibles</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-vinito-black/10 text-center">
          <p className="text-3xl font-bold text-vinito-red">{unavailable}</p>
          <p className="text-xs uppercase tracking-wide text-vinito-black/50 mt-1">Agotados</p>
        </div>
      </div>

      <h2 className="font-bold text-sm uppercase tracking-wide mb-3">Por categoría</h2>
      <div className="grid grid-cols-5 gap-2">
        {byCategory.map((c) => (
          <div key={c.category} className="bg-white p-3 rounded-lg border border-vinito-black/10 text-center">
            <p className="text-xl font-bold">{c._count}</p>
            <p className="text-[10px] uppercase tracking-wide text-vinito-black/50">{c.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
