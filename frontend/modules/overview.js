// ES Module: Overview chart module
'use strict';
import DeepSeekBus, { get as getBus } from './bus.js';
import { formatTagLabel } from './utils.js';
// import * as Bus from './bus.js';

let processedEntries = [];

const STYLE_ID = 'deepseek-overview-style';
const ns='http://www.w3.org/2000/svg';

function injectOverviewStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .deepseek-line-chart{display:block}
    .deepseek-tree-overview{display:flex;align-items:center;gap:12px;margin:6px 0 14px 0;padding:8px 14px;border-radius:8px;background:rgba(148,163,184,0.12);width:100%;box-sizing:border-box;position:relative;}
    .deepseek-tree-overview-label{display:flex;flex-direction:column;align-items:flex-start;gap:4px;font-size:8px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.1em}
    .deepseek-mode-item{font-size:10px;font-weight:600;color:#475569;cursor:pointer;opacity:0.42;transition:opacity 0.2s ease}
    .deepseek-mode-item.active{opacity:1}
    .deepseek-mode-sep{display:block;width:100%;height:1px;background:linear-gradient(90deg, rgba(148,163,184,0.36), rgba(148, 163, 184, 0.36));margin:6px 0;border-radius:1px}
    .deepseek-tree-overview svg{width:100%;height:120px;display:block}
    
    /* Uncertainty */
    .uncertainty-rect{fill:rgba(93, 120, 158, 0.4);}
    .uncertainty-bg-rect{fill:rgba(166, 182, 202, 1);}
    .uncertainty-line{stroke:#0f172a; stroke-dasharray:2,2;opacity:0.6;}
    .deepseek-uncertainty-arc{fill:none;stroke:rgba(71, 85, 105, 0.6);stroke-width:1;opacity:0.5;transition:opacity 0.2s;}
    .deepseek-uncertainty-arc.show{opacity:1;}

    /* Error propagation */
    .baseline-line{stroke:#000000;stroke-width:0.5;}
    .error-dot{fill:rgba(241, 99, 99, 0.8);stroke:none;stroke-width:1.2;r:2.6;}
    .deepseek-arc-group{fill:none;stroke:rgba(220, 38, 38, 0.8); stroke-opacity:0.8; stroke-width:1}

    /* Overview type selector */
    .deepseek-overview-controls{display:flex;flex-direction:column;gap:8px;margin-top:8px}
    .deepseek-type-selector{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
    .deepseek-type-selector-label{font-size:10px;color:#64748b;margin-right:8px;font-weight:500}

    /* Hover/interaction highlights */
    .deepseek-highlight-entry{background:rgba(59,130,246,0.12)!important;box-shadow:0 0 0 1px rgba(59,130,246,0.35) inset;border-radius:6px}
    .deepseek-arc{fill:none;transition:stroke-width 0.15s ease, opacity 0.15s ease}
    .deepseek-arc.dim{opacity:0.3}
    .deepseek-arc.highlight{stroke:#f59e0b!important;opacity:1;stroke-width:2.4}
    .deepseek-node-hit{cursor:pointer}
    .deepseek-overview-layer, .deepseek-propagation-layer{transition:opacity 0.2s ease}		
    
    /* Annotation text */
    .deepseek-overview-annotation-text{font-size:8px;fill:#64748b;pointer-events:none;letter-spacing:0.02em;}
    .deepseek-overview-annotation-text.error{fill:#f16363;}
    .deepseek-overview-annotation-marker{stroke:#94a3b8;stroke-width:1;opacity:0.8;}
    .deepseek-overview-annotation-marker.error{stroke:#f16363;}
    .deepseek-overview-annotation-marker.propagated_error{stroke:#f16363;}
    .deepseek-overview-annotation-dot{fill:#94a3b8;opacity:0.8;}
    .deepseek-overview-annotation-dot.error{fill:#f16363;}
    .deepseek-overview-annotation-dot.propagated_error{stroke:#f16363;stroke-width:1px;}

    /* Tooltip */
    .deepseek-overview-tooltip {
        position: absolute;
        background: #1e293b;
        color: #f8fafc;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        pointer-events: none;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.15s;
        white-space: normal;
        max-width: 200px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        top: 0; left: 0;
    }
    .deepseek-overview-tooltip.show { opacity: 1; }
    `;
  document.head.appendChild(style);
}
                

// 处理 overview 数据，计算每个 entry 的位置和尺寸
function processEntriesForOverview(entries,config){
    if(!Array.isArray(entries)) return [];
    const rect_height=6;
    const chartWidth=(config && config.width)||500;
    const chartHeight=(config && config.height)||120;
    const verticalPadding=(config && config.verticalPadding)||60;
    const horizontalPadding=(config && config.horizontalPadding)||15;
    const rightPadding = (config && config.legendWidth) ? config.legendWidth : horizontalPadding;
    const usableWidth=Math.max(0,chartWidth-horizontalPadding-rightPadding);
    const effectiveSteps=Math.max(1,entries.length-1);
    const stepX = usableWidth/effectiveSteps;
    const anchorXById=new Map();

    // 计算 error propagation links
    // const links = [];
    const dedup = new Set();
    const currentErrorMap = getBus()?.currentErrorMap;
    const idSet = new Set(entries.map(e=>e.id!=null?String(e.id):null).filter(id=>id!=null));
    
    // 计算每个 entry 的矩形位置和尺寸
    let currentX=horizontalPadding
    entries.forEach(entry=>{    
        const prevX=currentX;
        currentX = currentX + stepX;
        anchorXById.set(entry.id,currentX);
        entry._rectX = prevX+stepX/2;
        entry._rectWidth = stepX;
        // entry._rectHeight = verticalPadding;
        entry._rectHeight = rect_height;
        entry.isUncertainty = (entry.function_tag === 'uncertainty_management');
        entry._uncertain_links = (entry.related_sentences||[]).map(t_id=>({
            source:entry.id, target:t_id,
            sourceX:anchorXById.get(entry.id), targetX:anchorXById.get(t_id)
        }));
        entry.hasError = currentErrorMap?.get && currentErrorMap.get(entry.id) && (currentErrorMap.get(entry.id).has_error || currentErrorMap.get(entry.id).error);
        entry._error_links = []
        entry.baselineLineY = verticalPadding;
    });
    
    if(currentErrorMap){
        currentErrorMap.forEach((info)=>{
            if(!info || !Array.isArray(info.prop_pairs)) return;
            info.prop_pairs.forEach(pair=>{
                if(!pair || pair.source==null || pair.target==null) return;
                const s = String(pair.source);
                const t = String(pair.target);
                if(!idSet.has(s) || !idSet.has(t)) return;
                const key = `${s}->${t}`;
                if(dedup.has(key)) return;
                dedup.add(key);
                const link = {
                    source:s,target:t,
                    sourceX:anchorXById.get(s),targetX:anchorXById.get(t)
                };
                let entry = entries.find(en=>String(en.id)===s);
                entry._error_links.push(link);
                entries.find(en=>String(en.id)===t).isPropagatedError = true;
            });
        });
    }

    console.log('Processed overview entries:',entries);
    return entries;
}

// 绘制background
function buildBackgroundGroup(type){
    if(!Array.isArray(processedEntries) || processedEntries.length===0) return null;
    const bgGroup = document.createElementNS(ns,'g');
    bgGroup.setAttribute('class','deepseek-overview-layer');

    processedEntries.forEach(entry=>{
        if(!entry) return;
        // const rect = document.createElementNS(ns,'rect');
        const rect_bg = document.createElementNS(ns,'rect');
        const line = document.createElementNS(ns,'line');
        if (entry.function_tag == 'uncertainty_management') {
            //绘制用于覆盖baseline 的 rect_bg
            rect_bg.setAttribute('x', entry._rectX);
            rect_bg.setAttribute('y', entry.baselineLineY - entry._rectHeight / 2);
            rect_bg.setAttribute('width', entry._rectWidth);
            rect_bg.setAttribute('height', entry._rectHeight);
            rect_bg.setAttribute('class', 'uncertainty-bg-rect');
            bgGroup.appendChild(rect_bg);
            line.setAttribute('x1', entry._rectX);
            line.setAttribute('y1', entry.baselineLineY);
            line.setAttribute('x2', entry._rectX+entry._rectWidth);
            line.setAttribute('y2', entry.baselineLineY);
            line.setAttribute('class', 'uncertainty-line');
            // rect.setAttribute('x', entry._rectX);
            // rect.setAttribute('y', entry.baselineLineY - entry._rectHeight / 2);
            // rect.setAttribute('width', entry._rectWidth);
            // rect.setAttribute('height', entry._rectHeight);
            // rect.setAttribute('class', 'uncertainty-rect');
            // bgGroup.appendChild(rect);
            // line.setAttribute('x1', entry._rectX);
            // line.setAttribute('y1', 0);
            // line.setAttribute('x2', entry._rectX);
            // line.setAttribute('y2', entry._rectHeight);
            // line.setAttribute('class', 'uncertainty-line');
            bgGroup.appendChild(line);
        } else if (entry.function_tag == type) {    
            line.setAttribute('x1', entry._rectX);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', entry._rectX);
            line.setAttribute('y2', entry._rectHeight);
            line.setAttribute('class', 'type-line');
            bgGroup.appendChild(line);
        }
    });
    return bgGroup;
}

// 绘制 annotations
function buildAnnotationLayer(config){
    if(!Array.isArray(processedEntries) || processedEntries.length===0) return null;
    const annotationGroup = document.createElementNS(ns,'g');
    annotationGroup.setAttribute('class','deepseek-annotation-layer');
    
    const baselineY = (config && config.verticalPadding)||60;
    const filter = config.annotationFilter || 'result_consolidation';

    // Calculate thresholds for filters
    let pagerankThreshold = -Infinity;
    let reverseDepthThreshold = Infinity;
    
    if(filter === 'pagerank'){
         const topN = (config.pagerankTopN !== undefined) ? config.pagerankTopN : 3;
         const validEntries = processedEntries
            .filter(s => s.pagerank !== undefined && s.pagerank !== null)
            .map(s => s.pagerank)
            .sort((a, b) => b - a);
         if(validEntries.length > 0){
            const actualTopN = Math.min(topN, validEntries.length);
            pagerankThreshold = validEntries[actualTopN - 1];
         }
    } else if (filter === 'reverse_depth'){
         reverseDepthThreshold = (config.reverseDepthThreshold !== undefined) ? config.reverseDepthThreshold : 3;
    } 

    processedEntries.forEach(entry => {
        if(!entry) return;
        const x = entry._rectX + entry._rectWidth/2;

        // Determine if we should show text
        let shouldShow = false;
        
        const label = formatTagLabel(entry.function_tag);
        
        switch(filter){
            case 'pagerank':
                shouldShow = (entry.pagerank !== undefined && entry.pagerank !== null && entry.pagerank >= pagerankThreshold);
                break;
            case 'reverse_depth':
                shouldShow = (entry.reverse_depth !== undefined && entry.reverse_depth !== null && entry.reverse_depth < reverseDepthThreshold);
                break;
            default:
                // Assume filter is a type name (e.g. 'result_consolidation')
                // Convert both to Short Name for comparison
                shouldShow = (label === formatTagLabel(filter));
        }


        // Badge (Short Code)
        if(shouldShow){
            let textContent = entry.sentence && entry.sentence.trim() ? entry.sentence.trim() : '';

            if(textContent){
                const markerHeight = 20;
                const marker = document.createElementNS(ns, 'line');
                marker.setAttribute('x1', x);
                marker.setAttribute('x2', x);
                marker.setAttribute('y1', baselineY);
                marker.setAttribute('y2', baselineY + markerHeight);
                marker.setAttribute('class', 'deepseek-overview-annotation-marker');

                const dot = document.createElementNS(ns, 'circle');
                dot.setAttribute('cx', x);
                dot.setAttribute('cy', baselineY);
                dot.setAttribute('r', 1.8);
                dot.setAttribute('class', 'deepseek-overview-annotation-dot');

                // Badge Circle
                const badgeCircle = document.createElementNS(ns, 'circle');
                badgeCircle.setAttribute('cx', x);
                badgeCircle.setAttribute('cy', baselineY + markerHeight + 5);
                badgeCircle.setAttribute('r', 5);
                badgeCircle.setAttribute('fill', '#fff');
                badgeCircle.setAttribute('stroke', '#94a3b8');
                badgeCircle.setAttribute('stroke-width', '1');
                badgeCircle.setAttribute('class', 'deepseek-annotation-badge');
                badgeCircle.dataset.id = entry.id;
                badgeCircle.style.cursor = 'pointer';
                
                // Badge Text (Short Code)
                const badgeText = document.createElementNS(ns, 'text');
                badgeText.setAttribute('x', x);
                badgeText.setAttribute('y', baselineY + markerHeight + 5);
                badgeText.setAttribute('dy', '0.3em');
                badgeText.setAttribute('text-anchor', 'middle');
                badgeText.setAttribute('font-size', '7px');
                badgeText.setAttribute('font-weight', '600');
                badgeText.setAttribute('fill', '#475569');
                badgeText.style.pointerEvents = 'none';
                badgeText.textContent = label.charAt(0).toUpperCase();

                if(entry.hasError){
                    badgeCircle.setAttribute('stroke', '#f16363');
                    badgeText.setAttribute('fill', '#f16363');
                    marker.classList.add('error');
                    dot.classList.add('error');
                }else if(entry.isPropagatedError){
                    marker.classList.add('propagated_error');
                    dot.classList.add('propagated_error');
                    badgeCircle.setAttribute('stroke', '#f16363');
                }
                annotationGroup.appendChild(marker);
                annotationGroup.appendChild(dot);
                annotationGroup.appendChild(badgeCircle);
                annotationGroup.appendChild(badgeText);
            }
        }
    });
    return annotationGroup;
}

// 绘制 uncertainty arcs
function buildUncertaintyArcs(config){
    const arcGroup = document.createElementNS(ns,'g');
    arcGroup.setAttribute('class','deepseek-uncertainty-arc-group');
    const baselineY = (config && config.verticalPadding)||60;

    // Group consecutive uncertainty entries
    let i = 0;
    while(i < processedEntries.length){
        if(processedEntries[i].isUncertainty){
            let j = i;
            while(j < processedEntries.length && processedEntries[j].isUncertainty){
                j++;
            }
            // Group found: [i, j-1]
            const group = processedEntries.slice(i, j);
            
            // Calculate center of the group
            const startX = group[0]._rectX;
            const endEntry = group[group.length-1];
            const endX = endEntry._rectX + endEntry._rectWidth;
            const centerX = (startX + endX) / 2;

            // Collect unique targets that are NOT uncertainty nodes
            const uniqueTargets = new Set();
            group.forEach(entry => {
                if(entry._uncertain_links){
                    entry._uncertain_links.forEach(link => {
                        const targetId = String(link.target);
                        const targetEntry = processedEntries.find(e => String(e.id) === targetId);
                        if(targetEntry && !targetEntry.isUncertainty){
                            uniqueTargets.add(targetId);
                        }
                    });
                }
            });

            // Draw arcs from centerX to each target
            uniqueTargets.forEach(targetId => {
                const targetEntry = processedEntries.find(e => String(e.id) === targetId);
                if(!targetEntry) return;
                
                const targetX = targetEntry._rectX + targetEntry._rectWidth/2;
                const x1 = centerX;
                const x2 = targetX;
                const midX = (x1 + x2) / 2;
                
                let height = Math.max(Math.abs(x2 - x1), 10);
                
                // Limit height to marker height
                // const markerHeight = 20;
                // if(height > markerHeight) height = markerHeight;

                // Clamp height to avoid truncation (bottom)
                // Curve bottom is at baselineY + height/2.
                // We want bottom <= config.height - 5.
                const chartHeight = (config && config.height) || 120;
                const maxH = 40;
                if(height > maxH) height = maxH;

                const peakY = baselineY + height; 
                
                const path = document.createElementNS(ns, 'path');
                path.setAttribute('d', `M${x1},${baselineY} Q${midX},${peakY} ${x2},${baselineY}`);
                path.setAttribute('class', 'deepseek-uncertainty-arc');
                path.dataset.sourceIds = group.map(e => e.id).join(',');
                arcGroup.appendChild(path);
            });

            i = j; // Skip past this group
        } else {
            i++;
        }
    }
    return arcGroup;
}

// 绘制 error propagation的 arc diagrams
function buildErrorPropagationArcs(config){
    // if(!Array.isArray(processedEntries) || processedEntries.length===0) return null;
    const baselineLine=document.createElementNS(ns,'line');
    const baselineLineY = (config && config.verticalPadding)||60;
    baselineLine.setAttribute('x1','0');
    baselineLine.setAttribute('y1',baselineLineY);
    baselineLine.setAttribute('x2',config.width||500);
    baselineLine.setAttribute('y2',baselineLineY);
    baselineLine.setAttribute('class','baseline-line');

    const errorGroup = document.createElementNS(ns,'g','deepseek-error-group');
    // 在 baselineX（水平基线）上绘制弧线图：使用 baselineLineY 作为 y 轴，x 使用各节点锚点
    let arcGroup = null;
    if(processedEntries && processedEntries.length>0){
        arcGroup = document.createElementNS(ns,'g');
        arcGroup.setAttribute('class','deepseek-arc-group');
        // Calculate max span for dynamic height scaling
        let maxSpan = 0;
        processedEntries.forEach(entry => {
            if(entry._error_links){
                entry._error_links.forEach(link => {
                    const s = Math.abs(link.targetX - link.sourceX);
                    if(s > maxSpan) maxSpan = s;
                });
            }
        });
        
        const chartHeight = (config && config.height) || 120;
        let arcRatio = 0.3;
        if(maxSpan > 0) {
            arcRatio = Math.min(0.5, chartHeight / maxSpan);
        }

        const yAxis = baselineLineY; // 水平基线 y
        processedEntries.forEach(entry=>{
            // 在 baselineY 上绘制每个 error dot
            if(entry.hasError){
                const dot = document.createElementNS(ns, 'circle');
                dot.setAttribute('cx', entry._rectX + entry._rectWidth / 2);
                dot.setAttribute('cy', yAxis);
                dot.setAttribute('class', 'error-dot');
                errorGroup.appendChild(dot);
            }
            // 绘制每个 entry 的 error links
            entry._error_links.forEach(link=>{
                if(!link || !link.source || !link.target) return;
                const x1 = link.sourceX;
                const x2 = link.targetX;
                if(!Number.isFinite(x1) || !Number.isFinite(x2)) return;
                if(x1===x2) return;
                const span = (x2 - x1);
                
                let height = Math.abs(span) * arcRatio;
                // if(height < 15) height = 15 + height;

                // Clamp height to avoid truncation (top)
                // Curve peak is at yAxis - height/2.
                // We want peak >= 5.
                const maxH = 2 * (yAxis - 5);
                if(height > maxH) height = maxH;

                const peakY = yAxis - height;
                const midX = (x1 + x2) / 2;
                const path = document.createElementNS(ns, 'path');
                path.setAttribute('d', `M${x1},${yAxis} Q${midX},${peakY} ${x2},${yAxis}`);
                path.dataset.source = String(link.source);
                path.dataset.target = String(link.target);
                path.setAttribute('class', 'deepseek-arc');
                arcGroup.appendChild(path);
            });
        });
    }
    errorGroup.appendChild(arcGroup);
    return [baselineLine, errorGroup];
}

// 绘制 Legend
function buildLegend(config){
    const legendGroup = document.createElementNS(ns, 'g');
    legendGroup.setAttribute('class', 'deepseek-legend-group');
    
    const legendWidth = (config && config.legendWidth) || 10;
    const startX = (config.width || 730) + legendWidth + 10;
    const startY = 20; 
    const gap = 18; 
    
    let currentY = startY;

    // Helper to create text
    const createText = (x, y, textContent) => {
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', x + 15);
        text.setAttribute('y', y + 3);
        text.textContent = textContent;
        text.setAttribute('class', 'deepseek-overview-annotation-text');
        text.style.fill = '#64748b';
        text.style.fontSize = '9px';
        return text;
    };

    // 1. Uncertainty Rect
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', startX);
    rect.setAttribute('y', currentY - 4);
    rect.setAttribute('width', 10);
    rect.setAttribute('height', 8);
    rect.setAttribute('class', 'uncertainty-bg-rect');
    legendGroup.appendChild(rect);
    legendGroup.appendChild(createText(startX, currentY, 'Uncertainty Region'));
    currentY += gap;

    // 2. Uncertainty Arc
    const arcPath = document.createElementNS(ns, 'path');
    arcPath.setAttribute('d', `M${startX},${currentY} Q${startX+5},${currentY-8} ${startX+10},${currentY}`);
    arcPath.setAttribute('class', 'deepseek-uncertainty-arc');
    arcPath.style.opacity = '1';
    legendGroup.appendChild(arcPath);
    legendGroup.appendChild(createText(startX, currentY, 'Uncertainty Link'));
    currentY += gap;

    // 3. Propagation Link
    const propPath = document.createElementNS(ns, 'path');
    propPath.setAttribute('d', `M${startX},${currentY} Q${startX+5},${currentY-8} ${startX+10},${currentY}`);
    propPath.setAttribute('class', 'deepseek-arc');
    propPath.style.stroke = 'rgba(241, 99, 99, 0.68)';
    legendGroup.appendChild(propPath);
    legendGroup.appendChild(createText(startX, currentY, 'Error Propagation'));
    currentY += gap;

    // 4. Node (Error)
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', startX + 5);
    dot.setAttribute('cy', currentY);
    dot.setAttribute('r', 3);
    dot.setAttribute('class', 'error-dot');
    legendGroup.appendChild(dot);
    legendGroup.appendChild(createText(startX, currentY, 'Error Node'));
    currentY += gap;

    // 5. Node (Propagated Error)
    const pDot = document.createElementNS(ns, 'circle');
    pDot.setAttribute('cx', startX + 5);
    pDot.setAttribute('cy', currentY);
    pDot.setAttribute('r', 2.6);
    pDot.setAttribute('class', 'deepseek-overview-annotation-dot propagated_error');
    legendGroup.appendChild(pDot);
    legendGroup.appendChild(createText(startX, currentY, 'Propagated Error'));

    return legendGroup;
}

// 绘制 Timeline Markers (Start / Final Answer)
function buildTimelineLabels(config){
    const group = document.createElementNS(ns, 'g');
    const baselineY = (config && config.verticalPadding)||60;
    const width = config.width || 500;
    
    // Start Marker: Hollow circle
    const startMarker = document.createElementNS(ns, 'circle');
    startMarker.setAttribute('cx', 8); 
    startMarker.setAttribute('cy', baselineY);
    startMarker.setAttribute('r', 2.5);
    startMarker.setAttribute('fill', '#f8fafc');
    startMarker.setAttribute('stroke', '#64748b');
    startMarker.setAttribute('stroke-width', '1.2');
    
    // End Marker: Star
    const endMarker = document.createElementNS(ns, 'path');
    const endX = width - 8;
    // 4-pointed star
    endMarker.setAttribute('d', `M${endX},${baselineY-4.5} L${endX+1.2},${baselineY-1.2} L${endX+4.5},${baselineY} L${endX+1.2},${baselineY+1.2} L${endX},${baselineY+4.5} L${endX-1.2},${baselineY+1.2} L${endX-4.5},${baselineY} L${endX-1.2},${baselineY-1.2} Z`);
    endMarker.setAttribute('fill', '#64748b');
    endMarker.setAttribute('stroke', 'none');

    group.appendChild(startMarker);
    group.appendChild(endMarker);
    return group;
}

// 渲染overview面板
export function renderOverview(entries){
    if(!entries) return;
    
    if(!entries.length) return;
    const busState=getBus?getBus():{};
    const config={
        width:730,height:120,strokeWidth:1.8,highlightWidth:3,dotRadius:3.6,dotStrokeWidth:1.2,horizontalPadding:20,legendWidth:75,verticalPadding:90,cumulative:true,annotateResults:true,
        highlightType:busState.highlightType,showErrorStyling:true,propLinks:[],activeLayer:busState.overviewMode,
        annotationFilter: busState.annotationFilter || 'result',
        pagerankTopN: busState.pagerankTopN !== undefined ? busState.pagerankTopN : 5,
        reverseDepthThreshold: busState.reverseDepthThreshold !== undefined ? busState.reverseDepthThreshold : 3,
        onHoverId:(id)=>{ /* hook from other modules if needed */ }, onLeave:()=>{}, onClickId:(id)=>{ /* expand path if tree module exposes method */ }
    };
    processedEntries = processEntriesForOverview(entries,config);
    // Build SVG chart
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox', `0 0 ${config.width} ${config.height}`);
    svg.setAttribute('width', config.width);
    svg.setAttribute('height', config.height);
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    svg.setAttribute('class', 'deepseek-line-chart');

    const bgGroup=buildBackgroundGroup('uncertainty_management');
    const [baselineLine, errorGroup] = buildErrorPropagationArcs(config);
    const annotationGroup = buildAnnotationLayer(config);
    const uncertaintyArcs = buildUncertaintyArcs(config);
    const legendGroup = buildLegend(config);
    const timelineLabels = buildTimelineLabels(config);
    
    svg.appendChild(baselineLine);
    svg.appendChild(bgGroup);
    svg.appendChild(uncertaintyArcs);
    svg.appendChild(errorGroup);
    svg.appendChild(annotationGroup);
    svg.appendChild(legendGroup);
    svg.appendChild(timelineLabels);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'deepseek-overview-tooltip';
    
    // Interactions
    const hitsGroup = document.createElementNS(ns,'g');
    hitsGroup.setAttribute('class', 'deepseek-hits-layer');
    hitsGroup.setAttribute('fill','transparent');
    hitsGroup.setAttribute('stroke','none');
    hitsGroup.setAttribute('pointer-events','all');
    
    const baselineY = config.verticalPadding;

    function updateArcHighlight(id){
        const arcs = svg.querySelectorAll('.deepseek-arc');
        const uncArcs = svg.querySelectorAll('.deepseek-uncertainty-arc');
        
        if(!id){
            arcs.forEach(p=>{p.classList.remove('highlight');p.classList.remove('dim');});
            uncArcs.forEach(p=>{ if(!p.style.opacity) p.classList.remove('show'); });
            return;
        }
        arcs.forEach(p=>{
            const hit = (p.dataset.source===String(id) || p.dataset.target===String(id));
            p.classList.toggle('highlight', hit);
            p.classList.toggle('dim', !hit);
        });
        
        uncArcs.forEach(p=>{
            if(p.style.opacity === '1') return; // Skip legend
            const sources = p.dataset.sourceIds ? p.dataset.sourceIds.split(',') : [];
            if(sources.includes(String(id))){
                p.classList.add('show');
            } else {
                p.classList.remove('show');
            }
        });
    }

    // Event Handlers
    const handleMouseEnter = (e, entry) => {
        updateArcHighlight(entry.id);
        if(config.onHoverId) try{ config.onHoverId(entry.id); }catch{}
        
        if(entry.sentence){
            tooltip.textContent = entry.sentence;
            tooltip.classList.add('show');
            const rect = container.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;
            tooltip.style.left = (localX + 10) + 'px';
            tooltip.style.top = (localY + 10) + 'px';
        }
    };
    const handleMouseMove = (e) => {
         if(tooltip.classList.contains('show')){
            const rect = container.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;
            tooltip.style.left = (localX + 10) + 'px';
            tooltip.style.top = (localY + 10) + 'px';
         }
    };
    const handleMouseLeave = () => {
        updateArcHighlight(null);
        if(config.onLeave) try{ config.onLeave(); }catch{}
        tooltip.classList.remove('show');
    };
    const handleClick = (entry) => {
        if(config.onClickId) try{ config.onClickId(entry.id); }catch{}
        if(DeepSeekBus) DeepSeekBus.emit('node-click', { id: entry.id });
    };

    // Helper to attach to annotation layer
    const attachAnnotationEvents = (layer) => {
        if(!layer) return;
        const badges = layer.querySelectorAll('.deepseek-annotation-badge');
        badges.forEach(badge => {
            const id = badge.dataset.id;
            const entry = processedEntries.find(e => String(e.id) === String(id));
            if(!entry) return;
            badge.addEventListener('mouseenter', (e) => handleMouseEnter(e, entry));
            badge.addEventListener('mousemove', handleMouseMove);
            badge.addEventListener('mouseleave', handleMouseLeave);
            badge.addEventListener('click', () => handleClick(entry));
        });
    };
    
    attachAnnotationEvents(annotationGroup);

    processedEntries.forEach(entry => {
        if(!entry || !entry.id) return;
        const x = entry._rectX + entry._rectWidth/2;
        
        const hit = document.createElementNS(ns,'circle');
        hit.setAttribute('cx', x);
        hit.setAttribute('cy', baselineY);
        hit.setAttribute('r', 8);
        hit.setAttribute('class','deepseek-node-hit');
        hit.dataset.id = entry.id;
        
        hit.addEventListener('mouseenter', (e)=>handleMouseEnter(e, entry));
        hit.addEventListener('mousemove', handleMouseMove);
        hit.addEventListener('mouseleave', handleMouseLeave);
        hit.addEventListener('click', ()=>handleClick(entry));
        hitsGroup.appendChild(hit);
    });
    svg.appendChild(hitsGroup);

    const container=document.createElement('div'); container.className='deepseek-tree-overview';
    container.appendChild(tooltip); // Append tooltip to container
    const labelWrap=document.createElement('span'); labelWrap.className='deepseek-tree-overview-label';
    const btnOverview=document.createElement('span'); btnOverview.className='deepseek-mode-item'; btnOverview.textContent='Overview';
    const sep=document.createElement('span'); sep.className='deepseek-mode-sep';
    const btnProp=document.createElement('span'); btnProp.className='deepseek-mode-item'; btnProp.textContent='Propagation';
    function applyMode(mode){
        btnOverview.classList.toggle('active',mode!=='propagation');
        btnProp.classList.toggle('active',mode==='propagation');
        
        if(mode === 'propagation'){
            if(errorGroup) errorGroup.style.opacity = '1';
            if(bgGroup) bgGroup.style.opacity = '0.5';
        } else {
            if(errorGroup) errorGroup.style.opacity = '0.5';
            if(bgGroup) bgGroup.style.opacity = '1';
        }

        if(DeepSeekBus) DeepSeekBus.set({overviewMode:mode});
    }
    btnOverview.addEventListener('click',()=>applyMode('overview'));
    btnProp.addEventListener('click',()=>applyMode('propagation'));
    labelWrap.appendChild(btnOverview); labelWrap.appendChild(sep); labelWrap.appendChild(btnProp);
    container.appendChild(labelWrap); applyMode(busState.overviewMode||'overview'); 
    container.appendChild(svg);

    // Subscribe to bus changes for annotation updates
    if(DeepSeekBus && typeof DeepSeekBus.on === 'function'){
        DeepSeekBus.on('state', (state)=>{
            let needsUpdate = false;
            if(state.annotationFilter !== undefined && state.annotationFilter !== config.annotationFilter){
                config.annotationFilter = state.annotationFilter;
                needsUpdate = true;
            }
            if(state.annotationType !== undefined && state.annotationType !== config.annotationType){
                config.annotationType = state.annotationType;
                needsUpdate = true;
            }
            if(state.highlightType !== undefined && state.highlightType !== config.highlightType){
                config.highlightType = state.highlightType;
                needsUpdate = true;
            }
            if(state.pagerankTopN !== undefined && state.pagerankTopN !== config.pagerankTopN){
                config.pagerankTopN = state.pagerankTopN;
                if(config.annotationFilter === 'pagerank') needsUpdate = true;
            }
            if(state.reverseDepthThreshold !== undefined && state.reverseDepthThreshold !== config.reverseDepthThreshold){
                config.reverseDepthThreshold = state.reverseDepthThreshold;
                if(config.annotationFilter === 'reverse_depth') needsUpdate = true;
            }
            
            if(needsUpdate){
                const oldLayer = svg.querySelector('.deepseek-annotation-layer');
                if(oldLayer) oldLayer.remove();
                const newLayer = buildAnnotationLayer(config);
                attachAnnotationEvents(newLayer);
                const hitsLayer = svg.querySelector('.deepseek-hits-layer');
                if(hitsLayer){
                    svg.insertBefore(newLayer, hitsLayer);
                } else {
                    svg.appendChild(newLayer);
                }
            }
        });
    }

    return container;
}

injectOverviewStyles();