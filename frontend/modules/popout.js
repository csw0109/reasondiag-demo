// ES Module: Popout window for error details
'use strict';
import DeepSeekBus from './bus.js';

const STYLE_ID = 'deepseek-popout-style';

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .deepseek-error-popout {
            position: absolute;
            z-index: 10000;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            width: 500px;
            max-width: 90vw;
            border: 1px solid #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
            display: flex;
            flex-direction: column;
        }
        .deepseek-error-popout.visible {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
        }
        
        /* Arrows */
        .deepseek-error-popout::before, .deepseek-error-popout::after {
            content: "";
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
            pointer-events: none;
            left: var(--arrow-x, 50%);
            transform: translateX(-50%);
        }
        
        /* Top Placement (Arrow points down) */
        .deepseek-error-popout.placement-top::before {
            bottom: -8px;
            border-width: 8px 8px 0 8px;
            border-color: #e2e8f0 transparent transparent transparent;
        }
        .deepseek-error-popout.placement-top::after {
            bottom: -7px;
            border-width: 8px 8px 0 8px;
            border-color: white transparent transparent transparent;
        }

        /* Bottom Placement (Arrow points up) */
        .deepseek-error-popout.placement-bottom::before {
            top: -8px;
            border-width: 0 8px 8px 8px;
            border-color: transparent transparent #e2e8f0 transparent;
        }
        .deepseek-error-popout.placement-bottom::after {
            top: -7px;
            border-width: 0 8px 8px 8px;
            border-color: transparent transparent #fff1f2 transparent;
        }
        
        /* Header */
        .deepseek-popout-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #fff1f2; /* Light red bg for error */
            border-bottom: 1px solid #ffe4e6;
            border-radius: 12px 12px 0 0;
        }
        .deepseek-popout-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: #be123c;
            font-size: 14px;
        }
        .deepseek-popout-icon {
            font-size: 16px;
        }
        
        /* Right side actions */
        .deepseek-popout-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .deepseek-popout-close {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            color: #9f1239;
            font-size: 16px;
            margin-left: 4px;
            transition: background-color 0.2s;
            line-height: 1;
        }
        .deepseek-popout-close:hover {
            background-color: rgba(159, 18, 57, 0.1);
        }
        
        /* Content */
        .deepseek-popout-content {
            padding: 16px;
            font-size: 13px;
            line-height: 1.5;
            color: #334155;
        }
        .deepseek-error-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .deepseek-error-text {
            margin-bottom: 12px;
        }
        .deepseek-error-text:last-child {
            margin-bottom: 0;
        }
        
        /* Tree View */
        .deepseek-tree-wrapper { margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 8px; }
        .deepseek-tree-node { position: relative; }
        .deepseek-tree-children { margin-left: 16px; border-left: 2px solid #e2e8f0; padding-left: 12px; margin-top: 6px; }
        .deepseek-tree-node-content { 
            padding: 6px 8px; 
            font-size: 12px; 
            color: #334155; 
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: flex; 
            flex-direction: column;
            gap: 2px;
            margin-bottom: 6px;
        }
        .deepseek-tree-node-content:hover { border-color: #cbd5e1; background: #f1f5f9; }
        .node-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
        .node-id { 
            font-weight: 600; 
            color: #64748b; 
            font-size: 10px; 
            background: #e2e8f0;
            padding: 1px 4px;
            border-radius: 4px;
        }
        .node-text { line-height: 1.4; font-size: 11px; }
        
        /* Graph View */
        .deepseek-graph-wrapper {
            overflow: auto;
            max-height: 400px;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            background: #fff;
            padding: 10px;
            display: block;
            margin-top: 8px;
        }
        .deepseek-graph-wrapper svg {
            display: block;
            margin: 0 auto;
        }

        /* Filter Buttons */
        .ds-filter-btn {
            padding: 2px 6px;
            border: 1px solid #cbd5e1;
            background: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            color: #475569;
        }
        .ds-filter-btn:hover {
            background: #f1f5f9;
        }
        .ds-filter-btn.active {
            background: #e2e8f0;
            color: #0f172a;
            border-color: #94a3b8;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}

class ErrorPopout {
    constructor() {
        this.element = null;
        this.isVisible = false;
        injectStyles();
        this.init();
        
        DeepSeekBus.on('show-error', (data) => {
            this.show(data);
        });
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'deepseek-error-popout';
        this.element.innerHTML = `
            <div class="deepseek-popout-header">
                <div class="deepseek-popout-title">
                    <span class="deepseek-popout-type">Error</span>
                </div>
                <div class="deepseek-popout-actions">
                    <div class="deepseek-popout-close" title="Close">✕</div>
                </div>
            </div>
            <div class="deepseek-popout-content">
                <div class="deepseek-error-detail"></div>
            </div>
        `;
        // Close button
        this.element.querySelector('.deepseek-popout-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });

        // Close on click outside
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && 
                !this.element.contains(e.target) && 
                !e.target.closest('.deepseek-tree-tag') && 
                !e.target.closest('.deepseek-original-type-label')) {
                this.hide();
            }
        });
    }

    renderTreeGraph(root) {
        const NODE_W = 250;
        const NODE_H = 50;
        const GAP_X = 20;
        const GAP_Y = 40;

        // 1. Measure tree width
        const measure = (node) => {
            if (!node.children || node.children.length === 0) {
                node._width = NODE_W + GAP_X;
                return;
            }
            let w = 0;
            node.children.forEach(c => {
                measure(c);
                w += c._width;
            });
            node._width = Math.max(NODE_W + GAP_X, w);
        };
        measure(root);

        // 2. Layout nodes (Standard Top-Down first)
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        
        const layout = (node, x, y) => {
            const centerX = x + node._width / 2;
            const centerY = y;
            
            const layoutNode = { ...node, x: centerX, y: centerY, originalY: centerY };
            nodes.push(layoutNode);
            nodeMap.set(node, layoutNode);
            
            let currentX = x;
            if (node.children) {
                node.children.forEach(c => {
                    layout(c, currentX, y + NODE_H + GAP_Y);
                    const childLayout = nodeMap.get(c);
                    links.push({ source: childLayout, target: layoutNode });
                    currentX += c._width;
                });
            }
        };
        
        layout(root, 0, 10);

        // 3. Flip Y coordinates (Root at Bottom, Leaves at Top)
        let maxY = 0;
        nodes.forEach(n => maxY = Math.max(maxY, n.y));
        
        nodes.forEach(n => {
            n.y = maxY - n.originalY + 10;
        });

        // 4. Render SVG
        const totalWidth = root._width;
        const totalHeight = maxY + NODE_H + 20;
        
        let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Arrow Marker
        svg += `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
            </marker>
        </defs>
        `;

        // Links (Premise -> Conclusion)
        links.forEach(l => {
            const s = l.source; // Child (Premise) - Now at Top
            const t = l.target; // Parent (Conclusion) - Now at Bottom
            
            // Line from Source Bottom to Target Top
            const x1 = s.x;
            const y1 = s.y + NODE_H;
            const x2 = t.x;
            const y2 = t.y;
            
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1.5" marker-end="url(#arrowhead)" />`;
        });

        // Nodes
        nodes.forEach(n => {
            const rectX = n.x - NODE_W / 2;
            const rectY = n.y;
            const isRoot = n.id === root.id;
            const bgColor = isRoot ? '#fff1f2' : '#f8fafc';
            const borderColor = isRoot ? '#fda4af' : '#e2e8f0';
            const textColor = isRoot ? '#be123c' : '#64748b';
            
            svg += `
            <g transform="translate(${rectX}, ${rectY})">
                <rect width="${NODE_W}" height="${NODE_H}" rx="6" fill="${bgColor}" stroke="${borderColor}" stroke-width="1" />
                <foreignObject width="${NODE_W}" height="${NODE_H}">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:4px; box-sizing:border-box; font-family:sans-serif; text-align:center; overflow:hidden;">
                        <div style="font-size:9px; color:#334155; line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;" title="${n.text}">${n.text}</div>
                    </div>
                </foreignObject>
            </g>
            `;
        });

        svg += `</svg>`;
        return svg;
    }

    show(data) {
        const { error, target, text, premise_id, premise_text, premise_tree, evidence } = data;
        if (!target || !error) return;

        // Define helper function here so it's available for event listeners later
        const generateEvidenceList = (filter) => {
             if (!evidence) return '';
             if(Array.isArray(evidence.claim_detail)){
                 // Check if it's an array of objects (rich evidence)
                 if(evidence.claim_detail.length > 0 && typeof evidence.claim_detail[0] === 'object'){
                     return evidence.claim_detail.map(evidenceDetail => {
                        const filtered = evidenceDetail.evidences.filter(e => {
                            if(filter === 'ALL') return true;
                            return e.relationship === filter;
                        });
                        
                        if(filtered.length === 0) return '';

                        return filtered.map(e=>{
                            const relColor = (e.relationship === 'SUPPORTS') ? '#166534' : (e.relationship === 'REFUTES' ? '#991b1b' : '#854d0e');
                            const relBadge = e.relationship ? `<span style="display:inline-block; padding:1px 4px; border-radius:4px; background:${relColor}20; color:${relColor}; font-weight:600; font-size:10px; margin-right:6px;">${e.relationship}</span>` : '';
                            const sourceLink = e.url ? `<a href="${e.url}" target="_blank" style="color:#2563eb; text-decoration:none; font-size:10px; margin-left:auto;">Source ↗</a>` : '';
                            
                            return `
                                <div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">
                                    <div style="display:flex; align-items:center; margin-bottom:4px;">
                                        ${relBadge}
                                        ${sourceLink}
                                    </div>
                                    <div style="font-size:11px; color:#334155; margin-bottom:4px; line-height:1.4;">"${e.text || ''}"</div>
                                    ${e.reasoning ? `<div style="font-size:10px; color:#64748b; font-style:italic;">${e.reasoning}</div>` : ''}
                                </div>
                            `;
                        }).join('');
                     }).join('');
                 } else {
                     // Simple string array
                     return evidence.claim_detail.map(e => `<div style="margin-bottom:4px;">• ${e}</div>`).join('');
                 }
             } else {
                 return evidence;
             }
         };

        if (!this.element.isConnected) {
            const container = document.getElementsByClassName('app')[0] || document.body;
            container.appendChild(this.element);
        }

        // Populate Data
        const typeEl = this.element.querySelector('.deepseek-popout-type');
        const detailEl = this.element.querySelector('.deepseek-error-detail');

        const errorType = Array.isArray(error.error_type) ? error.error_type.join(', ') : (error.error_type || 'Logic Error');
        let errorMsg = error.error_msg || error.reason || 'An error was detected in this step.';

        // Fact Error handling: show evidence if available
        if (evidence) {
             const defaultFilter = 'REFUTES';
             
             const initialListHtml = generateEvidenceList(defaultFilter);
             
             errorMsg = `
                <div style="margin-top:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <div style="font-weight:600; color:#475569; font-size:11px;">Fact Check Evidence</div>
                        <div class="deepseek-evidence-controls" style="display:flex; gap:4px;">
                            <button class="ds-filter-btn ${defaultFilter==='ALL'?'active':''}" data-filter="ALL">All</button>
                            <button class="ds-filter-btn ${defaultFilter==='REFUTES'?'active':''}" data-filter="REFUTES">Refutes</button>
                            <button class="ds-filter-btn ${defaultFilter==='SUPPORTS'?'active':''}" data-filter="SUPPORTS">Supports</button>
                        </div>
                    </div>
                    <div class="deepseek-evidence-list" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px; font-size:12px; color:#334155; max-height:200px; overflow-y:auto;">
                        ${initialListHtml || '<div style="color:#94a3b8; font-style:italic;">No evidence found for this filter.</div>'}
                    </div>
                </div>
             `;
        }
        // Logic Error handling: show premise tree if available
        else if (String(errorType).includes('LogicError')) {
            if (premise_tree) {
                const svgGraph = this.renderTreeGraph(premise_tree);
                errorMsg = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <div style="font-weight:600; color:#475569; font-size:11px;">Dependency Graph</div>
                        <div class="deepseek-graph-controls" style="display:flex; gap:4px;">
                            <button class="ds-zoom-btn" data-action="out" title="Zoom Out" style="padding:2px 6px; border:1px solid #cbd5e1; background:#fff; border-radius:4px; cursor:pointer; font-size:10px; color:#475569;">-</button>
                            <button class="ds-zoom-btn" data-action="reset" title="Reset" style="padding:2px 6px; border:1px solid #cbd5e1; background:#fff; border-radius:4px; cursor:pointer; font-size:10px; color:#475569; min-width:36px;">100%</button>
                            <button class="ds-zoom-btn" data-action="in" title="Zoom In" style="padding:2px 6px; border:1px solid #cbd5e1; background:#fff; border-radius:4px; cursor:pointer; font-size:10px; color:#475569;">+</button>
                        </div>
                    </div>
                    <div class="deepseek-graph-wrapper" style="overflow:auto; position:relative;">
                        <div class="deepseek-graph-content" style="transform-origin:top center; transition:transform 0.1s ease-out; display:flex; justify-content:center;">
                            ${svgGraph}
                        </div>
                    </div>`;
            } else if (premise_id && premise_id.length > 0) {
                // Fallback to flat list
                if (premise_text && premise_text.length > 0) {
                     const list = premise_text.map((t, i) => 
                        `<div style="margin-bottom: 4px;">
                            <span>${t}</span>
                        </div>`
                     ).join('');
                     errorMsg = `<div style="margin-top:4px;">${list}</div>`;
                } else {
                    errorMsg = `Premise: ${premise_id.join(', ')}`;
                }
            }
        }

        typeEl.textContent = errorType;
        
        let html = '';
        if (text) {
            html += `
                <div class="deepseek-error-label">Sentence</div>
                <div class="deepseek-error-text" style="font-style: italic; color: #475569; border-left: 2px solid #e2e8f0; padding-left: 8px; margin-bottom: 12px;">${text}</div>
            `;
        }
        html += `
            <div class="deepseek-error-label">Reason</div>
            <div class="deepseek-error-text">${errorMsg}</div>
        `;
        detailEl.innerHTML = html;

        // Add event listeners for filter buttons
        const filterBtns = detailEl.querySelectorAll('.ds-filter-btn');
        const evidenceListContainer = detailEl.querySelector('.deepseek-evidence-list');
        
        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update active state
                    filterBtns.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Get filter type
                    const filterType = e.target.getAttribute('data-filter');
                    console.log('Filter evidence by:', filterType);
                    
                    // Regenerate list
                    evidenceListContainer.innerHTML = generateEvidenceList(filterType);
                });
            });
        }

        // Position
        const rect = target.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportWidth = document.documentElement.clientWidth;

        // Force layout to get dimensions
        this.element.style.display = 'flex';
        const popoutRect = this.element.getBoundingClientRect();
        
        const arrowHeight = 10;
        const gap = 4;
        
        // Default: Top Center
        let placement = 'top';
        let docTop = rect.top + scrollY - popoutRect.height - arrowHeight - gap;
        let docLeft = rect.left + scrollX + (rect.width / 2) - (popoutRect.width / 2);
        
        // Boundary checks (viewport relative)
        if (rect.top - popoutRect.height - arrowHeight - gap < 10) {
            // Flip to bottom
            docTop = rect.bottom + scrollY + arrowHeight + gap;
            placement = 'bottom';
        }
        
        // Horizontal clamping
        if (docLeft < 10 + scrollX) docLeft = 10 + scrollX;
        if (docLeft + popoutRect.width > scrollX + viewportWidth - 10) {
            docLeft = scrollX + viewportWidth - popoutRect.width - 10;
        }

        let finalTop = docTop;
        let finalLeft = docLeft;

        // Adjust for offset parent (e.g. if inside #app)
        const offsetParent = this.element.offsetParent;
        if (offsetParent && offsetParent !== document.body && offsetParent !== document.documentElement) {
            const parentRect = offsetParent.getBoundingClientRect();
            finalTop -= (parentRect.top + scrollY);
            finalLeft -= (parentRect.left + scrollX);
            finalTop += offsetParent.scrollTop;
            finalLeft += offsetParent.scrollLeft;
        }

        this.element.style.top = `${finalTop}px`;
        this.element.style.left = `${finalLeft}px`;
        
        // Calculate arrow position relative to popout
        const targetCenter = rect.left + scrollX + rect.width / 2;
        let arrowX = targetCenter - docLeft;
        // Clamp arrow to be within popout border radius
        arrowX = Math.max(16, Math.min(popoutRect.width - 16, arrowX));
        
        this.element.style.setProperty('--arrow-x', `${arrowX}px`);
        this.element.classList.remove('placement-top', 'placement-bottom');
        this.element.classList.add(`placement-${placement}`);
        
        // Set transform origin for growing effect
        const originY = placement === 'top' ? 'bottom' : 'top';
        this.element.style.transformOrigin = `${arrowX}px ${originY}`;

        // Initialize Zoom (after layout is active)
        const graphWrapper = detailEl.querySelector('.deepseek-graph-wrapper');
        const svg = graphWrapper ? graphWrapper.querySelector('svg') : null;
        
        if (graphWrapper && svg) {
            const origW = parseFloat(svg.getAttribute('width'));
            const origH = parseFloat(svg.getAttribute('height'));
            
            // Calculate fit scale
            const wrapperW = graphWrapper.clientWidth; 
            const wrapperH = 400; 
            const availW = wrapperW > 0 ? wrapperW : 480;
            
            const wRatio = availW / origW;
            const hRatio = wrapperH / origH;
            let scale = Math.min(wRatio, hRatio, 1); 
            scale = Math.max(0.1, scale);

            svg.style.width = '100%';
            svg.style.height = 'auto';
            svg.style.display = 'block';
            
            let viewBoxX = 0;
            let viewBoxY = 0;

            const updateZoom = () => {
                const vw = availW / scale;
                const vh = (availW * (origH / origW)) / scale;
                svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${vw} ${vh}`);
                
                const resetBtn = detailEl.querySelector('.ds-zoom-btn[data-action="reset"]');
                if (resetBtn) resetBtn.textContent = `${Math.round(scale * 100)}%`;
            };
            
            updateZoom();

            detailEl.querySelectorAll('.ds-zoom-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const oldScale = scale;
                    
                    if (action === 'in') scale = Math.min(5, scale * 1.2);
                    if (action === 'out') scale = Math.max(0.1, scale / 1.2);
                    if (action === 'reset') {
                        const cW = graphWrapper.clientWidth || 480;
                        scale = Math.min(cW / origW, 400 / origH, 1);
                        viewBoxX = 0;
                        viewBoxY = 0;
                    } else {
                        // Zoom to center
                        const vw = availW / oldScale;
                        const vh = (availW * (origH / origW)) / oldScale;
                        const newVw = availW / scale;
                        const newVh = (availW * (origH / origW)) / scale;
                        
                        viewBoxX += 0.5 * (vw - newVw);
                        viewBoxY += 0.5 * (vh - newVh);
                    }
                    updateZoom();
                });
            });
            
            graphWrapper.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const rect = svg.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    
                    const oldScale = scale;
                    const delta = e.deltaY > 0 ? 0.9 : 1.1;
                    scale = Math.max(0.1, Math.min(5, scale * delta));
                    
                    const vw = availW / oldScale;
                    const vh = (availW * (origH / origW)) / oldScale;
                    const newVw = availW / scale;
                    const newVh = (availW * (origH / origW)) / scale;
                    
                    // Adjust viewBoxX/Y to keep mouse position stable
                    const px = mx / rect.width;
                    const py = my / rect.height;
                    
                    viewBoxX += px * (vw - newVw);
                    viewBoxY += py * (vh - newVh);
                    
                    updateZoom();
                }
            }, { passive: false });
        }

        // Trigger animation
        requestAnimationFrame(() => {
            this.element.classList.add('visible');
        });
        this.isVisible = true;
    }

    hide() {
        this.element.classList.remove('visible');
        this.isVisible = false;
    }
}

export const errorPopout = new ErrorPopout();
