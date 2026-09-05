"use client";

import { useState } from "react";
import AddTradeModal from "./AddTradeModal";

export default function TradesClient() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
      >
        + Add Trade
      </button>

      {showModal && (
        <AddTradeModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}