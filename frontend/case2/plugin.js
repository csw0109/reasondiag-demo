// ES Module facade. Exposes the same interface via window.DeepSeekPlugin while using module imports.
'use strict';
// Do not override if the original plugin is already present
if (window.DeepSeekPlugin) {
    // still run minimal mount to avoid double UI; but skip redefining
}

import * as Bus from '../modules/bus.js';
import * as Utils from '../modules/utils.js';
import { renderOverview } from '../modules/overview.js';
import { renderControls } from '../modules/control.js';
import DeepSeekBus, { get as getBus, set as setBus } from '../modules/bus.js';
import { ensurePanel as ensureOriginalCotPanel, updatePanel as updateOriginalCotPanel, renderFromTree as renderOriginalCotFromTree } from '../modules/originalcot.js';
import { renderTree } from '../modules/tree.js';
import '../modules/popout.js'; // Import to initialize popout

let observer = null;
// originalState/restore were used in monolith; not needed in modular minimal version
let toggleBtn = null;
let isTreeView = false;
let currentErrorMap = null;
let factCheckMap = null;
let latestSentenceTree = null;
let originalCotPanel = null;
let originalCotContent = null;
let currentCotMode = 'paragraph';

const defaultPath = '../../data/case2/structured_cot_GAIA_with_reversed_depth.json';
const defaultErrorPath = '../../data/case2/merged_check_results_with_propagation-GAIA.json';
const FACT_CHECK_DATA_PATH = '../../data/case2/fact_checked_statements-GAIA.json';


function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

function ensureLayout() {
    const reasonBody = document.getElementById('reasonBody');
    if (!reasonBody) return null;
    let wrapper = document.getElementById('deepseek-layout-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'deepseek-layout-wrapper';
        wrapper.className = 'deepseek-layout-wrapper';
        const parent = reasonBody.parentElement || document.body;
        parent.insertBefore(wrapper, reasonBody);
        wrapper.appendChild(reasonBody);
    }
    return wrapper;
}

// 处理数据
function transformReasoningToTree(sentences) {
    if (!Array.isArray(sentences)) return null;

    // Prepare error info from Bus
    const state = (typeof Bus !== 'undefined' && Bus.get) ? Bus.get() : {};
    const currentErrorMap = state.currentErrorMap;
    const factCheckMap = state.factCheckMap;
    const propagatedSet = new Set();
    if (currentErrorMap) {
        currentErrorMap.forEach(info => {
            if (info && Array.isArray(info.prop_pairs)) {
                info.prop_pairs.forEach(pair => {
                    if (pair && pair.target != null) propagatedSet.add(String(pair.target));
                });
            }
        });
    }

    const depthSentences = []; const nonDepthSentences = []; const treeSentences = [];
    let maxDepth = -Infinity;
    sentences.forEach((s, idx) => {
        if (!s) return;

        const sId = s.id != null ? String(s.id) : String(idx);
        let has_error = null;
        let is_propagated = false;
        let evidence = null;

        if (currentErrorMap && currentErrorMap.has(sId)) {
            const err = currentErrorMap.get(sId);
            if (err.has_error === true || err.error === true) has_error = true;
            else if (err.has_error === false) has_error = false;
        }
        if (propagatedSet.has(sId)) is_propagated = true;

        if (factCheckMap && factCheckMap.has(sId)) {
            const fc = factCheckMap.get(sId);
            // Check if fact check is false (assuming boolean false or string "false")
            if (fc.fact_check === false || String(fc.fact_check).toLowerCase() === 'false') {
                evidence = fc.evidence;
            }
        }

        const item = {
            id: s.id != null ? s.id : idx,
            text: typeof s.sentence === 'string' ? s.sentence : '',
            tag: Array.isArray(s.function_tag) ? s.function_tag.slice(0) : (typeof s.function_tag === 'string' ? [s.function_tag] : []),
            depth: (s.depth != null && !isNaN(Number(s.depth))) ? Number(s.depth) : null,
            related_sentences: Array.isArray(s.related_sentences) ? s.related_sentences.slice(0) : [],
            hasDepth: (s.depth != null && !isNaN(Number(s.depth))),
            index: (s.index != null ? Number(s.index) : idx),
            reverse_depth: (s.reverse_depth != null && !isNaN(Number(s.reverse_depth))) ? Number(s.reverse_depth) : null,
            pagerank: s.pagerank,
            premise_id: Array.isArray(s.premise_id) ? s.premise_id.slice(0) : [],
            title: s.title || '',
            has_error: has_error,
            is_propagated: is_propagated,
            evidence: evidence,
            children: []
        };
        item.children.push(item)
        if (item.hasDepth) {
            depthSentences.push(item);
            treeSentences.push(item);
            if (item.depth > maxDepth) maxDepth = item.depth;
        } else {
            nonDepthSentences.push(item);
            treeSentences[treeSentences.length - 1].children.push(item);
        }
    });
    if (!isFinite(maxDepth)) maxDepth = Math.max(0, depthSentences.reduce((m, it) => Math.max(m, (it.depth || 0)), 0));
    depthSentences.forEach(it => { it.reverse_depth = (it.reverse_depth != null) ? (Number(it.reverse_depth)) : null; });
    // construct simple indices
    const byId = new Map();
    [...depthSentences, ...nonDepthSentences].forEach(it => { if (it && it.id != null) byId.set(String(it.id), it); });
    const tree = { treeSentences, depthSentences, nonDepthSentences, byId, idToParagraphMap: new Map() };
    if (setBus) setBus({ latestSentenceTree: tree });
    return tree;
}

// build error map from list
function buildErrorMap(errorList) {
    const map = new Map();
    if (!Array.isArray(errorList)) return null;
    errorList.forEach((item) => {
        if (!item || item.id === undefined || item.id === null) return;
        map.set(String(item.id), item);
    });
    return map;
}


function injectStyles() {
    let style = document.getElementById('deepseek-plugin-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'deepseek-plugin-style';
        document.head.appendChild(style);
    }
    style.textContent = `
		#deepseek-plugin-bar{position:absolute;right:18px;bottom:82px;display:flex;gap:8px;align-items:center;padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.08);backdrop-filter:blur(6px);box-shadow:0 8px 20px rgba(15,23,42,0.12);z-index:30}
		#deepseek-plugin-bar input{min-width:240px;padding:8px 10px;border-radius:8px;border:1px solid rgba(15,23,42,0.15);background:#fff;font-size:13px}
		#deepseek-plugin-bar button{display:inline-block !important;visibility:visible !important;padding:8px 12px;border-radius:8px;border:1px solid transparent;background:#2563eb;color:#fff;font-weight:500;cursor:pointer;transition:background 0.2s ease;min-width:130px;text-align:center}
		#deepseek-plugin-bar button:hover{background:#1d4ed8}
		#deepseek-plugin-bar .plugin-message{font-size:12px;color:#0f172a;margin-left:4px}
		/* icons removed per user request: deepseek-plugin-icons and related buttons disabled */

		/* Layout container for reason body and sidebar */
		.deepseek-layout-wrapper{display:flex;flex-wrap: wrap;align-items:stretch;gap:8px;margin-top:8px}
		.deepseek-left-panel{flex:0 0 100px;min-height:160px;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.25);border-radius:10px;padding:12px;color:#475569;font-size:12px;box-shadow:0 2px 6px rgba(15,23,42,0.08);display:none}
		.deepseek-left-panel.visible{display:block}
		.deepseek-left-panel h3{margin:0 0 8px 0;font-size:12px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.08em}
		.deepseek-left-panel .deepseek-left-panel-placeholder{font-size:11px;color:#6b7280;line-height:1.5}
		.deepseek-left-panel-title{margin:0 0 10px 0;font-size:12px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.08em}
		.deepseek-left-panel-content{max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;font-size:11px;color:#334155}
		.deepseek-left-panel-content::-webkit-scrollbar{width:6px}
		.deepseek-left-panel-content::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.45);border-radius:3px}
		.deepseek-evidence-summary{display:flex;flex-direction:column;gap:4px;padding:6px 0}
		.deepseek-evidence-summary strong{font-size:11px;color:#1f2937}
		.deepseek-evidence-item{padding:8px;border-radius:8px;background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.2);display:flex;flex-direction:column;gap:6px}
		.deepseek-evidence-item a{color:#2563eb;text-decoration:underline;font-size:10px;word-break:break-word}
		.deepseek-evidence-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:10px;color:#64748b}
		.deepseek-evidence-chip{padding:2px 6px;border-radius:999px;background:rgba(59,130,246,0.12);color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}
		.deepseek-evidence-empty{font-size:11px;color:#6b7280;padding:8px 0}
		.deepseek-layout-wrapper>#reasonBody{flex:1 1 auto}
		.deepseek-wide-bubble{max-width:1100px!important;width:100%!important;margin-left:auto;margin-right:auto}
    `;
}


function mount() {
    const composer = document.querySelector('.composer-wrap');
    if (!composer || document.getElementById('deepseek-plugin-bar')) return;
    // observer not required in this minimal modular version

    if (typeof window.loadJson === 'function' && !window.__deepseekPluginPatched) {
        const originalLoadJson = window.loadJson;
        window.loadJson = async function patchedLoadJson() {
            const result = await originalLoadJson.apply(this, arguments);
            // decorateEntries disabled
            isTreeView = false;
            if (toggleBtn) {
                toggleBtn.textContent = 'Load Structure';
            }
            // no-op
            return result;
        };
        window.__deepseekPluginPatched = true;
    }

    const bar = document.createElement('div');
    bar.id = 'deepseek-plugin-bar';

    toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Load Structure';
    const message = document.createElement('div');
    message.className = 'plugin-message';

    function showMessage(text, isError) {
        message.textContent = text;
        message.style.color = isError ? '#b91c1c' : '#0f172a';
        if (!text) {
            message.style.display = 'none';
            return;
        }
        message.style.display = 'block';
    }

    async function handleLoadSentences() {
        try {
            await loadSentenceStructure(defaultPath, defaultErrorPath, FACT_CHECK_DATA_PATH);
            isTreeView = true;
            if (toggleBtn) {
                toggleBtn.textContent = 'Show Original';
            }
            showMessage('', false);
        } catch (error) {
            const reason = error && error.message ? error.message : 'Unknown error';
            showMessage(`Failed to load tree: ${reason}`, true);
        }
    }

    function handleShowOriginal() {
        const reasonBody = document.getElementById('reasonBody');
        if (!reasonBody) {
            showMessage('reasonBody not found.', true);
            return;
        }
        // Restore visibility
        reasonBody.style.display = '';

        try {
            const reasondiag = document.getElementById('deepseek-content-wrapper');
            if (reasondiag) reasondiag.remove();
            const controls = document.querySelector('.deepseek-tree-controls');
            if (controls) controls.remove();
            const overview = document.querySelector('.deepseek-tree-overview');
            if (overview) overview.remove();
            // Remove the left panel when restoring original view
            const layoutWrapper = document.querySelector('#deepseek-layout-wrapper, .deepseek-layout-wrapper');
            if (layoutWrapper) {
                const leftPanel = document.querySelector('#deepseek-left-panel, .deepseek-left-panel');
                if (leftPanel) {
                    leftPanel.remove();
                }
            }
            if (typeof window !== 'undefined' && window.deepseekLeftPanel) {
                try { delete window.deepseekLeftPanel; } catch (_e) { window.deepseekLeftPanel = null; }
            }
            // We don't modify original reason body with this modular loader; nothing to restore.
            isTreeView = false;
            if (toggleBtn) {
                toggleBtn.textContent = 'Load Structure';
            }
            // no-op
            showMessage('', false);
        } catch (error) {
            const reason = error && error.message ? error.message : 'Unknown error';
            showMessage(`Failed to restore: ${reason}`, true);
        }
    }

    function handleToggle() {
        if (isTreeView) {
            handleShowOriginal();
        } else {
            handleLoadSentences();
        }
    }

    toggleBtn.addEventListener('click', handleToggle);

    bar.appendChild(toggleBtn);
    bar.appendChild(message);
    composer.appendChild(bar);

    // ensureInitialCapture();
}


function applySentenceErrors(sentenceTree) {
    const state = getBus ? getBus() : {};
    const errMap = state.currentErrorMap;
    if (!sentenceTree || !errMap) return;
    // add error class to rendered labels
    const root = document.getElementById('reasonBody');
    if (!root) return;
    root.querySelectorAll('[data-item-id]').forEach(el => {
        const sid = el.getAttribute('data-item-id');
        if (!sid) return;
        const e = errMap.get && errMap.get(sid);
        if (e && (e.has_error || e.error)) {
            const label = el.closest('.deepsntent-line')?.querySelector('.deepseek-type-label, .deepseek-original-type-label');
            if (label) label.classList.add('error');
        }
    });
}

async function loadFactCheckData(jsonPath) {
    const response = await fetch(jsonPath, { cache: 'no-store' });
    const factCheckList = await response.json();
    const index = new Map();
    if (Array.isArray(factCheckList)) {
        factCheckList.forEach(item => {
            if (item && item.id != null) {
                // Store item if fact_check is false (or store all, but ensure evidence is accessible)
                // User request: "get evidence for corresponding id ... where fact check is false"
                // We store the item. Logic to extract evidence will be in transformReasoningToTree or here.
                // Let's store the whole item for flexibility.
                index.set(String(item.id), item);
            }
        });
    }
    console.log('设置事实检查映射:', index);
    Bus.set({ factCheckMap: index });
    return index;
}

async function loadErrorData(jsonPath) {
    const response = await fetch(jsonPath, { cache: 'no-store' });
    const errorList = await response.json();
    const map = buildErrorMap(errorList);
    Bus.set({ currentErrorMap: map });
    console.log('设置错误映射:', map);
    // Re-apply if a tree is already rendered
    const st = Bus.get();
    if (st.latestSentenceTree) {
        applySentenceErrors(st.latestSentenceTree);
    }
    return map;
}

// Load and display sentence structure
async function loadSentenceStructure(jsonPath, errorJsonPath, factCheckPath) {
    try {
        if (errorJsonPath) {
            try {
                await loadErrorData(errorJsonPath);
            } catch (err) {
                console.warn('Failed to load error annotations, continuing without highlights.', err);
            }
        } else {
            currentErrorMap = null;
        }
        if (factCheckPath) {
            try {
                await loadFactCheckData(factCheckPath);
            } catch (err) {
                console.warn('Failed to load fact-check data, continuing without fact-check integration.', err);
            }
        } else {
            factCheckMap = null;
        }
        const response = await fetch(jsonPath, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to load JSON: ${jsonPath}`);
        const sentences = await response.json();
        // Transform existing reasoning entries to tree structure
        console.log('[DeepSeekPlugin] Loaded JSON data:', sentences);
        const tree = transformReasoningToTree(sentences);
        console.log('[DeepSeekPlugin] Loaded Tree data:', tree);
        // Optional rendering hooks: overview + Original CoT + tree
        const wrapper = ensureLayout();
        if (wrapper) {
            const oldOverview = wrapper.querySelector('.deepseek-tree-overview');
            if (oldOverview) oldOverview.remove();

            // Ensure controls container exists and is placed correctly (before reasonBody)
            let controlsDiv = wrapper.querySelector('.deepseek-tree-controls');
            if (!controlsDiv) {
                controlsDiv = document.createElement('div');
                controlsDiv.className = 'deepseek-tree-controls';
                const rb = document.getElementById('reasonBody');
                if (rb) wrapper.insertBefore(controlsDiv, rb);
                else wrapper.appendChild(controlsDiv);
            }

            // Render Controls (populates the container)
            renderControls(wrapper, sentences);

            // Generate Overview block
            const ov = renderOverview(sentences);
            if (ov) {
                // Insert overview after controls (so order is Controls -> Overview -> Body)
                wrapper.insertBefore(ov, document.getElementById('reasonBody'));
            }
            renderOriginalCotFromTree(tree);
            const container = document.getElementById('reasonBody');
            if (container) container.style.display = 'none';
            const all = [...(tree.depthSentences || []), ...(tree.nonDepthSentences || [])];
            const maxRD = Math.max(0, ...all.map(s => s.reverse_depth != null ? Number(s.reverse_depth) : 0));

            // Create Content Wrapper (Tree + Original CoT)
            let contentWrapper = document.getElementById('deepseek-content-wrapper');
            if (!contentWrapper) {
                contentWrapper = document.createElement('div');
                contentWrapper.id = 'deepseek-content-wrapper';
                contentWrapper.style.display = 'flex';
                contentWrapper.style.gap = '16px';
                contentWrapper.style.width = '100%';
                contentWrapper.style.alignItems = 'flex-start';

                // Insert after overview
                const ov = wrapper.querySelector('.deepseek-tree-overview');
                if (ov && ov.nextSibling) {
                    wrapper.insertBefore(contentWrapper, ov.nextSibling);
                } else {
                    wrapper.appendChild(contentWrapper);
                }
            }

            // create Tree view
            let treeContainer = document.getElementById('deepseek-tree-container');
            if (!treeContainer) {
                treeContainer = document.createElement('div');
                treeContainer.id = 'deepseek-tree-container';
                treeContainer.style.flex = '1 1 auto';
                treeContainer.style.minWidth = '0';
                contentWrapper.appendChild(treeContainer);
            } else if (treeContainer.parentElement !== contentWrapper) {
                contentWrapper.appendChild(treeContainer);
            }

            // Move Original CoT into contentWrapper
            const originalCot = document.getElementById('deepseek-original-cot');
            if (originalCot && originalCot.parentElement !== contentWrapper) {
                contentWrapper.appendChild(originalCot);
            }

            renderTree(treeContainer, tree, maxRD);
            const st = Bus.get();
            if (st.currentErrorMap) { applySentenceErrors(tree); }
        }

        return sentences;
    } catch (error) {
        console.error('Error loading sentence structure:', error);
        throw error;
    }
}

function unmount() {
    // Non-destructive: only remove overview block; leave original content intact
    const wrapper = document.getElementById('deepseek-layout-wrapper');
    if (!wrapper) return;
    const overview = wrapper.querySelector('.deepseek-tree-overview');
    if (overview) overview.remove();
}

// Global listener to re-render tree when filter/state changes
DeepSeekBus.on('state', (changes) => {
    const fullState = DeepSeekBus.get();
    const treeContainer = document.getElementById('deepseek-tree-container');

    // If the change is relevant to tree rendering (filter or tree data)
    if ((changes.annotationFilter || changes.latestSentenceTree) && fullState.latestSentenceTree && treeContainer) {
        const all = [...(fullState.latestSentenceTree.depthSentences || []), ...(fullState.latestSentenceTree.nonDepthSentences || [])];
        const maxRD = Math.max(0, ...all.map(s => s.reverse_depth != null ? Number(s.reverse_depth) : 0));
        renderTree(treeContainer, fullState.latestSentenceTree, maxRD);
    }
});

injectStyles();
ready(mount);

// Publish interface on window for external usage
window.DeepSeekPlugin = window.DeepSeekPlugin || {
    version: '2.0.0-modular-esm',
    mount,
    loadSentenceStructure,
    // loadErrorAnnotations,
    unmount
};
