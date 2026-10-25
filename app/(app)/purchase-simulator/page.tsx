"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SimulationItem {
  id: number;
  name: string;
  price: number;
}

export default function PurchaseSimulatorPage() {
  const [simulationItems, setSimulationItems] =
    useState<SimulationItem[]>([]);

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showResult, setShowResult] = useState(false);

  async function loadCurrentBalance() {
    const { data, error } = await supabase
      .from("transactions")
      .select("amount, transaction_type, status");

    if (error) {
      console.log("Bakiye hesaplanamadı:", error);
      return;
    }

    const completedTransactions = data.filter(
      (transaction) => transaction.status === "completed"
    );

    const totalIncome = completedTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    const totalExpense = completedTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    setCurrentBalance(totalIncome - totalExpense);
  }

  function handleAddItem() {
    const priceNumber = Number(price);

    if (
      productName.trim() === "" ||
      priceNumber <= 0
    ) {
      return;
    }

    const newItem: SimulationItem = {
      id: Date.now(),
      name: productName.trim(),
      price: priceNumber,
    };

    setSimulationItems([
      ...simulationItems,
      newItem,
    ]);

    setProductName("");
    setPrice("");
  }

  function handleDeleteItem(id: number) {
    setSimulationItems(
      simulationItems.filter(
        (item) => item.id !== id
      )
    );
  }

  function handleClearItems() {
    setSimulationItems([]);
    setShowResult(false);
  }

  const totalSimulationPrice = simulationItems.reduce(
    (total, item) => total + item.price,
    0
  );

  const balanceAfterPurchase =
    currentBalance - totalSimulationPrice;

  const purchasePercentage =
    currentBalance > 0
      ? (totalSimulationPrice / currentBalance) * 100
      : 0;

  const purchaseStatus =
    balanceAfterPurchase < 0
      ? "Bakiye yetersiz"
      : purchasePercentage >= 70
        ? "Yüksek etki"
        : purchasePercentage >= 40
          ? "Orta etki"
          : "Düşük etki";

  useEffect(() => {
    loadCurrentBalance();
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">
        Satın Alma Simülasyonu
      </h1>

      <p className="mt-2 text-slate-600">
        Almayı düşündüğün ürünleri birlikte değerlendir ve
        bütçene etkisini gör.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Yeni Ürün
        </h2>

        <div className="mt-5 grid items-center gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={productName}
            onChange={(e) =>
              setProductName(e.target.value)
            }
            placeholder="Ürün adı"
            className="h-11 rounded-xl border border-slate-300 px-3 text-slate-900 outline-none transition focus:border-slate-500"
          />

          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            placeholder="Fiyat"
            className="h-11 rounded-xl border border-slate-300 px-3 text-slate-900 outline-none transition focus:border-slate-500"
          />

          <button
            type="button"
            onClick={handleAddItem}
            aria-label="Ürün ekle"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-2xl text-white transition hover:bg-slate-800"
          >
            +
          </button>
        </div>
      </div>

      {simulationItems.length > 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Simülasyon Sepeti
            </h2>

            <button
              type="button"
              onClick={handleClearItems}
              className="text-sm font-medium text-slate-500 transition hover:text-red-600"
            >
              Sepeti Temizle
            </button>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {simulationItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {item.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.price.toLocaleString("tr-TR")} TL
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteItem(item.id)
                  }
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
            <div>
              <p className="text-sm text-slate-500">
                Toplam
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {totalSimulationPrice.toLocaleString("tr-TR")} TL
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResult(true)}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Simüle Et
            </button>
          </div>
        </div>
      )}

      {showResult && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Simülasyon Sonucu
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Mevcut Bakiye
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currentBalance.toLocaleString("tr-TR")} TL
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Alışveriş Toplamı
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900">
                {totalSimulationPrice.toLocaleString("tr-TR")} TL
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Satın Alma Sonrası
              </p>

              <p
                className={`mt-2 text-xl font-semibold ${
                  balanceAfterPurchase < 0
                    ? "text-red-600"
                    : "text-slate-900"
                }`}
              >
                {balanceAfterPurchase.toLocaleString("tr-TR")} TL
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Bakiyeye etkisi
              </p>

              <p className="text-sm font-medium text-slate-700">
                %{Math.round(purchasePercentage)}
              </p>
            </div>

            <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200">
              <div
                className={`h-2.5 rounded-full ${
                  purchasePercentage > 100
                    ? "bg-red-500"
                    : purchasePercentage >= 70
                      ? "bg-amber-500"
                      : "bg-slate-900"
                }`}
                style={{
                  width: `${Math.min(
                    purchasePercentage,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <p
            className={`mt-3 text-sm font-medium ${
              balanceAfterPurchase < 0
                ? "text-red-600"
                : purchasePercentage >= 70
                  ? "text-amber-600"
                  : "text-slate-600"
            }`}
          >
            {purchaseStatus}
          </p>

          {balanceAfterPurchase < 0 && (
            <p className="mt-4 text-sm font-medium text-red-600">
              Bu alışveriş mevcut bakiyeni aşıyor.
            </p>
          )}
        </div>
      )}
    </>
  );
}