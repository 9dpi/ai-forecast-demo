-- Tạo tín hiệu EUR/USD mẫu để test Price Watchdog
INSERT INTO ai_signals (
    symbol, 
    signal_type, 
    predicted_close, 
    confidence_score, 
    is_published,
    signal_status,
    entry_price,
    sl_price,
    tp1_price,
    tp2_price
) VALUES (
    'EURUSD=X',
    'LONG',
    1.0520,  -- Entry price
    92,      -- AI Confidence
    TRUE,
    'WAITING',  -- Trạng thái ban đầu
    1.0520,     -- Entry
    1.0490,     -- Stop Loss
    1.0562,     -- Take Profit 1
    1.0604      -- Take Profit 2
);

-- Kiểm tra xem đã insert thành công chưa
SELECT * FROM ai_signals WHERE symbol = 'EURUSD=X' ORDER BY created_at DESC LIMIT 1;
