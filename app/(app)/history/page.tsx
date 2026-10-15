"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Transaction {
    id: number;
    amount: number;
    transactionType: "income" | "expense";
    status: "completed" | "planned";
    date: string;
    description: string;
    category: string;
}

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedMonth, setSelectedMonth] = useState("");

    const months = Array.from(
        new Set(
            transactions.map((transaction) => {
                const [year, month] = transaction.date
                    .split("-")
                    .map(Number);

                return `${year}-${String(month).padStart(2, "0")}`;
            }),
        ),
    );

    const router = useRouter();

    function formatDate(date: string): string {
        return date.split("-").reverse().join(".");
    }

    function formatMonth(monthValue: string): string {
        const [year, month] = monthValue.split("-").map(Number);

        const date = new Date(year, month - 1);

        return date.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
        });
    }

    async function handleDeleteTransaction(id: number) {
        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id);

        if (error) {
            console.log("İşlem silinemedi:", error);
            return;
        }

        const updatedTransactions = transactions.filter(
            (transaction) => transaction.id !== id,
        );

        setTransactions(updatedTransactions);

        const selectedMonthStillExists = updatedTransactions.some(
            (transaction) =>
                transaction.date.slice(0, 7) === selectedMonth,
        );

        if (!selectedMonthStillExists) {
            if (updatedTransactions.length > 0) {
                setSelectedMonth(
                    updatedTransactions[0].date.slice(0, 7),
                );
            } else {
                setSelectedMonth("");
            }
        }
    }

    useEffect(() => {
        async function loadTransactions() {
            const { data, error } = await supabase
                .from("transactions")
                .select(
                    "id, amount, transaction_type, status, date, description, category"
                )
                .order("date", { ascending: false });

            if (error) {
                console.log("Geçmiş işlemler getirilemedi:", error);
                return;
            }

            const formattedTransactions = data.map((transaction) => ({
                id: transaction.id,
                amount: transaction.amount,
                transactionType: transaction.transaction_type,
                status: transaction.status,
                date: transaction.date,
                description: transaction.description,
                category: transaction.category,
            }));

            setTransactions(formattedTransactions);

            if (formattedTransactions.length > 0) {
                setSelectedMonth(
                    formattedTransactions[0].date.slice(0, 7)
                );
            }
        }

        loadTransactions();
    }, []);

    const selectedMonthTransactions = transactions.filter((transaction) => {
        const transactionMonth = transaction.date.slice(0, 7);

        return transactionMonth === selectedMonth;
    });

    const selectedMonthIncome = selectedMonthTransactions
        .filter(
            (transaction) =>
                transaction.transactionType === "income" &&
                transaction.status === "completed",
        )
        .reduce(
            (total, transaction) => total + transaction.amount,
            0,
        );

    const selectedMonthExpense = selectedMonthTransactions
        .filter(
            (transaction) =>
                transaction.transactionType === "expense" &&
                transaction.status === "completed",
        )
        .reduce(
            (total, transaction) => total + transaction.amount,
            0,
        );

    const selectedMonthBalance =
        selectedMonthIncome - selectedMonthExpense;


    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                Geçmiş
            </h1>

            <p className="mt-2 text-slate-600">
                Geçmiş aylardaki gelir ve giderlerini inceleyebilirsin.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
                {months.map((month) => (
                    <button
                        key={month}
                        type="button"
                        onClick={() => setSelectedMonth(month)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${selectedMonth === month
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 shadow-sm"
                            }`}
                    >
                        {formatMonth(month)}
                    </button>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Gelir
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-green-600">
                        {selectedMonthIncome.toLocaleString("tr-TR")} TL
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Gider
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-red-600">
                        {selectedMonthExpense.toLocaleString("tr-TR")} TL
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Net
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {selectedMonthBalance.toLocaleString("tr-TR")} TL
                    </p>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">
                    İşlemler
                </h2>

                <div className="mt-4 space-y-3">
                    {selectedMonthTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="rounded-xl bg-white p-4 shadow-sm"
                        >
                            <div>
                                <p className="font-medium text-slate-900">
                                    {transaction.description}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {formatDate(transaction.date)}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {transaction.category}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {transaction.status === "completed"
                                        ? "Tamamlandı"
                                        : "Planlandı"}
                                </p>

                                <p
                                    className={`mt-2 font-semibold ${transaction.transactionType === "income"
                                        ? "text-green-600"
                                        : "text-red-600"
                                        }`}
                                >
                                    {transaction.transactionType === "income" ? "+" : "-"}
                                    {transaction.amount.toLocaleString("tr-TR")} TL
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(`/transactions?edit=${transaction.id}`)
                                    }
                                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600"
                                >
                                    Düzenle
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}