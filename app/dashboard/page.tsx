import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "../component/Sidebar";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-zinc-400">
          Welcome back, {data.claims.email}
        </p>
      </main>
    </div>
  );
}