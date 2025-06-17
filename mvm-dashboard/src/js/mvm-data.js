// src/js/mvm-data.js

export const MVM_CONFIG = {
    LIVE_DATA: {
        mtplfPrice: 13.15,
        btcPrice: 107750,
        btcHeld: 10000,
        shares: 600710000,
        cash: 22000000,
        debt: 18000000,
        mstr: {
            mcap: 26_000_000_000,
            btcHeld: 226_331,
            price: 1450,
        }
    },
    MNAV_FACTORS: {
        basePremium: { value: 2.0 },
        beta: { label: "Leveraged BTC Beta", weight: 0.30, min: -1, max: 3, value: 1.5 },
        flows: { label: "Institutional Demand", weight: 0.25, min: -2, max: 2, value: 0.8 },
        sentiment: { label: "Market Sentiment", weight: 0.15, min: -2, max: 2, value: 0.5 },
        macro: { label: "Macro-Risk Environment", weight: 0.20, min: -2, max: 2, value: -0.2 },
        native: { label: "Crypto-Native Value", weight: 0.10, min: -2, max: 2, value: 0.1 },
    },
    Z_SCORE_SCALE: 5,
    HISTORICAL_DATA: [
        { date: '2024-07-01', btcPrice: 65000, actualPrice: 7.50, btcHeld: 10000, shares: 600000000, factors: { beta: 1.2, flows: 0.5, sentiment: 0.3, macro: 0.1, native: 0.2 } },
        { date: '2024-10-01', btcPrice: 85000, actualPrice: 9.80, btcHeld: 10000, shares: 600000000, factors: { beta: 1.8, flows: 1.1, sentiment: 0.8, macro: -0.1, native: 0.0 } },
        { date: '2025-01-15', btcPrice: 115000, actualPrice: 11.20, btcHeld: 10000, shares: 600000000, factors: { beta: 1.5, flows: 0.6, sentiment: 0.4, macro: -0.3, native: -0.1 } },
        { date: '2025-04-15', btcPrice: 135000, actualPrice: 18.00, btcHeld: 10000, shares: 600000000, factors: { beta: 2.2, flows: 1.5, sentiment: 1.2, macro: 0.0, native: 0.3 } },
        { date: '2025-06-15', btcPrice: 107750, actualPrice: 13.15, btcHeld: 10000, shares: 600710000, factors: { beta: 1.5, flows: 0.8, sentiment: 0.5, macro: -0.2, native: 0.1 } },
    ]
};
