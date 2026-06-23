import { ref, reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { Chat, ChatMessage, ApiConfig, ExtractedInfo } from '../types';

const STORAGE_KEY_CHATS = 'xf_chats';
const STORAGE_KEY_CURRENT = 'xf_cur';
const STORAGE_KEY_MODE = 'xf_mode';
const STORAGE_KEY_CONFIG = 'xf_config';

const PG = `现在是2026年6月，2026年高考已结束，志愿填报正在进行中。你正在帮助2026届考生做志愿填报规划。你是资深高考志愿规划师，风格直爽接地气，像张雪峰一样。

【核心规则】
1. 省份志愿政策感知(2025年起全部新高考)：
   专业+院校(浙江80/山东96/河北96/重庆96/辽宁112)→推荐至少30-50所
   院校+专业组(江苏40/广东45/湖北45/湖南45/福建40/北京30/天津50/上海24/海南24/河南48/四川45/陕西45/山西45/云南40/贵州45/内蒙古45/安徽45/江西45/黑龙江40/吉林40/广西40/甘肃45/新疆45/宁夏45/青海45/西藏45)→推荐填满80%+
2. 冲稳保比例：冲20%稳50%保30%，保底至少3个
3. 用户提供的数据默认准确，不质疑、不反问
4. 数据使用铁律：
   - [真实录取数据]逐条引用标注省份年份位次分数
   - [联网搜索]标注"据网上公开信息，仅供参考"
   - 都没数据的学校，说"暂无该校数据"，禁止编造！
5. 专业过滤：用户说学什么就只推什么，排斥的全部过滤
6. 普通家庭优先技术类。无公检法资源慎选法学
7. 生化环材土木护理等天坑专业主动提醒避开

【回答结构】
第1步:确认省份政策
第2步:冲的学校
第3步:稳的学校
第4步:保的学校
第5步:补充建议

追问规则：回答末尾检查信息是否清楚，从缺失信息里挑1-2个最关键的追问。`;

const PF = `你是张雪峰本人，不是AI。东北口音贼快，一拍桌子就开始说。

风格核心：狂妄自大但不让人讨厌，用段子讲大实话。先笑再怼，怼完给条路。

经典语录随口就来：新闻学？来来来你过来我给你打晕了别报。文科？那不就是服务业嘛，舔。生化环材土木，四大天坑谁学谁后悔。

东北味随口带：那啥、整、可不咋的、唉呀妈呀、我跟你说。不说作为AI、不说建议您、不碰政治红线、不编造具体数据。`;

export function useChat() {
  const chats = reactive<Record<string, Chat>>({});
  const currentId = ref('');
  const mode = ref<'gaokao' | 'fun'>('gaokao');
  const isLoading = ref(false);
  const dbReady = ref(false);
  const config = reactive<ApiConfig>({
    url: 'https://api.deepseek.com',
    key: '',
    model: 'deepseek-chat',
    tavily: ''
  });

  const currentChat = computed(() => {
    if (!currentId.value || !chats[currentId.value]) return null;
    return chats[currentId.value];
  });

  const currentMessages = computed(() => {
    if (!currentChat.value) return [];
    return currentChat.value.messages;
  });

  function loadFromStorage() {
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY_CHATS);
      if (savedChats) Object.assign(chats, JSON.parse(savedChats));
      const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (savedCurrent) currentId.value = savedCurrent;
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as 'gaokao' | 'fun';
      if (savedMode) mode.value = savedMode;
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) Object.assign(config, JSON.parse(savedConfig));
    } catch (e) {
      console.warn('Failed to load from storage:', e);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
      localStorage.setItem(STORAGE_KEY_CURRENT, currentId.value);
      localStorage.setItem(STORAGE_KEY_MODE, mode.value);
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save to storage:', e);
    }
  }

  function createChat() {
    const id = Date.now().toString();
    chats[id] = { id, name: '新对话', mode: mode.value, messages: [] };
    currentId.value = id;
    saveToStorage();
    return id;
  }

  function deleteChat(id: string) {
    delete chats[id];
    if (currentId.value === id) {
      const keys = Object.keys(chats);
      currentId.value = keys.length ? keys[keys.length - 1] : '';
      if (!currentId.value) createChat();
    }
    saveToStorage();
  }

  function switchChat(id: string) {
    currentId.value = id;
    if (chats[id] && chats[id].mode !== mode.value) {
      mode.value = chats[id].mode;
    }
    saveToStorage();
  }

  function setMode(newMode: 'gaokao' | 'fun') {
    mode.value = newMode;
    saveToStorage();
  }

  function setConfig(newConfig: Partial<ApiConfig>) {
    Object.assign(config, newConfig);
    saveToStorage();
  }

  async function checkDb() {
    try {
      dbReady.value = await invoke<boolean>('check_db');
    } catch (e) {
      dbReady.value = false;
    }
  }

  function extractInfo(text: string): ExtractedInfo {
    const info: ExtractedInfo = { province: '', rank: 0, score: 0, majors: [], schools: [], keywords: [] };
    const provinces = ['北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江','江苏','浙江','安徽',
      '福建','江西','山东','河南','湖北','湖南','广东','广西','海南','四川','贵州','云南',
      '西藏','陕西','甘肃','青海','宁夏','新疆','内蒙古'];
    let bestIdx = text.length, bestProv = '';
    for (const prov of provinces) {
      const idx = text.indexOf(prov);
      if (idx >= 0 && idx < bestIdx) { bestIdx = idx; bestProv = prov; }
    }
    info.province = bestProv;

    const rm = text.match(/(\d{4,7})\s*[位名]/) || text.match(/[位名]次?\s*(\d{4,7})/) || text.match(/排[名行]\s*(\d{4,7})/);
    if (rm) info.rank = parseInt(rm[1]) || parseInt(rm[2]) || 0;

    const sm = text.match(/(\d{3})\s*分/) || text.match(/分数\s*(\d{3})/);
    if (sm) info.score = parseInt(sm[1]);

    const majorsList = ['计算机','软件','电气','机械','自动化','土木','临床','口腔','法学','会计','金融','物联网','人工智能','大数据','电子','通信','材料','化工','生物','医学','护理','师范','英语','日语','新闻','设计','美术','音乐','体育','汉语言','思政','马克思','数学','化学','地理','航空航天','能源','交通','环境'];
    const negStr = (text.match(/(?:不学|不接受|不读|不选|别推荐).*?(?:[。，,;\n]|$)/g) || []).join('');
    const found: string[] = [];
    for (const major of majorsList) {
      if (text.indexOf(major) >= 0 && negStr.indexOf(major) < 0) found.push(major);
    }
    if (found.length > 0) info.majors = found;

    const schoolMatch = text.match(/[一-鿿]{2,8}(大学|学院)/);
    if (schoolMatch) info.schools.push(schoolMatch[0]);
    return info;
  }

  async function queryLocalDB(info: ExtractedInfo): Promise<string> {
    if (!info.province || (!info.rank && !info.score)) return '';
    try {
      const j: any = await invoke('recommend', {
        province: info.province,
        keyword: info.majors.join(','),
        rank: info.rank,
        score: info.score,
      });
      if (!j.chong?.length && !j.wen?.length && !j.bao?.length) return '';
      let dbData = `【本地数据库·冲稳保推荐】位次${j.rank}\n`;
      if (j.chong?.length) {
        dbData += '\n▎冲 (录取位次高于你，可以试试):\n';
        j.chong.slice(0, 7).forEach((d: any) => {
          dbData += `· ${d.school} ${d.major} ${d.year}年 最低${d.score || '?'}分 位次${d.rank || '?'}\n`;
        });
      }
      if (j.wen?.length) {
        dbData += '\n▎稳 (位次匹配，有把握):\n';
        j.wen.slice(0, 7).forEach((d: any) => {
          dbData += `· ${d.school} ${d.major} ${d.year}年 最低${d.score || '?'}分 位次${d.rank || '?'}\n`;
        });
      }
      if (j.bao?.length) {
        dbData += '\n▎保 (位次高于要求，稳录):\n';
        j.bao.slice(0, 7).forEach((d: any) => {
          dbData += `· ${d.school} ${d.major} ${d.year}年 最低${d.score || '?'}分 位次${d.rank || '?'}\n`;
        });
      }
      return dbData;
    } catch (e) {
      console.warn('DB查询失败:', e);
      return '';
    }
  }

  async function queryData(text: string): Promise<string> {
    const info = extractInfo(text);

    // AI提取
    if (config.key) {
      try {
        const xp = `从用户的高考咨询消息中提取信息。返回JSON:{"province":"","rank":0,"score":0,"majors":[],"schools":[],"keywords":[]}。只返回JSON。用户消息: ${text}`;
        const r = await fetch(`${config.url.replace(/\/+$/, '')}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
          body: JSON.stringify({ model: config.model || 'deepseek-chat', messages: [{ role: 'user', content: xp }], temperature: 0, max_tokens: 250 })
        });
        if (r.ok) {
          const d = await r.json();
          const raw = d.choices[0].message.content.replace(/```/g, '').replace(/json/g, '').trim();
          const ai = JSON.parse(raw);
          if (ai.province) info.province = ai.province;
          if (ai.rank) info.rank = parseInt(ai.rank);
          if (ai.score) info.score = parseInt(ai.score);
          if (ai.majors?.length) info.majors = ai.majors;
          if (ai.schools?.length) info.schools = ai.schools;
          if (ai.keywords?.length) info.keywords = ai.keywords;
        }
      } catch (e) { console.warn('AI提取失败:', e); }
    }

    // 本地数据库查询（Rust 后端）
    let dbData = '';
    if (dbReady.value) {
      dbData = await queryLocalDB(info);
    }

    // Tavily 联网搜索
    let webData = '';
    if (config.tavily) {
      try {
        const queries: string[] = [];
        if (info.majors.length && info.province) {
          queries.push(`${info.province} 2025年 ${info.majors[0]}专业 录取位次`);
        }
        for (const q of queries.slice(0, 2)) {
          const result: any = await invoke('search_tavily', {
            query: q,
            apiKey: config.tavily,
            maxResults: 3,
          });
          if (result.results?.length) {
            webData += result.results.join('\n') + '\n';
          }
        }
      } catch (e) { console.warn('Tavily搜索失败:', e); }
    }

    let result = `[查询参数] 省份=${info.province} 位次=${info.rank} 分数=${info.score} 专业=${info.majors.join(',')}\n`;
    if (dbData) result += dbData + '\n';
    if (webData) result += `【联网搜索·仅供参考】\n${webData}\n`;
    return result;
  }

  async function sendMessage(content: string) {
    if (!currentId.value || !chats[currentId.value]) createChat();
    const chat = chats[currentId.value];
    chat.messages.push({ role: 'user', content });
    if (chat.name === '新对话') chat.name = content.slice(0, 16);
    saveToStorage();
    isLoading.value = true;

    try {
      const systemPrompt = mode.value === 'fun' ? PF : PG;
      const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

      if (mode.value === 'gaokao') {
        const dataHint = await queryData(content);
        messages.push({ role: 'system', content: `【以下是查询到的真实数据，你必须逐条引用】\n${dataHint}` });
      }

      const info = extractInfo(content);
      if (info.province) {
        const ng: Record<string, number> = { '浙江': 80, '山东': 96, '河北': 96, '重庆': 96, '辽宁': 112 };
        const gg: Record<string, number> = { '江苏': 40, '广东': 45, '湖北': 45, '湖南': 45, '福建': 40, '北京': 30, '天津': 50, '上海': 24, '海南': 24, '河南': 48, '四川': 45, '陕西': 45, '山西': 45, '云南': 40, '贵州': 45, '内蒙古': 45, '安徽': 45, '江西': 45, '黑龙江': 40, '吉林': 40, '广西': 40, '甘肃': 45, '新疆': 45, '宁夏': 45, '青海': 45, '西藏': 45 };
        let pr = '【省份志愿政策提醒】';
        if (ng[info.province]) pr += `${info.province}是专业+院校模式，可填${ng[info.province]}个志愿。推荐至少30-50所！`;
        else if (gg[info.province]) pr += `${info.province}是院校+专业组模式，可填${gg[info.province]}个专业组。推荐填满80%以上！`;
        messages.push({ role: 'system', content: pr });
      }

      for (let i = Math.max(0, chat.messages.length - 25); i < chat.messages.length; i++) {
        messages.push(chat.messages[i]);
      }

      const r = await fetch(`${config.url.replace(/\/+$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
        body: JSON.stringify({ model: config.model || 'deepseek-chat', messages, temperature: 0.7 })
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${r.status}`);
      }
      const d = await r.json();
      chat.messages.push({ role: 'assistant', content: d.choices[0].message.content });
    } catch (e: any) {
      chat.messages.push({ role: 'assistant', content: `出错：${e.message}\n请检查API设置` });
    } finally {
      isLoading.value = false;
      saveToStorage();
    }
  }

  function init() {
    loadFromStorage();
    if (!currentId.value || !chats[currentId.value]) createChat();
    checkDb();
  }

  return {
    chats, currentId, mode, isLoading, dbReady, config,
    currentChat, currentMessages,
    createChat, deleteChat, switchChat, setMode, setConfig,
    sendMessage, init, checkServer: checkDb
  };
}