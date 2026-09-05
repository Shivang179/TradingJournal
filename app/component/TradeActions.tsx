"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AddTradeModal from "./AddTradeModal";

type TradeActionsProps = {
  trade: any;
};

export default function TradeActions({
  trade,
}: TradeActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trade?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", trade.id);

    if (error) {
      console.error(error);
      alert("Failed to delete trade.");
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          Edit
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-md px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 disabled:opacity-50"
        >
          {loading ? "..." : "Delete"}
        </button>
      </div>

      {showEdit && (
        <AddTradeModal
          trade={trade}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}