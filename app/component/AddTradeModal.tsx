"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AddTradeModalProps = {
  onClose: () => void;
  trade?: any;
};

export default function AddTradeModal({
  onClose,
  trade,
}: AddTradeModalProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    trade_date:
      trade?.trade_date ??
      new Date().toISOString().split("T")[0],

    symbol: trade?.symbol ?? "",
    asset_type: trade?.asset_type ?? "OPTION",
    side: trade?.side ?? "LONG",

    option_type: trade?.option_type ?? "CALL",

    strike_price:
      trade?.strike_price?.toString() ?? "",

    expiry_date:
      trade?.expiry_date ?? "",

    is_expiry:
      trade?.is_expiry ?? false,

    quantity:
      trade?.quantity?.toString() ?? "",

    entry_price:
      trade?.entry_price?.toString() ?? "",

    exit_price:
      trade?.exit_price?.toString() ?? "",

    stop_loss:
      trade?.stop_loss?.toString() ?? "",

    target_price:
      trade?.target_price?.toString() ?? "",

    brokerage:
      trade?.brokerage?.toString() ?? "0",

    opening_balance:
      trade?.opening_balance?.toString() ?? "",

    closing_balance:
      trade?.closing_balance?.toString() ?? "",

    entry_time: trade?.entry_time
      ? new Date(trade.entry_time)
          .toISOString()
          .slice(11, 16)
      : "",

    exit_time: trade?.exit_time
      ? new Date(trade.exit_time)
          .toISOString()
          .slice(11, 16)
      : "",

    strategy: trade?.strategy ?? "",

    followed_rules:
      trade?.followed_rules ?? false,

    notes: trade?.notes ?? "",
  });

  const updateField = (
    field: string,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    // Get logged-in user
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    const quantity = Number(form.quantity);
    const entryPrice = Number(form.entry_price);
    const exitPrice = Number(form.exit_price);

    // Calculate P/L
    let pnl = 0;

    if (form.side === "LONG") {
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - exitPrice) * quantity;
    }

    // Subtract brokerage
    pnl -= Number(form.brokerage || 0);

    // Calculate P/L percentage
    const investment = entryPrice * quantity;

    const pnlPercentage =
      investment !== 0
        ? (pnl / investment) * 100
        : 0;

    // Calculate Risk / Reward
    let riskReward = 0;

    if (
      form.stop_loss &&
      form.target_price &&
      entryPrice !== 0
    ) {
      const stopLoss = Number(form.stop_loss);
      const target = Number(form.target_price);

      const risk = Math.abs(
        entryPrice - stopLoss
      );

      const reward = Math.abs(
        target - entryPrice
      );

      if (risk !== 0) {
        riskReward = reward / risk;
      }
    }

    // Data common to both INSERT and UPDATE
    const tradeData = {
      trade_date: form.trade_date,

      symbol: form.symbol,

      asset_type: form.asset_type,

      side: form.side,

      option_type:
        form.asset_type === "OPTION"
          ? form.option_type
          : null,

      strike_price:
        form.asset_type === "OPTION"
          ? Number(form.strike_price)
          : null,

      expiry_date:
        form.asset_type === "OPTION"
          ? form.expiry_date
          : null,

      is_expiry: form.is_expiry,

      quantity,

      entry_price: entryPrice,

      exit_price: exitPrice,

      stop_loss: form.stop_loss
        ? Number(form.stop_loss)
        : null,

      target_price: form.target_price
        ? Number(form.target_price)
        : null,

      brokerage: Number(
        form.brokerage || 0
      ),

      opening_balance:
        form.opening_balance
          ? Number(form.opening_balance)
          : null,

      closing_balance:
        form.closing_balance
          ? Number(form.closing_balance)
          : null,

      entry_time: form.entry_time
        ? new Date(
            `${form.trade_date}T${form.entry_time}`
          ).toISOString()
        : null,

      exit_time: form.exit_time
        ? new Date(
            `${form.trade_date}T${form.exit_time}`
          ).toISOString()
        : null,

      pnl,

      pnl_percentage: pnlPercentage,

      risk_reward: riskReward,

      strategy:
        form.strategy || null,

      followed_rules:
        form.followed_rules,

      notes:
        form.notes || null,

      source: "MANUAL",
    };

    let saveError;

    if (trade) {
      // EDIT EXISTING TRADE
      const { error } = await supabase
        .from("trades")
        .update(tradeData)
        .eq("id", trade.id);

      saveError = error;
    } else {
      // ADD NEW TRADE
      const { error } = await supabase
        .from("trades")
        .insert({
          ...tradeData,
          user_id: authData.user.id,
        });

      saveError = error;
    }

    if (saveError) {
      console.error(saveError);

      setError(saveError.message);

      setLoading(false);

      return;
    }

    setLoading(false);

    onClose();

    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {trade
                ? "Edit Trade"
                : "Add Trade"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Record a completed trade.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-zinc-500 hover:text-white"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Information */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field
                label="Date"
                type="date"
                value={form.trade_date}
                onChange={(value) =>
                  updateField(
                    "trade_date",
                    value
                  )
                }
                required
              />

              <Field
                label="Symbol"
                placeholder="NIFTY"
                value={form.symbol}
                onChange={(value) =>
                  updateField(
                    "symbol",
                    value.toUpperCase()
                  )
                }
                required
              />

              <SelectField
                label="Asset Type"
                value={form.asset_type}
                onChange={(value) =>
                  updateField(
                    "asset_type",
                    value
                  )
                }
                options={[
                  "OPTION",
                  "STOCK",
                  "FUTURE",
                  "CRYPTO",
                  "FOREX",
                  "OTHER",
                ]}
              />

              <SelectField
                label="Side"
                value={form.side}
                onChange={(value) =>
                  updateField(
                    "side",
                    value
                  )
                }
                options={[
                  "LONG",
                  "SHORT",
                ]}
              />
            </div>
          </section>

          {/* Option Information */}
          {form.asset_type ===
            "OPTION" && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Option Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SelectField
                  label="Option Type"
                  value={form.option_type}
                  onChange={(value) =>
                    updateField(
                      "option_type",
                      value
                    )
                  }
                  options={[
                    "CALL",
                    "PUT",
                  ]}
                />

                <Field
                  label="Strike Price"
                  type="number"
                  value={
                    form.strike_price
                  }
                  onChange={(value) =>
                    updateField(
                      "strike_price",
                      value
                    )
                  }
                  required
                />

                <Field
                  label="Expiry Date"
                  type="date"
                  value={
                    form.expiry_date
                  }
                  onChange={(value) =>
                    updateField(
                      "expiry_date",
                      value
                    )
                  }
                  required
                />

                <CheckboxField
                  label="Expiry Day"
                  checked={
                    form.is_expiry
                  }
                  onChange={(value) =>
                    updateField(
                      "is_expiry",
                      value
                    )
                  }
                />
              </div>
            </section>
          )}

          {/* Execution */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Execution
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field
                label="Entry Price"
                type="number"
                step="0.01"
                value={
                  form.entry_price
                }
                onChange={(value) =>
                  updateField(
                    "entry_price",
                    value
                  )
                }
                required
              />

              <Field
                label="Exit Price"
                type="number"
                step="0.01"
                value={
                  form.exit_price
                }
                onChange={(value) =>
                  updateField(
                    "exit_price",
                    value
                  )
                }
                required
              />

              <Field
                label="Quantity"
                type="number"
                value={
                  form.quantity
                }
                onChange={(value) =>
                  updateField(
                    "quantity",
                    value
                  )
                }
                required
              />

              <Field
                label="Entry Time"
                type="time"
                value={
                  form.entry_time
                }
                onChange={(value) =>
                  updateField(
                    "entry_time",
                    value
                  )
                }
              />

              <Field
                label="Exit Time"
                type="time"
                value={
                  form.exit_time
                }
                onChange={(value) =>
                  updateField(
                    "exit_time",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* Risk Management */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Risk Management
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field
                label="Stop Loss"
                type="number"
                step="0.01"
                value={
                  form.stop_loss
                }
                onChange={(value) =>
                  updateField(
                    "stop_loss",
                    value
                  )
                }
              />

              <Field
                label="Target"
                type="number"
                step="0.01"
                value={
                  form.target_price
                }
                onChange={(value) =>
                  updateField(
                    "target_price",
                    value
                  )
                }
              />

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs text-zinc-500">
                  Risk / Reward
                </p>

                <p className="mt-2 text-lg font-medium text-white">
                  Calculated automatically
                </p>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Account
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field
                label="Brokerage"
                type="number"
                step="0.01"
                value={
                  form.brokerage
                }
                onChange={(value) =>
                  updateField(
                    "brokerage",
                    value
                  )
                }
              />

              <Field
                label="Opening Balance"
                type="number"
                step="0.01"
                value={
                  form.opening_balance
                }
                onChange={(value) =>
                  updateField(
                    "opening_balance",
                    value
                  )
                }
              />

              <Field
                label="Closing Balance"
                type="number"
                step="0.01"
                value={
                  form.closing_balance
                }
                onChange={(value) =>
                  updateField(
                    "closing_balance",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* Journal */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Journal
            </h3>

            <div className="space-y-4">
              <Field
                label="Strategy"
                placeholder="Breakout"
                value={
                  form.strategy
                }
                onChange={(value) =>
                  updateField(
                    "strategy",
                    value
                  )
                }
              />

              <CheckboxField
                label="Followed Rules"
                checked={
                  form.followed_rules
                }
                onChange={(value) =>
                  updateField(
                    "followed_rules",
                    value
                  )
                }
              />

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateField(
                      "notes",
                      e.target.value
                    )
                  }
                  rows={4}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  placeholder="What happened during this trade?"
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : trade
                  ? "Update Trade"
                  : "Save Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Reusable Fields ---------- */

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        step={step}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-4 w-4"
      />

      <span className="text-sm text-zinc-400">
        {label}
      </span>
    </label>
  );
}