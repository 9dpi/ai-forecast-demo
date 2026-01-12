/**
 * QUANTIX CORE V1.8 - MARKET SENTINEL AGENT
 * Specialization: News Monitoring, Economic Calendar, Market Sentiment
 * Decision Output: APPROVE/REJECT + Sentiment Score (-50 to +50)
 */

import { agentBus, CHANNELS } from './bus.js';
import fetch from 'node-fetch';

class SentinelAgent {
    constructor() {
        this.name = 'SENTINEL_AGENT';
        this.newsCache = [];
        this.economicCalendar = [];
        this.lastNewsFetch = null;

        // High-impact news keywords that trigger rejection
        this.criticalKeywords = [
            'NFP', 'NON-FARM', 'PAYROLL',
            'FOMC', 'FED RATE', 'INTEREST RATE',
            'ECB', 'CENTRAL BANK',
            'GDP', 'INFLATION', 'CPI',
            'UNEMPLOYMENT', 'JOBS REPORT',
            'GEOPOLITICAL', 'WAR', 'CRISIS'
        ];

        this._initializeListeners();
        this._startNewsMonitoring();
    }

    /**
     * Main sentiment analysis function
     */
    async analyze(marketData) {
        const startTime = Date.now();
        console.log(`[${this.name}] Starting sentiment analysis...`);

        try {
            // 1. Check for upcoming high-impact news (next 2 hours)
            const upcomingNews = await this._checkUpcomingNews(2);

            if (upcomingNews.hasHighImpact) {
                return this._rejectSignal('HIGH_IMPACT_NEWS_PENDING', {
                    newsEvent: upcomingNews.events[0],
                    timeUntil: upcomingNews.minutesUntil,
                    reason: `High-impact news "${upcomingNews.events[0].title}" in ${upcomingNews.minutesUntil} minutes`
                });
            }

            // 2. Analyze recent news sentiment
            const newsSentiment = await this._analyzeRecentNews();

            // 3. Check market volatility indicators
            const volatilityScore = this._assessVolatility(marketData);

            // 4. Calculate composite sentiment score (-50 to +50)
            const sentimentScore = Math.round(
                (newsSentiment.score * 0.6) +
                (volatilityScore * 0.4)
            );

            // 5. Decision logic
            let decision = 'APPROVE';
            let reasoning = '';

            if (sentimentScore < -30) {
                decision = 'REJECT';
                reasoning = `Negative market sentiment (${sentimentScore})`;
            } else if (newsSentiment.hasCriticalNews) {
                decision = 'REJECT';
                reasoning = `Critical news detected: ${newsSentiment.criticalNews}`;
            } else {
                reasoning = `Market conditions favorable (Sentiment: ${sentimentScore})`;
            }

            const result = {
                agent: this.name,
                decision,
                sentimentScore,
                details: {
                    newsSentiment: newsSentiment.score,
                    volatilityScore,
                    recentNewsCount: this.newsCache.length,
                    criticalNewsDetected: newsSentiment.hasCriticalNews,
                    upcomingHighImpact: upcomingNews.hasHighImpact,
                    processingTime: `${Date.now() - startTime}ms`
                },
                reasoning
            };

            console.log(`[${this.name}] Analysis complete: ${decision} (Sentiment: ${sentimentScore})`);

            // Publish result to bus
            agentBus.publish(CHANNELS.SENTIMENT_CHECK, result);

            return result;

        } catch (error) {
            console.error(`[${this.name}] Analysis error:`, error);
            // On error, default to APPROVE with neutral sentiment (fail-safe)
            return {
                agent: this.name,
                decision: 'APPROVE',
                sentimentScore: 0,
                details: { error: error.message },
                reasoning: 'Sentiment check failed, defaulting to neutral'
            };
        }
    }

    /**
     * Check for upcoming high-impact news events
     */
    async _checkUpcomingNews(hoursAhead = 2) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

        // Filter economic calendar for upcoming events
        const upcomingEvents = this.economicCalendar.filter(event => {
            const eventTime = new Date(event.timestamp);
            return eventTime > now && eventTime < futureTime && event.impact === 'HIGH';
        });

        if (upcomingEvents.length > 0) {
            const nextEvent = upcomingEvents[0];
            const minutesUntil = Math.round((new Date(nextEvent.timestamp) - now) / 60000);

            return {
                hasHighImpact: true,
                events: upcomingEvents,
                minutesUntil
            };
        }

        return { hasHighImpact: false, events: [], minutesUntil: null };
    }

    /**
     * Analyze recent news for sentiment
     */
    async _analyzeRecentNews() {
        if (this.newsCache.length === 0) {
            return { score: 0, hasCriticalNews: false, criticalNews: null };
        }

        let sentimentSum = 0;
        let criticalNewsDetected = false;
        let criticalNewsTitle = null;

        // Analyze last 10 news items
        const recentNews = this.newsCache.slice(-10);

        for (const news of recentNews) {
            // Check for critical keywords
            const titleUpper = news.title.toUpperCase();
            const hasCritical = this.criticalKeywords.some(keyword =>
                titleUpper.includes(keyword)
            );

            if (hasCritical) {
                criticalNewsDetected = true;
                criticalNewsTitle = news.title;
                sentimentSum -= 30; // Heavy penalty for critical news
            } else {
                // Simple sentiment based on keywords
                if (titleUpper.includes('RISE') || titleUpper.includes('UP') || titleUpper.includes('GAIN')) {
                    sentimentSum += 5;
                } else if (titleUpper.includes('FALL') || titleUpper.includes('DOWN') || titleUpper.includes('DROP')) {
                    sentimentSum -= 5;
                }
            }
        }

        const avgSentiment = recentNews.length > 0 ? sentimentSum / recentNews.length : 0;

        return {
            score: Math.max(-50, Math.min(50, avgSentiment)), // Clamp to -50/+50
            hasCriticalNews: criticalNewsDetected,
            criticalNews: criticalNewsTitle
        };
    }

    /**
     * Assess market volatility
     */
    _assessVolatility(marketData) {
        if (!marketData.prices || marketData.prices.length < 20) return 0;

        // Calculate standard deviation of recent prices
        const recentPrices = marketData.prices.slice(-20);
        const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recentPrices.length;
        const stdDev = Math.sqrt(variance);

        // Normalize to -50/+50 scale (lower volatility = positive score)
        const volatilityRatio = stdDev / mean;

        if (volatilityRatio < 0.001) return 30; // Low volatility - good
        if (volatilityRatio < 0.002) return 10; // Normal volatility
        if (volatilityRatio < 0.005) return -10; // High volatility
        return -30; // Extreme volatility - bad
    }

    /**
     * Fetch news from Alpha Vantage (or fallback to mock data)
     */
    async _fetchNews() {
        try {
            const apiKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
            const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=FOREX:EUR&apikey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.feed && Array.isArray(data.feed)) {
                this.newsCache = data.feed.slice(0, 20).map(item => ({
                    title: item.title,
                    summary: item.summary,
                    timestamp: item.time_published,
                    sentiment: item.overall_sentiment_score
                }));

                console.log(`[${this.name}] Fetched ${this.newsCache.length} news items`);
            }
        } catch (error) {
            console.warn(`[${this.name}] News fetch failed, using cached data:`, error.message);
        }

        this.lastNewsFetch = new Date();
    }

    /**
     * Fetch economic calendar (mock implementation - replace with real API)
     */
    async _fetchEconomicCalendar() {
        // TODO: Integrate with ForexFactory or Investing.com API
        // For now, using mock data
        this.economicCalendar = [
            {
                title: 'US Non-Farm Payrolls',
                timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
                impact: 'HIGH',
                currency: 'USD'
            }
        ];
    }

    /**
     * Start background news monitoring
     */
    _startNewsMonitoring() {
        // Fetch news immediately
        this._fetchNews();
        this._fetchEconomicCalendar();

        // Refresh news every 15 minutes
        setInterval(() => {
            this._fetchNews();
        }, 15 * 60 * 1000);

        // Refresh economic calendar every hour
        setInterval(() => {
            this._fetchEconomicCalendar();
        }, 60 * 60 * 1000);

        console.log(`[${this.name}] News monitoring started (refresh: 15min)`);
    }

    /**
     * Reject signal helper
     */
    _rejectSignal(reason, details) {
        return {
            agent: this.name,
            decision: 'REJECT',
            sentimentScore: -50,
            reason,
            details
        };
    }

    /**
     * Initialize event listeners
     */
    _initializeListeners() {
        agentBus.subscribe(CHANNELS.MARKET_DATA, async (message) => {
            if (message.data.requestSentiment) {
                await this.analyze(message.data);
            }
        });
    }

    /**
     * Manual news injection (for testing)
     */
    injectNews(newsItem) {
        this.newsCache.push({
            title: newsItem.title,
            summary: newsItem.summary || '',
            timestamp: new Date().toISOString(),
            sentiment: newsItem.sentiment || 0
        });
        console.log(`[${this.name}] News injected: ${newsItem.title}`);
    }

    /**
     * Manual economic event injection (for testing)
     */
    injectEconomicEvent(event) {
        this.economicCalendar.push(event);
        console.log(`[${this.name}] Economic event injected: ${event.title}`);
    }
}

// Export singleton instance
export const sentinelAgent = new SentinelAgent();
console.log('[SENTINEL_AGENT] Market Sentinel Agent initialized ✅');
