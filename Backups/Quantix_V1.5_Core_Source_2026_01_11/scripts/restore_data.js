/**
 * ♻️ AUTOMATED RESTORE SCRIPT (PROTOCOL PHOENIX)
 * Purpose: Import CSV backups back into Supabase
 * Usage: node scripts/restore_data.js
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '6543'),
    ssl: { rejectUnauthorized: false }
});

const BACKUP_DIR = './Backups/Data/2026_01_11'; // Hoặc đường dẫn file giải nén

async function importCSVToTable(tableName, filePath) {
    console.log(`♻️ Restoring table: ${tableName}...`);

    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ Backup file not found: ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');

    // Skip header, filter empty lines
    const dataRows = lines.slice(1).filter(line => line.trim());

    if (dataRows.length === 0) {
        console.log(`   ℹ️ No data to restore for ${tableName}`);
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Simple batch insert strategy
        // Note: For huge datasets, COPY command is better, but this works for restoration scripts
        for (const line of dataRows) {
            // Handle simple CSV parsing (assumes no complex quoted commas for simplicity of this script)
            // For production robustness, use a CSV parser library like 'csv-parse'
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, ''));

            // Construct param placeholders ($1, $2...)
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

            const query = `
                INSERT INTO ${tableName} (${headers.join(',')})
                VALUES (${placeholders})
                ON CONFLICT DO NOTHING -- Avoid duplicates if data exists
            `;

            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log(`   ✅ Restored ${dataRows.length} records to ${tableName}`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Error restoring ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🔥 INITIATING PROTOCOL PHOENIX (DATA RESTORE)...');

    // Order matters due to Foreign Keys!
    // 1. Assets Master (Parent)
    // 2. Market Data (Child)
    // 3. AI Signals (Child)

    // Note: Adjust paths if you unzip elsewhere. This assumes standard structure.
    // If running from backup root: 'Data_Snapshot/assets_master.csv'

    // Auto-detect backup location logic could be added here

    try {
        await importCSVToTable('assets_master', path.join(BACKUP_DIR, 'assets_master.csv'));
        await importCSVToTable('market_data', path.join(BACKUP_DIR, 'market_data.csv'));
        await importCSVToTable('ai_signals', path.join(BACKUP_DIR, 'ai_signals.csv'));

        console.log('\n✨ SYSTEM RESTORATION COMPLETE!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
