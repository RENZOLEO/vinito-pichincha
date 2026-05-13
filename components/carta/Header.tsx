import Image from "next/image";

export function Header() {
  return (
    <header>
      <div className="bg-vinito-red text-vinito-cream text-[10px] tracking-[3px] uppercase text-center py-2 font-medium">
        JUJUY 2248 · PICHINCHA · ROSARIO
      </div>
      <div className="flex justify-center py-4">
        <Image
          src="/03.png"
          alt="VINITO Pichincha"
          width={180}
          height={80}
          priority
          className="h-16 w-auto"
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
  );
}
