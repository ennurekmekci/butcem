"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SavingsGoal {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
}

export default function GoalsPage() {
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [addingToGoalId, setAddingToGoalId] =
        useState<number | null>(null);
    const [contributionAmount, setContributionAmount] =
        useState("")
    const [editingGoalId, setEditingGoalId] =
        useState<number | null>(null);

    async function handleSaveGoal() {
        const targetAmountNumber = Number(targetAmount);
        const currentAmountNumber = Number(currentAmount || 0);

        if (
            name.trim() === "" ||
            targetAmountNumber <= 0 ||
            currentAmountNumber < 0
        ) {
            console.log("Hedef bilgilerini doğru doldur.");
            return;
        }

        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            console.log("Kullanıcı bulunamadı:", userError);
            return;
        }

        let error;

        if (editingGoalId !== null) {
            const result = await supabase
                .from("savings_goals")
                .update({
                    name: name.trim(),
                    target_amount: targetAmountNumber,
                    current_amount: currentAmountNumber,
                    target_date: targetDate === "" ? null : targetDate,
                })
                .eq("id", editingGoalId);

            error = result.error;
        } else {
            const result = await supabase
                .from("savings_goals")
                .insert({
                    user_id: userData.user.id,
                    name: name.trim(),
                    target_amount: targetAmountNumber,
                    current_amount: currentAmountNumber,
                    target_date: targetDate === "" ? null : targetDate,
                });

            error = result.error;
        }

        if (error) {
            console.log("Hedef kaydedilemedi:", error);
            return;
        }

        await loadGoals();

        setEditingGoalId(null);

        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setTargetDate("");
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

    async function handleAddContribution(goal: SavingsGoal) {
        const contributionNumber = Number(contributionAmount);

        if (contributionNumber <= 0) {
            console.log("Eklenecek tutar sıfırdan büyük olmalı.");
            return;
        }

        const newCurrentAmount =
            goal.currentAmount + contributionNumber;

        const { error } = await supabase
            .from("savings_goals")
            .update({
                current_amount: newCurrentAmount,
            })
            .eq("id", goal.id);

        if (error) {
            console.log("Birikim eklenemedi:", error);
            return;
        }

        await loadGoals();

        setAddingToGoalId(null);
        setContributionAmount("");
    }

    function handleEditGoal(goal: SavingsGoal) {
        setEditingGoalId(goal.id);

        setName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setCurrentAmount(goal.currentAmount.toString());
        setTargetDate(goal.targetDate ?? "");
    }

    async function handleDeleteGoal(id: number) {
        const { error } = await supabase
            .from("savings_goals")
            .delete()
            .eq("id", id);

        if (error) {
            console.log("Hedef silinemedi:", error);
            return;
        }

        setGoals(
            goals.filter((goal) => goal.id !== id)
        );
    }

    function handleCancelEdit() {
        setEditingGoalId(null);

        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setTargetDate("");
    }

    useEffect(() => {
        loadGoals();
    }, []);

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                Tasarruf Hedefleri
            </h1>

            <p className="mt-2 text-slate-600">
                Birikim hedeflerini oluştur ve ilerlemeni takip et.
            </p>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                    Yeni Hedef Ekle
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Hedef adı"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="Hedef tutar"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <input
                        type="number"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="Mevcut birikim"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />
                </div>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={handleSaveGoal}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        {editingGoalId !== null
                            ? "Hedefi Güncelle"
                            : "Hedef Kaydet"}
                    </button>

                    {editingGoalId !== null && (
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
                    Hedeflerim
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {goals.map((goal) => {
                        const actualPercentage =
                            (goal.currentAmount / goal.targetAmount) * 100;

                        const barPercentage = Math.min(actualPercentage, 100);

                        const remaining =
                            goal.targetAmount - goal.currentAmount;

                        return (
                            <div
                                key={goal.id}
                                className="rounded-xl bg-white p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-900">
                                    {goal.name}
                                </h3>

                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <p className="text-slate-600">
                                        {goal.currentAmount.toLocaleString("tr-TR")} TL birikti
                                    </p>

                                    <p className="font-medium text-slate-700">
                                        {goal.targetAmount.toLocaleString("tr-TR")} TL hedef
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
                                            ? `${remaining.toLocaleString("tr-TR")} TL kaldı`
                                            : "Hedef tamamlandı 🎉"}
                                    </p>
                                </div>

                                {goal.targetDate && (
                                    <p className="mt-4 text-sm text-slate-500">
                                        Hedef tarihi: {goal.targetDate}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingToGoalId(goal.id);
                                            setContributionAmount("");
                                        }}
                                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                    >
                                        Birikim Ekle
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleEditGoal(goal)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            Düzenle
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-700"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>

                                {addingToGoalId === goal.id && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={contributionAmount}
                                            onChange={(e) =>
                                                setContributionAmount(e.target.value)
                                            }
                                            placeholder="Eklenecek tutar"
                                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleAddContribution(goal)}
                                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                        >
                                            Ekle
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAddingToGoalId(null);
                                                setContributionAmount("");
                                            }}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}