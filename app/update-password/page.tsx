"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState("");

    async function handleUpdatePassword() {
        const cleanedPassword = newPassword.trim();

        if (cleanedPassword.length < 6) {
            console.log("Şifre en az 6 karakter olmalı.");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: cleanedPassword,
        });

        if (error) {
            console.log("Şifre güncellenemedi:", error);
            return;
        }

        console.log("Şifre başarıyla güncellendi.");
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">
                    Yeni Şifre Belirle
                </h1>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700">
                        Yeni şifre
                    </label>

                    <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />

                    <button
                        type="button"
                        onClick={handleUpdatePassword}
                        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
                    >
                        Şifreyi Güncelle
                    </button>
                </div>
            </div>
        </main>
    );
}