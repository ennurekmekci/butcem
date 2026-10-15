"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateDuePlannedTransactions } from "@/lib/transactions";
import { useRouter, useSearchParams } from "next/navigation";

type TransactionType = "income" | "expense";
type TransactionStatus = "completed" | "planned";

interface Transaction {
    id: number;
    description: string;
    amount: number;
    transactionType: TransactionType;
    status: TransactionStatus;
    date: string;
    category: string;
}

interface CategoryRule {
    keywords: string[];
    category: string;
    priority: number;
}

interface CategoryPrediction {
    category: string | null;
    reason: "matched" | "no_match" | "ambiguous";
}

interface UserCategoryRule {
    id: number;
    keyword: string;
    category: string;
}

const categoryRules: CategoryRule[] = [
    {
        keywords: ["bershka", "zara", "koton", "elbise", "pantolon"],
        category: "Giyim",
        priority: 3,
    },
    {
        keywords: ["market", "migros", "a101", "bim", "şok"],
        category: "Market",
        priority: 2,
    },
    {
        keywords: ["kyk", "yurt", "kira"],
        category: "Barınma",
        priority: 3,
    },
];

function predictCategory(
    description: string,
    userRules: UserCategoryRule[],
): CategoryPrediction {
    const normalizedDescription = normalizeText(description);

    const matchedUserRule = userRules.find((rule) =>
        normalizedDescription.includes(normalizeText(rule.keyword)),
    );

    if (matchedUserRule) {
        return {
            category: matchedUserRule.category,
            reason: "matched",
        };
    }

    const matchedRules = categoryRules.filter((rule) =>
        rule.keywords.some((keyword) =>
            normalizedDescription.includes(normalizeText(keyword)),
        ),
    );

    if (matchedRules.length === 0) {
        return {
            category: null,
            reason: "no_match",
        };
    }

    const bestRule = matchedRules.reduce(
        (bestRule, currentRule) => {
            if (currentRule.priority > bestRule.priority) {
                return currentRule;
            }

            if (currentRule.priority < bestRule.priority) {
                return bestRule;
            }

            const currentMatchCount = countKeywordMatches(
                description,
                currentRule,
            );

            const bestMatchCount = countKeywordMatches(
                description,
                bestRule,
            );

            return currentMatchCount > bestMatchCount
                ? currentRule
                : bestRule;
        },
    );

    const bestMatchCount = countKeywordMatches(
        description,
        bestRule,
    );

    const hasAmbiguousMatch = matchedRules.some(
        (rule) =>
            rule.category !== bestRule.category &&
            rule.priority === bestRule.priority &&
            countKeywordMatches(description, rule) === bestMatchCount,
    );

    if (hasAmbiguousMatch) {
        return {
            category: null,
            reason: "ambiguous",
        };
    }

    return {
        category: bestRule.category,
        reason: "matched",
    };
}

function countKeywordMatches(
    description: string,
    rule: CategoryRule,
): number {
    const normalizedDescription = normalizeText(description);

    return rule.keywords.filter((keyword) =>
        normalizedDescription.includes(normalizeText(keyword)),
    ).length;
}

function formatMoney(amount: number): string {
    return amount.toLocaleString("tr-TR");
}

function formatDate(date: string): string {
    return date.split("-").reverse().join(".");
}

function normalizeText(text: string): string {
    return text.toLocaleLowerCase("tr-TR");
}

function normalizeCategory(category: string): string {
    const cleanedCategory =
        category.trim().toLocaleLowerCase("tr-TR");

    return (
        cleanedCategory.charAt(0).toLocaleUpperCase("tr-TR") +
        cleanedCategory.slice(1)
    );
}

function getLocalDateString(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] =
        useState<Transaction[]>([]);
    const [newDescription, setNewDescription] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newTransactionType, setNewTransactionType] =
        useState<TransactionType>("expense");
    const [newStatus, setNewStatus] =
        useState<TransactionStatus>("completed");
    const [newDate, setNewDate] = useState(
        getLocalDateString(),
    );
    const [newTransactionCategory, setNewTransactionCategory] =
        useState("");
    const [isCategoryManuallyEdited, setIsCategoryManuallyEdited] =
        useState(false);
    const [saveCategoryRule, setSaveCategoryRule] = useState(false);
    const [newRuleKeyword, setNewRuleKeyword] = useState("");
    const [activeUserCategoryRules, setActiveUserCategoryRules] =
        useState<UserCategoryRule[]>([]);
    const [editingTransactionId, setEditingTransactionId] =
        useState<number | null>(null);

    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    async function loadUserCategoryRules() {
        const { data, error } = await supabase
            .from("user_category_rules")
            .select("id, keyword, category");

        if (error) {
            console.log("Kurallar getirilemedi:", error);
            return;
        }

        setActiveUserCategoryRules(data);
    }

    async function loadTransactions() {
        await updateDuePlannedTransactions();

        const { data, error } = await supabase
            .from("transactions")
            .select(
                "id, description, amount, transaction_type, status, date, category, created_at, updated_at",
            )
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.log("İşlemler getirilemedi:", error);
            return;
        }

        const formattedTransactions = data.map((transaction) => ({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            transactionType: transaction.transaction_type,
            status: transaction.status,
            date: transaction.date,
            category: transaction.category,
        }));

        setTransactions(formattedTransactions);
    }

    useEffect(() => {
        loadUserCategoryRules();
        loadTransactions();
    }, []);

    useEffect(() => {
        if (isCategoryManuallyEdited) {
            return;
        }

        const prediction = predictCategory(
            newDescription,
            activeUserCategoryRules,
        );

        setNewTransactionCategory(
            prediction.category ?? "Diğer",
        );
    }, [
        newDescription,
        activeUserCategoryRules,
        isCategoryManuallyEdited,
    ]);

    useEffect(() => {
        const today = getLocalDateString();

        if (newDate > today) {
            setNewStatus("planned");
        } else {
            setNewStatus("completed");
        }
    }, [newDate]);

    useEffect(() => {
        if (!editId || transactions.length === 0) {
            return;
        }

        const transactionToEdit = transactions.find(
            (transaction) => transaction.id === Number(editId),
        );

        if (!transactionToEdit) {
            return;
        }

        setEditingTransactionId(transactionToEdit.id);
        setNewDescription(transactionToEdit.description);
        setNewAmount(transactionToEdit.amount.toString());
        setNewTransactionType(transactionToEdit.transactionType);
        setNewStatus(transactionToEdit.status);
        setNewDate(transactionToEdit.date);
        setNewTransactionCategory(transactionToEdit.category);

        setIsCategoryManuallyEdited(true);
        setSaveCategoryRule(false);
        setNewRuleKeyword("");
    }, [editId, transactions]);

    async function handleAddTransaction() {
        const cleanedDescription = newDescription.trim();
        const amountNumber = Number(newAmount);

        const cleanedCategory =
            normalizeCategory(newTransactionCategory) || "Diğer";

        const cleanedRuleKeyword =
            normalizeText(newRuleKeyword.trim());

        if (!cleanedDescription || amountNumber <= 0) {
            console.log("Geçerli bir açıklama ve tutar gir.");
            return;
        }

        if (saveCategoryRule && cleanedRuleKeyword === "") {
            console.log("Kural kaydetmek için anahtar kelime gir.");
            return;
        }

        const existingRule = activeUserCategoryRules.find(
            (rule) =>
                normalizeText(rule.keyword) === cleanedRuleKeyword,
        );

        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            console.log("Kullanıcı bilgisi alınamadı:", userError);
            return;
        }

        if (editingTransactionId !== null) {
            const { error: updateError } = await supabase
                .from("transactions")
                .update({
                    description: cleanedDescription,
                    amount: amountNumber,
                    transaction_type: newTransactionType,
                    status: newStatus,
                    date: newDate,
                    category: cleanedCategory,
                })
                .eq("id", editingTransactionId);

            if (updateError) {
                console.log("İşlem güncellenemedi:", updateError);
                return;
            }

            await loadTransactions();

            setEditingTransactionId(null);
            setNewDescription("");
            setNewAmount("");
            setNewTransactionType("expense");
            setNewStatus("completed");
            setNewDate(getLocalDateString());
            setNewTransactionCategory("");
            setIsCategoryManuallyEdited(false);
            setSaveCategoryRule(false);
            setNewRuleKeyword("");

            router.replace("/transactions");

            return;
        }

        const { data: savedTransaction, error: insertError } =
            await supabase
                .from("transactions")
                .insert({
                    user_id: userData.user.id,
                    description: cleanedDescription,
                    amount: amountNumber,
                    transaction_type: newTransactionType,
                    status: newStatus,
                    date: newDate,
                    category: cleanedCategory,
                })
                .select(
                    "id, description, amount, transaction_type, status, date, category",
                )
                .single();

        if (insertError || !savedTransaction) {
            console.log("İşlem eklenemedi:", insertError);
            return;
        }

        if (saveCategoryRule && !existingRule) {
            const { data: savedRule, error: ruleInsertError } =
                await supabase
                    .from("user_category_rules")
                    .insert({
                        user_id: userData.user.id,
                        keyword: cleanedRuleKeyword,
                        category: cleanedCategory,
                    })
                    .select("id, keyword, category")
                    .single();

            if (ruleInsertError) {
                console.log(
                    "Kategori kuralı kaydedilemedi:",
                    ruleInsertError,
                );
            }

            if (savedRule) {
                setActiveUserCategoryRules([
                    ...activeUserCategoryRules,
                    savedRule,
                ]);
            }
        }

        if (
            saveCategoryRule &&
            existingRule &&
            existingRule.category !== cleanedCategory
        ) {
            const { error: ruleUpdateError } = await supabase
                .from("user_category_rules")
                .update({
                    category: cleanedCategory,
                })
                .eq("id", existingRule.id);

            if (ruleUpdateError) {
                console.log(
                    "Kategori kuralı güncellenemedi:",
                    ruleUpdateError,
                );
            }

            if (!ruleUpdateError) {
                const updatedRules = activeUserCategoryRules.map(
                    (rule) =>
                        rule.id === existingRule.id
                            ? { ...rule, category: cleanedCategory }
                            : rule,
                );

                setActiveUserCategoryRules(updatedRules);
            }
        }

        const formattedTransaction: Transaction = {
            id: savedTransaction.id,
            description: savedTransaction.description,
            amount: Number(savedTransaction.amount),
            transactionType:
                savedTransaction.transaction_type as TransactionType,
            status:
                savedTransaction.status as TransactionStatus,
            date: savedTransaction.date,
            category: savedTransaction.category,
        };

        setTransactions([
            formattedTransaction,
            ...transactions,
        ]);

        setNewDescription("");
        setNewAmount("");
        setNewTransactionType("expense");
        setNewStatus("completed");
        setNewDate(getLocalDateString());
        setNewTransactionCategory("");
        setIsCategoryManuallyEdited(false);
        setSaveCategoryRule(false);
        setNewRuleKeyword("");
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
    }

    function handleCancelEdit() {
        setEditingTransactionId(null);
        setNewDescription("");
        setNewAmount("");
        setNewTransactionType("expense");
        setNewStatus("completed");
        setNewDate(getLocalDateString());
        setNewTransactionCategory("");
        setIsCategoryManuallyEdited(false);
        setSaveCategoryRule(false);
        setNewRuleKeyword("");

        router.replace("/transactions");
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                İşlemler
            </h1>

            <p className="mt-2 text-slate-600">
                Gelir ve gider işlemlerini buradan yönetebilirsin.
            </p>

            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                    {editingTransactionId === null
                        ? "Yeni İşlem Ekle"
                        : "İşlemi Düzenle"}
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Açıklama"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="Tutar"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <select
                        value={newTransactionType}
                        onChange={(e) =>
                            setNewTransactionType(
                                e.target.value as TransactionType,
                            )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    >
                        <option value="expense">Gider</option>
                        <option value="income">Gelir</option>
                    </select>

                    <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Kategori
                        </label>

                        <input
                            type="text"
                            value={newTransactionCategory}
                            onChange={(e) => {
                                setNewTransactionCategory(e.target.value);
                                setIsCategoryManuallyEdited(true);
                            }}
                            placeholder="Örneğin: Market"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                        />
                    </div>
                </div>

                {editingTransactionId === null && (
                    <>
                        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={saveCategoryRule}
                                onChange={(e) => {
                                    setSaveCategoryRule(e.target.checked);

                                    if (!e.target.checked) {
                                        setNewRuleKeyword("");
                                    }
                                }}
                            />
                            Bu kategori seçimini kural olarak kaydet
                        </label>

                        {saveCategoryRule && (
                            <input
                                type="text"
                                value={newRuleKeyword}
                                onChange={(e) =>
                                    setNewRuleKeyword(e.target.value)
                                }
                                placeholder="Kural anahtar kelimesi"
                                className="mt-3 w-110 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                            />
                        )}
                    </>
                )}

                <div className="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleAddTransaction}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        {editingTransactionId === null
                            ? "İşlem Ekle"
                            : "Güncelle"}
                    </button>

                    {editingTransactionId !== null && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                        >
                            İptal
                        </button>
                    )}
                </div>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">
                    Son İşlemler
                </h2>

                <div className="mt-4 space-y-3">
                    {transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
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
                                    {transaction.transactionType === "income" ? "+" : "-"}{" "}
                                    {formatMoney(transaction.amount)} TL
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingTransactionId(transaction.id);
                                        setNewDescription(transaction.description);
                                        setNewAmount(transaction.amount.toString());
                                        setNewTransactionType(transaction.transactionType);
                                        setNewStatus(transaction.status);
                                        setNewDate(transaction.date);
                                        setNewTransactionCategory(transaction.category);
                                        setIsCategoryManuallyEdited(true);

                                        setSaveCategoryRule(false);
                                        setNewRuleKeyword("");
                                    }}
                                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600"
                                >
                                    Düzenle
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteTransaction(transaction.id)
                                    }
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