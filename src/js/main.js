// src/js/main.js

import { MVM_CONFIG } from './mvm-data.js';
import { calculateEnhancedNAV, getMnavFromFactors, simulateDilution, runMonteCarloSimulation } from './mvm-core.js';
import { DOM, initializeDOM, updateDashboardUI, renderMonteCarloResults, initializeBacktestingUI } from './mvm-ui.js';

function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-content-${tabId}`).classList.add('active');
    element.classList.add('active');
}

function getSliderValues() {
    const values = {};
    for (const key in DOM.dash.sliders) {
        values[key] = parseFloat(DOM.dash.sliders[key].value);
    }
    values.factorValues = {};
    for (const key in DOM.dash.factorSliders) {
        values.factorValues[key] = parseFloat(DOM.dash.factorSliders[key].value);
    }
    return values;
}

function runPointInTimeProjection() {
    const sliderVals = getSliderValues();
    const { btcTarget, btcHoldings, acquisitionMnav, overshoot, factorValues } = sliderVals;

    const dilution = simulateDilution(btcTarget, btcHoldings, acquisitionMnav);
    const mnav = getMnavFromFactors(factorValues);
    const nav = calculateEnhancedNAV(btcTarget, btcHoldings, dilution.futureShares, MVM_CONFIG.LIVE_DATA.cash, MVM_CONFIG.LIVE_DATA.debt);
    const basePrice = nav * mnav;
    const finalPrice = basePrice * overshoot;

    updateDashboardUI({ nav, mnav, basePrice, finalPrice, sliderVals });
}

function initializeEventListeners() {
    document.querySelectorAll('.tab-button').forEach(button => {
        const tabId = button.id.split('-')[1];
        button.addEventListener('click', (e) => switchTab(tabId, e.currentTarget));
    });

    Object.values({...DOM.dash.sliders, ...DOM.dash.factorSliders}).forEach(slider => {
        if (slider) slider.addEventListener('input', runPointInTimeProjection);
    });

    const monteCarloBtn = document.getElementById('runMonteCarloBtn');
    if (monteCarloBtn) {
        monteCarloBtn.addEventListener('click', () => {
            const inputs = getSliderValues();
            const results = runMonteCarloSimulation({
                btcTargetPrice: inputs.btcTarget,
                sigma: inputs.volatility,
                btcHoldings: inputs.btcHoldings,
                factorValues: inputs.factorValues,
                acquisitionMnav: inputs.acquisitionMnav,
            });
            renderMonteCarloResults(results);
        });
    }
    // Dark mode toggle is part of the HTML for simplicity in this version
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    initializeEventListeners();
    runPointInTimeProjection(); // Initial render for the dashboard
    initializeBacktestingUI();
});
