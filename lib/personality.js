/* A small, transparent fan quiz. Agent roles follow Riot's public agent roster. */
(function (root) {
  'use strict';

  const roles = [
    { id: 'duelist', name: '决斗者', hint: '愿意先制造交火机会' },
    { id: 'initiator', name: '先锋', hint: '先把信息和机会递给队友' },
    { id: 'controller', name: '控场者', hint: '喜欢安排视野和进点节奏' },
    { id: 'sentinel', name: '哨卫', hint: '擅长守住身后和关键区域' }
  ];
  const habits = [
    { id: 'gun', name: '对枪派', hint: '相信准星能给出答案' },
    { id: 'objective', name: '目标派', hint: '满脑子都是下包、守包和拆包' },
    { id: 'utility', name: '道具派', hint: '喜欢用技能把难题变简单' }
  ];
  const tempos = [
    { id: 'fast', name: '先手节奏', hint: '看到窗口就行动' },
    { id: 'steady', name: '稳健节奏', hint: '先确认，再出手' }
  ];
  const agents = [
    ['Astra','星礈','controller'],['Breach','铁臂','initiator'],['Brimstone','炼狱','controller'],
    ['Chamber','尚勃勒','sentinel'],['Clove','暮蝶','controller'],['Cypher','零','sentinel'],
    ['Deadlock','钢锁','sentinel'],['Fade','黑梦','initiator'],['Gekko','盖可','initiator'],
    ['Harbor','海神','controller'],['Iso','壹决','duelist'],['Jett','捷风','duelist'],
    ['KAY/O','K/O','initiator'],['Killjoy','奇乐','sentinel'],['Miks','迷核','controller'],
    ['Neon','霓虹','duelist'],['Omen','幽影','controller'],['Phoenix','不死鸟','duelist'],
    ['Raze','雷兹','duelist'],['Reyna','芮娜','duelist'],['Sage','贤者','sentinel'],
    ['Skye','斯凯','initiator'],['Sova','猎枭','initiator'],['Tejo','钛狐','initiator'],
    ['Veto','禁灭','sentinel'],['Viper','蝰蛇','controller'],['Vyse','维斯','sentinel'],
    ['Waylay','幻棱','duelist'],['Yoru','夜露','duelist']
  ].map(([name, cn, role]) => ({ name, cn, role }));

  // Five role decisions, four win-condition decisions, three tempo decisions.
  const questions = [
    { scene: '手枪局快开打了，语音安静得像全队掉线。你先做什么？', options: [
      ['先拉第一枪，队友补','duelist'],['先探点，报敌人位置','initiator'],
      ['先给烟，挡住守点视线','controller'],['先看后路，防人绕后','sentinel'] ] },
    { scene: '进攻卡在 A 点门口，大家探头探成了排队。你最想负责哪一步？', options: [
      ['丢烟挡视线，带队过门','controller'],['看侧路，防人绕后','sentinel'],
      ['先拉出去，叫队友补枪','duelist'],['探清点里，再喊队友进','initiator'] ] },
    { scene: '防守 B 点时听见一串脚步，队友还在另一头。你第一反应是？', options: [
      ['报 B 点脚步，查人数','initiator'],['守入口，等他们进来','sentinel'],
      ['前压一步，先打一个','duelist'],['封入口，等队友回防','controller'] ] },
    { scene: '如果这局能白送你一个额外技能，四选一你拿哪个？', options: [
      ['防绕后的陷阱','sentinel'],['抢第一枪的位移','duelist'],
      ['挡视线的烟','controller'],['能查站位的技能','initiator'] ] },
    { scene: '残局 2v2，队友问“怎么回防？”你最想说哪句？', options: [
      ['我看侧门，你盯包','sentinel'],['我先探人，立刻报点','initiator'],
      ['我丢烟，再一起进','controller'],['我先拉枪，你跟着补','duelist'] ] },
    { scene: '包刚下好，对面开始回防。接下来你最想做什么？', options: [
      ['架枪，打回防的人','gun'],['盯包，防人偷拆','objective'],
      ['留技能打断拆包','utility'] ] },
    { scene: '残局只剩你一个，队友喊“靠你了！”你脑子里先冒出什么？', options: [
      ['用技能逼他换位','utility'],['找机会打一对一','gun'],
      ['先看包和倒计时','objective'] ] },
    { scene: '结算只给你放 5 秒高光，你最想看见哪一幕？', options: [
      ['关键一枪，队友尖叫','gun'],['最后几秒下包或拆包','objective'],
      ['一颗技能卡住三个人','utility'] ] },
    { scene: '经济局买不起好枪，队友说“这把随缘吧”。你想怎么偷一分？', options: [
      ['买关键技能，打一波配合','utility'],['抓落单的，捡枪继续打','gun'],
      ['摸进包点，先把包下了','objective'] ] },
    { scene: '队友刚报：A 点现在只看到一个人。你会？', options: [
      ['趁人没到，一起进点','fast'],['先看清门边，再一起进','steady'] ] },
    { scene: '包下好了，你们 4 打 3，对面回防脚步越来越近。你会？', options: [
      ['分好角度，守包等人','steady'],['先出去截一个回防','fast'] ] },
    { scene: '原定走 A，走到一半发现那边堵死，队友喊“转 B！”你会？', options: [
      ['先转，路上再报分工','fast'],['先确认包和断后，再转','steady'] ] }
  ].map((q, index) => ({ index, scene: q.scene, options: q.options.map(([text, value], optionIndex) => ({ text, value, optionIndex })) }));

  // Each profile has its own joke, useful strength, and a gentle self-check.
  const profiles = {
    'duelist-gun-fast': ['秒锁冲锋号','枪声未响，先手已到。','破局第一枪','等等，我还没到！','我先上，补我！'],
    'duelist-gun-steady': ['预瞄冷面杀手','不抢开场，专收尾。','预瞄稳，收尾准','还等？包都快炸了。','这条线我来。'],
    'duelist-objective-fast': ['闪送安装员','进点顺手把包送到。','突破接下包','送完别原地签收。','我开路，包跟上！'],
    'duelist-objective-steady': ['进点护送员','开路，也护住包。','进点不丢包','别护包护成肉盾。','包跟我走。'],
    'duelist-utility-fast': ['技能开幕雷','技能一响，进攻开场。','道具抢先手','等等，我们还没跟！','技能到了，进！'],
    'duelist-utility-steady': ['技能存钱罐','关键时候，兜里有货。','留好关键技能','回合结束还满兜？','我还有一手。'],
    'initiator-gun-fast': ['闪光催债人','闪一出，立刻收人头。','闪后抢首杀','先喊闪啊！','闪了，跟我！'],
    'initiator-gun-steady': ['侦查补枪员','看到人，枪也跟上。','信息接补枪','报点也分我一份。','看到了，我补。'],
    'initiator-objective-fast': ['冲点交通警','路一通，整队进。','探路带队快','绿灯也等等人！','路清了，走！'],
    'initiator-objective-steady': ['进点导航仪','清角进点，不绕远路。','进点路线清','别规划到超时。','清完这角就下。'],
    'initiator-utility-fast': ['信息轰炸机','对面刚藏好，你已报点。','连续探出机会','重点是哪一句？','我探，你们打！'],
    'initiator-utility-steady': ['箭线备忘录','开局前，箭线已背熟。','道具落点稳','这招对面会背了。','这条线我熟。'],
    'controller-gun-fast': ['烟里拆快递','烟一落，人就钻。','借烟抢先手','进烟前说一声！','烟里有人？我来。'],
    'controller-gun-steady': ['烟后冷枪王','藏在烟后，等你过来。','烟边架枪稳','你到底躲哪儿？','过烟，我接。'],
    'controller-objective-fast': ['下包总导演','烟铺好，包落地。','控场接下包','导演，听听演员！','烟给了，包下！'],
    'controller-objective-steady': ['人形皮蛋','枪可以空，包不能丢。','下包守包都上心','包别抱成传家宝。','包给我，放心。'],
    'controller-utility-fast': ['三秒封路师','对面露头，路就封死。','封路反应快','也给我留条路！','这条线关了。'],
    'controller-utility-steady': ['小地图房东','地图一开，地盘划好。','技能守关键点','先看看你身后！','这片先归我们。'],
    'sentinel-gun-fast': ['回防收租人','包点一响，立刻回防。','回防敢先开枪','你到底从哪来？','我到了，接我！'],
    'sentinel-gun-steady': ['架枪定海针','战况再乱，准星不飘。','架枪守线稳','人都转点啦！','这条线我守。'],
    'sentinel-objective-fast': ['拆包急诊员','听见滴滴，就想拆包。','回防拆包果断','先等我架枪！','帮我架，我拆。'],
    'sentinel-objective-steady': ['守包老干部','不追人，只守包。','站位和时间都稳','倒计时倒是报啊！','别追，守包。'],
    'sentinel-utility-fast': ['陷阱快递员','对面转点，陷阱搬家。','布防跟得快','别把自己送进去。','换路了，我补。'],
    'sentinel-utility-steady': ['绊线物业经理','门口有线，路过报备。','守住身后','这根线又是这里？','后面我管。']
  };
  // The herb is a playful round identity, not a medical recommendation.
  const herbNames = {
    'duelist-gun-fast':'穿心莲', 'duelist-gun-steady':'独活',
    'duelist-objective-fast':'红花', 'duelist-objective-steady':'黄芪',
    'duelist-utility-fast':'薄荷', 'duelist-utility-steady':'甘草',
    'initiator-gun-fast':'急性子', 'initiator-gun-steady':'千里光',
    'initiator-objective-fast':'路路通', 'initiator-objective-steady':'远志',
    'initiator-utility-fast':'连翘', 'initiator-utility-steady':'熟地黄',
    'controller-gun-fast':'沉香', 'controller-gun-steady':'玄参',
    'controller-objective-fast':'合欢花', 'controller-objective-steady':'紫花地丁',
    'controller-utility-fast':'防风', 'controller-utility-steady':'茯苓',
    'sentinel-gun-fast':'当归', 'sentinel-gun-steady':'石斛',
    'sentinel-objective-fast':'救必应', 'sentinel-objective-steady':'锁阳',
    'sentinel-utility-fast':'苍耳子', 'sentinel-utility-steady':'钩藤'
  };
  const personas = [];
  for (const role of roles) for (const habit of habits) for (const tempo of tempos) {
    const id = `${role.id}-${habit.id}-${tempo.id}`;
    const [name, lead, strength, tease, quote] = profiles[id];
    personas.push({ id, name, herb: herbNames[id], lead, strength, tease, quote, role: role.id, habit: habit.id, tempo: tempo.id });
  }

  function makeResult(selectedNames, answers) {
    if (!Array.isArray(selectedNames) || selectedNames.length !== 3 || new Set(selectedNames).size !== 3 || selectedNames.some(name => !agents.some(agent => agent.name === name))) throw new Error('请选择三位不同的特工');
    if (!Array.isArray(answers) || answers.length !== questions.length) throw new Error('请完成全部题目');
    const roleScores = Object.fromEntries(roles.map(item => [item.id, 0]));
    const habitScores = Object.fromEntries(habits.map(item => [item.id, 0]));
    const tempoScores = Object.fromEntries(tempos.map(item => [item.id, 0]));
    selectedNames.forEach((name, index) => { roleScores[agents.find(agent => agent.name === name).role] += [1.5, 1, 0.5][index]; });
    answers.forEach((answer, index) => {
      const option = questions[index].options[answer];
      if (!option || !Number.isInteger(answer)) throw new Error(`第 ${index + 1} 题答案无效`);
      const target = index < 5 ? roleScores : index < 9 ? habitScores : tempoScores;
      target[option.value] += 1;
    });
    const pick = (items, scores) => items.slice().sort((a, b) => scores[b.id] - scores[a.id] || items.indexOf(a) - items.indexOf(b))[0];
    const role = pick(roles, roleScores), habit = pick(habits, habitScores), tempo = pick(tempos, tempoScores);
    const persona = personas.find(item => item.id === `${role.id}-${habit.id}-${tempo.id}`);
    const withShare = (items, scores) => {
      const total = Object.values(scores).reduce((a,b) => a + b, 0);
      return items.map(item => ({ id:item.id, name:item.name, hint:item.hint, score:scores[item.id], share:Math.round(scores[item.id] / total * 100) }));
    };
    return { persona, selectedNames:selectedNames.slice(), role, habit, tempo,
      roles:withShare(roles, roleScores), habits:withShare(habits, habitScores), tempos:withShare(tempos, tempoScores),
      secondaryRole:roles.slice().sort((a,b) => roleScores[b.id] - roleScores[a.id] || roles.indexOf(a) - roles.indexOf(b))[1] };
  }

  const api = { roles, habits, tempos, agents, questions, personas, makeResult };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ValorantPersonality = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
