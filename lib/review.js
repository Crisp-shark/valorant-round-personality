/* A round-economy checklist. The ticks are self-reports, not match telemetry. */
(function (root) {
  'use strict';

  const common = [
    { id:'buy', tag:'资金', text:'跟队友一起买', hint:'该起就起，该省就省。' },
    { id:'skills', tag:'技能', text:'技能花出了效果', hint:'换到信息、空间或拖延。' },
    { id:'risk', tag:'风险', text:'有优势时没白送', hint:'少打一枪赚不到什么的架。' },
    { id:'time', tag:'时间', text:'没把时间拖光', hint:'转点、下包和拆包留够时间。' }
  ];
  const byRole = {
    duelist: { id:'role-duelist', tag:'你的定位', text:'先手有人补枪', hint:'拉出去前，队友知道要跟。' },
    initiator: { id:'role-initiator', tag:'你的定位', text:'情报及时报给队友', hint:'探到人就报，少让队友重复探。' },
    controller: { id:'role-controller', tag:'你的定位', text:'烟帮队伍省了路', hint:'挡关键视线，也留自家通道。' },
    sentinel: { id:'role-sentinel', tag:'你的定位', text:'守住后路少交学费', hint:'换点前说清谁还在看家。' }
  };
  const byHabit = {
    gun: { id:'habit-gun', tag:'你的赢法', text:'贵枪回合没急着白给', hint:'先停稳，再打值得打的枪。' },
    objective: { id:'habit-objective', tag:'你的赢法', text:'围着爆能器赚时间', hint:'没为追人错过下包或拆包。' },
    utility: { id:'habit-utility', tag:'你的赢法', text:'关键道具有队友接', hint:'技能交完，机会有人兑现。' }
  };
  const byTempo = {
    fast: { id:'tempo-fast', tag:'你的节奏', text:'提速前喊队友一起动', hint:'人数和道具一块儿进点。' },
    steady: { id:'tempo-steady', tag:'你的节奏', text:'等到信息就行动', hint:'没把转点窗口等成倒计时。' }
  };

  const itemsFor = persona => [...common, byRole[persona.role], byHabit[persona.habit], byTempo[persona.tempo]];
  const emptyStore = () => ({ nextNumber:1, drafts:{}, history:[] });
  function normalizeStore(raw) {
    const store=emptyStore();
    if (!raw || typeof raw!=='object') return store;
    const personas=root.ValorantPersonality.personas;
    if (raw.drafts && typeof raw.drafts==='object' && !Array.isArray(raw.drafts)) {
      personas.forEach(persona=>{
        const draft=raw.drafts[persona.id];
        if (!draft || typeof draft!=='object') return;
        const valid=new Set(itemsFor(persona).map(item=>item.id));
        store.drafts[persona.id]={
          checked:Array.isArray(draft.checked)?[...new Set(draft.checked.filter(id=>valid.has(id)))]:[],
          note:typeof draft.note==='string'?draft.note.slice(0,120):''
        };
      });
    }
    if (Array.isArray(raw.history)) {
      store.history=raw.history.filter(record=>record && Number.isSafeInteger(record.number) && record.number>0 && personas.some(persona=>persona.id===record.personaId) && typeof record.createdAt==='string').slice(0,20).map(record=>({
        number:record.number,
        personaId:record.personaId,
        createdAt:record.createdAt,
        completed:Math.max(0,Math.min(7,Number(record.completed)||0)),
        total:7,
        focus:typeof record.focus==='string'?record.focus.slice(0,80):'',
        note:typeof record.note==='string'?record.note.slice(0,120):''
      }));
    }
    store.nextNumber=Math.max(1,Number.isSafeInteger(raw.nextNumber)?raw.nextNumber:1,...store.history.map(record=>record.number+1));
    return store;
  }
  const draftFor = (store,persona) => store.drafts[persona.id] || {checked:[],note:''};
  function archive(store,persona,createdAt) {
    const draft=draftFor(store,persona);
    if (!draft.checked.length && !draft.note.trim()) return null;
    const items=itemsFor(persona);
    const focus=items.find(item=>!draft.checked.includes(item.id));
    const record={number:store.nextNumber,personaId:persona.id,createdAt,
      completed:draft.checked.length,total:items.length,
      focus:focus?focus.text:'七项都做到了，下局继续做稳。',note:draft.note.trim()};
    return {record,store:{nextNumber:store.nextNumber+1,
      drafts:{...store.drafts,[persona.id]:{checked:[],note:''}},
      history:[record,...store.history].slice(0,20)}};
  }
  const api={itemsFor,normalizeStore,draftFor,archive};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  root.ValorantReview=api;
})(typeof globalThis!=='undefined'?globalThis:this);
