"use client";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-vinito-cream/60 hover:text-vinito-red text-[10px] uppercase tracking-wide transition-colors"
    >
      Salir
    </button>
  );
}
