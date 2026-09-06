"use client";

import { useMemo, useState } from "react";

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

  entry_time?: string | null;
  exit_time?: string | null;

  pnl?: number | null;
  pnl_percentage?: number | null;
  risk_reward?: number | null;

  strategy?: string | null;
};

type AnalyticsClientProps = {
  trades: Trade[];
};

type Period =
  | "7"
  | "30"
  | "90"
  | "ALL"
  | "CUSTOM";

function getTodayIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function subtractDays(
  dateString: string,
  days: number
) {
  const date = new Date(
    `${dateString}T12:00:00Z`
  );

  date.setUTCDate(
    date.getUTCDate() - days
  );

  return date.toISOString().split("T")[0];
}

function formatMoney(value: number) {
  const abs = Math.abs(value);

  return `₹${abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function signedMoney(value: number) {
  if (value > 0) {
    return `+${formatMoney(value)}`;
  }

  if (value < 0) {
    return `-${formatMoney(value)}`;
  }

  return "₹0.00";
}

function formatPrice(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(
  dateString: string
) {
  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatTime(
  timestamp: string | null | undefined
) {
  if (!timestamp) {
    return "—";
  }

  return new Date(timestamp).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }
  );
}

function getHour(
  timestamp: string | null | undefined
) {
  if (!timestamp) {
    return null;
  }

  const parts = new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }
  ).formatToParts(new Date(timestamp));

  const hour = parts.find(
    (part) => part.type === "hour"
  );

  return hour
    ? Number(hour.value)
    : null;
}

function getWeekday(
  dateString: string
) {
  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function getDayIndex(
  dateString: string
) {
  return new Date(
    `${dateString}T12:00:00Z`
  ).getUTCDay();
}

function getAssetLabel(trade: Trade) {
  if (trade.asset_type !== "OPTION") {
    return trade.symbol;
  }

  const details = [
    trade.option_type,
    trade.strike_price !== null &&
    trade.strike_price !== undefined
      ? formatPrice(trade.strike_price)
      : null,
  ].filter(Boolean);

  return details.length > 0
    ? `${trade.symbol} ${details.join(" ")}`
    : trade.symbol;
}

export default function AnalyticsClient({
  trades,
}: AnalyticsClientProps) {
  const today = getTodayIndia();

  const [period, setPeriod] =
    useState<Period>("30");

  const [customStart, setCustomStart] =
    useState("");

  const [customEnd, setCustomEnd] =
    useState(today);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const filteredTrades = useMemo(() => {
    let startDate: string | null = null;

    if (period === "7") {
      startDate = subtractDays(today, 6);
    }

    if (period === "30") {
      startDate = subtractDays(today, 29);
    }

    if (period === "90") {
      startDate = subtractDays(today, 89);
    }

    if (period === "CUSTOM") {
      startDate = customStart || null;
    }

    return trades.filter((trade) => {
      if (startDate && trade.trade_date < startDate) {
        return false;
      }

      if (
        period === "CUSTOM" &&
        customEnd &&
        trade.trade_date > customEnd
      ) {
        return false;
      }

      return true;
    });
  }, [
    trades,
    period,
    customStart,
    customEnd,
    today,
    refreshKey,
  ]);

  const statistics = useMemo(() => {
    const pnls = filteredTrades.map(
      (trade) => Number(trade.pnl ?? 0)
    );

    const totalTrades = pnls.length;

    const winning = pnls.filter(
      (pnl) => pnl > 0
    );

    const losing = pnls.filter(
      (pnl) => pnl < 0
    );

    const totalPnl = pnls.reduce(
      (sum, pnl) => sum + pnl,
      0
    );

    const grossProfit = winning.reduce(
      (sum, pnl) => sum + pnl,
      0
    );

    const grossLoss = losing.reduce(
      (sum, pnl) => sum + Math.abs(pnl),
      0
    );

    const winRate =
      totalTrades > 0
        ? (winning.length / totalTrades) * 100
        : 0;

    const averageRRTrades =
      filteredTrades.filter(
        (trade) =>
          trade.risk_reward !== null &&
          trade.risk_reward !== undefined
      );

    const averageRR =
      averageRRTrades.length > 0
        ? averageRRTrades.reduce(
            (sum, trade) =>
              sum +
              Number(
                trade.risk_reward ?? 0
              ),
            0
          ) / averageRRTrades.length
        : 0;

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
        ? Infinity
        : 0;

    const averageWin =
      winning.length > 0
        ? grossProfit / winning.length
        : 0;

    const averageLoss =
      losing.length > 0
        ? grossLoss / losing.length
        : 0;

    const maxProfit =
      winning.length > 0
        ? Math.max(...winning)
        : 0;

    const maxLoss =
      losing.length > 0
        ? Math.min(...losing)
        : 0;

    return {
      totalTrades,
      winning: winning.length,
      losing: losing.length,
      totalPnl,
      grossProfit,
      grossLoss,
      winRate,
      averageRR,
      profitFactor,
      averageWin,
      averageLoss,
      maxProfit,
      maxLoss,
    };
  }, [filteredTrades]);

  const equityCurve = useMemo(() => {
    let cumulative = 0;

    return filteredTrades.map(
      (trade) => {
        const pnl = Number(
          trade.pnl ?? 0
        );

        cumulative += pnl;

        return {
          date: trade.trade_date,
          pnl,
          cumulative,
        };
      }
    );
  }, [filteredTrades]);

  const topTrades = useMemo(() => {
    return [...filteredTrades]
      .sort(
        (a, b) =>
          Number(b.pnl ?? 0) -
          Number(a.pnl ?? 0)
      )
      .slice(0, 5);
  }, [filteredTrades]);

  const dayOfWeekData = useMemo(() => {
    const days = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ];

    const values = days.map(
      (day) => ({
        day,
        pnl: 0,
        trades: 0,
      })
    );

    for (const trade of filteredTrades) {
      const index =
        getDayIndex(trade.trade_date) === 0
          ? 6
          : getDayIndex(trade.trade_date) - 1;

      values[index].pnl += Number(
        trade.pnl ?? 0
      );

      values[index].trades += 1;
    }

    return values;
  }, [filteredTrades]);

  const strategyData = useMemo(() => {
    const map = new Map<
      string,
      {
        pnl: number;
        trades: number;
      }
    >();

    for (const trade of filteredTrades) {
      const strategy =
        trade.strategy?.trim() ||
        "N/A";

      const current = map.get(strategy);

      if (current) {
        current.pnl += Number(
          trade.pnl ?? 0
        );
        current.trades += 1;
      } else {
        map.set(strategy, {
          pnl: Number(trade.pnl ?? 0),
          trades: 1,
        });
      }
    }

    return Array.from(map.entries())
      .map(([strategy, data]) => ({
        strategy,
        ...data,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const expiryData = useMemo(() => {
    const expiry = filteredTrades.filter(
      (trade) => trade.is_expiry
    );

    const regular = filteredTrades.filter(
      (trade) => !trade.is_expiry
    );

    return {
      expiry: {
        pnl: expiry.reduce(
          (sum, trade) =>
            sum + Number(trade.pnl ?? 0),
          0
        ),
        trades: expiry.length,
      },
      regular: {
        pnl: regular.reduce(
          (sum, trade) =>
            sum + Number(trade.pnl ?? 0),
          0
        ),
        trades: regular.length,
      },
    };
  }, [filteredTrades]);

  const hourlyData = useMemo(() => {
    const map = new Map<
      number,
      {
        trades: number;
        wins: number;
      }
    >();

    for (const trade of filteredTrades) {
      const hour = getHour(
        trade.entry_time
      );

      if (hour === null) {
        continue;
      }

      const current = map.get(hour);

      if (current) {
        current.trades += 1;

        if (Number(trade.pnl ?? 0) > 0) {
          current.wins += 1;
        }
      } else {
        map.set(hour, {
          trades: 1,
          wins:
            Number(trade.pnl ?? 0) > 0
              ? 1
              : 0,
        });
      }
    }

    return Array.from(map.entries())
      .map(([hour, data]) => ({
        hour,
        ...data,
        success:
          data.trades > 0
            ? (data.wins / data.trades) *
              100
            : 0,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [filteredTrades]);

  const equityMin = useMemo(() => {
    if (equityCurve.length === 0) {
      return 0;
    }

    return Math.min(
      0,
      ...equityCurve.map(
        (point) => point.cumulative
      )
    );
  }, [equityCurve]);

  const equityMax = useMemo(() => {
    if (equityCurve.length === 0) {
      return 0;
    }

    return Math.max(
      0,
      ...equityCurve.map(
        (point) => point.cumulative
      )
    );
  }, [equityCurve]);

  const equityRange =
    equityMax - equityMin || 1;

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Journal Insights
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              A data-driven view of your trading
              performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Time period */}
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-xs text-zinc-500">
                Time Period:
              </span>

              <select
                value={period}
                onChange={(e) =>
                  setPeriod(
                    e.target.value as Period
                  )
                }
                className="cursor-pointer bg-transparent text-sm font-medium text-white outline-none"
              >
                <option
                  value="7"
                  className="bg-zinc-900"
                >
                  Last 7 Days
                </option>

                <option
                  value="30"
                  className="bg-zinc-900"
                >
                  Last 30 Days
                </option>

                <option
                  value="90"
                  className="bg-zinc-900"
                >
                  Last 90 Days
                </option>

                <option
                  value="ALL"
                  className="bg-zinc-900"
                >
                  All Time
                </option>

                <option
                  value="CUSTOM"
                  className="bg-zinc-900"
                >
                  Custom
                </option>
              </select>
            </div>

            <button
              onClick={() =>
                setRefreshKey(
                  (value) => value + 1
                )
              }
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              ↻ Refresh
            </button>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">

        {/* Custom range */}
        {period === "CUSTOM" && (
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                From
              </label>

              <input
                type="date"
                value={customStart}
                onChange={(e) =>
                  setCustomStart(
                    e.target.value
                  )
                }
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                To
              </label>

              <input
                type="date"
                value={customEnd}
                onChange={(e) =>
                  setCustomEnd(
                    e.target.value
                  )
                }
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none"
              />
            </div>

          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <MetricCard
            icon="↗"
            label="Total P&L"
            value={signedMoney(
              statistics.totalPnl
            )}
            subtext={
              statistics.totalPnl >= 0
                ? "Net positive"
                : "Net negative"
            }
            valueClass={
              statistics.totalPnl >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }
          />

          <MetricCard
            icon="♧"
            label="Total Trades"
            value={statistics.totalTrades.toString()}
            subtext={`${statistics.winning} winning · ${statistics.losing} losing`}
          />

          <WinRateCard
            value={statistics.winRate}
            winning={statistics.winning}
            total={statistics.totalTrades}
          />

          <MetricCard
            icon="⇄"
            label="Average R/R"
            value={
              statistics.averageRR > 0
                ? statistics.averageRR.toFixed(2)
                : "—"
            }
            subtext={`Based on ${filteredTrades.filter(
              (trade) =>
                trade.risk_reward !==
                  null &&
                trade.risk_reward !==
                  undefined
            ).length} trades`}
          />

          <MetricCard
            icon="ϟ"
            label="Profit Factor"
            value={
              statistics.profitFactor ===
              Infinity
                ? "∞"
                : statistics.profitFactor > 0
                ? statistics.profitFactor.toFixed(
                    2
                  )
                : "—"
            }
            subtext="Gross Profit / Gross Loss"
          />

        </div>

        {/* Row 1 */}
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">

          {/* Cumulative P/L */}
          <Panel
            title="Cumulative P&L"
            icon="↗"
            action={
              <div className="flex overflow-hidden rounded-lg border border-zinc-800">
                <button className="bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
                  D
                </button>

                <button className="px-4 py-2 text-xs text-zinc-500 hover:text-white">
                  W
                </button>

                <button className="px-4 py-2 text-xs text-zinc-500 hover:text-white">
                  M
                </button>
              </div>
            }
          >
            <EquityChart
              data={equityCurve}
              min={equityMin}
              max={equityMax}
              range={equityRange}
            />
          </Panel>

          {/* Top Trades */}
          <Panel
            title="Top Trades"
            icon="♜"
            action={
              <span className="cursor-pointer text-xs font-semibold text-violet-400">
                View All
              </span>
            }
          >
            {topTrades.length === 0 ? (
              <ChartEmpty />
            ) : (
              <div className="divide-y divide-zinc-800">
                {topTrades.map(
                  (trade) => {
                    const pnl = Number(
                      trade.pnl ?? 0
                    );

                    return (
                      <div
                        key={trade.id}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-white">
                                {trade.symbol}
                              </span>

                              {trade.option_type && (
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                  {trade.option_type}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-zinc-600">
                              {formatDate(
                                trade.trade_date
                              )}{" "}
                              · Entry: ₹
                              {formatPrice(
                                trade.entry_price
                              )}{" "}
                              · Exit: ₹
                              {formatPrice(
                                trade.exit_price
                              )}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold ${
                                pnl >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {signedMoney(
                                pnl
                              )}
                            </p>

                            {trade.pnl_percentage !==
                              null &&
                              trade.pnl_percentage !==
                                undefined && (
                                <p className="mt-1 text-xs text-zinc-500">
                                  {pnl >= 0
                                    ? "+"
                                    : ""}
                                  {Number(
                                    trade.pnl_percentage
                                  ).toFixed(
                                    2
                                  )}
                                  %
                                </p>
                              )}
                          </div>

                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </Panel>

        </div>

        {/* Row 2 */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">

          {/* Win Loss */}
          <Panel
            title="Win/Loss Distribution"
            icon="◔"
          >
            <WinLossChart
              winning={
                statistics.winning
              }
              losing={
                statistics.losing
              }
              total={
                statistics.totalTrades
              }
            />
          </Panel>

          {/* Day of Week */}
          <Panel
            title="Day of Week vs P&L"
            icon="▥"
          >
            <DayChart
              data={dayOfWeekData}
            />
          </Panel>

        </div>

        {/* Row 3 */}
        <div className="grid gap-6 xl:grid-cols-3">

          {/* Strategy */}
          <Panel
            title="Strategy vs P&L"
            icon="▥"
          >
            {strategyData.length === 0 ? (
              <ChartEmpty text="Assign strategies to your trades to see this analysis" />
            ) : (
              <div className="space-y-5">
                {strategyData
                  .slice(0, 6)
                  .map((strategy) => {
                    const max = Math.max(
                      ...strategyData.map(
                        (item) =>
                          Math.abs(
                            item.pnl
                          )
                      ),
                      1
                    );

                    const width =
                      (Math.abs(
                        strategy.pnl
                      ) /
                        max) *
                      100;

                    return (
                      <div
                        key={
                          strategy.strategy
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium text-zinc-300">
                            {
                              strategy.strategy
                            }
                          </span>

                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              strategy.pnl >=
                              0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {signedMoney(
                              strategy.pnl
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${
                              strategy.pnl >=
                              0
                                ? "bg-emerald-400"
                                : "bg-red-400"
                            }`}
                            style={{
                              width: `${Math.max(
                                width,
                                3
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-right text-[11px] text-zinc-600">
                          {
                            strategy.trades
                          }{" "}
                          {strategy.trades ===
                          1
                            ? "trade"
                            : "trades"}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </Panel>

          {/* Expiry */}
          <Panel
            title="Expiry vs Regular Day P&L"
            icon="▣"
          >
            <ExpiryChart
              expiry={
                expiryData.expiry
              }
              regular={
                expiryData.regular
              }
            />
          </Panel>

          {/* Hourly */}
          <Panel
            title="Hourly Success Rate"
            icon="◷"
          >
            <HourlyChart
              data={hourlyData}
            />
          </Panel>

        </div>

      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* Components                                       */
/* ------------------------------------------------ */

function MetricCard({
  icon,
  label,
  value,
  subtext,
  valueClass = "text-white",
}: {
  icon: string;
  label: string;
  value: string;
  subtext: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">
          {label}
        </span>

        <span className="text-lg text-zinc-500">
          {icon}
        </span>
      </div>

      <p
        className={`mt-4 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {subtext}
      </p>

    </div>
  );
}

function WinRateCard({
  value,
  winning,
  total,
}: {
  value: number;
  winning: number;
  total: number;
}) {
  const radius = 29;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) *
      circumference;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-medium text-zinc-400">
            Win Rate
          </p>

          <p className="mt-4 text-2xl font-bold text-white">
            {value.toFixed(1)}%
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            {winning} / {total} trades
          </p>
        </div>

        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          className="-rotate-90"
        >
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="text-zinc-800"
          />

          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            className="text-emerald-400"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              offset
            }
          />
        </svg>

      </div>

    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">

      <div className="mb-6 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          <span className="text-lg text-violet-400">
            {icon}
          </span>

          <h2 className="text-base font-semibold text-white">
            {title}
          </h2>
        </div>

        {action}

      </div>

      {children}

    </section>
  );
}

function EquityChart({
  data,
  min,
  max,
  range,
}: {
  data: {
    date: string;
    cumulative: number;
  }[];
  min: number;
  max: number;
  range: number;
}) {
  if (data.length === 0) {
    return <ChartEmpty />;
  }

  const width = 1000;
  const height = 300;

  const points = data
    .map((point, index) => {
      const x =
        data.length === 1
          ? width / 2
          : (index /
              (data.length - 1)) *
            width;

      const y =
        240 -
        ((point.cumulative - min) /
          range) *
          190;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[650px]">

        <div className="relative h-[300px]">

          {/* Grid */}
          <div className="absolute inset-x-0 top-[50px] border-t border-zinc-800" />
          <div className="absolute inset-x-0 top-[115px] border-t border-zinc-800" />
          <div className="absolute inset-x-0 top-[180px] border-t border-zinc-800" />
          <div className="absolute inset-x-0 top-[240px] border-t border-zinc-800" />

          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >

            <defs>
              <linearGradient
                id="equityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.25"
                  className="text-emerald-400"
                />

                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0"
                  className="text-emerald-400"
                />
              </linearGradient>
            </defs>

            <polygon
              points={`0,240 ${points} 1000,240`}
              fill="url(#equityGradient)"
            />

            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                data[data.length - 1]
                  .cumulative >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            />

            {data.map(
              (point, index) => {
                const x =
                  data.length === 1
                    ? width / 2
                    : (index /
                        (data.length - 1)) *
                      width;

                const y =
                  240 -
                  ((point.cumulative -
                    min) /
                    range) *
                    190;

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    className={
                      point.cumulative >=
                      0
                        ? "fill-emerald-400"
                        : "fill-red-400"
                    }
                  />
                );
              }
            )}

          </svg>

          <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[11px] text-zinc-600">
            <span>
              {formatDate(
                data[0].date
              )}
            </span>

            <span>
              {formatDate(
                data[data.length - 1]
                  .date
              )}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

function WinLossChart({
  winning,
  losing,
  total,
}: {
  winning: number;
  losing: number;
  total: number;
}) {
  const radius = 52;
  const circumference =
    2 * Math.PI * radius;

  const winningLength =
    total > 0
      ? (winning / total) *
        circumference
      : 0;

  const losingLength =
    total > 0
      ? (losing / total) *
        circumference
      : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">

      <div className="relative h-40 w-40">

        <svg
          viewBox="0 0 140 140"
          className="-rotate-90"
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            className="text-zinc-800"
          />

          {winning > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-emerald-400"
              strokeDasharray={`${winningLength} ${circumference}`}
            />
          )}

          {losing > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-red-400"
              strokeDasharray={`${losingLength} ${circumference}`}
              strokeDashoffset={
                -winningLength
              }
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {total}
          </span>

          <span className="text-xs text-zinc-500">
            Total Trades
          </span>
        </div>

      </div>

      <div className="space-y-4">

        <DistributionRow
          color="bg-emerald-400"
          label="Winning Trades"
          value={winning}
          percentage={
            total > 0
              ? (winning / total) *
                100
              : 0
          }
        />

        <DistributionRow
          color="bg-red-400"
          label="Losing Trades"
          value={losing}
          percentage={
            total > 0
              ? (losing / total) *
                100
              : 0
          }
        />

      </div>

    </div>
  );
}

function DistributionRow({
  color,
  label,
  value,
  percentage,
}: {
  color: string;
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="flex items-center gap-3">

      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-sm text-zinc-400">
        {label}
      </span>

      <span className="ml-auto text-sm font-semibold text-white">
        {value}
      </span>

      <span className="w-14 text-right text-xs text-zinc-600">
        ({percentage.toFixed(1)}%)
      </span>

    </div>
  );
}

function DayChart({
  data,
}: {
  data: {
    day: string;
    pnl: number;
    trades: number;
  }[];
}) {
  const max = Math.max(
    ...data.map((item) =>
      Math.abs(item.pnl)
    ),
    1
  );

  return (
    <div className="flex h-[220px] items-end gap-3 sm:gap-5">

      {data.map((item) => {
        const height =
          (Math.abs(item.pnl) /
            max) *
          145;

        return (
          <div
            key={item.day}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >

            <span
              className={`mb-2 text-[11px] font-semibold ${
                item.pnl >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {item.pnl === 0
                ? "0"
                : signedMoney(
                    item.pnl
                  )}
            </span>

            <div className="flex h-[155px] w-full items-end justify-center">

              <div
                className={`w-full max-w-[42px] rounded-t-md ${
                  item.pnl >= 0
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
                style={{
                  height: `${Math.max(
                    height,
                    item.pnl !== 0
                      ? 4
                      : 0
                  )}px`,
                }}
              />

            </div>

            <span className="mt-3 text-xs text-zinc-500">
              {item.day}
            </span>

          </div>
        );
      })}

    </div>
  );
}

function ExpiryChart({
  expiry,
  regular,
}: {
  expiry: {
    pnl: number;
    trades: number;
  };
  regular: {
    pnl: number;
    trades: number;
  };
}) {
  const max = Math.max(
    Math.abs(expiry.pnl),
    Math.abs(regular.pnl),
    1
  );

  const items = [
    {
      label: "Expiry",
      ...expiry,
    },
    {
      label: "Regular",
      ...regular,
    },
  ];

  return (
    <div className="flex h-[220px] items-end gap-12 px-8">

      {items.map((item) => {
        const height =
          (Math.abs(item.pnl) /
            max) *
          150;

        return (
          <div
            key={item.label}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >

            <span
              className={`mb-2 text-xs font-semibold ${
                item.pnl >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {signedMoney(item.pnl)}
            </span>

            <div className="flex h-[155px] items-end">

              <div
                className={`w-12 rounded-t-md ${
                  item.pnl >= 0
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
                style={{
                  height: `${Math.max(
                    height,
                    item.pnl !== 0
                      ? 4
                      : 0
                  )}px`,
                }}
              />

            </div>

            <span className="mt-3 text-xs font-medium text-zinc-400">
              {item.label}
            </span>

            <span className="mt-1 text-[11px] text-zinc-600">
              {item.trades}{" "}
              {item.trades === 1
                ? "trade"
                : "trades"}
            </span>

          </div>
        );
      })}

    </div>
  );
}

function HourlyChart({
  data,
}: {
  data: {
    hour: number;
    success: number;
    trades: number;
  }[];
}) {
  if (data.length === 0) {
    return (
      <ChartEmpty text="Add entry times to your trades to see hourly performance" />
    );
  }

  const hours = data;

  return (
    <div className="flex h-[220px] items-end gap-3 overflow-x-auto">

      {hours.map((item) => (
        <div
          key={item.hour}
          className="flex h-full min-w-[42px] flex-1 flex-col items-center justify-end"
        >

          <span className="mb-2 text-[10px] font-semibold text-emerald-400">
            {item.success.toFixed(0)}%
          </span>

          <div className="flex h-[155px] items-end">

            <div
              className="w-8 rounded-t-md bg-emerald-400"
              style={{
                height: `${Math.max(
                  item.success *
                    1.45,
                  item.success > 0
                    ? 4
                    : 0
                )}px`,
              }}
            />

          </div>

          <span className="mt-3 text-[10px] text-zinc-500">
            {String(
              item.hour
            ).padStart(2, "0")}:00
          </span>

          <span className="mt-1 text-[9px] text-zinc-700">
            {item.trades}T
          </span>

        </div>
      ))}

    </div>
  );
}

function ChartEmpty({
  text = "Not enough data to display this chart.",
}: {
  text?: string;
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center text-center">
      <p className="max-w-xs text-sm text-zinc-600">
        {text}
      </p>
    </div>
  );
}