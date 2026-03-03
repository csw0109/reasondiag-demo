// ES Module: Control panel module
'use strict';
import DeepSeekBus from './bus.js';

const STYLE_ID = 'deepseek-control-style';

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .deepseek-tree-controls {
            display: flex;
            flex-direction: row;
            gap: 16px;
            width: 100%;
            box-sizing: border-box;
        }
        
        /* Section */
        .deepseek-control-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .deepseek-section-title {
            font-size: 10px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Filter Tags (Chips) */
        .deepseek-filter-group {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .deepseek-filter-chip {
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 6px;
            background: #f1f5f9;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            font-weight: 500;
            user-select: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            min-width: 50px;
        }
        .deepseek-filter-chip:hover {
            background: #e2e8f0;
            color: #475569;
        }
        .deepseek-filter-chip.active {
            background: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
            font-weight: 600;
        }
        
        .deepseek-mini-chart {
            display: flex;
            width: 100%;
            height: 3px;
            border-radius: 1.5px;
            overflow: hidden;
            background: #e2e8f0;
        }
        .deepseek-chart-segment {
            height: 100%;
        }
        .deepseek-chart-segment.safe { background: rgba(12, 143, 64, 1); opacity: 0.5; }
        .deepseek-chart-segment.error { background: rgba(220, 38, 38, 0.8); opacity: 0.5; }
        .deepseek-chart-segment.unknown { background: #94a3b8; opacity: 0.3; }
        
        .deepseek-filter-chip.active .deepseek-chart-segment.safe { opacity: 0.8; }
        .deepseek-filter-chip.active .deepseek-chart-segment.error { opacity: 0.8; }
        .deepseek-filter-chip.active .deepseek-chart-segment.unknown { opacity: 0.5; }

        /* Modern Sliders */
        .deepseek-slider-container {
            display: flex;
            flex-direction: row;
            gap: 6px;
        }
        .deepseek-slider-row {
            display: flex;
            align-items: center;
            gap: 12px;
            height: 28px;
            padding: 0 4px;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .deepseek-slider-row:hover {
            background: #f8fafc;
        }
        .deepseek-slider-row.active {
            background: #eff6ff;
        }
        .deepseek-slider-label {
            font-size: 11px;
            color: #64748b;
            width: 60px;
            font-weight: 500;
        }
        .deepseek-slider-row.active .deepseek-slider-label {
            color: #2563eb;
        }
        
        .deepseek-slider-input {
            -webkit-appearance: none;
            flex: 1;
            height: 4px;
            width: 90px;
            background: #e2e8f0;
            border-radius: 2px;
            outline: none;
        }
        .deepseek-slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #cbd5e1;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .deepseek-slider-input:hover::-webkit-slider-thumb {
            border-color: #94a3b8;
            transform: scale(1.1);
        }
        .deepseek-slider-row.active .deepseek-slider-input {
            background: #bfdbfe;
        }
        .deepseek-slider-row.active .deepseek-slider-input::-webkit-slider-thumb {
            border-color: #2563eb;
            background: #2563eb;
            box-shadow: 0 0 0 2px #dbeafe;
        }
        
        .deepseek-slider-value {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            min-width: 24px;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        .deepseek-slider-row.active .deepseek-slider-value {
            color: #2563eb;
        }
    `;
    document.head.appendChild(style);
}

function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text) el.textContent = options.text;
    return el;
}

let pagerankSlider, pagerankValue;
let reverseDepthSlider, reverseDepthValue;
let pagerankRow, reverseDepthRow;

export function renderControls(container, data) {
    if (!container) return;
    injectStyles();
    console.log('Rendering controls with data:', data);

    // Create main controls container if it doesn't exist
    let panel = container.querySelector('.deepseek-tree-controls');
    if (!panel) {
        panel = createElement('div', { className: 'deepseek-tree-controls' });
        container.appendChild(panel);
    } else {
        panel.innerHTML = '';
    }

    const state = DeepSeekBus.get();
    let currentFilter = state.annotationFilter;
    if (!currentFilter || currentFilter === 'result' || currentFilter === 'Result') currentFilter = 'result_consolidation';
    
    // --- Section 1: Filter Tags ---
    const filterSection = createElement('div', { className: 'deepseek-control-section' });
    filterSection.appendChild(createElement('div', { className: 'deepseek-section-title', text: 'Filter Nodes' }));
    
    const filterGroup = createElement('div', { className: 'deepseek-filter-group' });
    const availableTypes = ['Plan', 'Fact', 'Compute', 'Result', 'Uncertain', 'Check', 'Answer', 'Setup'];
    const typeMap = {
        'Plan': 'plan_generation',
        'Fact': 'fact_retrieval',
        'Compute': 'active_computation',
        'Result': 'result_consolidation',
        'Uncertain': 'uncertainty_management',
        'Check': 'self_checking',
        'Answer': 'final_answer_emission',
        'Setup': 'problem_setup'
    };

    // Calculate Stats
    const typeStats = {};
    Object.values(typeMap).forEach(k => typeStats[k] = { safe: 0, error: 0, unknown: 0, total: 0 });
    
    const currentErrorMap = state.currentErrorMap;

    if (data && Array.isArray(data)) {
        data.forEach(node => {
            let tags = node.function_tag;
            if (!tags) return;
            if (!Array.isArray(tags)) tags = [tags];
            
            // Determine error status
            let hasError = null; // null = unknown
            
            // 1. Try to get from node itself (if it's a tree node or pre-processed)
            if (node.has_error !== undefined) {
                hasError = node.has_error;
            } else if (node.hasError !== undefined) {
                hasError = node.hasError;
            } 
            // 2. Try to look up in error map
            else if (currentErrorMap) {
                const id = node.id != null ? String(node.id) : null;
                if (id && currentErrorMap.has(id)) {
                    const err = currentErrorMap.get(id);
                    // Check various error property formats
                    if (err.has_error === true || err.error === true) hasError = true;
                    else if (err.has_error === false || err.error === false) hasError = false;
                }
            }
            
            tags.forEach(t => {
                if (typeStats[t]) {
                    typeStats[t].total++;
                    if (hasError === true) typeStats[t].error++;
                    else if (hasError === false) typeStats[t].safe++;
                    else typeStats[t].unknown++;
                }
            });
        });
    }

    const typeButtons = [];

    availableTypes.forEach(type => {
        const key = typeMap[type];
        const btn = createElement('div', { className: 'deepseek-filter-chip' });
        
        // Text Label
        const label = createElement('span', { text: type });
        btn.appendChild(label);
        
        // Mini Chart
        const stats = typeStats[key];
        console.log('Type Stats for', key, stats);
        if (stats && stats.total > 0) {
            const chart = createElement('div', { className: 'deepseek-mini-chart' });
            
            const safePct = (stats.safe / stats.total) * 100;
            const errorPct = (stats.error / stats.total) * 100;
            const unknownPct = (stats.unknown / stats.total) * 100;
            
            if (safePct > 0) {
                const s = createElement('div', { className: 'deepseek-chart-segment safe' });
                s.style.width = `${safePct}%`;
                chart.appendChild(s);
            }
            if (errorPct > 0) {
                const e = createElement('div', { className: 'deepseek-chart-segment error' });
                e.style.width = `${errorPct}%`;
                chart.appendChild(e);
            }
            if (unknownPct > 0) {
                const u = createElement('div', { className: 'deepseek-chart-segment unknown' });
                u.style.width = `${unknownPct}%`;
                chart.appendChild(u);
            }
            btn.appendChild(chart);
        }

        btn.dataset.type = key;
        if (currentFilter === key) btn.classList.add('active');

        btn.addEventListener('click', () => {
            DeepSeekBus.set({ annotationFilter: key });
            updateAllControls(key);
        });
        typeButtons.push(btn);
        filterGroup.appendChild(btn);
    });
    filterSection.appendChild(filterGroup);
    panel.appendChild(filterSection);

    // --- Section 2: Parameters ---
    const paramSection = createElement('div', { className: 'deepseek-control-section' });
    paramSection.appendChild(createElement('div', { className: 'deepseek-section-title', text: 'Parameters' }));
    const sliderContainer = createElement('div', { className: 'deepseek-slider-container' });

    // Helper to create slider row
    const createSliderRow = (label, min, max, value, onChange, onActivate, isActive) => {
        const row = createElement('div', { className: 'deepseek-slider-row' });
        if(isActive) row.classList.add('active');
        
        const labelEl = createElement('span', { className: 'deepseek-slider-label', text: label });
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.value = value;
        input.className = 'deepseek-slider-input';
        
        const valueEl = createElement('span', { className: 'deepseek-slider-value', text: value });
        
        input.addEventListener('input', (e) => {
            valueEl.textContent = e.target.value;
            onChange(parseInt(e.target.value, 10));
        });
        
        // Activation logic
        const activate = () => {
            if(!row.classList.contains('active')) {
                onActivate();
            }
        };
        input.addEventListener('mousedown', activate);
        row.addEventListener('click', (e) => {
            if(e.target !== input) activate();
        });

        row.appendChild(labelEl);
        row.appendChild(input);
        row.appendChild(valueEl);
        return { row, input, valueEl };
    };

    // PageRank Slider
    const prControls = createSliderRow('PR Top', '1', '20', String(state.pagerankTopN || 5), 
        (val) => DeepSeekBus.set({ pagerankTopN: val }),
        () => {
            DeepSeekBus.set({ annotationFilter: 'pagerank' });
            updateAllControls('pagerank');
        },
        currentFilter === 'pagerank'
    );
    pagerankSlider = prControls.input;
    pagerankValue = prControls.valueEl;
    pagerankRow = prControls.row;

    // Calculate max reverse depth
    let maxRD = 0;
    if (state.latestSentenceTree) {
        const allSentences = [
            ...(state.latestSentenceTree.depthSentences || []),
            ...(state.latestSentenceTree.nonDepthSentences || [])
        ];
        const validReverseDepths = allSentences
            .filter(s => s.reverse_depth !== undefined && s.reverse_depth !== null)
            .map(s => s.reverse_depth);
        if (validReverseDepths.length > 0) {
            maxRD = Math.max(...validReverseDepths) + 1;
        }
    }

    // Reverse Depth Slider
    const rdControls = createSliderRow('R-Depth <', '0', String(maxRD), String(state.reverseDepthThreshold || 3),
        (val) => DeepSeekBus.set({ reverseDepthThreshold: val }),
        () => {
            DeepSeekBus.set({ annotationFilter: 'reverse_depth' });
            updateAllControls('reverse_depth');
        },
        currentFilter === 'reverse_depth'
    );
    reverseDepthSlider = rdControls.input;
    reverseDepthValue = rdControls.valueEl;
    reverseDepthRow = rdControls.row;

    sliderContainer.appendChild(pagerankRow);
    sliderContainer.appendChild(reverseDepthRow);
    paramSection.appendChild(sliderContainer);
    panel.appendChild(paramSection);

    function updateAllControls(activeFilter) {
        typeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === activeFilter);
        });
        pagerankRow.classList.toggle('active', activeFilter === 'pagerank');
        reverseDepthRow.classList.toggle('active', activeFilter === 'reverse_depth');
    }
    
    if (state.latestSentenceTree) {
        updateSliderRanges(state.latestSentenceTree);
    }
}
  
function updateSliderRanges(sentenceTree) {
    if (!sentenceTree) return;
    const allSentences = [];
    if (Array.isArray(sentenceTree.depthSentences)) {
        allSentences.push(...sentenceTree.depthSentences);
    }
    if (Array.isArray(sentenceTree.nonDepthSentences)) {
        allSentences.push(...sentenceTree.nonDepthSentences);
    }

    const state = DeepSeekBus.get();

    // Update PageRank Slider
    if (pagerankSlider && pagerankValue) {
        const validPageranks = allSentences.filter(s => s.pagerank !== undefined && s.pagerank !== null);
        if (validPageranks.length > 0) {
            if (state.pagerankTopN > validPageranks.length) {
                const newVal = validPageranks.length;
                pagerankSlider.value = String(newVal);
                pagerankValue.textContent = String(newVal);
                DeepSeekBus.set({ pagerankTopN: newVal });
            }
        }
    }

    // Update Reverse Depth Slider
    if (reverseDepthSlider && reverseDepthValue) {
        const validReverseDepths = allSentences
            .filter(s => s.reverse_depth !== undefined && s.reverse_depth !== null)
            .map(s => s.reverse_depth);
        
        if (validReverseDepths.length > 0) {
            const maxReverseDepth = Math.max(...validReverseDepths);
            reverseDepthSlider.max = String(maxReverseDepth + 1);
            
            if (state.reverseDepthThreshold > maxReverseDepth + 1) {
                const newVal = maxReverseDepth + 1;
                reverseDepthSlider.value = String(newVal);
                reverseDepthValue.textContent = String(newVal);
                DeepSeekBus.set({ reverseDepthThreshold: newVal });
            }
        }
    }
}

// Subscribe to state changes to update sliders when tree changes
DeepSeekBus.on('state', (state) => {
    if (state.latestSentenceTree) {
        updateSliderRanges(state.latestSentenceTree);
    }
});
