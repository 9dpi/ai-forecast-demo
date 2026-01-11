/**
 * 💾 AUTOMATED BACKUP SCRIPT
 * Purpose: Export tables to CSV for offline storage
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

const BACKUP_DIR = './Backups/Data/2026_01_11';

async function exportTableToCSV(tableName) {
    console.log(`📦 Backing up table: ${tableName}...`);
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT * FROM ${tableName}`);
        const rows = res.rows;

        if (rows.length === 0) {
            console.log(`   ⚠️ Table ${tableName} is empty.`);
            return;
        }

        // Generate CSV Header
        const headers = Object.keys(rows[0]);
        const csvRows = [headers.join(',')];

        // Generate CSV Rows
        for (const row of rows) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null) return '';
                if (val instanceof Date) return val.toISOString();
                // Escape quotes and wrap in quotes if contains comma
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csvRows.push(values.join(','));
        }

        const filePath = path.join(BACKUP_DIR, `${tableName}.csv`);
        fs.writeFileSync(filePath, csvRows.join('\n'));
        console.log(`   ✅ Saved ${rows.length} records to ${filePath}`);

    } catch (e) {
        console.error(`   ❌ Error backing up ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🚀 STARTING DATA SNAPSHOT...');
    try {
        await exportTableToCSV('market_data');
        await exportTableToCSV('ai_signals');
        await exportTableToCSV('assets_master');
        console.log('\n✅ DATA SNAPSHOT COMPLETE!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
