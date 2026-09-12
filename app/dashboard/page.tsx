"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TransactionType = "income" | "expense";
type TransactionStatus = "completed" | "planned";

interface Transaction {
  id: number;
  amount: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  date: string;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

export default function DashboardPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, amount, transaction_type, status, date",
        );

      if (error) {
        console.log("İşlemler getirilemedi:", error);
        return;
      }

      const formattedTransactions = data.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        transactionType:
          transaction.transaction_type as TransactionType,
        status:
          transaction.status as TransactionStatus,
        date: transaction.date,
      }));

      setTransactions(formattedTransactions);
    }

    loadTransactions();
  }, []);

  const incomeTransactions = transactions.filter(
    (transaction) =>
      transaction.transactionType === "income" &&
      transaction.status === "completed",
  );

  const expenseTransactions = transactions.filter(
    (transaction) =>
      transaction.transactionType === "expense" &&
      transaction.status === "completed",
  );

  const totalIncome = incomeTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  const totalExpense = expenseTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  const totalBalance = totalIncome - totalExpense;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const monthlyIncomeTransactions = transactions.filter(
    (transaction) => {
      const [year, month] = transaction.date
        .split("-")
        .map(Number);

      return (
        transaction.transactionType === "income" &&
        transaction.status === "completed" &&
        year === currentYear &&
        month === currentMonth
      );
    },
  );

  const monthlyExpenseTransactions = transactions.filter(
    (transaction) => {
      const [year, month] = transaction.date
        .split("-")
        .map(Number);

      return (
        transaction.transactionType === "expense" &&
        transaction.status === "completed" &&
        year === currentYear &&
        month === currentMonth
      );
    },
  );

  const monthlyIncome = monthlyIncomeTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  const monthlyExpense = monthlyExpenseTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Ana Sayfa
      </h1>

      <p className="mt-2 text-slate-600">
        Gelir ve giderlerinin genel özeti.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Toplam Bakiye
        </p>

        <p className="mt-2 text-3xl font-semibold text-slate-900">
          {formatMoney(totalBalance)} TL
        </p>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Bu Ay Gelir
          </p>

          <p className="mt-2 text-2xl font-semibold text-green-600">
            {formatMoney(monthlyIncome)} TL
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Bu Ay Gider
          </p>

          <p className="mt-2 text-2xl font-semibold text-red-600">
            {formatMoney(monthlyExpense)} TL
          </p>
        </div>
      </section>
    </main>
  );
}