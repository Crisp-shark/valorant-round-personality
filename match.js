(function () {
  'use strict';
  const API = 'https://valorant-apothecary-party.f2swf77gfz.chatgpt.site/api/match';
  const P = window.ValorantPersonality;
  const $ = id => document.getElementById(id);
  const names = {cn:'国服',apac:'亚太',eu:'欧洲',na:'北美',other:'其他',duelist:'决斗者',initiator:'先锋',controller:'控场者',sentinel:'哨卫'};
  const ranks = ['黑铁','青铜','白银','黄金','铂金','钻石','超凡','神话','辐能战魂'];
  let token = sessionStorage.getItem('valorant-party-token') || '';
  let authMode = 'login';
  let username = '';
  let busy = false;
  function status(message, bad) { $('match-status').textContent=message; $('match-status').classList.toggle('is-error',!!bad); }
  async function api(action, payload) {
    const isGet = payload === undefined;
    const response = await fetch(isGet ? `${API}?action=${encodeURIComponent(action)}` : API, {
      method:isGet?'GET':'POST', mode:'cors', cache:'no-store',
      headers:{...(isGet?{}:{'Content-Type':'application/json'}),...(token?{'Authorization':`Bearer ${token}`}:{})},
      ...(isGet?{}:{body:JSON.stringify({action,...payload})}),
      signal:AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '服务暂时不可用');
    return data;
  }
  function element(tag, className, content) {
    const node=document.createElement(tag);
    if(className) node.className=className;
    if(content!==undefined) node.textContent=content;
    return node;
  }
  function detectedPersona() {
    try {
      const saved=JSON.parse(localStorage.getItem('valorant-personality-v1')||'null');
      if (!saved) return null;
      return P.makeResult(saved.selected,saved.answers).persona;
    } catch (_) { return null; }
  }
  function fillPersonas() {
    for (const persona of P.personas) {
      const option=element('option','',`${persona.herb} · ${persona.name}`);
      option.value=persona.id;
      $('profile-persona').append(option);
    }
    const detected=detectedPersona();
    if(detected) {
      $('profile-persona').value=detected.id;
      $('profile-persona-note').textContent=`本机测得药方：${detected.herb} · ${detected.name}。可以在下方确认或修改。`;
    } else {
      $('profile-persona-note').textContent='这台设备还没有测试结果。可以先返回完成测试，也可以从 24 味药方中手动选择。';
    }
  }
  function showAuth() { $('match-auth').hidden=false; $('match-app').hidden=true; }
  function showApp() { $('match-auth').hidden=true; $('match-app').hidden=false; $('match-welcome').textContent=`药铺会员 · ${username}`; }
  function setAuthMode(mode) {
    authMode=mode;
    $('tab-login').setAttribute('aria-selected',String(mode==='login'));
    $('tab-register').setAttribute('aria-selected',String(mode==='register'));
    $('tab-recover').setAttribute('aria-selected',String(mode==='recover'));
    $('auth-submit').firstChild.textContent=mode==='login'?'登录 ':mode==='register'?'注册 ':'重设密码 ';
    $('recovery-code-label').hidden=mode!=='recover';
    $('auth-code').required=mode==='recover';
    $('auth-password-label').textContent=mode==='recover'?'新密码':'密码';
    $('auth-password').autocomplete=mode==='login'?'current-password':'new-password';
    status('');
  }
  function fillProfile(profile) {
    if (!profile) return;
    $('profile-name').value=profile.display_name||'';
    $('profile-riot').value=profile.riot_id||'';
    $('profile-region').value=profile.region||'';
    $('profile-rank').value=Number(profile.rank)<0?'':String(profile.rank);
    $('profile-role').value=profile.role||'';
    $('profile-voice').value=String(profile.voice||0);
    $('profile-persona').value=profile.persona_id||detectedPersona()?.id||'';
    $('profile-discoverable').checked=!!profile.discoverable;
    for(const input of document.querySelectorAll('.match-time input')) input.checked=!!(Number(profile.play_times)&Number(input.value));
  }
  function profileData() {
    let playTimes=0;
    for(const input of document.querySelectorAll('.match-time input')) if(input.checked) playTimes|=Number(input.value);
    return {displayName:$('profile-name').value.trim(),riotId:$('profile-riot').value.trim(),region:$('profile-region').value,rank:Number($('profile-rank').value),role:$('profile-role').value,voice:Number($('profile-voice').value),personaId:$('profile-persona').value,playTimes,discoverable:$('profile-discoverable').checked};
  }
  async function loadAccount() {
    try {
      const data=await api('me');
      username=data.username;
      showApp();
      fillProfile(data.profile);
      await Promise.all([loadCandidates(),loadInvites()]);
    } catch(error) {
      if(error.message==='请先登录') { token=''; sessionStorage.removeItem('valorant-party-token'); showAuth(); }
      else status(error.message,true);
    }
  }
  async function loadCandidates() {
    const box=$('match-candidates'); box.replaceChildren();
    try {
      const data=await api('recommendations');
      if(!data.candidates.length) { box.append(element('p','match-empty','暂时没有同区服且已公开名片的玩家。可以稍后再来看看。')); return; }
      for (const item of data.candidates) {
        const card=element('article','match-card');
        const top=element('div','match-card-top');
        top.append(element('strong','',item.displayName||item.username),element('b','match-score',`${item.score.value}% 合拍`));
        const persona=P.personas.find(x=>x.id===item.personaId);
        card.append(top,element('small','',`@${item.username} · ${persona?persona.herb:'未配药'}`),element('p','',`${names[item.region]} · ${ranks[item.rank]} · ${names[item.role]}`),element('p','match-reasons',item.score.reasons.join(' / ')));
        const button=element('button','match-invite-button','发出组队邀请 ↗'); button.type='button';
        button.addEventListener('click',async()=>{button.disabled=true;try{await api('sendInvite',{targetId:item.id});status(`已向 ${item.displayName||item.username} 发出邀请。`);await loadInvites();}catch(error){status(error.message,true);button.disabled=false;}});
        card.append(button); box.append(card);
      }
    } catch(error) { box.append(element('p','match-empty',error.message)); }
  }
  async function loadInvites() {
    const box=$('match-invites'); box.replaceChildren();
    try {
      const data=await api('invites');
      if(!data.invites.length) {box.append(element('p','match-empty','还没有邀请。先看上面的推荐，找一位合拍队友吧。'));return;}
      for(const item of data.invites) {
        const card=element('article','match-invite');
        const heading=element('div','match-card-top'); heading.append(element('strong','',item.displayName||item.username),element('span','match-invite-state',item.status==='accepted'?'已配对':item.status==='pending'?'等待回应':'已婉拒'));
        card.append(heading,element('small','',`@${item.username} · ${item.incoming?'对方邀请你':'你发出的邀请'}`));
        if(item.status==='accepted') card.append(element('p','match-contact',`游戏 ID：${item.riotId||'对方暂未填写'}`));
        if(item.status==='pending'&&item.incoming) {
          const row=element('div','match-invite-actions');
          for(const [accept,label] of [[true,'接受并互换游戏 ID'],[false,'婉拒']]) {
            const button=element('button','match-invite-button',label); button.type='button';
            button.addEventListener('click',async()=>{try{await api('respondInvite',{inviteId:item.id,accept});status(accept?'组队成功，已显示彼此的游戏 ID。':'已婉拒邀请。');await loadInvites();}catch(error){status(error.message,true);}});
            row.append(button);
          }
          card.append(row);
        }
        if(item.status==='accepted'||(item.status==='pending'&&!item.incoming)) {
          const button=element('button','match-remove-button',item.status==='accepted'?'解除配对':'撤回邀请'); button.type='button';
          button.addEventListener('click',async()=>{try{await api('removeInvite',{inviteId:item.id});status(item.status==='accepted'?'已解除配对，对方的游戏 ID 不再显示。':'邀请已撤回。');await Promise.all([loadInvites(),loadCandidates()]);}catch(error){status(error.message,true);}});
          card.append(button);
        }
        box.append(card);
      }
    } catch(error) { box.append(element('p','match-empty',error.message)); }
  }
  $('tab-login').addEventListener('click',()=>setAuthMode('login'));
  $('tab-register').addEventListener('click',()=>setAuthMode('register'));
  $('tab-recover').addEventListener('click',()=>setAuthMode('recover'));
  $('copy-recovery').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('recovery-codes').textContent);status('恢复码已复制，请保存到安全的地方。');}catch(_){status('请手动复制恢复码。',true);}});
  $('dismiss-recovery').addEventListener('click',()=>{$('recovery-panel').hidden=true;$('recovery-codes').textContent='';});
  $('auth-form').addEventListener('submit',async event=>{
    event.preventDefault(); if(busy)return; busy=true; $('auth-submit').disabled=true;
    try {
      const result=await api(authMode,{username:$('auth-username').value,password:$('auth-password').value,...(authMode==='recover'?{code:$('auth-code').value.trim()}:{})});
      if(authMode==='recover') { $('auth-password').value='';$('auth-code').value='';setAuthMode('login');status('密码已重设，请用新密码登录。');return; }
      token=result.token; sessionStorage.setItem('valorant-party-token',token);
      $('auth-password').value=''; status(authMode==='register'?'注册成功，接下来填写组队名片。':'欢迎回来。');
      if(result.recoveryCodes) {$('recovery-codes').textContent=result.recoveryCodes.join('\n');$('recovery-panel').hidden=false;}
      await loadAccount();
      if(result.recoveryCodes) $('recovery-panel').scrollIntoView({behavior:'smooth',block:'start'});
    } catch(error) {status(error.message,true);} finally {busy=false;$('auth-submit').disabled=false;}
  });
  $('profile-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const data=profileData();
    if(!data.playTimes){status('请至少选择一个开黑时间。',true);return;}
    try {await api('saveProfile',data);status('组队名片已保存。');await loadCandidates();}catch(error){status(error.message,true);}
  });
  $('refresh-matches').addEventListener('click',()=>{loadCandidates();loadInvites();});
  $('match-logout').addEventListener('click',async()=>{try{await api('logout',{});}catch(_){} token='';sessionStorage.removeItem('valorant-party-token');showAuth();status('已退出登录。');});
  $('delete-account').addEventListener('click',async()=>{
    const confirm=$('delete-confirm').value.trim().toLowerCase();
    if(confirm!==username){status('请输入当前用户名确认删除。',true);return;}
    try{await api('deleteAccount',{confirm,password:$('delete-password').value});token='';sessionStorage.removeItem('valorant-party-token');showAuth();status('账号和组队资料已删除。');}catch(error){status(error.message,true);}
  });
  fillPersonas();
  if(token) loadAccount(); else showAuth();
})();
