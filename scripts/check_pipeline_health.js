import { supabase } from '../backend/supabaseClient.js';

async function checkPipeline() {
    console.log("🔍 Checking Quantix Elite Pipeline Activity...");

    // 1. Check last market update
    const { data: snapshot, error: snapError } = await supabase
        .from('market_snapshot')
        .select('symbol, price, last_updated')
        .order('last_updated', { ascending: false })
        .limit(5);

    if (snapError) {
        console.error("❌ Database Error (Snapshot):", snapError);
    } else {
        console.log("\n📊 Latest Market Updates:");
        snapshot.forEach(s => {
            const delay = (new Date() - new Date(s.last_updated)) / 1000;
            console.log(`- ${s.symbol}: $${s.price} | Last: ${s.last_updated} (${delay.toFixed(1)}s ago)`);
        });
    }

    // 2. Check last AI Signal
    const { data: signals, error: sigError } = await supabase
        .from('ai_signals')
        .select('symbol, confidence_score, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (sigError) {
        console.error("❌ Database Error (Signals):", sigError);
    } else if (signals && signals.length > 0) {
        console.log(`\n🎯 Latest AI Signal: ${signals[0].symbol} | Conf: ${signals[0].confidence_score}% | Time: ${signals[0].created_at}`);
    } else {
        console.log("\n🎯 No AI signals found in recent history.");
    }

    process.exit();
}

checkPipeline();
