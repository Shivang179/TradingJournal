import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import Sidebar from "../component/Sidebar";
import AnalyticsClient from "../component/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/");
  }

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .order("trade_date", { ascending: true })
    .order("entry_time", { ascending: true });

  if (error) {
    console.error("Error fetching analytics trades:", error);
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-zinc-950">
        <AnalyticsClient trades={trades ?? []} />
      </main>
    </div>
  );
}