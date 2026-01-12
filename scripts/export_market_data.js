import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }
});

async function exportData() {
    console.log("📡 Đang kết nối Supabase để trích xuất dữ liệu lịch sử...");

    try {
        const query = `
            SELECT timestamp_utc, open, high, low, close, volume 
            FROM market_data 
            WHERE symbol = 'EURUSD=X'
            ORDER BY timestamp_utc ASC
        `;

        const res = await pool.query(query);

        if (res.rows.length === 0) {
            console.log("⚠️ Không tìm thấy dữ liệu trong bảng market_data.");
            return;
        }

        const csvHeader = "timestamp,open,high,low,close,volume\n";
        const csvRows = res.rows.map(r =>
            `${r.timestamp_utc.toISOString()},${r.open},${r.high},${r.low},${r.close},${r.volume}`
        ).join("\n");

        const outputPath = path.join(__dirname, '../Quantix_Lab/data/history_2025.csv');
        fs.writeFileSync(outputPath, csvHeader + csvRows);

        console.log(`✅ Đã trích xuất ${res.rows.length} bản ghi.`);
        console.log(`📂 File đã lưu tại: ${outputPath}`);

    } catch (err) {
        console.error("❌ Trích xuất dữ liệu thất bại:", err.message);
    } finally {
        await pool.end();
    }
}

exportData();
