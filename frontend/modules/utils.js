// ES Module: utils
'use strict';

export const colorMap = {
    'error': '#f16363',
    'correct': '#439663ff'
};

export function createElement(tag,options){
    const el=document.createElement(tag);
    if(options){
        if(options.className) el.className=options.className;
        if(options.text) el.textContent=options.text;
        if(options.type) el.type=options.type;
        if(options.placeholder) el.placeholder=options.placeholder;
    }
    return el;
}

export function getBubbleContainer(el){
    if(!el) return null;
    const bubble=el.closest('.bubble, .message, .Message-Item, .message-item, .chat-bubble, .gpt-bubble, .msg, .chat__bubble');
    return bubble || el.parentElement || null;
}

export function typesetMath(targets){
    if(!Array.isArray(targets)) targets=[targets];
    const filtered=targets.filter(Boolean);
    if(filtered.length===0) return Promise.resolve();
    if(window.MathJax && typeof window.MathJax.typesetPromise==='function'){
        return window.MathJax.typesetPromise(filtered).catch(err=>console.error('MathJax typeset failed',err));
    }
    return Promise.resolve();
}

// 通用函数：格式化标签
export function formatTagLabel(tags){
    const map={
        plan_generation:'Plan',
        fact_retrieval:'Fact',
        active_computation:'Compute',
        result_consolidation:'Result',
        uncertainty_management:'Uncertain',
        self_checking:'Check',
        final_answer_emission:'Answer',
        problem_setup:'Setup'
    };
    let primary=null;
    if(Array.isArray(tags) && tags.length>0) primary=tags[0]; else if(typeof tags==='string') primary=tags;
    if(typeof primary==='string' && primary.trim()){
        const norm=primary.trim();
        if(map[norm]) return map[norm];
        return norm.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
    }
    return 'Other';
}

// 通用函数：映射标签到趋势
export function mapTagLabelToTrend(label){
    switch(label){
        case 'Plan':
        case 'Fact':
        case 'Compute':
            return -1;
        case 'Uncertain':
            return 1;
        case 'Setup':
        case 'Result':
            return 0;
        case 'Check':
        case 'Answer':
        case 'Other':
        default:
            return 0;
    }
}

// Optional global for backward compatibility
window.DeepSeekUtils = window.DeepSeekUtils || { createElement, getBubbleContainer, typesetMath, formatTagLabel, mapTagLabelToTrend };