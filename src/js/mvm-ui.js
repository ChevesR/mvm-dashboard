// src/js/mvm-ui.js

import { MVM_CONFIG } from './mvm-data.js';
import { calculateEnhancedNAV, getMnavFromFactors } from './mvm-core.js';

export const DOM = {
    dash: { sliders: {}, factorSliders: {} }
};

let mcPathsChart = null;
const formatCurrency = (val, minDigits = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: minDigits }).format(val);
const formatNumber = (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);

export function initializeDOM() {
    const sliderIds = ['btcTarget', 'btcHoldings', 'volatility', 'acquisitionMnav', 'overshoot'];
    sliderIds.forEach(id => DOM.dash.sliders[id] = document.getElementById(`dash-${id}Slider`));

    const container = document.getElementById('dash-factorInputsContainer');
    for (const key in MVM_CONFIG.MNAV_FACTORS) {
        const factor = MVM_CONFIG.MNAV_FACTORS[key];
        if (!factor.label) continue;
        const div = document.createElement('div');
        div.innerHTML = `<label class="font-medium text-xs subtle-text">${factor.label}</label><span id="dash-display-${key}" class="float-right font-mono text-xs subtle-text"></span><input type="range" id="dash-slider-${key}" min="${factor.min}" max="${factor.max}" value="${factor.value}" step="0.1" class="w-full h-2 rounded-lg appearance-none">`;
        container.appendChild(div);
        DOM.dash.factorSliders[key] = document.getElementById(`dash-slider-${key}`);
    }
}

export function updateDashboardUI(values) {
    const { nav, mnav, basePrice, finalPrice, sliderVals } = values;

    document.getElementById('dash-btcTargetDisplay').textContent = formatCurrency(sliderVals.btcTarget, 0);
    document.getElementById('dash-btcHoldingsDisplay').textContent = formatNumber(sliderVals.btcHoldings);
    document.getElementById('dash-volatilityDisplay').textContent = (sliderVals.volatility * 100).toFixed(0) + '%';
    document.getElementById('dash-acquisitionMnavDisplay').textContent = `${sliderVals.acquisitionMnav.toFixed(1)}x`;
    document.getElementById('dash-overshootDisplay').textContent = `${sliderVals.overshoot.toFixed(2)}x`;
    
    document.getElementById('dash-outputNavPerShare').textContent = formatCurrency(nav);
    document.getElementById('dash-outputMnav').textContent = `${mnav.toFixed(2)}x`;
    document.getElementById('dash-outputBasePrice').textContent = formatCurrency(basePrice);
    document.getElementById('dash-outputFinalPrice').textContent = formatCurrency(finalPrice);
    
    for (const key in DOM.dash.factorSliders) {
        document.getElementById(`dash-display-${key}`).textContent = parseFloat(DOM.dash.factorSliders[key].value).toFixed(1);
    }
}

export function renderMonteCarloResults(results) {
    const { finalPrices, samplePaths } = results;
    const numSims = finalPrices.length;

    document.getElementById('mc-p25').textContent = formatCurrency(finalPrices[Math.floor(numSims * 0.25)]);
    document.getElementById('mc-p50').textContent = formatCurrency(finalPrices[Math.floor(numSims * 0.50)]);
    document.getElementById('mc-p75').textContent = formatCurrency(finalPrices[Math.floor(numSims * 0.75)]);
    document.getElementById('mc-range').textContent = `5th-95th Range: ${formatCurrency(finalPrices[Math.floor(numSims*0.05)])} – ${formatCurrency(finalPrices[Math.floor(numSims*0.95)])}`;
    document.getElementById('mc-results').classList.remove('hidden');
    document.getElementById('mc-range').classList.remove('hidden');

    visualizeSamplePaths(samplePaths);
}

function visualizeSamplePaths(paths) {
    const datasets = paths.map((path, i) => ({
        data: path,
        borderColor: `rgba(96, 165, 250, 0.3)`,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.2
    }));

    if (mcPathsChart) mcPathsChart.destroy();
    mcPathsChart = new Chart('mcPathsChart', {
        type: 'line', data: { labels: Array.from({length: paths[0].length}, (_, i) => i), datasets },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: value => formatCurrency(value,0), color: '#9ca3af' }, grid: { color: '#374151' } }, x: { display: false } } }
    });
}

export function initializeBacktestingUI() {
    const { HISTORICAL_DATA, LIVE_DATA } = MVM_CONFIG;
    const tableBody = document.getElementById('backtestTableBody');
    const premiumData = [];
    const labels = [];
    
    HISTORICAL_DATA.forEach(row => {
        const nav = calculateEnhancedNAV(row.btcPrice, row.btcHeld, row.shares, LIVE_DATA.cash, LIVE_DATA.debt);
        const impliedMnav = getMnavFromFactors(row.factors);
        const impliedPrice = nav * impliedMnav;
        const error = ((impliedPrice / row.actualPrice) - 1) * 100;
        let errorColor = Math.abs(error) > 15 ? 'text-red-400' : (Math.abs(error) > 5 ? 'text-yellow-400' : 'text-green-400');

        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="px-3 py-4 text-sm subtle-text">${row.date}</td><td class="px-3 py-4 text-sm font-medium header-text">${formatCurrency(row.actualPrice)}</td><td class="px-3 py-4 text-sm subtle-text">${formatCurrency(nav)}</td><td class="px-3 py-4 text-sm highlight-value font-semibold">${formatCurrency(impliedPrice)}</td><td class="px-3 py-4 text-sm font-semibold ${errorColor}">${error.toFixed(1)}%</td>`;
        tableBody.appendChild(tr);

        premiumData.push(((row.actualPrice / nav) - 1) * 100);
        labels.push(row.date);
    });
    
    new Chart('premiumChart', {
        type: 'line', data: { labels, datasets: [{ label: 'Realized Premium to NAV (%)', data: premiumData, borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.2)', fill: true, tension: 0.1 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: v => v + '%', color: '#9ca3af' }, grid: { color: '#374151' } }, x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } } } }
    });
}
