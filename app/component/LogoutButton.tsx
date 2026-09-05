"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-lg px-4 py-3 text-left text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
    >
      Logout
    </button>
  );
}