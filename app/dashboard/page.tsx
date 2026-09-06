import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "../component/Sidebar";
import DashboardClient from "../component/DashboardClient";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/");
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayDate = new Date(`${today}T12:00:00Z`);

  const dayOfWeek = todayDate.getUTCDay();

  const daysSinceMonday =
    dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  todayDate.setUTCDate(
    todayDate.getUTCDate() - daysSinceMonday
  );

  const weekStart = todayDate
    .toISOString()
    .split("T")[0];

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .gte("trade_date", weekStart)
    .lte("trade_date", today)
    .order("trade_date", { ascending: false })
    .order("entry_time", { ascending: false });

  if (error) {
    console.error("Error fetching dashboard trades:", error);
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>

          <p className="mt-2 text-zinc-400">
            Review your trading performance and decisions.
          </p>
        </div>

        <DashboardClient
          trades={trades ?? []}
          today={today}
        />
      </main>
    </div>
  );
}