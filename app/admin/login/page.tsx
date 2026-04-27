"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vinito-cream">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg border border-vinito-black/10">
        <div className="flex justify-center mb-6">
          <Image src="/logo-vinito-pichincha.png" alt="VINITO" width={120} height={60} className="h-12 w-auto" />
        </div>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <label className="block text-xs uppercase tracking-wide mb-1 font-bold">Email</label>
        <input name="email" type="email" required className="w-full border border-vinito-black/20 rounded px-3 py-2 mb-4 text-sm" />

        <label className="block text-xs uppercase tracking-wide mb-1 font-bold">Contraseña</label>
        <input name="password" type="password" required className="w-full border border-vinito-black/20 rounded px-3 py-2 mb-6 text-sm" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-vinito-red text-vinito-cream py-2.5 rounded-full font-bold text-sm tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
