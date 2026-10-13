"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
    const [email, setEmail] = useState("");
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const { data, error } = await supabase.auth.getUser();

            if (error || !data.user) {
                console.log("Kullanıcı bilgisi alınamadı:", error);
                return;
            }

            setEmail(data.user.email ?? "");
        }

        loadUser();
    }, []);

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.log("Çıkış hatası:", error);
            return;
        }

        router.push("/");
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-900">
                Hesap
            </h1>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                    E-posta
                </p>

                <p className="mt-1 font-medium text-slate-900">
                    {email}
                </p>

                <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                    Çıkış Yap
                </button>
            </div>

            <p className="mt-2 text-slate-600">
                Hesap bilgilerini buradan yönetebilirsin.
            </p>
        </>
    );
}