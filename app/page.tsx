"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignUp() {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    console.log("Kayıt olan kullanıcı:", data.user?.email);
    console.log("Kayıt hatası:", error);
  }

  async function handleSignIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    console.log("Giriş yapan kullanıcı:", data.user?.email);
    console.log("Kullanıcı ID:", data.user?.id);
    console.log("Session oluştu mu:", data.session !== null);
    console.log("Sign in error:", error);
  }

  async function handleForgotPassword() {
    const cleanedEmail = email.trim();

    if (cleanedEmail === "") {
      console.log("E-posta adresi boş olamaz.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanedEmail,
      {
        redirectTo: "http://localhost:3000/update-password",
      },
    );

    if (error) {
      console.log("Şifre sıfırlama maili gönderilemedi:", error);
      return;
    }

    console.log("Şifre sıfırlama maili gönderildi.");
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Çıkış hatası:", error);
      return;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">BütçeM</h1>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Hesap
        </h2>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            E-posta
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@mail.com"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Şifre
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Şifren"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>

        <button
          type="button"
          onClick={handleSignUp}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
        >
          Kayıt Ol
        </button>

        <button
          type="button"
          onClick={handleSignIn}
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-900"
        >
          Giriş Yap
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="mt-2 w-full text-sm font-medium text-slate-600"
        >
          Şifremi Unuttum
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 w-full rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600"
        >
          Çıkış Yap
        </button>

      </div>

      <p className="mt-2 text-slate-600">
        Gelir ve giderlerini kolayca takip et.
      </p>
    </main>
  );
}