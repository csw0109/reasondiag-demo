// ES Module: Original CoT panel module
'use strict';
import DeepSeekBus from './bus.js';
import { createElement, typesetMath, formatTagLabel } from './utils.js';
const STYLE_ID='deepseek-original-cot-style';

export function ensurePanel(wrapper){
	if(!wrapper) return null;
	let panel=wrapper.querySelector('#deepseek-original-cot');
	if(!panel){
		panel=createElement?createElement('div',{className:'deepseek-original-cot'}):document.createElement('div');
		panel.id='deepseek-original-cot';
        if(!panel.className) panel.className='deepseek-original-cot';

		const header=document.createElement('div');
		header.className='deepseek-original-cot-header';
		const title=document.createElement('span');
		title.textContent='Original CoT';
		header.appendChild(title);

		const modeContainer=document.createElement('div');
		modeContainer.className='deepseek-cot-mode-container';
		const paragraphBtn=document.createElement('button');
		paragraphBtn.textContent='Section';
		paragraphBtn.className='deepseek-cot-mode-btn active';
		const sentencesBtn=document.createElement('button');
		sentencesBtn.textContent='Step';
		sentencesBtn.className='deepseek-cot-mode-btn';
		modeContainer.appendChild(paragraphBtn);
		modeContainer.appendChild(sentencesBtn);
		header.appendChild(modeContainer);

        // Add event listeners
        paragraphBtn.addEventListener('click', () => {
            paragraphBtn.classList.add('active');
            sentencesBtn.classList.remove('active');
            const content = panel.querySelector('.deepseek-original-cot-content');
            if(content){
                content.classList.remove('deepseek-sentences-mode');
            }
        });
        sentencesBtn.addEventListener('click', () => {
            sentencesBtn.classList.add('active');
            paragraphBtn.classList.remove('active');
            const content = panel.querySelector('.deepseek-original-cot-content');
            if(content){
                content.classList.add('deepseek-sentences-mode');
                // Clean whitespace-only text nodes between inline sentence spans for better flex layout
                Array.from(content.querySelectorAll('.deepseek-content-lines')).forEach(wrapper=>{
                    Array.from(wrapper.childNodes).forEach(node=>{
                        if(node.nodeType===3 && !/\S/.test(node.textContent||'')){
                            wrapper.removeChild(node);
                        }
                    });
                });
            }
        });

		const content=document.createElement('div');
		content.className='deepseek-original-cot-content';
		content.innerHTML='<div class="deepseek-original-cot-placeholder">Original chain-of-thought not available.</div>';
		panel.appendChild(header);
		panel.appendChild(content);
		panel.style.display='none';
		panel.setAttribute('aria-hidden','true');
        wrapper.appendChild(panel);

        if(typeof window!=='undefined'){
			window.deepseekOriginalCotPanel=panel;
		}
	}
	return panel;
}

function injectStyles(){
	if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
	style.textContent=`
		#deepseek-original-cot{flex:0 0 490px;max-width:400px;min-height:160px;max-height:600px; background:transparent;border:none;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:none}
		#deepseek-original-cot .deepseek-original-cot-header{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.08em;margin:0}
		#deepseek-original-cot .deepseek-original-cot-content{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:8px;border-radius:6px;background:transparent;font-size:12px;line-height:1.45;color:#475569;border:none;max-height:100%}
		#deepseek-original-cot .deepseek-original-cot-content::-webkit-scrollbar{width:8px}
		#deepseek-original-cot .deepseek-original-cot-content::-webkit-scrollbar-track{background:rgba(148,163,184,0.1);border-radius:4px}
		#deepseek-original-cot .deepseek-original-cot-content::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.4);border-radius:4px}
		#deepseek-original-cot .deepseek-original-cot-content::-webkit-scrollbar-thumb:hover{background:rgba(148,163,184,0.6)}
		#deepseek-original-cot .deepseek-original-cot-placeholder{color:#9ca3af;font-size:11px}

		/* CoT mode buttons */
		.deepseek-cot-mode-container{display:flex;gap:4px;margin-left:auto}
		.deepseek-cot-mode-btn{padding:4px 8px;font-size:11px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer}
		.deepseek-cot-mode-btn.active{background:#3b82f6;color:#fff;border-color:#3b82f6}
		.deepseek-cot-mode-btn:hover{background:#eaeaea}
		.deepseek-cot-mode-btn.active:hover{background:#2563eb}

		.deepseek-type-label, .deepseek-original-type-label{flex:0 0 58px;display:inline-flex;justify-content:center;align-items:center;padding:1px 4px;border-radius:999px;font-size:9px;font-weight:500;text-transform:lowercase;letter-spacing:0.04em;box-sizing:border-box;min-height:16px;opacity:0.88;transition:background-color 0.2s ease,border-color 0.2s ease,box-shadow 0.2s ease}
		.deepseek-type-label[data-tag="Plan"], .deepseek-original-type-label[data-tag="Plan"]{background:#fff3e0;color:#e65100;border:1px solid #ffb74d}
		.deepseek-type-label[data-tag="Fact"], .deepseek-original-type-label[data-tag="Fact"]{background:#e3f2fd;color:#1565c0;border:1px solid #90caf9}
		.deepseek-type-label[data-tag="Compute"], .deepseek-original-type-label[data-tag="Compute"]{background:#e8eaf6;color:#3949ab;border:1px solid #9fa8da}
		.deepseek-type-label[data-tag="Result"], .deepseek-original-type-label[data-tag="Result"]{background:#e0f7fa;color:#006064;border:1px solid #4dd0e1}
		.deepseek-type-label[data-tag="Uncertain"], .deepseek-original-type-label[data-tag="Uncertain"]{background:#eceff1;color:#37474f;border:1px solid #90a4ae}
		.deepseek-type-label[data-tag="Check"], .deepseek-original-type-label[data-tag="Check"]{background:#fff9e8;color:#d46f00;border:1px solid #f0c28a}
		.deepseek-type-label[data-tag="Answer"], .deepseek-original-type-label[data-tag="Answer"]{background:#efebe9;color:#3e2723;border:1px solid #a1887f}
		.deepseek-type-label[data-tag="Setup"], .deepseek-original-type-label[data-tag="Setup"]{background:#f7eef9;color:#6a1b9a;border:1px solid #b78ac9}
		.deepseek-type-label[data-tag="Other"], .deepseek-original-type-label[data-tag="Other"]{background:#f6f7f8;color:#475569;border:1px solid #a3acb9}
		.deepseek-type-label.error, .deepseek-original-type-label.error{border-color:#c2185b!important;color:#c2185b!important;background:rgba(194,24,91,0.08)!important;box-shadow:0 0 0 2px rgba(194,24,91,0.12)}
		.deepseek-type-label.warn, .deepseek-original-type-label.warn{border-color:#ff6f00!important;color:#8a4a05!important;background:rgba(255,179,0,0.1)!important;box-shadow:0 0 0 2px rgba(255,179,0,0.12)}
		.deepseek-type-label.type-LogicError, .deepseek-original-type-label.type-LogicError{border-color:#880e4f!important}
		.deepseek-type-label.type-FactError, .deepseek-original-type-label.type-FactError{border-color:#1976d2!important}
		.deepseek-type-label.type-Timeout, .deepseek-original-type-label.type-Timeout{border-color:#ffa000!important}
		.deepseek-type-label.type-Duplicate, .deepseek-original-type-label.type-Duplicate{border-color:#6a1b9a!important}
		.deepseek-type-label span, .deepseek-original-type-label span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis}

		/* Original CoT panel: make labels inline with text (not split as flex items) */
		.deepseek-content-lines{display:block;margin-bottom:12px;transition:background-color 0.3s ease;border-radius:4px;padding:4px 0}
		.deepseek-content-line{display:inline;transition:background-color 0.3s ease;padding:2px 4px;border-radius:3px}
		.deepseek-original-type-label{display:inline-block;flex:0 0 auto;min-width:0;margin-right:6px;vertical-align:baseline}
		.deepseek-content-text{display:inline}
		.deepseek-content-text{white-space:pre-wrap;font-size:12px;color:#475569;line-height:1.5}
		.deepseek-highlight-flash{background-color:rgba(59,130,246,0.15)!important;box-shadow:0 0 0 2px rgba(59,130,246,0.3) inset}
		
		/* Type-specific highlights for Original CoT */
		.deepseek-content-line.highlight-Plan{background-color:#fff3e0!important}
		.deepseek-content-line.highlight-Fact{background-color:#e3f2fd!important}
		.deepseek-content-line.highlight-Compute{background-color:#e8eaf6!important}
		.deepseek-content-line.highlight-Result{background-color:#e0f7fa!important}
		.deepseek-content-line.highlight-Uncertain{background-color:#eceff1!important}
		.deepseek-content-line.highlight-Check{background-color:#fff9e8!important}
		.deepseek-content-line.highlight-Answer{background-color:#efebe9!important}
		.deepseek-content-line.highlight-Setup{background-color:#f7eef9!important}

		/* Sentences mode layout: do not re-render; just change layout */
		.deepseek-sentences-mode .deepseek-content-lines{display:flex;flex-direction:column;gap:4px;padding:2px 0}
		.deepseek-sentences-mode .deepseek-content-line{display:flex;align-items:flex-start;margin:0;padding:2px 4px}
		.deepseek-sentences-mode .deepseek-content-line + .deepseek-content-line{margin-top:2px}
		.deepseek-sentences-mode .deepseek-content-text{display:inline-block}
		.deepseek-sentences-mode .deepseek-original-type-label{display:inline-flex;flex:0 0 58px;min-width:58px;justify-content:center;align-items:center}
		.deepseek-sentences-mode .deepseek-content-line.highlight-Plan,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Fact,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Compute,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Result,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Uncertain,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Check,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Answer,
		.deepseek-sentences-mode .deepseek-content-line.highlight-Setup{border-radius:4px}

		/* Styles for non-depth sentences */
		.non-depth-sentences{margin-top:8px;padding-top:8px;border-top:1px solid rgba(100,116,139,0.18)}
		.non-depth-sentence{margin:4px 0;padding:6px 10px;border-radius:6px;font-size:12px;color:#475569;background:transparent}
		.non-depth-sentence:hover{background:rgba(148,163,184,0.12)}
		.non-depth-root{margin:8px 0;padding:8px 10px;border-radius:6px;color:#475569;background:transparent}
		/* Hover/interaction highlights */
		.deepseek-highlight-entry{background:rgba(59,130,246,0.12)!important;box-shadow:0 0 0 1px rgba(59,130,246,0.35) inset;border-radius:6px}
		.deepseek-arc{transition:stroke-width 0.15s ease, opacity 0.15s ease}
		.deepseek-arc.dim{opacity:0.15}
		.deepseek-arc.highlight{stroke:#f59e0b!important;opacity:0.95;stroke-width:2.4}
		.deepseek-node-hit{cursor:pointer}
		.deepseek-overview-layer, .deepseek-propagation-layer{transition:opacity 0.2s ease}
	`;
	document.head.appendChild(style);
}

export function updatePanel(opts){
	const wrapper=document.getElementById('deepseek-layout-wrapper');
	const panel=ensurePanel(wrapper);
	if(!panel) return;
	const content=panel.querySelector('.deepseek-original-cot-content');
	const fallback=(opts && typeof opts.fallback==='string' && opts.fallback.trim())?opts.fallback.trim():'Original chain-of-thought not available.';
	const placeholderHtml=`<div class="deepseek-original-cot-placeholder">${fallback}</div>`;
	if(opts && Object.prototype.hasOwnProperty.call(opts,'html')){
		const htmlString=typeof opts.html==='string'?opts.html:'';
		content.innerHTML= htmlString.trim()?htmlString:placeholderHtml;
		if(typesetMath) typesetMath([content]);
	}
	if(opts && opts.visible===true){ panel.style.display='flex'; panel.setAttribute('aria-hidden','false'); }
	else if(opts && opts.visible===false){ panel.style.display='none'; panel.setAttribute('aria-hidden','true'); }
}

function updateHighlights(filterKey) {
    const panel = document.getElementById('deepseek-original-cot');
    if (!panel) return;
    
    const lines = panel.querySelectorAll('.deepseek-content-line');
    const targetLabel = filterKey ? formatTagLabel(filterKey) : null;
    
    lines.forEach(line => {
        const classesToRemove = [];
        line.classList.forEach(cls => {
            if (cls.startsWith('highlight-')) {
                classesToRemove.push(cls);
            }
        });
        classesToRemove.forEach(c => line.classList.remove(c));
        
        if (targetLabel && line.dataset.tag === targetLabel) {
            line.classList.add(`highlight-${targetLabel}`);
        }
    });
}

export function renderFromTree(sentenceTree, mode = 'paragraph'){
    const wrapper=document.getElementById('deepseek-layout-wrapper');
    const panel=ensurePanel(wrapper);
    const content=panel.querySelector('.deepseek-original-cot-content');
	
    if(!content || !sentenceTree) {
        console.log('[Original CoT Render] Missing required elements, aborting');
        return;
    }

    const state = DeepSeekBus.get();
    const currentErrorMap = state.currentErrorMap;
	const paragraphs = sentenceTree.treeSentences;
    const sentenceMap = sentenceTree.byId;
    // Clear previous content
    content.innerHTML='';
    
    // Render each paragraph
    paragraphs.forEach((para)=>{
        const wrapper=document.createElement('div');
        wrapper.className='deepseek-content-lines';
        if(para.id !== undefined && para.id !== null) wrapper.dataset.sectionId = String(para.id);
        
        para.children.forEach(item=>{
            const line=document.createElement('span');
            line.className='deepseek-content-line';
            const labelSpan=document.createElement('span');
            labelSpan.className='deepseek-original-type-label';
            const tagLabel=formatTagLabel(item.tag || 'Other');
            labelSpan.dataset.tag=tagLabel;
            line.dataset.tag=tagLabel;
            
            // Check if this item has an error
            const itemId = String(item.id);
            const hasError = currentErrorMap && currentErrorMap.has(itemId) && currentErrorMap.get(itemId).has_error;
            
            // Add click handler to show left panel when clicking on error labels
            if (hasError) {
                labelSpan.style.cursor = 'pointer';
                labelSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('[Error Label Click] Showing popout for error item:', itemId);
                    const err = currentErrorMap.get(itemId);
                    
                    // Helper to build tree
                    const buildPremiseTree = (id, visited = new Set()) => {
                        if(visited.has(id)) return { id, text: 'Cycle detected', children: [] };
                        visited.add(id);
                        
                        const node = sentenceMap ? sentenceMap.get(String(id)) : null;
                        let text = node ? node.text : id;
                        let pids = node ? (node.premise_id || []) : [];
                        
                        if(String(id) === String(itemId)) {
                            text = item.text;
                            pids = item.premise_id || [];
                        }

                        const children = pids.map(pid => buildPremiseTree(pid, new Set(visited)));
                        return { id, text, children };
                    };

                    const premiseTree = buildPremiseTree(itemId);

                    DeepSeekBus.emit('show-error', { 
                        id: itemId, 
                        error: err, 
                        target: labelSpan, 
                        text: item.text,
                        premise_tree: premiseTree
                    });
                });
            }
            
            const inner=document.createElement('span');
            inner.textContent=tagLabel;
            labelSpan.appendChild(inner);
            const textSpan=document.createElement('span');
            textSpan.className='deepseek-content-text';
            if(item.id!==undefined && item.id!==null){ textSpan.dataset.itemId=String(item.id); }
            textSpan.textContent=item.text;
            
            // If sentence has error, make text red (softer color)
            if (hasError) {
                textSpan.style.color = '#b91c1c'; // Softer red color for error text
            }
            
            line.appendChild(labelSpan);
            line.appendChild(textSpan);
            wrapper.appendChild(line);
            // Add space between sentences within the same paragraph
            wrapper.appendChild(document.createTextNode(' '));
        });
        content.appendChild(wrapper);
    });
    updatePanel({visible:true});
    const currentState = DeepSeekBus.get();
    if (currentState.annotationFilter) {
        updateHighlights(currentState.annotationFilter);
    }
}

function scrollToItem(itemId, type) {
    const panel = document.getElementById('deepseek-original-cot');
    if (!panel) return;
    const content = panel.querySelector('.deepseek-original-cot-content');
    if (!content) return;

    let target = null;

    if (type === 'tag') {
        // Priority: Item (Line)
        const targetSpan = content.querySelector(`.deepseek-content-text[data-item-id="${itemId}"]`);
        if (targetSpan) target = targetSpan.closest('.deepseek-content-line');
    } else if (type === 'section') {
        // Priority: Section (Wrapper)
        target = content.querySelector(`.deepseek-content-lines[data-section-id="${itemId}"]`);
    }

    // Fallback logic if specific type target not found
    if (!target) {
        // Try section first
        target = content.querySelector(`.deepseek-content-lines[data-section-id="${itemId}"]`);
        
        // Then item
        if (!target) {
            const targetSpan = content.querySelector(`.deepseek-content-text[data-item-id="${itemId}"]`);
            if (targetSpan) {
                target = targetSpan.closest('.deepseek-content-line');
            }
        }
    }

    if (target) {
        // Scroll into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary flash highlight
        target.classList.add('deepseek-highlight-flash');
        setTimeout(() => {
            target.classList.remove('deepseek-highlight-flash');
        }, 2000);
    }
}

DeepSeekBus.on('state', (state) => {
    if (state.annotationFilter !== undefined) {
        updateHighlights(state.annotationFilter);
    }
});

DeepSeekBus.on('node-click', (payload) => {
    if (payload && payload.id) {
        scrollToItem(payload.id, payload.type);
    }
});

injectStyles();
