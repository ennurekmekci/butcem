"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserCategoryRule {
    id: number;
    keyword: string;
    category: string;
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

export default function CategoriesPage() {
    const [activeUserCategoryRules, setActiveUserCategoryRules] =
        useState<UserCategoryRule[]>([]);

    const [newKeyword, setNewKeyword] = useState("");
    const [newCategory, setNewCategory] = useState("");

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

    async function handleSaveUserRule() {
        const cleanedKeyword = normalizeText(newKeyword.trim());
        const cleanedCategory = normalizeCategory(newCategory);

        if (cleanedKeyword === "" || cleanedCategory === "") {
            return;
        }

        const ruleExists = activeUserCategoryRules.some(
            (rule) => rule.keyword === cleanedKeyword,
        );

        if (ruleExists) {
            console.log("Bu anahtar kelime için zaten bir kural var.");
            return;
        }

        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            console.log("Kullanıcı bulunamadı:", userError);
            return;
        }

        const { data: savedRule, error: insertError } = await supabase
            .from("user_category_rules")
            .insert({
                user_id: userData.user.id,
                keyword: cleanedKeyword,
                category: cleanedCategory,
            })
            .select("id, keyword, category")
            .single();

        if (insertError) {
            console.log("Kural kaydedilemedi:", insertError);
            return;
        }

        if (!savedRule) {
            return;
        }

        setActiveUserCategoryRules([
            ...activeUserCategoryRules,
            savedRule,
        ]);

        setNewKeyword("");
        setNewCategory("");
    }

    async function handleDeleteUserRule(id: number) {
        const { error } = await supabase
            .from("user_category_rules")
            .delete()
            .eq("id", id);

        if (error) {
            console.log("Kural silinemedi:", error);
            return;
        }

        const updatedRules = activeUserCategoryRules.filter(
            (rule) => rule.id !== id,
        );

        setActiveUserCategoryRules(updatedRules);
    }

    useEffect(() => {
        loadUserCategoryRules();
    }, []);

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                Kategori Kuralları
            </h1>

            <p className="mt-2 text-slate-600">
                Kategori kurallarını buradan yönetebilirsin.
            </p>

            <div className="mt-6">
                <p className="text-sm text-slate-600">
                    Aktif kural sayısı: {activeUserCategoryRules.length}
                </p>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700">
                    Anahtar kelime
                </label>

                <input
                    type="text"
                    value={newKeyword}
                    onChange={(event) => setNewKeyword(event.target.value)}
                    placeholder="Örneğin: Netflix"
                    className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                    Kategori
                </label>

                <input
                    type="text"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    placeholder="Örneğin: Abonelik"
                    className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
            </div>

            <button
                type="button"
                onClick={handleSaveUserRule}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
                Kuralı kaydet
            </button>

            <section className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">
                    Kayıtlı Kurallar
                </h2>

                <div className="mt-3 space-y-2">
                    {activeUserCategoryRules.map((rule) => (
                        <div
                            key={rule.id}
                            className="flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow-sm"
                        >
                            <div>
                                <span className="font-medium text-slate-900">
                                    {rule.keyword}
                                </span>

                                <span className="text-slate-500">
                                    {" → "}
                                    {rule.category}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDeleteUserRule(rule.id)}
                                className="font-medium text-red-600"
                            >
                                Sil
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}