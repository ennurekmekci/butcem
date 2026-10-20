"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BudgetsPage() {
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [month, setMonth] = useState("");
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [budgetTransactions, setBudgetTransactions] =
        useState<BudgetTransaction[]>([]);
    const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState("");

    const budgetMonths = Array.from(
        new Set(
            budgets.map((budget) => budget.month.slice(0, 7))
        )
    );

    const selectedMonthBudgets = budgets.filter(
        (budget) => budget.month.slice(0, 7) === selectedMonth
    );

    function normalizeCategory(category: string): string {
        const cleanedCategory =
            category.trim().toLocaleLowerCase("tr-TR");

        return (
            cleanedCategory.charAt(0).toLocaleUpperCase("tr-TR") +
            cleanedCategory.slice(1)
        );
    }

    function formatMonth(monthValue: string): string {
        const [year, month] = monthValue.split("-").map(Number);

        const date = new Date(year, month - 1);

        return date.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
        });
    }

    interface Budget {
        id: number;
        category: string;
        amount: number;
        month: string;
    }

    interface BudgetTransaction {
        amount: number;
        category: string;
        date: string;
        transactionType: "income" | "expense";
        status: "completed" | "planned";
    }

    async function handleSaveBudget() {
        const cleanedCategory = normalizeCategory(category);
        const amountNumber = Number(amount);

        if (
            cleanedCategory === "" ||
            amountNumber <= 0 ||
            month === ""
        ) {
            console.log("Kategori, tutar ve ay alanlarını doğru doldur.");
            return;
        }

        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            console.log("Kullanıcı bulunamadı:", userError);
            return;
        }

        const budgetMonth = `${month}-01`;

        let error;

        if (editingBudgetId !== null) {
            const result = await supabase
                .from("budgets")
                .update({
                    category: cleanedCategory,
                    amount: amountNumber,
                    month: budgetMonth,
                })
                .eq("id", editingBudgetId);

            error = result.error;
        } else {
            const result = await supabase
                .from("budgets")
                .insert({
                    user_id: userData.user.id,
                    category: cleanedCategory,
                    amount: amountNumber,
                    month: budgetMonth,
                });

            error = result.error;
        }

        if (error) {
            console.log("Bütçe kaydedilemedi:", error);
            return;
        }

        await loadBudgets();

        setEditingBudgetId(null);
        setCategory("");
        setAmount("");
        setMonth("");
    }

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

        if (data.length > 0 && selectedMonth === "") {
            setSelectedMonth(data[0].month.slice(0, 7));
        }
    }

    async function loadBudgetTransactions() {
        const { data, error } = await supabase
            .from("transactions")
            .select("amount, category, date, transaction_type, status");

        if (error) {
            console.log("Bütçe işlemleri getirilemedi:", error);
            return;
        }

        const formattedTransactions = data.map((transaction) => ({
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            transactionType: transaction.transaction_type,
            status: transaction.status,
        }));

        setBudgetTransactions(formattedTransactions);
    }

    function getBudgetSpent(budget: Budget): number {
        const budgetMonth = budget.month.slice(0, 7);

        return budgetTransactions
            .filter(
                (transaction) =>
                    transaction.transactionType === "expense" &&
                    transaction.status === "completed" &&
                    normalizeCategory(transaction.category) ===
                    normalizeCategory(budget.category) &&
                    transaction.date.slice(0, 7) === budgetMonth,
            )
            .reduce((total, transaction) => total + transaction.amount, 0);
    }

    async function handleDeleteBudget(id: number) {
        const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", id);

        if (error) {
            console.log("Bütçe silinemedi:", error);
            return;
        }

        setBudgets(
            budgets.filter((budget) => budget.id !== id)
        );
    }

    function handleEditBudget(budget: Budget) {
        setEditingBudgetId(budget.id);
        setCategory(budget.category);
        setAmount(budget.amount.toString());
        setMonth(budget.month.slice(0, 7));
    }

    function handleCancelEdit() {
        setEditingBudgetId(null);
        setCategory("");
        setAmount("");
        setMonth("");
    }

    useEffect(() => {
        loadBudgets();
        loadBudgetTransactions();
    }, []);

    useEffect(() => {
        async function loadCategoryOptions() {
            const { data, error } = await supabase
                .from("transactions")
                .select("category");

            if (error) {
                console.log("Kategoriler getirilemedi:", error);
                return;
            }

            const uniqueCategories = Array.from(
                new Set(
                    data
                        .map((transaction) => transaction.category)
                        .filter((category) => category && category.trim() !== ""),
                ),
            );

            setCategoryOptions(uniqueCategories);
        }

        loadCategoryOptions();
    }, []);
    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                Bütçeler
            </h1>

            <p className="mt-2 text-slate-600">
                Aylık kategori bütçelerini buradan yönetebilirsin.
            </p>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                    Yeni Bütçe Ekle
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Kategori"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                        />

                        {category !== "" && (
                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-sm">
                                {categoryOptions
                                    .filter((option) =>
                                        option
                                            .toLocaleLowerCase("tr-TR")
                                            .includes(category.toLocaleLowerCase("tr-TR")),
                                    )
                                    .map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setCategory(option)}
                                            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            {option}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Bütçe Tutarı"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />
                </div>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={handleSaveBudget}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        {editingBudgetId !== null
                            ? "Bütçeyi Güncelle"
                            : "Bütçe Kaydet"}
                    </button>

                    {editingBudgetId !== null && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            İptal
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">
                    Bütçelerim
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                    {budgetMonths.map((monthValue) => (
                        <button
                            key={monthValue}
                            type="button"
                            onClick={() => setSelectedMonth(monthValue)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${selectedMonth === monthValue
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                                }`}
                        >
                            {formatMonth(monthValue)}
                        </button>
                    ))}
                </div>

                <div className="mt-4 space-y-3">
                    {selectedMonthBudgets.map((budget) => {
                        const spent = getBudgetSpent(budget);
                        const remaining = budget.amount - spent;
                        const actualPercentage = (spent / budget.amount) * 100;
                        const barPercentage = Math.min(actualPercentage, 100);

                        return (
                            <div
                                key={budget.id}
                                className="rounded-xl bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-slate-900">
                                        {budget.category}
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleEditBudget(budget)}
                                            className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                        >
                                            Düzenle
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBudget(budget.id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-700"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-1 text-sm text-slate-600">
                                    {formatMonth(budget.month.slice(0, 7))}
                                </p>

                                <div className="mt-3 space-y-1 text-sm">
                                    <p>
                                        Bütçe:{" "}
                                        <span className="font-semibold">
                                            {budget.amount} TL
                                        </span>
                                    </p>

                                    <p>
                                        Harcanan:{" "}
                                        <span className="font-semibold">
                                            {spent} TL
                                        </span>
                                    </p>

                                    <p>
                                        Kalan:{" "}
                                        <span className="font-semibold">
                                            {remaining} TL
                                        </span>
                                    </p>

                                    <div className="mt-4">
                                        <div className="h-3 w-full rounded-full bg-slate-200">
                                            <div
                                                className={`h-3 rounded-full ${spent > budget.amount
                                                    ? "bg-red-500"
                                                    : "bg-slate-900"
                                                    }`}
                                                style={{ width: `${barPercentage}%` }}
                                            />
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">
                                            %{Math.round(actualPercentage)} kullanıldı

                                            {spent > budget.amount && (
                                                <p className="mt-2 text-sm font-medium text-red-600">
                                                    Bütçe aşıldı.
                                                </p>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}