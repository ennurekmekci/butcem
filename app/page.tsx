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

function predictCategory(description: string): CategoryPrediction {
  const normalizedDescription = normalizeText(description);

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
  const transactions: Transaction[] = [
    {
      id: 1,
      description: "Harçlık",
      amount: 19000,
      transactionType: "income",
      status: "completed",
      date: "2026-07-20",
      category: "Harçlık",
    },
    {
      id: 2,
      description: "Bershka kot",
      amount: 1999,
      transactionType: "expense",
      status: "completed",
      date: "2026-07-29",
      category: predictCategory("Bershka kot").category ?? "Diğer",
    },
    {
      id: 3,
      description: "Market alışverişi",
      amount: 500,
      transactionType: "expense",
      status: "completed",
      date: "2026-07-30",
      category: predictCategory("Market alışverişi").category ?? "Diğer",
    },
    {
      id: 4,
      description: "KYK yurt",
      amount: 1200,
      transactionType: "expense",
      status: "planned",
      date: "2026-09-20",
      category: predictCategory("KYK yurt").category ?? "Diğer",
    },
  ];

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

  const matchedTest = predictCategory("Bershka pantolon");
  const noMatchTest = predictCategory("Sinema bileti");
  const ambiguousTest = predictCategory("Zara kira");

  console.log("Eşleşen test:", matchedTest);
  console.log("Eşleşmeyen test:", noMatchTest);
  console.log("Kararsız test:", ambiguousTest);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">BütçeM</h1>

      <p className="mt-2 text-slate-600">
        Gelir ve giderlerini kolayca takip et.
      </p>

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