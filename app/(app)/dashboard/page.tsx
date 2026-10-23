"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateDuePlannedTransactions } from "@/lib/transactions";
import Link from "next/link";

type TransactionType = "income" | "expense";
type TransactionStatus = "completed" | "planned";

interface Transaction {
  id: number;
  amount: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  date: string;
  category: string;
}

interface Budget {
  id: number;
  category: string;
  amount: number;
  month: string;
}

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

export default function DashboardPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  async function loadBudgets() {
    const { data, error } = await supabase
      .from("budgets")
      .select("id, category, amount, month")
      .order("month", { ascending: false });

    if (error) {
      console.log("Bütçeler getirilemedi:", error);
      return;
    }

    setBudgets(data);
  }

  function getBudgetSpent(budget: Budget): number {
    return transactions
      .filter(
        (transaction) =>
          transaction.transactionType === "expense" &&
          transaction.status === "completed" &&
          transaction.category
            .trim()
            .toLocaleLowerCase("tr-TR") ===
          budget.category
            .trim()
            .toLocaleLowerCase("tr-TR") &&
          transaction.date.slice(0, 7) === currentMonth
      )
      .reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
  }

  async function loadGoals() {
    const { data, error } = await supabase
      .from("savings_goals")
      .select(
        "id, name, target_amount, current_amount, target_date"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Hedefler getirilemedi:", error);
      return;
    }

    const formattedGoals = data.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      targetDate: goal.target_date,
    }));

    setGoals(formattedGoals);
  }

  useEffect(() => {
    async function loadTransactions() {
      await updateDuePlannedTransactions();

      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, amount, transaction_type, status, date, category",
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
        category: transaction.category,
      }));

      setTransactions(formattedTransactions);
    }

    loadTransactions();
    loadBudgets();
    loadGoals();
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
  const currentMonthNumber = currentDate.getMonth() + 1;

  const monthlyIncomeTransactions = transactions.filter(
    (transaction) => {
      const [year, month] = transaction.date
        .split("-")
        .map(Number);

      return (
        transaction.transactionType === "income" &&
        transaction.status === "completed" &&
        year === currentYear &&
        month === currentMonthNumber
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
        month === currentMonthNumber
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

  const today = new Date();

  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const currentMonthBudgets = budgets.filter(
    (budget) => budget.month.slice(0, 7) === currentMonth
  );

  return (
    <>
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {currentMonthBudgets.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Bu Ayın Bütçeleri
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Kategori bütçelerinin güncel kullanım durumu
                </p>
              </div>

              <Link
                href="/budgets"
                className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Bütçeleri Yönet
              </Link>
            </div>

            <div className="space-y-4">
              {currentMonthBudgets.map((budget) => {
                const spent = getBudgetSpent(budget);
                const actualPercentage =
                  (spent / budget.amount) * 100;

                const barPercentage = Math.min(
                  actualPercentage,
                  100
                );

                return (
                  <div
                    key={budget.id}
                    className="rounded-xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        {budget.category}
                      </p>

                      <p className="text-sm font-medium text-slate-600">
                        {formatMoney(spent)} /{" "}
                        {formatMoney(budget.amount)} TL
                      </p>
                    </div>

                    <div className="mt-4 h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className={`h-2.5 rounded-full ${spent > budget.amount
                            ? "bg-red-500"
                            : actualPercentage >= 80
                              ? "bg-amber-500"
                              : "bg-slate-900"
                          }`}
                        style={{
                          width: `${barPercentage}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        %{Math.round(actualPercentage)} kullanıldı
                      </p>

                      {spent > budget.amount ? (
                        <p className="text-sm font-medium text-red-600">
                          Bütçe aşıldı
                        </p>
                      ) : actualPercentage >= 80 ? (
                        <p className="text-sm font-medium text-amber-600">
                          Limite yaklaşıyor
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {formatMoney(budget.amount - spent)} TL kaldı
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {goals.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Tasarruf Hedefleri
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Birikim hedeflerinin güncel durumu
                </p>
              </div>

              <Link
                href="/goals"
                className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Hedefleri Yönet
              </Link>
            </div>

            <div className="space-y-4">
              {goals.map((goal) => {
                const actualPercentage =
                  (goal.currentAmount / goal.targetAmount) * 100;

                const barPercentage = Math.min(
                  actualPercentage,
                  100
                );

                const remaining =
                  goal.targetAmount - goal.currentAmount;

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        {goal.name}
                      </p>

                      <p className="text-sm font-medium text-slate-600">
                        {formatMoney(goal.currentAmount)} /{" "}
                        {formatMoney(goal.targetAmount)} TL
                      </p>
                    </div>

                    <div className="mt-4 h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-slate-900"
                        style={{
                          width: `${barPercentage}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        %{Math.round(actualPercentage)} tamamlandı
                      </p>

                      <p className="text-sm text-slate-500">
                        {remaining > 0
                          ? `${formatMoney(remaining)} TL kaldı`
                          : "Hedef tamamlandı 🎉"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}