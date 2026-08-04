type TransactionType = "income" | "expense";
type TransactionStatus = "completed" | "planned";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  date: string;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR");
}

function formatDate(date: string): string {
  return date.split("-").reverse().join(".");
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
    },
    {
      id: 2,
      description: "Bershka kot",
      amount: 1999,
      transactionType: "expense",
      status: "completed",
      date: "2026-07-29",
    },
    {
      id: 3,
      description: "Market alışverişi",
      amount: 500,
      transactionType: "expense",
      status: "completed",
      date: "2026-07-30",
    },
    {
      id: 4,
      description: "KYK yurt",
      amount: 1200,
      transactionType: "expense",
      status: "planned",
      date: "2026-09-20",
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