// src/js/mvm-core.js

import { MVM_CONFIG } from './mvm-data.js';

export function calculateEnhancedNAV(btcPrice, btcHeld, shares, cash, debt) {
    const btcValue = btcPrice * btcHeld;
    const netAssets = btcValue + cash - debt;
    return shares > 0 ? netAssets / shares : 0;
}

export function getMnavFromFactors(factorValues) {
    let mnav = MVM_CONFIG.MNAV_FACTORS.basePremium.value;
    for (const key in factorValues) {
        if (MVM_CONFIG.MNAV_FACTORS[key] && MVM_CONFIG.MNAV_FACTORS[key].weight) {
            mnav += factorValues[key] * MVM_CONFIG.MNAV_FACTORS[key].weight * MVM_CONFIG.Z_SCORE_SCALE;
        }
    }
    return mnav;
}

export function simulateDilution(futureBtcPrice, futureBtcHoldings, acquisitionMnav) {
    const { LIVE_DATA } = MVM_CONFIG;
    const btcToAcquire = futureBtcHoldings - LIVE_DATA.btcHeld;
    if (btcToAcquire <= 0) return { newShares: 0, futureShares: LIVE_DATA.shares };

    const capitalNeeded = btcToAcquire * futureBtcPrice;
    const issuancePrice = calculateEnhancedNAV(futureBtcPrice, LIVE_DATA.btcHeld, LIVE_DATA.shares, LIVE_DATA.cash, LIVE_DATA.debt) * acquisitionMnav;
    const newShares = issuancePrice > 0 ? capitalNeeded / issuancePrice : 0;
    
    return { newShares, futureShares: LIVE_DATA.shares + newShares };
}

export function runMonteCarloSimulation(inputs) {
    const { btcTargetPrice, sigma, btcHoldings, factorValues, acquisitionMnav } = inputs;
    const { LIVE_DATA } = MVM_CONFIG;

    const drift = Math.log(btcTargetPrice / LIVE_DATA.btcPrice);
    const mnav = getMnavFromFactors(factorValues);

    const finalPrices = [];
    const samplePaths = [];
    const numSims = 1000;
    const timeSteps = 252; // 1 year
    const dt = 1 / timeSteps;

    for (let i = 0; i < numSims; i++) {
        let simBtcPrice = LIVE_DATA.btcPrice;
        const path = [simBtcPrice];
        for (let t = 0; t < timeSteps; t++) {
            const Z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
            simBtcPrice *= Math.exp((drift - 0.5 * sigma ** 2) * dt + sigma * Math.sqrt(dt) * Z);
            path.push(simBtcPrice);
        }
        
        const finalBtcPrice = path[path.length - 1];
        const dilution = simulateDilution(finalBtcPrice, btcHoldings, acquisitionMnav);
        const simNav = calculateEnhancedNAV(finalBtcPrice, btcHoldings, dilution.futureShares, LIVE_DATA.cash, LIVE_DATA.debt);
        finalPrices.push(simNav * mnav);
        if (i < 10) samplePaths.push(path);
    }

    finalPrices.sort((a, b) => a - b);
    return { finalPrices, samplePaths };
}
