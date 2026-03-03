// ES Module: Reason tree module
'use strict';
import * as U from './utils.js';
import DeepSeekBus, { get as getBus, set as setBus, tagMap } from './bus.js';
const STYLE_ID='deepseek-tree-style';

function injectStyles(){
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent=`
    /* Enhanced tree structure aligned with base UI */
		.indent-tree.deepseek-enhanced{margin-left:0;padding-left:34px; width:200px}
		.indent-tree.deepseek-enhanced::before{content:"";position:absolute;left:16px;top:30px;bottom:30px;width:1px;background:rgba(100,116,139,0.28);z-index:0}
		.indent-tree.deepseek-enhanced .indent-entry{margin:0px 0;padding-left:12px} 

		/* Tree structure styling */
    .deepseek-tree-section{
      position:relative;
      min-height:35px;
      }
    
    .deepseek-tree-entry {
        display: flex;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
        border-radius: 0 6px 6px 0;
        margin: 0px 0;
    }
    .deepseek-tree-entry:hover,
    .deepseek-tree-section.active-highlight {
        background-color: rgba(241, 245, 249, 1);
    }
 
    .indent-text{display:flex;align-items:center;gap:24px;flex-direction:row;cursor:pointer;transition:background-color 0.15s ease;padding:4px;margin:-4px;border-radius:4px}
		.indent-text:hover{background-color:rgba(148,163,184,0.08)}
		.deepseek-tree-label{display:block;font-size:14px;color:#64748b;cursor:pointer;line-height:1.7}
		.deepseek-tree-label:hover{text-decoration:underline}
		.deepseek-tree-label-prefix{flex:0 0 auto;display:flex;align-items:center;justify-content:center;min-width:30px;height:40px;padding:0 2px}
		.deepseek-tree-label-prefix svg{display:block}
		.deepseek-tree-label-prefix svg polyline{stroke-width:1.2}
		.deepseek-tree-label-prefix svg line{stroke-width:1.2}
		.deepseek-tree-label-prefix.empty{min-width:10px;width:10px;height:10px;border-radius:50%;background:rgba(148,163,184,0.45)}
		.deepseek-line-chart{display:block}

    /* Nested tree structure */
		.deepseek-nested-tree{margin:6px 0 0 0;padding-left:34px}
		.deepseek-tree-section.deepseek-has-children>.deepseek-nested-tree{position:relative;margin-top:8px}
		.deepseek-tree-section.deepseek-has-children>.deepseek-nested-tree>.indent-entry{position:relative}
		.deepseek-tree-section.deepseek-has-children>.deepseek-nested-tree>.indent-entry::after{display:none}

    /* Tree Tags */
    .deepseek-tree-tag {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        font-size: 9px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.1s ease;
        position: relative;
        z-index: 2;
    }
    .deepseek-tree-tag:hover {
        transform: scale(1.1);
    }
    .deepseek-tree-tag.status-unknown {
        background-color: #dadadbff;
        color: #64748b;
    }
    .deepseek-tree-tag.status-error {
        background-color: rgba(243, 196, 196, 1);
        color: #991b1b;
    }
    .deepseek-tree-tag.status-safe {
        background-color: rgba(201, 233, 214, 1);
        color: #166534;
    }
    .deepseek-tree-tag.status-propagated {
        border: 1.5px solid #ef4444;
        box-sizing: border-box;
    }
    .deepseek-tree-tag:not(.status-propagated) {
        border: 1px solid transparent;
    }

    /* New Styles for Refactoring */
    .deepseek-tree-root {
        position: relative;
        margin: 8px 0;
        padding: 0;
        border: none;
    }

    .deepseek-tree-links {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 1;
    }
    .deepseek-tree-legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0px;
        padding: 6px 6px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 8px;
        font-size: 10px;
        color: #64748b;
        background: #f8fafc;
        border-radius: 6px;
    }
    .deepseek-legend-section {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .deepseek-legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .deepseek-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
    .deepseek-legend-dot.safe { background-color: rgba(161, 215, 183, 1); opacity: 0.8; }
    .deepseek-legend-dot.error { background-color: rgba(236, 165, 165, 1); opacity: 0.8; }
    .deepseek-legend-dot.propagated { border: 1.5px solid #ef4444; box-sizing: border-box; background: transparent; }
    
    .deepseek-legend-separator {
        width: 1px;
        height: 16px;
        background-color: #cbd5e1;
        margin: 0 4px;
    }
    .deepseek-legend-tag-item {
        display: flex;
        align-items: center;
        gap: 3px;
    }
    .deepseek-legend-tag-char {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: #e2e8f0;
        color: #475569;
        font-size: 9px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        text-transform: uppercase;
        line-height: 1;
    }
    .deepseek-tree-bar {
        width: 3px;
        height: 12px;
        border-radius: 1.5px;
        background-color: #cbd5e1;
        margin: 0 8px;
        flex-shrink: 0;
    }
    .deepseek-tree-tags-container {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
        z-index: 2;
        align-items: center;
    }
    .deepseek-link-arc {
        stroke: #94a3b8;
        stroke-width: 1;
        fill: none;
        opacity: 0.3; /* Default hidden/faint */
        transition: all 0.2s ease;
    }
    .deepseek-link-arc.error {
        stroke:  rgba(239, 68, 68, 0.8);;
    }
    
    /* Hover States */
    .deepseek-tree-root.has-hover .deepseek-tree-tag:not(.is-highlighted) {
        opacity: 0.3;
    }
    
    .deepseek-tree-root.has-hover .deepseek-link-arc:not(.active-parent):not(.active-child) {
        opacity: 0.3 !important;
    }
    
    .deepseek-link-arc.active-parent {
        stroke: #64748b;
        stroke-width: 1.5;
        opacity: 1 !important;
        stroke-dasharray: none;
    }
    .deepseek-link-arc.active-child {
        stroke: #64748b;
        stroke-width: 1.5;
        opacity: 1 !important;
        stroke-dasharray: 4 2;
    }

    /* Preserve error color when highlighted */
    .deepseek-link-arc.active-parent.error,
    .deepseek-link-arc.active-child.error {
        stroke: rgba(239, 68, 68, 1) !important;
    }
    
    .deepseek-tree-tag.is-highlighted {
        opacity: 1 !important;
        transform: scale(1.2);
        z-index: 10;
    }
    @keyframes deepseek-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
    }
    .deepseek-tree-tag.active-selected {
        animation: deepseek-pop 0.4s ease-out;
        box-shadow: 0 0 0 2px #fcff50ff;
        z-index: 15;
    }
    /* Updates to existing classes */
    .deepseek-tree-label {
        /* Box style for text */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: normal;
        line-height: 1.35;
        
        background: transparent;
        border: none;
        padding: 0 10px 0 0;
        
        flex: 0 0 auto;
        text-align: right;
        margin-right: 10px;
        max-width: 220px;
    }
    .deepseek-tree-label.is-root {
        font-weight: 600;
        color: #1e293b;
    }
    .deepseek-tree-label:not(.is-root) {
        font-weight: 400;
        color: #6a717bff;
    }
  `;
  document.head.appendChild(style);
}
injectStyles();


// Global listener for hover events to highlight nodes
DeepSeekBus.on('hover-section', (data) => {
    const id = data?.id;
    // Remove existing highlights
    document.querySelectorAll('.deepseek-tree-section.active-highlight').forEach(el => {
        el.classList.remove('active-highlight');
    });
    
    if (id) {
        const el = document.querySelector(`.deepseek-tree-section[data-id="${id}"]`);
        if (el) {
            el.classList.add('active-highlight');
            // Optional: scroll into view if needed
            // el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

function clearHighlight(root, keepSelection = false) {
    root.classList.remove('has-hover');
    root.querySelectorAll(':not(.is-highlighted)').forEach(el => el.classList.remove(':not(.is-highlighted)'));
    root.querySelectorAll('.is-highlighted').forEach(el => el.classList.remove('is-highlighted'));
    root.querySelectorAll('.active-parent').forEach(el => el.classList.remove('active-parent'));
    root.querySelectorAll('.active-child').forEach(el => el.classList.remove('active-child'));
    
    if (!keepSelection) {
        root.querySelectorAll('.deepseek-tree-section.active-highlight').forEach(el => el.classList.remove('active-highlight'));
        root.querySelectorAll('.deepseek-tree-tag.active-selected').forEach(el => el.classList.remove('active-selected'));
    }
}

function applyHighlight(root, hoveredId, keepSelection = false) {
    clearHighlight(root, keepSelection);
    
    if (!hoveredId) return;

    root.classList.add('has-hover');

    // Build Graph from DOM links
    const links = Array.from(root.querySelectorAll('.deepseek-link-arc'));
    const adj = {}; // source -> [targets]
    const revAdj = {}; // target -> [sources]
    const linkMap = {}; // key -> linkElement

    links.forEach(link => {
        const s = link.dataset.sourceId;
        const t = link.dataset.targetId;
        if(s && t) {
            if(!adj[s]) adj[s] = [];
            adj[s].push(t);
            
            if(!revAdj[t]) revAdj[t] = [];
            revAdj[t].push(s);
            
            const key = `${s}-${t}`;
            linkMap[key] = link;
        }
    });

    const hId = String(hoveredId);
    const relatedNodes = new Set([hId]);
    const relatedLinks = new Set();
    const ancestors = new Set();
    
    // BFS for Ancestors (Upstream)
    let q = [hId];
    const visitedUp = new Set([hId]);
    while(q.length > 0){
        const curr = q.shift();
        if(revAdj[curr]){
            revAdj[curr].forEach(parent => {
                if(linkMap[`${parent}-${curr}`]) relatedLinks.add(linkMap[`${parent}-${curr}`]);
                
                if(!visitedUp.has(parent)){
                    visitedUp.add(parent);
                    ancestors.add(parent);
                    relatedNodes.add(parent);
                    q.push(parent);
                }
            });
        }
    }

    // BFS for Descendants (Downstream)
    q = [hId];
    const visitedDown = new Set([hId]);
    while(q.length > 0){
        const curr = q.shift();
        if(adj[curr]){
            adj[curr].forEach(child => {
                if(linkMap[`${curr}-${child}`]) relatedLinks.add(linkMap[`${curr}-${child}`]);

                if(!visitedDown.has(child)){
                    visitedDown.add(child);
                    relatedNodes.add(child);
                    q.push(child);
                }
            });
        }
    }

    // Apply classes
    relatedNodes.forEach(nodeId => {
        const node = document.getElementById(`tree-tag-${nodeId}`);
        if(node) node.classList.add('is-highlighted');
    });

    relatedLinks.forEach(link => {
        const t = link.dataset.targetId;
        if (t === hId || ancestors.has(t)) {
             link.classList.add('active-parent');
        } else {
             link.classList.add('active-child');
        }
    });
}

// Global listener for hover events to highlight nodes
DeepSeekBus.on('hover-node', (data) => {
    const hoveredId = data?.id;
    
    const root = document.querySelector('.deepseek-tree-root');
    if (!root) return;

    if (hoveredId) {
        applyHighlight(root, hoveredId, true);
    } else {
        // If clearing hover, check if we have a selected node to fall back to
        const selectedTag = root.querySelector('.deepseek-tree-tag.active-selected');
        if (selectedTag && selectedTag.dataset.nodeId) {
            applyHighlight(root, selectedTag.dataset.nodeId, true);
        } else {
            clearHighlight(root, false);
        }
    }
});

// Global listener for click events to highlight and scroll to nodes
DeepSeekBus.on('node-click', (data) => {
    const id = data?.id;
    const root = document.querySelector('.deepseek-tree-root');

    if (root) {
        clearHighlight(root, false);
    }
    if (data?.type === 'section') {
      clearHighlight(root, false);
      return; // Ignore section clicks here
    }

    if (!id) return;

    const el = document.querySelector(`.deepseek-tree-section[data-id="${id}"]`);
    if (el) {
        el.classList.add('active-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const tag = document.getElementById(`tree-tag-${id}`);
    if (tag) {
        tag.classList.add('active-selected');
    }

    // Also trigger the connection highlight
    if (root) {
        applyHighlight(root, id, true);
    }
});

//绘制Premise链接
function drawLinks(treeRoot, svgLayer){
    svgLayer.innerHTML = '';
    const nodes = treeRoot.querySelectorAll('.deepseek-tree-tag');
    
    const rootRect = treeRoot.getBoundingClientRect();
    
    nodes.forEach(node => {
      // console.log('Drawing links for node:', node.dataset);
        if(!node.dataset.premises) return;
        let premises = [];
        try { premises = JSON.parse(node.dataset.premises); } catch(e){}
        
        const targetRect = node.getBoundingClientRect();
        // Target: Top Center
        const targetY = targetRect.top - rootRect.top;
        const targetX = targetRect.left - rootRect.left + targetRect.width / 2;
        
        premises.forEach(premiseId => {
            // Try to find source by ID (for tags)
            let sourceNode = document.getElementById(`tree-tag-${String(premiseId)}`);
            
            // Fallback: check data-id in this tree (for rows)
            if(!sourceNode){
                sourceNode = treeRoot.querySelector(`.deepseek-tree-section[data-id="${premiseId}"]`);
            }
            
            if(sourceNode){
                const sourceRect = sourceNode.getBoundingClientRect();
                
                // If source is a tag (small), center it. If row, use left offset.
                let sourceX;
                if(sourceNode.classList.contains('deepseek-tree-tag')){
                     sourceX = sourceRect.left - rootRect.left + sourceRect.width / 2;
                } else {
                     sourceX = sourceRect.left - rootRect.left + 20;
                }
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // Check if Source and Target are on the same layer (depth)
                const sourcelayerId = sourceNode.dataset.layerId;
                const targetlayerId = node.dataset.layerId;
                const isSameLayer = (sourcelayerId === targetlayerId);
                const isContinuous = Math.abs(Number(sourcelayerId) - Number(targetlayerId)) === 1;

                let sourceY, startDirY;
                if(isSameLayer){
                    sourceY = sourceRect.top - rootRect.top;
                    startDirY = -1; // Up
                } else {
                    sourceY = sourceRect.bottom - rootRect.top;
                    startDirY = 1; // Down
                }

                let d = '';
                
                if(isSameLayer){
                    // Same Layer: Top -> Top connection
                    // Direct path: Up -> Horizontal -> Down
                    // No channel needed.
                    
                    const midY = Math.min(sourceY, targetY) - 5; // Arc height above
                    const r = 10;
                    const dirX = targetX > sourceX ? 1 : -1;
                    
                    // Ensure radius fits
                    const effR = Math.min(
                        r, 
                        Math.abs(targetX - sourceX)/2, 
                        Math.abs(sourceY - midY), 
                        Math.abs(targetY - midY)
                    );
                    
                    d += `M ${sourceX} ${sourceY}`;
                    d += ` L ${sourceX} ${midY + effR}`; // Up
                    d += ` Q ${sourceX} ${midY} ${sourceX + dirX * effR} ${midY}`; // Turn
                    d += ` L ${targetX - dirX * effR} ${midY}`; // Horizontal
                    d += ` Q ${targetX} ${midY} ${targetX} ${midY + effR}`; // Turn
                    d += ` L ${targetX} ${targetY}`; // Down
                    
                } else {
                    // Different Layer: Bottom -> Top connection
                    // Use Channel to the RIGHT
                    const r = 10;
                    const distY = Math.abs(targetY - sourceY);
                    let offset = Math.max(Math.min(60, 20 + distY * 0.1),0);
                    
                    if (sourceX==targetX){
                        offset = - r;
                    }
                    
                    // Change: Bias to RIGHT (targetX + offset) instead of Left (targetX - offset)
                    const channelX = targetX + offset;
                    
                    const effR = Math.min(
                        r, 
                        Math.abs(sourceX - channelX)/2, 
                        Math.abs(targetX - channelX)/2,
                        Math.abs(targetY - sourceY)/2
                    );
                    
                    const y1 = sourceY + effR; // Down (since startDirY=1 for !isSameLayer)
                    const y2 = targetY - effR; // Up from target
                    const dirY = y2 >= y1 ? 1 : -1;
                    
                    const isAligned = (sourceX === targetX);

                    if (isContinuous && !isAligned){
                        // console.log('Continuous connection');
                        // Direct path for continuous layers
                        const dirX = sourceX <= targetX ? 1 : -1;
                        d += `M ${sourceX} ${sourceY}`;
                        d += ` Q ${sourceX} ${y1} ${sourceX + dirX * effR} ${y1}`; // Turn
                        d += ` L ${targetX - dirX * effR} ${y1}`; // Left/Right
                        d += ` Q ${targetX} ${y1} ${targetX} ${targetY}`; // Turn Down
                    } else {
                        // Channel path
                        const dirX = sourceX <= channelX ? 1 : -1;
                        const channelSide = channelX > targetX ? 1 : -1;

                        d += `M ${sourceX} ${sourceY}`;
                        d += ` Q ${sourceX} ${y1} ${sourceX + dirX * effR} ${y1}`; // Turn
                        d += ` L ${channelX - dirX * effR} ${y1}`; // Horizontal to Channel
                        d += ` Q ${channelX} ${y1} ${channelX} ${y1 + dirY * effR}`; // Turn Vertical
                        d += ` L ${channelX} ${y2 - dirY * effR}`; // Vertical
                        d += ` Q ${channelX} ${y2} ${channelX - channelSide * effR} ${y2}`; // Turn
                        d += ` L ${targetX + channelSide * effR} ${y2}`; // Horizontal to Target
                        d += ` Q ${targetX} ${y2} ${targetX} ${targetY}`; // Turn Down
                    }
                }
                
                path.setAttribute('d', d);
                path.setAttribute('class', 'deepseek-link-arc');
                path.dataset.sourceId = premiseId;
                if(node.dataset.nodeId) path.dataset.targetId = node.dataset.nodeId;

                if(sourceNode.classList.contains('status-error' )||sourceNode.classList.contains('status-propagated' )){
                    path.classList.add('error');
                }
                svgLayer.appendChild(path);
            }
        });
    });
}

// Helper functions for tree rendering
function setupTreeRoot(container) {
  let treeRoot = container.querySelector('.deepseek-nested-tree');
  if(!treeRoot){
    treeRoot = document.createElement('div');
    treeRoot.className = 'deepseek-nested-tree deepseek-tree-root';
    container.appendChild(treeRoot);
  } else {
    treeRoot.innerHTML='';
    treeRoot.classList.add('deepseek-tree-root');
  }
  treeRoot.removeAttribute('style');
  return treeRoot;
}

function setupSvgLayer(treeRoot) {
  let svgLayer = treeRoot.querySelector('.deepseek-tree-links');
  if(!svgLayer){
      svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgLayer.setAttribute('class', 'deepseek-tree-links');
      treeRoot.appendChild(svgLayer);
  } else {
      svgLayer.innerHTML = '';
  }
  return svgLayer;
}

function createLegend() {
  const legend = document.createElement('div');
  legend.className = 'deepseek-tree-legend';

  // Status Section
  const statusGroup = document.createElement('div');
  statusGroup.className = 'deepseek-legend-section';
  
  const createStatusItem = (className, label) => {
      const item = document.createElement('div');
      item.className = 'deepseek-legend-item';
      const dot = document.createElement('div');
      dot.className = `deepseek-legend-dot ${className}`;
      const text = document.createElement('span');
      text.textContent = label;
      item.appendChild(dot);
      item.appendChild(text);
      return item;
  };
  statusGroup.appendChild(createStatusItem('safe', 'Correct'));
  statusGroup.appendChild(createStatusItem('error', 'Wrong'));
  statusGroup.appendChild(createStatusItem('propagated', 'Propagated'));
  
  legend.appendChild(statusGroup);

  // Separator
  const sep = document.createElement('div');
  sep.className = 'deepseek-legend-separator';
  legend.appendChild(sep);

  // Types Section
  const typeGroup = document.createElement('div');
  typeGroup.className = 'deepseek-legend-section';

  const createTagItem = (char, label) => {
      const item = document.createElement('div');
      item.className = 'deepseek-legend-tag-item';
      const charNode = document.createElement('div');
      charNode.className = 'deepseek-legend-tag-char';
      charNode.textContent = char;
      const text = document.createElement('span');
      text.textContent = label;
      item.appendChild(charNode);
      item.appendChild(text);
      return item;
  };

  Object.values(tagMap).forEach(t => typeGroup.appendChild(createTagItem(t.char, t.label)));
  
  legend.appendChild(typeGroup);
  
  return legend;
}

function calculateDepthMetrics(sentenceTree) {
  if (!sentenceTree || sentenceTree.length === 0) return { maxDepth: 0, minDepth: 0 };
  return sentenceTree.reduce((acc,item)=>{
    const depth = item.depth || 0;
    if(depth > acc.maxDepth) acc.maxDepth = depth;
    if(depth < acc.minDepth) acc.minDepth = depth;
    return acc;
  }, { maxDepth: -Infinity, minDepth: Infinity });
}

function getTagChar(tagKey) {
    if (!tagKey) return '?';
    if (tagMap[tagKey]) return tagMap[tagKey].char;
}

function createTagNode(child, valueRanges, activeFilter, sentenceMap) {
    
    const currentErrorMap = getBus()?.currentErrorMap;
    const factCheckMap = getBus()?.factCheckMap;

    const tagRaw = child.tag;
    const tagLabel = U.formatTagLabel ? U.formatTagLabel(tagRaw) : (Array.isArray(tagRaw) ? tagRaw[0] : tagRaw);
    if(!tagLabel) return null;
    
    let isError = child.has_error;
    let isPropagated = child.is_propagated;
    
    if(child.id && currentErrorMap?.has(child.id)){
        const err = currentErrorMap.get(child.id);
        if(err.has_error !== undefined && err.has_error !== null) {
            isError = err.has_error;
        } else if(err.error !== undefined && err.error !== null) {
            isError = err.error;
        }
        if(err.propagated_error || err.isPropagatedError) isPropagated = true;
    }

    const tagNode = document.createElement('div');
    tagNode.className = 'deepseek-tree-tag';
    
    // Dynamic Sizing Logic
    let size = 14; // Default size
    if (activeFilter === 'pagerank' && child.pagerank !== undefined && child.pagerank !== null) {
        const { minPR, maxPR } = valueRanges || {};
        if (maxPR !== undefined && maxPR > minPR) {
            // Larger PageRank -> Larger Size
            const ratio = (child.pagerank - minPR) / (maxPR - minPR);
            size = 14 + ratio * 10; // Range: 14px - 28px
        }
    } else if (activeFilter === 'reverse_depth' && child.reverse_depth !== undefined && child.reverse_depth !== null) {
        const { minRD, maxRD } = valueRanges || {};
        if (maxRD !== undefined && maxRD > minRD) {
            // Smaller Reverse Depth -> Larger Size
            const ratio = (maxRD - child.reverse_depth) / (maxRD - minRD);
            size = 10 + ratio * 14; // Range: 10px - 24px
        }
    } else if (activeFilter && activeFilter !== 'pagerank' && activeFilter !== 'reverse_depth') {
        // Category Filter: Highlight matching nodes with larger size
        const tags = Array.isArray(child.tag) ? child.tag : (child.tag ? [child.tag] : []);
        if (tags.includes(activeFilter)) {
            size = 20; // Highlighted
        } else {
            size = 14; // Dimmed
        }
    }

    if (size !== 14) {
        tagNode.style.width = `${size}px`;
        tagNode.style.height = `${size}px`;
        tagNode.style.fontSize = `${Math.max(9, size * 0.5)}px`;
    }

    if(child.id) {
        tagNode.id = `tree-tag-${child.id}`;
        tagNode.dataset.nodeId = child.id;
    }
    
    if(child.premise_id && Array.isArray(child.premise_id) && child.premise_id.length > 0){
        tagNode.dataset.premises = JSON.stringify(child.premise_id);
    }
    
    if(isError === null || isError === undefined){
        tagNode.classList.add('status-unknown');
    } else if(isError){
        tagNode.classList.add('status-error');
    } else {
        tagNode.classList.add('status-safe');
    }
    
    if(isPropagated){
        tagNode.classList.add('status-propagated');
    }

    const tagKey = Array.isArray(tagRaw) ? tagRaw[0] : tagRaw;
    tagNode.textContent = getTagChar(tagKey);
    tagNode.title = `${tagLabel}${isError ? ' (Error)' : ''}${isPropagated ? ' (Propagated)' : ''}`;

    tagNode.addEventListener('click', (e) => {
        e.stopPropagation();
        if(DeepSeekBus) DeepSeekBus.emit('node-click', { id: child.id, type: 'tag' });
        
        if (isError && DeepSeekBus) {
             const err = currentErrorMap.get(child.id);
             const factEvidence = factCheckMap.get(child.id)?.fact_check_result || null;
             console.log('Emitting show-error for node:', child.id, factEvidence);
             
             // Helper to build tree
             const buildPremiseTree = (id, visited = new Set()) => {
                 if(visited.has(id)) return { id, text: 'Cycle detected', children: [] };
                 visited.add(id);
                 
                 const node = sentenceMap ? sentenceMap.get(String(id)) : null;
                 // If it's the root (child.id), we have the text in 'child'
                 let text = node ? node.text : id;
                 let pids = node ? (node.premise_id || []) : [];
                 
                 if(String(id) === String(child.id)) {
                     text = child.text;
                     pids = child.premise_id || [];
                 }

                 const children = pids.map(pid => buildPremiseTree(pid, new Set(visited)));
                 return { id, text, children };
             };

             const premiseTree = buildPremiseTree(child.id);

             DeepSeekBus.emit('show-error', { 
                 id: child.id, 
                 error: err, 
                 target: tagNode, 
                 text: child.text,
                 premise_tree: premiseTree,
                 evidence: factEvidence
             });
        }
    });
    // Hover effect
    tagNode.onmouseenter = () => {
        DeepSeekBus.emit('hover-node', { id: child.id, source: 'tree' });
    };
    tagNode.onmouseleave = () => {
        DeepSeekBus.emit('hover-node', { id: null, source: 'tree' });
    };
    
    return tagNode;
}

function createTreeEntry(layerId, item, depthMetrics, valueRanges, activeFilter, sentenceMap) {
    const depth = item.depth || 0;

    // Create Entry Row
    const entry = document.createElement('div');
    entry.className = 'deepseek-tree-section deepseek-tree-entry';
    
    const basePadding = 8;
    const indentStep = 24;
    entry.style.padding = `6px 8px 6px ${basePadding}px`;
    
    entry.dataset.id = item.id;
    entry.dataset.layerId = layerId;

    // Store premise info
    let premises = item.premise_id || [];
    if(item.children && Array.isArray(item.children)){
        item.children.forEach(c => {
            if(c.premise_id && Array.isArray(c.premise_id)){
                premises = [...premises, ...c.premise_id];
            }
        });
    }
    premises = [...new Set(premises)];
    if(premises.length > 0){
        entry.dataset.premises = JSON.stringify(premises);
    }
    
    // Hover effect
    entry.onmouseenter = () => {
        DeepSeekBus.emit('hover-section', { id: item.id, source: 'tree' });
    };
    entry.onmouseleave = () => {
        DeepSeekBus.emit('hover-section', { id: null, source: 'tree' });
    };

    // Font Size & Weight
    const minDepth = (depthMetrics.minDepth === undefined || depthMetrics.minDepth === Infinity) ? 0 : depthMetrics.minDepth;
    const maxDepth = Math.max(3, (depthMetrics.maxDepth === undefined || depthMetrics.maxDepth === -Infinity) ? 0 : depthMetrics.maxDepth);
    const minFS = 9;
    const maxFS = 12;
    const minFW = 400;
    const maxFW = 600;
    
    let fontSize;
    let fontWeight;
    if (maxDepth <= minDepth) {
        fontSize = maxFS;
        fontWeight = maxFW;
    } else {
        const t = (depth - minDepth) / (maxDepth - minDepth);
        fontSize = maxFS - t * (maxFS - minFS);
        fontWeight = maxFW - t * (maxFW - minFW);
    }
    
    // Label
    const title = document.createElement('span');
    title.className = 'deepseek-tree-label';
    if(depth === minDepth) title.classList.add('is-root');
    title.textContent = item.title || item.text || '';
    
    // Fixed Label Width Logic
    const labelWidth = 220;
    
    title.style.width = `${labelWidth}px`;
    title.style.flex = 'none';
    // title.style.textAlign = 'right';
    
    title.style.fontSize = `${fontSize.toFixed(1)}px`;
    title.style.fontWeight = Math.round(fontWeight);
    entry.appendChild(title);

    // Status Bar
    const bar = document.createElement('div');
    bar.className = 'deepseek-tree-bar';
    bar.style.marginLeft = `${(depth-minDepth) * indentStep}px`;
    entry.appendChild(bar);

    // Children Tags
    if(item.children && Array.isArray(item.children)){
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'deepseek-tree-tags-container';
        
        item.children.forEach(child => {
            const tagNode = createTagNode(child, valueRanges, activeFilter, sentenceMap);
            tagNode.dataset.layerId = layerId;
            if(tagNode) childrenContainer.appendChild(tagNode);
        });
        entry.appendChild(childrenContainer);
    }

    // Click Event
    entry.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(DeepSeekBus) DeepSeekBus.emit('node-click', { id: item.id, type: 'section' });
    });

    return entry;
}

function calculateValueRanges(treeSentences) {
    let minPR = Infinity, maxPR = -Infinity;
    let minRD = Infinity, maxRD = -Infinity;

    if (!treeSentences) return { minPR, maxPR, minRD, maxRD };

    treeSentences.forEach(row => {
        // Iterate over children (which includes the row itself and non-depth siblings)
        if (row.children && Array.isArray(row.children)) {
            row.children.forEach(node => {
                if (node.pagerank !== undefined && node.pagerank !== null) {
                    minPR = Math.min(minPR, node.pagerank);
                    maxPR = Math.max(maxPR, node.pagerank);
                }
                if (node.reverse_depth !== undefined && node.reverse_depth !== null) {
                    minRD = Math.min(minRD, node.reverse_depth);
                    maxRD = Math.max(maxRD, node.reverse_depth);
                }
            });
        } else {
             // Fallback if no children array
             if (row.pagerank !== undefined && row.pagerank !== null) {
                minPR = Math.min(minPR, row.pagerank);
                maxPR = Math.max(maxPR, row.pagerank);
            }
            if (row.reverse_depth !== undefined && row.reverse_depth !== null) {
                minRD = Math.min(minRD, row.reverse_depth);
                maxRD = Math.max(maxRD, row.reverse_depth);
            }
        }
    });
    
    // Handle single value or no value cases to avoid division by zero
    if (minPR === Infinity) { minPR = 0; maxPR = 1; }
    if (minPR === maxPR) { maxPR = minPR + 1; }
    
    if (minRD === Infinity) { minRD = 0; maxRD = 1; }
    if (minRD === maxRD) { maxRD = minRD + 1; }

    return { minPR, maxPR, minRD, maxRD };
}

// Minimal tree rendering (clean, readable). Heavy grouping/links remain in legacy plugin; this focuses on structure.
export function renderTree(container, data, maxReverseDepth){
  console.log('[Tree] renderTree called with data:', data, 'maxReverseDepth:', maxReverseDepth);
  const sentenceTree = data.treeSentences;
  const sentenceMap = data.byId;

  const state = getBus() || {};
  const activeFilter = state.annotationFilter;
  console.log('[Tree] activeFilter:', activeFilter);

  if(!container || !sentenceTree) return null;
  
  const treeRoot = setupTreeRoot(container);
  
  // Add background click listener to clear selection
  treeRoot.onclick = (e) => {
      // Only trigger if clicking directly on the root or the SVG layer (background)
      // Nodes stop propagation, so they won't trigger this.
      DeepSeekBus.emit('node-click', { id: null });
  };

  const svgLayer = setupSvgLayer(treeRoot);
  
  treeRoot.appendChild(createLegend());
  
  const depthMetrics = calculateDepthMetrics(sentenceTree);
  const valueRanges = calculateValueRanges(sentenceTree);
  
  sentenceTree.forEach((item, i) => {
      console.log("i",i)
      const entry = createTreeEntry(i, item, depthMetrics, valueRanges, activeFilter, sentenceMap);
      treeRoot.appendChild(entry);
  });

  // Draw links
  setTimeout(() => {
      drawLinks(treeRoot, svgLayer);
  }, 100);

  return treeRoot;
}
