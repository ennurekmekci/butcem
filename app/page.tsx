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

function normalizeCategory(category: string): string {
  const cleanedCategory =
    category.trim().toLocaleLowerCase("tr-TR");

  return (
    cleanedCategory.charAt(0).toLocaleUpperCase("tr-TR") +
    cleanedCategory.slice(1)
  );
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

function getLocalDateString(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Home() {

  const [activeUserCategoryRules, setActiveUserCategoryRules] =
    useState<UserCategoryRule[]>([]);

  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const [editingTransactionId, setEditingTransactionId] =
    useState<number | null>(null);

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
        "id, description, amount, transaction_type, status, date, category, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.log("İşlemler getirilemedi:", error);
      return;
    }

    const today = getLocalDateString();

    const duePlannedTransactions = data.filter(
      (transaction) =>
        transaction.status === "planned" &&
        transaction.date <= today,
    );

    console.log(
      "Tarihi gelmiş planned işlemler:",
      duePlannedTransactions,
    );

    for (const transaction of duePlannedTransactions) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.log(
          "Planlanan işlem tamamlanamadı:",
          updateError,
        );
      }
    }

    let finalData = data;

    if (duePlannedTransactions.length > 0) {
      const { data: updatedData, error: updatedDataError } =
        await supabase
          .from("transactions")
          .select(
            "id, description, amount, transaction_type, status, date, category, created_at, updated_at",
          )
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

      if (updatedDataError) {
        console.log(
          "Güncel işlemler getirilemedi:",
          updatedDataError,
        );
        return;
      }

      finalData = updatedData;
    }

    console.log("Supabase transactions data:", finalData);

    const formattedTransactions = finalData.map((transaction) => ({
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
    async function initializeApp() {
      const { data } = await supabase.auth.getSession();

      console.log(
        "Sayfa açıldığında session var mı:",
        data.session !== null,
      );

      if (!data.session) {
        setActiveUserCategoryRules([]);
        setTransactions([]);
        return;
      }

      await loadUserCategoryRules();
      await loadTransactions();
    }

    initializeApp();
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
        console.log("Kategori kuralı kaydedilemedi:", ruleInsertError);
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
        console.log("Kategori kuralı güncellenemedi:", ruleUpdateError);
      }

      if (!ruleUpdateError) {
        const updatedRules = activeUserCategoryRules.map((rule) =>
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

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const monthlyIncomeTransactions = transactions.filter(
    (transaction) => {
      const [year, month] = transaction.date
        .split("-")
        .map(Number);

      return (
        transaction.transactionType === "income" &&
        transaction.status === "completed" &&
        year === currentYear &&
        month === currentMonth
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
        month === currentMonth
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
            {formatMoney(monthlyIncome)} TL
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bu Ay Gider</p>

          <p className="mt-2 text-2xl font-semibold text-red-600">
            {formatMoney(monthlyExpense)} TL
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {editingTransactionId === null ? "Yeni İşlem Ekle" : "İşlemi Düzenle"}
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
              setNewTransactionType(e.target.value as TransactionType)
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
                onChange={(e) => setNewRuleKeyword(e.target.value)}
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
            {editingTransactionId === null ? "İşlem Ekle" : "Güncelle"}
          </button>

          {editingTransactionId !== null && (
            <button
              type="button"
              onClick={() => {
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
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              İptal
            </button>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Son İşlemler</h2>

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
    </main>
  );
}