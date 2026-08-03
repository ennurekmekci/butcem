export default function Home() {
  const totalIncome = 19000;
  const totalExpense = 1999;
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
          {totalBalance} TL
        </p>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bu Ay Gelir</p>

          <p className="mt-2 text-2xl font-semibold text-green-600">
            {totalIncome} TL
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bu Ay Gider</p>

          <p className="mt-2 text-2xl font-semibold text-red-600">
            {totalExpense} TL
          </p>
        </div>
      </section>
    </main>
  );
}