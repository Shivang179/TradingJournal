"use client";

import { useState } from "react";

type Trade = {
  id: string;
  symbol: string;
  asset_type: string;
  side: string;
  option_type: string | null;
  strike_price: number | null;
  expiry_date: string | null;
  quantity: number;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  target_price: number | null;
  pnl: number | null;
  pnl_percentage: number | null;
  risk_reward: number | null;
  strategy: string | null;
  followed_rules: boolean;
  notes: string | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_date: string;
};

type Props = {
  trades: Trade[];
  today: string;
};

export default function DashboardClient({
  trades,
  today,
}: Props) {
  const [period, setPeriod] = useState<"today" | "week">("today");

  // ============================================================
  // Trades for selected period
  // ============================================================

  const visibleTrades =
    period === "today"
      ? trades.filter((trade) => trade.trade_date === today)
      : trades;

  // ============================================================
  // Basic statistics
  // ============================================================

  const totalTrades = visibleTrades.length;

  const totalPnL = visibleTrades.reduce(
    (sum, trade) => sum + Number(trade.pnl ?? 0),
    0
  );

  const winningTrades = visibleTrades.filter(
    (trade) => Number(trade.pnl ?? 0) > 0
  ).length;

  const losingTrades = visibleTrades.filter(
    (trade) => Number(trade.pnl ?? 0) < 0
  ).length;

  const winRate =
    totalTrades > 0
      ? (winningTrades / totalTrades) * 100
      : 0;

  // ============================================================
  // Average Risk / Reward
  // ============================================================

  const tradesWithRR = visibleTrades.filter(
    (trade) => trade.risk_reward !== null
  );

  const averageRR =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce(
          (sum, trade) =>
            sum + Number(trade.risk_reward ?? 0),
          0
        ) / tradesWithRR.length
      : 0;

  // ============================================================
  // Rules followed
  // ============================================================

  const rulesFollowed = visibleTrades.filter(
    (trade) => trade.followed_rules
  ).length;

  const rulesFollowedPercentage =
    totalTrades > 0
      ? (rulesFollowed / totalTrades) * 100
      : 0;

  // ============================================================
  // Best / Worst trade
  // ============================================================

  const bestTrade =
    totalTrades > 0
      ? visibleTrades.reduce((best, trade) =>
          Number(trade.pnl ?? 0) >
          Number(best.pnl ?? 0)
            ? trade
            : best
        )
      : null;

  const worstTrade =
    totalTrades > 0
      ? visibleTrades.reduce((worst, trade) =>
          Number(trade.pnl ?? 0) <
          Number(worst.pnl ?? 0)
            ? trade
            : worst
        )
      : null;

  return (
    <div>
      {/* ======================================================
          PERIOD TOGGLE
          ====================================================== */}

      <div className="mb-8 flex w-fit rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => setPeriod("today")}
          className={`rounded-md px-5 py-2 text-sm transition ${
            period === "today"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => setPeriod("week")}
          className={`rounded-md px-5 py-2 text-sm transition ${
            period === "week"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          This Week
        </button>
      </div>

      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Trades"
          value={totalTrades.toString()}
        />

        <StatCard
          title="P/L"
          value={`₹${totalPnL.toFixed(2)}`}
          valueClass={
            totalPnL > 0
              ? "text-green-500"
              : totalPnL < 0
                ? "text-red-500"
                : "text-white"
          }
        />

        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
        />

        <StatCard
          title="Average R/R"
          value={averageRR.toFixed(2)}
        />

        <StatCard
          title="Rules Followed"
          value={`${rulesFollowedPercentage.toFixed(1)}%`}
        />

        <StatCard
          title="Winning Trades"
          value={winningTrades.toString()}
        />

        <StatCard
          title="Best Trade"
          value={
            bestTrade
              ? formatPnL(Number(bestTrade.pnl ?? 0))
              : "—"
          }
          valueClass="text-green-500"
        />

        <StatCard
          title="Worst Trade"
          value={
            worstTrade
              ? formatPnL(Number(worstTrade.pnl ?? 0))
              : "—"
          }
          valueClass={
            worstTrade &&
            Number(worstTrade.pnl ?? 0) < 0
              ? "text-red-500"
              : "text-white"
          }
        />
      </div>

      {/* ======================================================
          P/L PROGRESSION
          ====================================================== */}

      <PnLChart trades={visibleTrades} />

      {/* ======================================================
          TRADE ANALYSIS
          ====================================================== */}

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            {period === "today"
              ? "Today's Trade Analysis"
              : "This Week's Trade Analysis"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Review how each trade was planned and executed.
          </p>
        </div>

        {visibleTrades.length === 0 ? (
          <EmptyState period={period} />
        ) : (
          <div className="space-y-4">
            {visibleTrades.map((trade) => (
              <TradeAnalysisCard
                key={trade.id}
                trade={trade}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  valueClass = "text-white",
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// P/L CHART
// ============================================================

function PnLChart({
  trades,
}: {
  trades: Trade[];
}) {
  if (trades.length === 0) {
    return null;
  }

  /*
   * Sort chronologically so cumulative P/L follows
   * the actual order in which trades were executed.
   */
  const orderedTrades = [...trades].sort((a, b) => {
    const timeA = a.entry_time
      ? new Date(a.entry_time).getTime()
      : new Date(
          `${a.trade_date}T00:00:00`
        ).getTime();

    const timeB = b.entry_time
      ? new Date(b.entry_time).getTime()
      : new Date(
          `${b.trade_date}T00:00:00`
        ).getTime();

    return timeA - timeB;
  });

  let cumulativePnL = 0;

  const points = orderedTrades.map(
    (trade, index) => {
      cumulativePnL += Number(trade.pnl ?? 0);

      return {
        index,
        pnl: cumulativePnL,
      };
    }
  );

  const values = points.map(
    (point) => point.pnl
  );

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);

  const range = maxValue - minValue || 1;

  const width = 800;
  const height = 280;

  const paddingX = 55;
  const paddingY = 30;

  const chartWidth =
    width - paddingX * 2;

  const chartHeight =
    height - paddingY * 2;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    return (
      paddingX +
      (index / (points.length - 1)) *
        chartWidth
    );
  };

  const getY = (value: number) => {
    return (
      paddingY +
      ((maxValue - value) / range) *
        chartHeight
    );
  };

  const linePoints = points
    .map(
      (point) =>
        `${getX(point.index)},${getY(point.pnl)}`
    )
    .join(" ");

  const zeroY = getY(0);

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          P/L Progression
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Cumulative P/L across your trades.
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[600px] w-full"
          role="img"
          aria-label="Cumulative profit and loss progression"
        >
          {/* Zero line */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            stroke="currentColor"
            className="text-zinc-800"
            strokeWidth="1"
          />

          {/* Top value */}
          <text
            x="5"
            y={getY(maxValue) + 5}
            className="fill-zinc-600 text-xs"
          >
            ₹{formatChartValue(maxValue)}
          </text>

          {/* Zero value */}
          <text
            x="5"
            y={zeroY + 5}
            className="fill-zinc-600 text-xs"
          >
            ₹0
          </text>

          {/* Bottom value */}
          <text
            x="5"
            y={getY(minValue) + 5}
            className="fill-zinc-600 text-xs"
          >
            ₹{formatChartValue(minValue)}
          </text>

          {/* Cumulative P/L line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            className="text-white"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {points.map((point) => (
            <circle
              key={point.index}
              cx={getX(point.index)}
              cy={getY(point.pnl)}
              r="4"
              fill="currentColor"
              className="text-white"
            />
          ))}

          {/* Trade numbers */}
          {points.map((point) => {
            const shouldShow =
              points.length <= 10 ||
              point.index === 0 ||
              point.index ===
                points.length - 1;

            if (!shouldShow) {
              return null;
            }

            return (
              <text
                key={`label-${point.index}`}
                x={getX(point.index)}
                y={height - 5}
                textAnchor="middle"
                className="fill-zinc-600 text-xs"
              >
                {point.index + 1}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-600">
        <span>Trade 1</span>

        <span>
          Trade {points.length}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// TRADE ANALYSIS CARD
// ============================================================

function TradeAnalysisCard({
  trade,
}: {
  trade: Trade;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const pnl = Number(trade.pnl ?? 0);

  const pnlColor =
    pnl > 0
      ? "text-green-500"
      : pnl < 0
        ? "text-red-500"
        : "text-zinc-400";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950">
      {/* ====================================================
          COLLAPSED SUMMARY
          ==================================================== */}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Trade information */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                {trade.symbol}
              </h3>

              {trade.option_type && (
                <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                  {trade.option_type}
                </span>
              )}

              {trade.strike_price !==
                null && (
                <span className="text-sm text-zinc-500">
                  ₹
                  {Number(
                    trade.strike_price
                  ).toFixed(2)}
                </span>
              )}

              <span className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-500">
                {trade.side}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
              <span>
                {trade.strategy ||
                  "No strategy"}
              </span>

              <span>
                {formatTime(
                  trade.entry_time
                )}{" "}
                →{" "}
                {formatTime(
                  trade.exit_time
                )}
              </span>

              {trade.risk_reward !==
                null && (
                <span>
                  R/R{" "}
                  {Number(
                    trade.risk_reward
                  ).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* P/L */}
          <div className="shrink-0 text-right">
            <p
              className={`text-lg font-semibold ${pnlColor}`}
            >
              {pnl >= 0 ? "+" : ""}
              ₹{pnl.toFixed(2)}
            </p>

            {trade.pnl_percentage !==
              null && (
              <p
                className={`text-xs ${pnlColor}`}
              >
                {pnl >= 0 ? "+" : ""}
                {Number(
                  trade.pnl_percentage
                ).toFixed(2)}
                %
              </p>
            )}
          </div>
        </div>

        {/* Expand / collapse */}
        <button
          type="button"
          onClick={() =>
            setExpanded(!expanded)
          }
          className="mt-5 text-sm text-zinc-500 transition hover:text-white"
        >
          {expanded
            ? "Hide Analysis ↑"
            : "View Analysis ↓"}
        </button>
      </div>

      {/* ====================================================
          EXPANDED ANALYSIS
          ==================================================== */}

      {expanded && (
        <div className="border-t border-zinc-900 px-6 py-5">
          {/* Main metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Metric
              label="Strategy"
              value={
                trade.strategy || "—"
              }
            />

            <Metric
              label="Quantity"
              value={String(
                trade.quantity
              )}
            />

            <Metric
              label="Entry Price"
              value={formatPrice(
                trade.entry_price
              )}
            />

            <Metric
              label="Exit Price"
              value={formatPrice(
                trade.exit_price
              )}
            />

            <Metric
              label="Stop Loss"
              value={formatPrice(
                trade.stop_loss
              )}
            />

            <Metric
              label="Target"
              value={formatPrice(
                trade.target_price
              )}
            />

            <Metric
              label="Risk / Reward"
              value={
                trade.risk_reward !==
                null
                  ? Number(
                      trade.risk_reward
                    ).toFixed(2)
                  : "—"
              }
            />

            <Metric
              label="Date"
              value={
                trade.trade_date
              }
            />

            <Metric
              label="Entry Time"
              value={formatTime(
                trade.entry_time
              )}
            />

            <Metric
              label="Exit Time"
              value={formatTime(
                trade.exit_time
              )}
            />

            <Metric
              label="P/L"
              value={formatPnL(pnl)}
            />

            <Metric
              label="P/L %"
              value={
                trade.pnl_percentage !==
                null
                  ? `${
                      Number(
                        trade.pnl_percentage
                      ) >= 0
                        ? "+"
                        : ""
                    }${Number(
                      trade.pnl_percentage
                    ).toFixed(2)}%`
                  : "—"
              }
            />
          </div>

          {/* Rules */}
          <div className="mt-6 border-t border-zinc-900 pt-5">
            <p className="text-xs text-zinc-600">
              Trading Rules
            </p>

            <p
              className={`mt-1 text-sm ${
                trade.followed_rules
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {trade.followed_rules
                ? "✓ Followed trading rules"
                : "✕ Rules were not followed"}
            </p>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="mt-5">
              <p className="text-xs text-zinc-600">
                Notes
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {trade.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm text-zinc-300">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  period,
}: {
  period: "today" | "week";
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-10 text-center">
      <p className="text-zinc-400">
        {period === "today"
          ? "No trades today."
          : "No trades this week."}
      </p>

      <p className="mt-1 text-sm text-zinc-600">
        Your trade analysis will appear here
        after you add a trade.
      </p>
    </div>
  );
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

function formatPrice(
  value: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `₹${Number(value).toFixed(2)}`;
}

function formatPnL(value: number) {
  return `${value >= 0 ? "+" : ""}₹${value.toFixed(
    2
  )}`;
}

function formatTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatChartValue(
  value: number
) {
  const absValue = Math.abs(value);

  if (absValue >= 100000) {
    return `${(value / 100000).toFixed(
      1
    )}L`;
  }

  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(
      1
    )}K`;
  }

  return value.toFixed(0);
}