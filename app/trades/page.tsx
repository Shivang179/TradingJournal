import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "../component/Sidebar";
import TradesClient from "../component/TradesClient";
import TradeActions from "../component/TradeActions";

export default async function TradesPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/");
  }

  // Fetch this user's trades
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .order("trade_date", { ascending: false });

  if (error) {
    console.error("Error fetching trades:", error);
  }

  const tradeList = trades ?? [];

  // Basic statistics
  const totalTrades = tradeList.length;

  const totalPnL = tradeList.reduce(
    (sum, trade) => sum + Number(trade.pnl ?? 0),
    0
  );

  const winningTrades = tradeList.filter(
    (trade) => Number(trade.pnl ?? 0) > 0
  ).length;

  const winRate =
    totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const avgRR =
    totalTrades > 0
      ? tradeList.reduce(
          (sum, trade) => sum + Number(trade.risk_reward ?? 0),
          0
        ) / totalTrades
      : 0;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Trades
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              View and manage your trading history.
            </p>
          </div>

          <TradesClient />
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <StatCard
            title="Total P/L"
            value={`₹${totalPnL.toFixed(2)}`}
          />

          <StatCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
          />

          <StatCard
            title="Avg R/R"
            value={avgRR.toFixed(2)}
          />

          <StatCard
            title="Total Trades"
            value={totalTrades.toString()}
          />
        </div>

        {/* Trades table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="font-semibold text-white">
              Trade History
            </h2>
          </div>

          {tradeList.length === 0 ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-400">
                  No trades yet.
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Add your first trade to start tracking your
                  performance.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Side</th>
                    <th className="px-6 py-4">Entry</th>
                    <th className="px-6 py-4">Exit</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">P/L</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {tradeList.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {trade.symbol}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        {trade.side}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        ₹
                        {Number(
                          trade.entry_price ?? 0
                        ).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        ₹
                        {Number(
                          trade.exit_price ?? 0
                        ).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        {trade.quantity}
                      </td>

                      <td
                        className={`px-6 py-4 font-medium ${
                          Number(trade.pnl ?? 0) > 0
                            ? "text-green-500"
                            : Number(trade.pnl ?? 0) < 0
                              ? "text-red-500"
                              : "text-zinc-400"
                        }`}
                      >
                        ₹
                        {Number(
                          trade.pnl ?? 0
                        ).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-zinc-500">
                        {trade.trade_date}
                      </td>

                      <td className="px-6 py-4">
                        <TradeActions trade={trade} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}