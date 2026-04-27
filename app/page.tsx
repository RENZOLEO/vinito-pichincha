import Image from "next/image";
import Link from "next/link";

const options = [
  { href: "/carta?s=vinos", label: "Vinos", icon: "🍷" },
  { href: "/carta?s=platos", label: "Menú", icon: "🍽️" },
  { href: "/carta?s=tragos", label: "Tragos", icon: "🍸" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-vinito-cream flex flex-col">
      {/* Header — same as carta */}
      <header>
        <div className="bg-vinito-red text-vinito-cream text-[10px] tracking-[3px] uppercase text-center py-2 font-medium">
          JUJUY 2248 · PICHINCHA · ROSARIO
        </div>
        <div className="flex justify-center py-6">
          <Image
            src="/logo-vinito-pichincha.png"
            alt="VINITO Pichincha"
            width={220}
            height={100}
            priority
            className="h-20 w-auto"
          />
        </div>
        <div
          className="h-2.5 opacity-25"
          style={{
            backgroundImage: [
              "linear-gradient(45deg, #C54329 25%, transparent 25%)",
              "linear-gradient(-45deg, #C54329 25%, transparent 25%)",
              "linear-gradient(45deg, transparent 75%, #C54329 75%)",
              "linear-gradient(-45deg, transparent 75%, #C54329 75%)",
            ].join(", "),
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        />
      </header>

      {/* Options */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-md mx-auto w-full gap-4">
        {options.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="w-full flex items-center gap-4 bg-white border border-vinito-black rounded-xl px-6 py-5 hover:bg-vinito-black hover:text-vinito-cream transition-colors group"
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-sm font-medium uppercase tracking-[3px] group-hover:text-vinito-cream">
              {label}
            </span>
          </Link>
        ))}
      </div>

    </main>
  );
}
