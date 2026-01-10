import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role key for admin access
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://gvglzvjsexeaectypkyk.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

/**
 * API Endpoint: Receive Signal from Quantix AI Core
 * POST /api/v1/internal/signals
 * 
 * This endpoint receives signals from the Core system and stores them in Supabase.
 * It validates authentication, signal format, and handles database upserts.
 */

export async function receiveSignal(req, res) {
    // Security: Verify internal authentication
    const authHeader = req.headers['x-auth-token'];

    if (!INTERNAL_AUTH_KEY) {
        console.error('⚠️ INTERNAL_AUTH_KEY not configured!');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (authHeader !== INTERNAL_AUTH_KEY) {
        console.warn('🚫 Unauthorized signal attempt from:', req.ip);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const signal = req.body;

        // Validate required fields
        if (!signal.signal_id || !signal.pair || !signal.type || !signal.entry_price) {
            console.error('❌ Invalid signal format:', signal);
            return res.status(400).json({
                error: 'Invalid signal format',
                required: ['signal_id', 'pair', 'type', 'entry_price']
            });
        }

        console.log(`📥 Received signal ${signal.signal_id} for ${signal.pair} ${signal.type}`);

        // Transform signal to database schema
        const dbSignal = {
            id: signal.signal_id,
            symbol: signal.pair.replace('/', '') + '=X', // EUR/USD -> EURUSD=X
            timestamp_utc: signal.timestamp,
            predicted_close: signal.entry_price,
            confidence_score: signal.confidence_score,
            signal_type: signal.type === 'BUY' ? 'LONG' : 'SHORT',
            signal_status: signal.status || 'WAITING',
            sl_price: signal.sl,
            tp1_price: signal.metadata?.tp1_price || signal.tp,
            tp2_price: signal.metadata?.tp2_price || signal.tp,
            current_price: signal.entry_price, // Initial price
            model_version: signal.version,
            is_published: true,
            created_at: signal.timestamp
        };

        // Upsert to database (insert or update if exists)
        const { data, error } = await supabase
            .from('ai_signals')
            .upsert(dbSignal, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log(`✅ Signal ${signal.signal_id} stored successfully`);

        // Optional: Send Telegram notification for high-confidence signals
        if (signal.confidence_score >= 90) {
            // await sendTelegramAlert(signal);
            console.log(`📢 High-confidence signal (${signal.confidence_score}%) - Telegram alert queued`);
        }

        return res.status(200).json({
            success: true,
            message: 'Signal received and processed',
            signal_id: signal.signal_id,
            stored_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Signal processing error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * API Endpoint: Update Signal Status
 * PATCH /api/v1/internal/signals/status
 * 
 * Updates the status of an existing signal (e.g., ENTRY_HIT, TP1_HIT, EXPIRED)
 */
export async function updateSignalStatus(req, res) {
    // Security check
    const authHeader = req.headers['x-auth-token'];
    if (authHeader !== INTERNAL_AUTH_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { signal_id, status, current_price } = req.body;

        if (!signal_id || !status) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['signal_id', 'status']
            });
        }

        console.log(`📝 Updating signal ${signal_id} to ${status}`);

        const { data, error } = await supabase
            .from('ai_signals')
            .update({
                signal_status: status,
                current_price: current_price,
                last_checked_at: new Date().toISOString()
            })
            .eq('id', signal_id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Signal not found' });
        }

        console.log(`✅ Signal ${signal_id} updated to ${status}`);

        return res.status(200).json({
            success: true,
            message: 'Signal status updated',
            signal_id,
            new_status: status
        });

    } catch (error) {
        console.error('❌ Status update error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * API Endpoint: Health Check
 * GET /api/v1/internal/health
 * 
 * Simple endpoint to verify the API is running
 */
export async function healthCheck(req, res) {
    const authHeader = req.headers['x-auth-token'];
    if (authHeader !== INTERNAL_AUTH_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Test database connection
        const { data, error } = await supabase
            .from('ai_signals')
            .select('id')
            .limit(1);

        if (error) throw error;

        return res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        return res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
}

// Export handlers for use in Express/Vite server
export default {
    receiveSignal,
    updateSignalStatus,
    healthCheck
};
