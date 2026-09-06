"use client";

import { useMemo, useState } from "react";
import AddTradeModal from "./AddTradeModal";
import TradeActions from "./TradeActions";

type Trade = {
  id: string;
  trade_date: string;
  symbol: string;
  asset_type: string;
  side: string;
  option_type?: string | null;
  strike_price?: number | null;
  expiry_date?: string | null;
  is_expiry?: boolean | null;
  quantity?: number | null;
  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  target_price?: number | null;
  brokerage?: number | null;
  entry_time?: string | null;
  exit_time?: string | null;
  pnl?: number | null;
  pnl_percentage?: number | null;
  risk_reward?: number | null;
  strategy?: string | null;
  followed_rules?: boolean | null;
  notes?: string | null;
};

type TradesClientProps = {
  trades: Trade[];
};

type PeriodFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";
type ResultFilter = "ALL" | "WINNING" | "LOSING";

function getTodayIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getWeekStart(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay();

  const daysSinceMonday = day === 0 ? 6 : day - 1;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday);

  return date.toISOString().split("T")[0];
}

function getMonthStart(dateString: string) {
  return `${dateString.slice(0, 7)}-01`;
}

function formatMoney(value: number | null | undefined) {
  const amount = Number(value ?? 0);

  return `₹${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 4,
  });
}

function formatDate(dateString: string) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timestamp: string | null | undefined) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function getAssetName(trade: Trade) {
  if (trade.asset_type !== "OPTION") {
    return trade.symbol;
  }

  const optionDetails = [
    trade.option_type,
    trade.strike_price !== null && trade.strike_price !== undefined
      ? formatPrice(trade.strike_price)
      : null,
  ].filter(Boolean);

  if (optionDetails.length === 0) {
    return trade.symbol;
  }

  return `${trade.symbol} ${optionDetails.join(" ")}`;
}

function getSideClass(side: string) {
  return side === "LONG"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";
}

export default function TradesClient({ trades }: TradesClientProps) {
  const [showAddTrade, setShowAddTrade] = useState(false);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("ALL");
  const [result, setResult] = useState<ResultFilter>("ALL");

  const today = getTodayIndia();

  const filteredTrades = useMemo(() => {
    const weekStart = getWeekStart(today);
    const monthStart = getMonthStart(today);

    const searchValue = search.trim().toLowerCase();

    return [...trades]
      .filter((trade) => {
        if (!searchValue) return true;

        const symbol = trade.symbol?.toLowerCase() ?? "";
        const strategy = trade.strategy?.toLowerCase() ?? "";

        return (
          symbol.includes(searchValue) ||
          strategy.includes(searchValue)
        );
      })
      .filter((trade) => {
        if (period === "ALL") return true;

        if (period === "TODAY") {
          return trade.trade_date === today;
        }

        if (period === "WEEK") {
          return (
            trade.trade_date >= weekStart &&
            trade.trade_date <= today
          );
        }

        if (period === "MONTH") {
          return (
            trade.trade_date >= monthStart &&
            trade.trade_date <= today
          );
        }

        return true;
      })
      .filter((trade) => {
        const pnl = Number(trade.pnl ?? 0);

        if (result === "WINNING") {
          return pnl > 0;
        }

        if (result === "LOSING") {
          return pnl < 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.trade_date !== b.trade_date) {
          return b.trade_date.localeCompare(a.trade_date);
        }

        const aTime = a.entry_time
          ? new Date(a.entry_time).getTime()
          : 0;

        const bTime = b.entry_time
          ? new Date(b.entry_time).getTime()
          : 0;

        return bTime - aTime;
      });
  }, [trades, search, period, result, today]);

  const statistics = useMemo(() => {
    const totalTrades = filteredTrades.length;

    const totalPnl = filteredTrades.reduce(
      (sum, trade) => sum + Number(trade.pnl ?? 0),
      0
    );

    const winningTrades = filteredTrades.filter(
      (trade) => Number(trade.pnl ?? 0) > 0
    ).length;

    const winRate =
      totalTrades > 0
        ? (winningTrades / totalTrades) * 100
        : 0;

    const tradesWithRR = filteredTrades.filter(
      (trade) =>
        trade.risk_reward !== null &&
        trade.risk_reward !== undefined
    );

    const averageRR =
      tradesWithRR.length > 0
        ? tradesWithRR.reduce(
            (sum, trade) =>
              sum + Number(trade.risk_reward ?? 0),
            0
          ) / tradesWithRR.length
        : 0;

    return {
      totalTrades,
      totalPnl,
      winRate,
      averageRR,
    };
  }, [filteredTrades]);

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Trade Journal
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Review and analyze your historical trades.
            </p>
          </div>

          <button
            onClick={() => setShowAddTrade(true)}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            + Add Trade
          </button>
        </div>

        {/* Search + Filters */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-col gap-4">

            {/* Search */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol or strategy..."
                className="w-full rounded-lg border border-zinc-800 bg-black py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              {/* Period */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["ALL", "All"],
                    ["TODAY", "Today"],
                    ["WEEK", "This Week"],
                    ["MONTH", "This Month"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() =>
                        setPeriod(value as PeriodFilter)
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        period === value
                          ? "border-zinc-600 bg-zinc-800 text-white"
                          : "border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Result
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["ALL", "All"],
                    ["WINNING", "Winning"],
                    ["LOSING", "Losing"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() =>
                        setResult(value as ResultFilter)
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        result === value
                          ? "border-zinc-600 bg-zinc-800 text-white"
                          : "border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            label="Total Trades"
            value={statistics.totalTrades.toString()}
          />

          <StatCard
            label="Total P/L"
            value={
              statistics.totalPnl >= 0
                ? `+${formatMoney(statistics.totalPnl)}`
                : `-${formatMoney(statistics.totalPnl)}`
            }
            valueClass={
              statistics.totalPnl >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }
          />

          <StatCard
            label="Win Rate"
            value={`${statistics.winRate.toFixed(1)}%`}
          />

          <StatCard
            label="Average R/R"
            value={
              statistics.averageRR > 0
                ? statistics.averageRR.toFixed(2)
                : "—"
            }
          />

        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Trade History
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Showing {filteredTrades.length} of {trades.length} trades
            </p>
          </div>

          {(search || period !== "ALL" || result !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setPeriod("ALL");
                setResult("ALL");
              }}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          {filteredTrades.length === 0 ? (
            <EmptyState
              hasFilters={
                Boolean(search) ||
                period !== "ALL" ||
                result !== "ALL"
              }
              onAddTrade={() => setShowAddTrade(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40">
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Asset / Side
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Execution
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Strategy
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Limits
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                      P/L
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Timing
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrades.map((trade) => {
                    const pnl = Number(trade.pnl ?? 0);

                    return (
                      <tr
                        key={trade.id}
                        className="border-b border-zinc-900 transition hover:bg-zinc-900/40"
                      >
                        {/* Asset */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="font-medium text-white">
                              {getAssetName(trade)}
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getSideClass(
                                  trade.side
                                )}`}
                              >
                                {trade.side}
                              </span>

                              <span className="text-xs text-zinc-500">
                                {trade.asset_type}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Execution */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-white">
                            {formatPrice(trade.entry_price)}
                            <span className="mx-2 text-zinc-600">
                              →
                            </span>
                            {formatPrice(trade.exit_price)}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            Qty {formatQuantity(trade.quantity)}
                          </div>
                        </td>

                        {/* Strategy */}
                        <td className="px-5 py-4">
                          <div className="max-w-[180px] truncate text-sm text-zinc-300">
                            {trade.strategy || "—"}
                          </div>
                        </td>

                        {/* Limits */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-zinc-300">
                            SL{" "}
                            <span className="text-zinc-500">
                              {formatPrice(trade.stop_loss)}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            Target {formatPrice(trade.target_price)}
                          </div>
                        </td>

                        {/* P/L */}
                        <td className="px-5 py-4 text-right">
                          <div
                            className={`text-sm font-semibold ${
                              pnl > 0
                                ? "text-emerald-400"
                                : pnl < 0
                                ? "text-red-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {pnl > 0 ? "+" : ""}
                            {pnl < 0 ? "-" : ""}
                            {formatMoney(pnl)}
                          </div>

                          {trade.pnl_percentage !== null &&
                            trade.pnl_percentage !== undefined && (
                              <div
                                className={`mt-1 text-xs ${
                                  pnl > 0
                                    ? "text-emerald-500"
                                    : pnl < 0
                                    ? "text-red-500"
                                    : "text-zinc-500"
                                }`}
                              >
                                {pnl > 0 ? "+" : ""}
                                {Number(
                                  trade.pnl_percentage
                                ).toFixed(2)}
                                %
                              </div>
                            )}
                        </td>

                        {/* Timing */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-zinc-300">
                            {formatTime(trade.entry_time)}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            → {formatTime(trade.exit_time)}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-zinc-300">
                            {formatDate(trade.trade_date)}
                          </div>

                          {trade.is_expiry && (
                            <div className="mt-1 text-[10px] font-medium text-amber-400">
                              EXPIRY
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex">
                            <TradeActions trade={trade} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Trade Modal */}
      {showAddTrade && (
        <AddTradeModal
          onClose={() => setShowAddTrade(false)}
        />
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAddTrade,
}: {
  hasFilters: boolean;
  onAddTrade: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-xl">
        {hasFilters ? "⌕" : "＋"}
      </div>

      <h3 className="text-base font-semibold text-white">
        {hasFilters
          ? "No trades match your filters"
          : "No trades yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        {hasFilters
          ? "Try changing your search or filters to find the trades you're looking for."
          : "Start building your trading journal by adding your first trade."}
      </p>

      {hasFilters ? (
        <p className="mt-4 text-xs text-zinc-600">
          Clear the filters above to see your complete journal.
        </p>
      ) : (
        <button
          onClick={onAddTrade}
          className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          + Add Trade
        </button>
      )}
    </div>
  );
}