/**
 * QUANTIX ELITE v2.5.3 - PRODUCTION CONFIGURATION
 * Live Safety Protocols & Environment Settings
 */

export const PRODUCTION_CONFIG = {
    // Railway Production API
    API_BASE_URL: 'https://web-production-fbb05.up.railway.app',

    // Data Compliance Settings (Chế độ 1: Strict Data Compliance)
    MAX_DATA_DELAY_SECONDS: 60,
    PRICE_POLLING_INTERVAL_MS: 3000, // 3s refresh for smooth price updates

    // Sniper Execution Threshold (Chế độ 2: Sniper Execution)
    MIN_CONFIDENCE_THRESHOLD: 95,
    REQUIRE_AGENT_CONSENSUS: true,

    // Anti-Conflict Settings (Chế độ 3: Anti-Conflict Logic)
    AUTO_HIDE_OLD_SIGNALS: true,
    SIGNAL_EXPIRY_HOURS: 4,

    // Alert & Warning Settings
    ENABLE_DELAY_WARNING: true,
    ENABLE_CONFLICT_DETECTION: true,
    ENABLE_PRICE_STALENESS_CHECK: true,

    // Fallback Configuration
    ENABLE_YAHOO_FALLBACK: true,
    MAX_ALPHA_VANTAGE_FAILURES: 3
};

export default PRODUCTION_CONFIG;
