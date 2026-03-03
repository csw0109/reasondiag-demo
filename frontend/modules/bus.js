// ES Module: event bus
'use strict';

const listeners = new Map(); // event -> Set<fn>
const state = {
  overviewMode: 'overview',
  highlightType: null,
  annotationFilter: 'result_consolidation',
  pagerankTopN: 5,
  reverseDepthThreshold: 3,
  currentErrorMap: null,
  latestSentenceTree: null,
  cotMode: 'paragraph'
};

export const tagMap= {
    'plan_generation':{ char: 'P', label: 'Plan' },
    'fact_retrieval':{ char: 'F', label: 'Fact' },
    'active_computation':{ char: 'C', label: 'Compute' },
    'self_checking':{ char: 'K', label: 'Check' },
    'result_consolidation':{ char: 'R', label: 'Result' },
    'uncertainty_management':{ char: 'U', label: 'Uncertain' },
    'final_answer_emission':{ char: 'A', label: 'Answer' },
    'problem_setup':{ char: 'S', label: 'Setup' }
}

export function on(event, fn){
  if(!listeners.has(event)) listeners.set(event,new Set());
  listeners.get(event).add(fn);
}
export function off(event, fn){
  if(listeners.has(event)) listeners.get(event).delete(fn);
}
export function emit(event, payload){
  if(listeners.has(event)){
    listeners.get(event).forEach(fn=>{ try{ fn(payload); }catch(e){ console.warn('[DeepSeekBus listener error]', e); } });
  }
  document.dispatchEvent(new CustomEvent('deepseek:'+event,{detail:payload}));
}
export function set(partial){
  Object.assign(state, partial);
  emit('state', {...state});
}
export function get(){ return state; }

// Optional default export + global fallback
const DeepSeekBus = { on, off, emit, set, get, state };
export default DeepSeekBus;
window.DeepSeekBus = window.DeepSeekBus || DeepSeekBus;
