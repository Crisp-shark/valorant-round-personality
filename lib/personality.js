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
    { scene: '开局 20 秒，队里谁都没说话。你先做什么？', options: [
      ['抢个前点，看看能不能打开局面','duelist'],['先探一块区域，把信息报出来','initiator'],
      ['和队友约好第一颗烟怎么给','controller'],['看住侧翼，别让大家后背发凉','sentinel'] ] },
    { scene: '进攻被卡在门口，第一波没进去。你倾向于……', options: [
      ['改个角度封视野，重组下一波','controller'],['留个后手，防对面绕后或前压','sentinel'],
      ['请队友跟上，再试一次主动突破','duelist'],['清掉可能藏人的位置，再一起走','initiator'] ] },
    { scene: '防守时只听见一串脚步，你的第一反应是？', options: [
      ['报人数和位置，帮队友决定回防','initiator'],['守住出口，等对方自己撞上来','sentinel'],
      ['趁他们还没展开，主动打一枪','duelist'],['切断主路，给回防争取时间','controller'] ] },
    { scene: '队友问你最想负责哪件事。你说：', options: [
      ['把后方和关键通道交给我','sentinel'],['我来把交火带起来','duelist'],
      ['我负责让大家安全进点','controller'],['我先找人、报点、给机会','initiator'] ] },
    { scene: '残局里你和队友还活着，最顺手的配合是？', options: [
      ['先架好交叉火力，等对手犯错','sentinel'],['用信息逼对面暴露位置','initiator'],
      ['封一条线，让对面只能走另一条','controller'],['我先制造接触，队友跟着补枪','duelist'] ] },
    { scene: '只剩 35 秒，进点成功。你最惦记的是？', options: [
      ['先找下一次能赢的对枪','gun'],['包有没有安全落下','objective'],['还能留什么技能守这一波','utility'] ] },
    { scene: '队友突然说“这把靠你了”。你手会先摸向？', options: [
      ['技能键：先让局势变简单','utility'],['准星：能打一个是一个','gun'],['地图和包：回合目标别丢','objective'] ] },
    { scene: '你最想被夸的一句是？', options: [
      ['“这枪太硬了！”','gun'],['“这包下得真会选地方。”','objective'],['“你这个技能救了整队。”','utility'] ] },
    { scene: '经济局只能把一件事做好，你会保什么？', options: [
      ['一套能创造机会的技能','utility'],['能好好对枪的武器','gun'],['能偷到下包或拆包的路线','objective'] ] },
    { scene: '队友报“对面露了半个身位”，你会？', options: [
      ['马上抓这半秒窗口','fast'],['先确认第二个人在哪','steady'] ] },
    { scene: '打出人数优势后，你更习惯？', options: [
      ['重新站位，把优势锁住','steady'],['趁对手没缓过来继续施压','fast'] ] },
    { scene: '最后一回合，计划突然变了。你会？', options: [
      ['迅速接招，边打边修正','fast'],['停一拍，先把新计划讲清楚','steady'] ] }
  ].map((q, index) => ({ index, scene: q.scene, options: q.options.map(([text, value], optionIndex) => ({ text, value, optionIndex })) }));

  // Each profile has its own joke, useful strength, and a gentle self-check.
  const profiles = {
    'duelist-gun-fast': ['秒锁冲锋号','倒计时还没结束，心里已经听到“跟我冲”。','你擅长把僵局打出第一道口子。','有时队友的腿还没跟上，你的击杀播报已经结束了。','我先进，跟上补枪！'],
    'duelist-gun-steady': ['预瞄冷面杀手','不抢第一声枪响，但喜欢拿走最后一声。','你会耐心找角度，把单挑变成自己熟悉的题。','别把每个回合都等成 1v1；有人正等你一起进点。','角度找好了，这枪我来。'],
    'duelist-objective-fast': ['闪送安装员','冲进点的目的很朴素：先把包送到。','你能把一次突破直接变成回合优势。','包落地之后记得找掩体，别站在原地等好评。','我先进，你们准备下包！'],
    'duelist-objective-steady': ['进点护送员','枪能开，包也要平安送达。','你愿意替队友开路，也知道什么时候该收住脚步。','别为了护送到最后，把自己变成对手的第一份战利品。','人可以冒险，包别乱丢。'],
    'duelist-utility-fast': ['技能开幕雷','你按技能键的速度，像在给进攻按播放。','你会用道具制造一瞬间的突破窗口。','技能飞出去了，先看队友能不能跟上这班车。','道具到了，现在轮到我们。'],
    'duelist-utility-steady': ['技能存钱罐','队友问“还有技能吗”，你总能掏出最后一手。','你善于为关键交火留资源。','偶尔也可以早点花；回合结束还满兜技能不算理财成功。','先别急，我还留了一手。'],
    'initiator-gun-fast': ['闪光催债人','闪一出手，立刻上门收账。','你能把自己创造的机会快速换成击杀。','报一声闪的方向，队友才不会和对面一起交学费。','闪了！跟我一起收。'],
    'initiator-gun-steady': ['侦查补枪员','信息到手后，你总能找到最该开的那一枪。','你擅长让队友的第一波接触有第二层保险。','别把每个报点都留给自己用，信息传出去才更值钱。','我看到人了，架好补枪。'],
    'initiator-objective-fast': ['冲点交通警','一边喊“这边能走”，一边把人带进包点。','你能迅速把情报变成队伍行动。','大家如果还在买枪，你的绿灯开得再快也没人过。','路清了，包跟我走。'],
    'initiator-objective-steady': ['进点导航仪','你的报点像导航：不花哨，但少走冤枉路。','你会把下包前的危险逐个排掉。','地图上还有问号时也别无限绕路，计时器不听解释。','先排这个角，下一步就能下。'],
    'initiator-utility-fast': ['信息轰炸机','对面刚站稳，你的第二条信息已经来了。','你很会连续制造队伍可以利用的机会。','提示太密时，记得把最重要的一条说清楚。','我来探，看到人就一起动。'],
    'initiator-utility-steady': ['箭线备忘录','别人背枪皮名字，你背一整本投点。','你能用准备好的道具让不确定变少。','套路被识破就换一本，别在同一个点位反复签名。','这条线我熟，先让我试。'],
    'controller-gun-fast': ['烟里拆快递','烟刚落，你已经在里面签收第一位对手。','你会利用视野变化果断改写交火。','队友要是只看到你的烟和你的背影，会以为你瞬移了。','烟开了，机会也开了。'],
    'controller-gun-steady': ['烟后冷枪王','你从不着急现身，但总知道哪条线会有人经过。','你能把控场和架枪连成一套。','烟散之前给队友一个信号，别让大家一起猜你的计划。','等他过烟，我来接。'],
    'controller-objective-fast': ['下包总导演','“烟、进、下包”三个字，你能喊出一整套流程。','你善于把短暂的空间优势变成回合目标。','导演也得偶尔听演员说话，别把队友全排成背景板。','位置给好了，包现在下。'],
    'controller-objective-steady': ['人形皮蛋','枪法今天可商量，包在你身上绝对有交代。','你记得下包点、守包角和计时，比击杀数更惦记回合。','别把包抱成传家宝；该交给更近的队友就交。','我枪可以空，包不能白下。'],
    'controller-utility-fast': ['三秒封路师','对面刚露头，下一秒就发现路被你改了。','你能迅速用技能切开混乱场面。','封得太漂亮也要记得留队友的路。','这条线我关了，走另一边。'],
    'controller-utility-steady': ['小地图房东','整张地图的视野租约，仿佛都归你管。','你擅长分配技能，把最关键的区域留到最后。','别只盯着地图看，身边的脚步声也得续租。','这片先归我们，慢慢来。'],
    'sentinel-gun-fast': ['回防收租人','听见包点出事，你马上去收迟交的房租。','你敢在回防窗口里主动争取第一枪。','先报自己的位置，免得队友以为你还在另一头看家。','我到了，这一枪先收。'],
    'sentinel-gun-steady': ['架枪定海针','队友打得天翻地覆，你的准星还稳在那条线上。','你能用耐心守住别人容易忽略的角度。','守得再稳，也要看看队友是不是已经在另一边开派对。','这条线我看着，放心。'],
    'sentinel-objective-fast': ['拆包急诊员','听到滴滴声，你的职业病就犯了。','你会迅速判断什么时候该回防、什么时候能拆。','烟里摸包很勇，但队友的掩护比勇更有用。','帮我看一眼，我摸包。'],
    'sentinel-objective-steady': ['守包老干部','不抢镜头，只守到对面没时间。','你很会用站位和时间把优势留到结算。','别把“稳住”说成静音模式；队友也需要你的倒计时。','不用追，守住包就赢。'],
    'sentinel-utility-fast': ['陷阱快递员','刚听见脚步，陷阱已经送货上门。','你能及时改布置，接住对手突然换的路线。','偶尔慢半拍确认安全，别自己先撞进快递柜。','换路了？我的道具也换。'],
    'sentinel-utility-steady': ['绊线物业经理','你不一定看见对面，但对面迟早会看见你的布置。','你擅长让敌人每走一步都多想一下。','同一套摆法用太久，物业就会变成公开地图。','后面我管，前面你们打。']
  };
  const personas = [];
  for (const role of roles) for (const habit of habits) for (const tempo of tempos) {
    const id = `${role.id}-${habit.id}-${tempo.id}`;
    const [name, lead, strength, tease, quote] = profiles[id];
    personas.push({ id, name, lead, strength, tease, quote, role: role.id, habit: habit.id, tempo: tempo.id });
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
