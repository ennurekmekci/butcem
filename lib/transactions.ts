import { supabase } from "@/lib/supabase";

function getLocalDateString(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export async function updateDuePlannedTransactions() {
    const today = getLocalDateString();

    const { data, error } = await supabase
        .from("transactions")
        .select("id, status, date")
        .eq("status", "planned")
        .lte("date", today);

    if (error) {
        console.log("Planlanan işlemler getirilemedi:", error);
        return;
    }

    for (const transaction of data) {
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
}