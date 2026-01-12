import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role key for admin access
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://gvglzvjsexeaectypkyk.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * CLEANUP SCRIPT: Remove Test & Corrupted Signals
 * 
 * This script removes:
 * 1. Signals with null entry_price (legacy data before fallback mechanism)
 * 2. Test signals (signal_id contains 'TEST_')
 * 3. Signals older than 7 days with WAITING status (stale signals)
 */

async function cleanupDatabase() {
    console.log('🧹 Starting Database Cleanup...\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Find signals with null entry_price
        console.log('\n📊 Step 1: Identifying signals with null entry_price...');
        const { data: nullEntrySignals, error: nullError } = await supabase
            .from('ai_signals')
            .select('id, symbol, signal_type, created_at')
            .is('entry_price', null);

        if (nullError) throw nullError;

        console.log(`   Found: ${nullEntrySignals?.length || 0} signals with null entry_price`);
        if (nullEntrySignals && nullEntrySignals.length > 0) {
            nullEntrySignals.forEach(s => {
                console.log(`   - ${s.id.substring(0, 8)}... | ${s.symbol} ${s.signal_type} | ${new Date(s.created_at).toLocaleString()}`);
            });
        }

        // Step 2: Find test signals (filter in JavaScript since UUID doesn't support LIKE)
        console.log('\n📊 Step 2: Identifying test signals...');
        const { data: allSignals, error: allError } = await supabase
            .from('ai_signals')
            .select('id, symbol, signal_type, created_at');

        if (allError) throw allError;

        // Filter test signals in JavaScript
        const testSignals = allSignals?.filter(s =>
            s.id.toString().includes('TEST_')
        ) || [];

        console.log(`   Found: ${testSignals?.length || 0} test signals`);
        if (testSignals && testSignals.length > 0) {
            testSignals.forEach(s => {
                console.log(`   - ${s.id} | ${s.symbol} ${s.signal_type}`);
            });
        }

        // Step 3: Find stale WAITING signals (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log('\n📊 Step 3: Identifying stale WAITING signals (>7 days)...');
        const { data: staleSignals, error: staleError } = await supabase
            .from('ai_signals')
            .select('id, symbol, signal_type, created_at')
            .eq('signal_status', 'WAITING')
            .lt('created_at', sevenDaysAgo.toISOString());

        if (staleError) throw staleError;

        console.log(`   Found: ${staleSignals?.length || 0} stale signals`);
        if (staleSignals && staleSignals.length > 0) {
            staleSignals.forEach(s => {
                console.log(`   - ${s.id.substring(0, 8)}... | ${s.symbol} ${s.signal_type} | ${new Date(s.created_at).toLocaleString()}`);
            });
        }

        // Calculate total to delete
        const totalToDelete = (nullEntrySignals?.length || 0) +
            (testSignals?.length || 0) +
            (staleSignals?.length || 0);

        console.log('\n' + '='.repeat(60));
        console.log(`📋 CLEANUP SUMMARY:`);
        console.log(`   - Null entry_price: ${nullEntrySignals?.length || 0}`);
        console.log(`   - Test signals: ${testSignals?.length || 0}`);
        console.log(`   - Stale WAITING: ${staleSignals?.length || 0}`);
        console.log(`   - TOTAL TO DELETE: ${totalToDelete}`);
        console.log('='.repeat(60));

        if (totalToDelete === 0) {
            console.log('\n✅ Database is already clean! No action needed.');
            return;
        }

        console.log('\n⚠️  CONFIRMATION REQUIRED:');
        console.log('   This will permanently delete the signals listed above.');
        console.log('   To proceed, run this script with --confirm flag:');
        console.log('   node scripts/cleanup_database.js --confirm\n');

        // Check for --confirm flag
        if (process.argv.includes('--confirm')) {
            console.log('🚀 Proceeding with cleanup...\n');

            let deletedCount = 0;

            // Delete null entry_price signals
            if (nullEntrySignals && nullEntrySignals.length > 0) {
                const { error: deleteNullError } = await supabase
                    .from('ai_signals')
                    .delete()
                    .is('entry_price', null);

                if (deleteNullError) throw deleteNullError;
                deletedCount += nullEntrySignals.length;
                console.log(`✅ Deleted ${nullEntrySignals.length} signals with null entry_price`);
            }

            // Delete test signals
            if (testSignals && testSignals.length > 0) {
                const testIds = testSignals.map(s => s.id);
                const { error: deleteTestError } = await supabase
                    .from('ai_signals')
                    .delete()
                    .in('id', testIds);

                if (deleteTestError) throw deleteTestError;
                deletedCount += testSignals.length;
                console.log(`✅ Deleted ${testSignals.length} test signals`);
            }

            // Delete stale signals
            if (staleSignals && staleSignals.length > 0) {
                const { error: deleteStaleError } = await supabase
                    .from('ai_signals')
                    .delete()
                    .eq('signal_status', 'WAITING')
                    .lt('created_at', sevenDaysAgo.toISOString());

                if (deleteStaleError) throw deleteStaleError;
                deletedCount += staleSignals.length;
                console.log(`✅ Deleted ${staleSignals.length} stale WAITING signals`);
            }

            console.log('\n' + '='.repeat(60));
            console.log(`🎉 CLEANUP COMPLETE!`);
            console.log(`   Total deleted: ${deletedCount} signals`);
            console.log('='.repeat(60));

            // Verify final state
            const { data: remainingSignals, error: countError } = await supabase
                .from('ai_signals')
                .select('id', { count: 'exact', head: true });

            if (!countError) {
                console.log(`\n📊 Remaining signals in database: ${remainingSignals?.length || 0}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

cleanupDatabase();
