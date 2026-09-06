import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import Sidebar from "../component/Sidebar";
import TradesClient from "../component/TradesClient";

export default async function TradesPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/");
  }

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .order("trade_date", { ascending: false })
    .order("entry_time", { ascending: false });

  if (error) {
    console.error("Error fetching trades:", error);
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <TradesClient trades={trades ?? []} />
      </main>
    </div>
  );
}