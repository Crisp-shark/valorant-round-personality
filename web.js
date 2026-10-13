(function () {
  'use strict';
  const P = window.ValorantPersonality;
  const $ = id => document.getElementById(id);
  const screens = ['intro','select','quiz','result','gallery'];
  const key = 'valorant-personality-v1';
  let state = { screen:'intro', galleryReturn:'intro', selected:[], answers:Array(P.questions.length).fill(null), index:0, roleFilter:'all', galleryFilter:'all' };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && Array.isArray(saved.selected) && Array.isArray(saved.answers) && saved.answers.length === P.questions.length) {
      state = Object.assign(state, saved);
      if (!screens.includes(state.screen)) state.screen = 'intro';
      if (state.screen === 'result') P.makeResult(state.selected, state.answers);
    }
  } catch (_) { state = { screen:'intro', galleryReturn:'intro', selected:[], answers:Array(P.questions.length).fill(null), index:0, roleFilter:'all', galleryFilter:'all' }; }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {} };
  const roleName = id => P.roles.find(item => item.id === id).name;
  const findAgent = name => P.agents.find(item => item.name === name);
  // The five 3×2 atlases follow the agent order in personality.js.
  const portraitStyle = name => {
    const index=P.agents.findIndex(agent=>agent.name===name);
    const sheet=String(Math.floor(index/6)+1).padStart(2,'0');
    const tile=index%6;
    return `--portrait-sheet:url('./assets/agent-atlas-${sheet}.jpg');--portrait-x:${tile%3*50}%;--portrait-y:${Math.floor(tile/3)*100}%`;
  };
  const mascotNames=['冲锋狐狸','冷面猫头鹰','闪送兔子','护送小龟','开幕小火兽','存钱仓鼠','闪光雪貂','侦查蝙蝠','交通青蛙','导航蜗牛','情报机械蜂','箭线纸鹤','拆件烟猫','冷枪变色龙','下包企鹅导演','抱包小蛋','封路章鱼','地图房东幽灵','回防浣熊','架枪寄居蟹','拆包六角龙','守包老龟','陷阱刺猬','绊线蜘蛛'];
  const mascotStyle = persona => {
    const index=P.personas.indexOf(persona), sheet=String(Math.floor(index/6)+1).padStart(2,'0'), tile=index%6;
    return `--mascot-sheet:url('./assets/persona-atlas-${sheet}.webp');--mascot-x:${tile%3*50}%;--mascot-y:${Math.floor(tile/3)*100}%`;
  };
  const show = screen => { state.screen = screen; screens.forEach(name => { $('screen-'+name).hidden = name !== screen; }); save(); window.scrollTo(0, 0); };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function confirmCommand(button, action) {
    if (button.disabled || button.classList.contains('is-advancing')) return;
    if (reducedMotion.matches) { action(); return; }
    const currentScreen=state.screen;
    button.classList.add('is-advancing');
    button.setAttribute('aria-busy','true');
    window.setTimeout(()=>{
      button.classList.remove('is-advancing');
      button.removeAttribute('aria-busy');
      if (state.screen===currentScreen) action();
    },270);
  }
  const formatTabs = (target, active, handler) => {
    target.replaceChildren();
    [{id:'all',name:'全部'},...P.roles].forEach(item => {
      const button = document.createElement('button'); button.type='button'; button.textContent=item.name;
      button.className = item.id === active ? 'active' : ''; button.setAttribute('aria-pressed', String(item.id===active));
      button.addEventListener('click', () => handler(item.id)); target.append(button);
    });
  };
  function renderSelect(celebrateName = null) {
    $('selected-slots').replaceChildren();
    for (let index=0; index<3; index++) {
      const name=state.selected[index], slot=document.createElement('div'); slot.className='selected-slot'+(name?' filled':'')+(name===celebrateName?' just-picked':'');
      if (name) {
        slot.innerHTML=`<span class="slot-portrait" style="${portraitStyle(name)}" aria-hidden="true"></span><span class="slot-order">0${index+1} / 常玩</span><strong>${findAgent(name).cn}</strong><small>${name} · ${roleName(findAgent(name).role)}</small>`;
        const remove=document.createElement('button'); remove.type='button'; remove.className='slot-remove'; remove.textContent='×'; remove.setAttribute('aria-label',`移除 ${name}`);
        remove.addEventListener('click',()=>{ state.selected.splice(index,1); renderSelect(); save(); }); slot.append(remove);
      } else slot.innerHTML=`<span class="slot-order">0${index+1} / 常玩</span><strong>＋</strong><small>选择特工</small>`;
      $('selected-slots').append(slot);
    }
    formatTabs($('role-tabs'),state.roleFilter,id=>{ state.roleFilter=id; renderSelect(); save(); });
    const query=$('agent-search').value.trim().toLowerCase();
    const list=P.agents.filter(item => (state.roleFilter==='all'||item.role===state.roleFilter) && (item.name.toLowerCase().includes(query)||item.cn.includes(query)));
    $('agent-grid').replaceChildren();
    list.forEach(agent => {
      const selected=state.selected.indexOf(agent.name), card=document.createElement('button'); card.type='button'; card.className='agent-card'+(selected>=0?' selected':'')+(agent.name===celebrateName?' just-picked':'');
      card.innerHTML=`<span class="agent-portrait" style="${portraitStyle(agent.name)}" aria-hidden="true"></span><span class="agent-info"><strong>${agent.cn}</strong><small>${agent.name} · ${roleName(agent.role)}</small></span><span class="agent-check">${selected>=0?'0'+(selected+1):'+'}</span>`;
      card.setAttribute('aria-pressed',String(selected>=0));
      card.addEventListener('click',()=>{ let picked=null; if(selected>=0) state.selected.splice(selected,1); else if(state.selected.length<3) { state.selected.push(agent.name); picked=agent.name; } renderSelect(picked); save(); });
      $('agent-grid').append(card);
    });
    $('agent-count').textContent=`已选 ${state.selected.length} / 3 · 显示 ${list.length} 位特工`;
    $('select-next').disabled=state.selected.length!==3;
    $('select-next').dataset.count=String(state.selected.length);
    $('select-next').style.setProperty('--charge',`${state.selected.length/3*100}%`);
    $('select-next-caption').textContent=`特工就位 ${state.selected.length} / 3`;
  }
  function renderQuiz(animateQuestion = false) {
    const q=P.questions[state.index];
    const card=$('screen-quiz').querySelector('.quiz-card');
    const sceneTile=state.index%6;
    const sceneSheet=String(Math.floor(state.index/6)+1).padStart(2,'0');
    $('scenario-art').style.cssText=`--scene-sheet:url('./assets/scenario-atlas-${sceneSheet}.webp');--scene-x:${sceneTile%3*50}%;--scene-y:${Math.floor(sceneTile/3)*100}%`;
    $('scenario-kind').textContent=state.index<5?'战术位置':state.index<9?'回合目标':'行动节奏';
    card.dataset.act=state.index<5?'role':state.index<9?'objective':'tempo';
    card.classList.toggle('has-answer',state.answers[state.index]!==null);
    const spikeBriefs=['皮蛋刚出门，爆能器在路上','皮蛋抱包跟队中','皮蛋正在找下包位','爆能器准备就绪'];
    $('spike-brief').textContent=spikeBriefs[Math.min(3,Math.floor(state.index/3))];
    const progress=((state.index+1)/P.questions.length*100)+'%';
    $('quiz-progress').style.width=progress;
    $('quiz-track').style.setProperty('--runner-progress',progress);
    $('quiz-track').setAttribute('aria-valuenow',String(state.index+1));
    $('question-count').textContent=`${String(state.index+1).padStart(2,'0')} / ${P.questions.length}`;
    $('round-code').textContent=String(state.index+1).padStart(2,'0');
    $('question-title').textContent=q.scene;
    $('option-list').replaceChildren();
    q.options.forEach((option,index)=>{
      const button=document.createElement('button'); button.type='button'; button.className='option'+(state.answers[state.index]===index?' active':'');
      button.innerHTML=`<span class="option-letter">${'ABCD'[index]}</span><span>${option.text}</span><span class="option-arrow">↗</span>`;
      button.setAttribute('aria-pressed',String(state.answers[state.index]===index));
      button.addEventListener('click',()=>{ state.answers[state.index]=index; renderQuiz(); save(); }); $('option-list').append(button);
    });
    $('quiz-next').disabled=state.answers[state.index]===null;
    const finalRound=state.index===P.questions.length-1;
    $('quiz-next-number').textContent=finalRound?'★':String(state.index+2).padStart(2,'0');
    $('quiz-next-caption').textContent=finalRound?'PERSONA REVEAL':`ROUND ${String(state.index+1).padStart(2,'0')} / ${P.questions.length}`;
    $('quiz-next-label').textContent=finalRound?'生成我的人格':'下一题';
    if (animateQuestion) {
      card.classList.remove('question-enter');
      void card.offsetWidth;
      card.classList.add('question-enter');
    }
  }
  function renderScores(target, list) {
    target.replaceChildren();
    list.forEach(item=>{ const row=document.createElement('div'); row.className='score-row'; row.innerHTML=`<div><strong>${item.name}</strong><span>${item.share}%</span></div><div class="score-track"><i style="width:${item.share}%"></i></div>`; target.append(row); });
  }
  function renderResult() {
    const result=P.makeResult(state.selected,state.answers), persona=result.persona;
    const personaIndex=P.personas.indexOf(persona);
    $('result-number').textContent=String(personaIndex+1).padStart(2,'0');
    $('result-mascot').style.cssText=mascotStyle(persona);
    $('result-mascot').setAttribute('aria-label',`${persona.name}的专属形象：${mascotNames[personaIndex]}`);
    $('result-kicker').textContent=`${result.role.name} / ${result.habit.name} / ${result.tempo.name}`;
    $('result-title').textContent=persona.name; $('result-lead').textContent=persona.lead;
    $('result-strength').textContent=persona.strength; $('result-tease').textContent=persona.tease;
    $('result-quote').textContent='“'+persona.quote+'”';
    $('result-tags').innerHTML=`<span>${result.role.name}</span><span>${result.habit.name}</span><span>${result.tempo.name}</span>`;
    $('result-agents').replaceChildren(); result.selectedNames.forEach((name,index)=>{const chip=document.createElement('span');chip.textContent=`0${index+1} ${findAgent(name).cn} · ${name}`;$('result-agents').append(chip);});
    $('secondary-role').textContent=`第二倾向：${result.secondaryRole.name}`;
    renderScores($('role-scores'),result.roles);renderScores($('habit-scores'),result.habits);renderScores($('tempo-scores'),result.tempos);
    $('copy-status').textContent='';
  }
  function renderGallery() {
    formatTabs($('gallery-tabs'),state.galleryFilter,id=>{state.galleryFilter=id;renderGallery();save();});
    $('persona-grid').replaceChildren();
    P.personas.filter(item=>state.galleryFilter==='all'||item.role===state.galleryFilter).forEach(persona=>{
      const card=document.createElement('article'); card.className='persona-card';
      const number=String(P.personas.indexOf(persona)+1).padStart(2,'0');
      card.innerHTML=`<div class="persona-card-top"><span>FILE ${number}</span><span>${roleName(persona.role)}</span></div><span class="persona-card-art" style="${mascotStyle(persona)}" aria-hidden="true"></span><h3>${persona.name}</h3><p class="persona-lead">${persona.lead}</p><p>${persona.strength}</p><p class="persona-tease">队友会吐槽：${persona.tease}</p><div class="persona-quote">“${persona.quote}”</div>`;
      $('persona-grid').append(card);
    });
  }
  function openGallery() { state.galleryReturn=state.screen;renderGallery();show('gallery'); }
  $('home').addEventListener('click',()=>show('intro'));
  $('start').addEventListener('click',()=>{renderSelect();show('select');});
  $('view-gallery-intro').addEventListener('click',openGallery);
  $('view-gallery-result').addEventListener('click',openGallery);
  $('gallery-back').addEventListener('click',()=>{if(state.galleryReturn==='result'){renderResult();show('result');}else show('intro');});
  $('select-back').addEventListener('click',()=>show('intro'));
  $('agent-search').addEventListener('input',()=>renderSelect());
  $('select-next').addEventListener('click',()=>{if(state.selected.length===3)confirmCommand($('select-next'),()=>{state.index=0;renderQuiz();show('quiz');});});
  $('quiz-back').addEventListener('click',()=>{if(state.index>0){state.index--;renderQuiz(true);save();}else {renderSelect();show('select');}});
  $('quiz-next').addEventListener('click',()=>{if(state.answers[state.index]===null)return;confirmCommand($('quiz-next'),()=>{if(state.index<P.questions.length-1){state.index++;renderQuiz(true);save();window.scrollTo(0,0);}else{renderResult();show('result');}});});
  $('result-restart').addEventListener('click',()=>{state.selected=[];state.answers=Array(P.questions.length).fill(null);state.index=0;$('agent-search').value='';renderSelect();show('select');});
  $('copy-result').addEventListener('click',async()=>{
    const r=P.makeResult(state.selected,state.answers),p=r.persona;
    const summary=`我的瓦罗兰特回合人格：${p.name}\n${r.role.name} · ${r.habit.name} · ${r.tempo.name}\n${p.lead}\n擅长：${p.strength}\n队友会吐槽：${p.tease}\n“${p.quote}”\n常玩特工：${r.selectedNames.join(' / ')}\n非官方趣味测试，不代表真实战绩。`;
    try { await navigator.clipboard.writeText(summary); $('copy-status').textContent='已复制，可以发给队友了。'; }
    catch (_) { $('copy-status').textContent='浏览器未允许复制，请手动选取页面文字。'; }
  });
  const heroArt=document.querySelector('.hero-art');
  if (heroArt && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    heroArt.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      const rect=heroArt.getBoundingClientRect();
      heroArt.style.setProperty('--drift-x',`${((event.clientX-rect.left)/rect.width-.5)*14}px`);
      heroArt.style.setProperty('--drift-y',`${((event.clientY-rect.top)/rect.height-.5)*10}px`);
    });
    heroArt.addEventListener('pointerleave',()=>{heroArt.style.setProperty('--drift-x','0px');heroArt.style.setProperty('--drift-y','0px');});
  }
  if(state.screen==='select')renderSelect();
  if(state.screen==='quiz'){state.index=Math.max(0,Math.min(P.questions.length-1,Number(state.index)||0));renderQuiz();}
  if(state.screen==='result')renderResult();
  if(state.screen==='gallery')renderGallery();
  show(state.screen);
})();
