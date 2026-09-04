"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const bestRule = matchedRules.reduce((bestRule, currentRule) => {
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
  });

  const bestMatchCount = countKeywordMatches(description, bestRule);

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

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

function formatDate(date: string): string {
  return date.split("-").reverse().join(".");
}

function normalizeText(text: string): string {
  return text.toLocaleLowerCase("tr-TR");
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

export default function Home() {

  const [activeUserCategoryRules, setActiveUserCategoryRules] =
    useState<UserCategoryRule[]>([]);

  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newTransactionType, setNewTransactionType] =
    useState<TransactionType>("expense");
  const [newStatus, setNewStatus] =
    useState<TransactionStatus>("completed");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newTransactionCategory, setNewTransactionCategory] =
    useState("");
  const [isCategoryManuallyEdited, setIsCategoryManuallyEdited] =
    useState(false);

  const [saveCategoryRule, setSaveCategoryRule] = useState(false);

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
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, description, amount, transaction_type, status, date, category",
      );

    if (error) {
      console.log("İşlemler getirilemedi:", error);
      return;
    }

    console.log("Supabase transactions data:", data);

    const formattedTransactions = data.map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      transactionType: transaction.transaction_type,
      status: transaction.status,
      date: transaction.date,
      category: transaction.category,
    }));

    console.log("Formatted transactions:", formattedTransactions);

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

    if (!error) {
      await loadUserCategoryRules();
      await loadTransactions();
    }
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

    setActiveUserCategoryRules([]);
    setTransactions([]);
  }

  async function handleAddTransaction() {
    const cleanedDescription = newDescription.trim();
    const amountNumber = Number(newAmount);
    const cleanedCategory =
      newTransactionCategory.trim() || "Diğer";

    if (!cleanedDescription || amountNumber <= 0) {
      console.log("Geçerli bir açıklama ve tutar gir.");
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.log("Kullanıcı bilgisi alınamadı:", userError);
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
      ...transactions,
      formattedTransaction,
    ]);

    setNewDescription("");
    setNewAmount("");
    setNewTransactionType("expense");
    setNewStatus("completed");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewTransactionCategory("");
    setIsCategoryManuallyEdited(false);
    setSaveCategoryRule(false);

    console.log({
      cleanedDescription,
      amountNumber,
      newTransactionType,
      newStatus,
      newDate,
      cleanedCategory,
    });
  }

  async function handleSaveUserRule() {
    const cleanedKeyword = normalizeText(newKeyword.trim());
    const cleanedCategory = newCategory.trim();

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

    console.log("Kural Supabase'e kaydedildi.");

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

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

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

      <div className="mt-4 flex items-center gap-4">

        <p className="text-sm text-slate-600">
          Aktif kural sayısı: {activeUserCategoryRules.length}
        </p>
      </div>

      <div className="mt-4">
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

      <div className="mt-6">
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
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Toplam Bakiye</p>

        <p className="mt-2 text-3xl font-semibold text-slate-900">
          {formatMoney(totalBalance)} TL
        </p>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bu Ay Gelir</p>

          <p className="mt-2 text-2xl font-semibold text-green-600">
            {formatMoney(totalIncome)} TL
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bu Ay Gider</p>

          <p className="mt-2 text-2xl font-semibold text-red-600">
            {formatMoney(totalExpense)} TL
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Yeni İşlem Ekle
        </h2>

        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Açıklama"
        />

        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Tutar"
        />

        <select
          value={newTransactionType}
          onChange={(e) =>
            setNewTransactionType(e.target.value as TransactionType)
          }
        >
          <option value="expense">Gider</option>
          <option value="income">Gelir</option>
        </select>

        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />

        <input
          type="text"
          value={newTransactionCategory}
          onChange={(e) => {
            setNewTransactionCategory(e.target.value);
            setIsCategoryManuallyEdited(true);
          }}
          placeholder="Kategori"
        />

        <label>
          <input
            type="checkbox"
            checked={saveCategoryRule}
            onChange={(e) => setSaveCategoryRule(e.target.checked)}
          />
          Bu kategori seçimini kural olarak kaydet
        </label>

        <button
          type="button"
          onClick={handleAddTransaction}
        >
          İşlem Ekle
        </button>

      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Son İşlemler</h2>

        <div className="mt-4 space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-xl bg-white p-4 shadow-sm"
            >
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
                {transaction.status === "completed" ? "Tamamlandı" : "Planlandı"}
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
          ))}
        </div>
      </section>
    </main>
  );
}