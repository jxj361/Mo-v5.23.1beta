// ========== core.js — 数据层 ==========

// ---------- 全局变量 ----------
let currentChatId = null;
let currentMomentUserId = 'me';
let globalViewMode='all', userViewMode='all';
let currentQuote = null;
let letterRefreshInterval = null;
let currentDraftId = null;
let selectedCards = new Set();
let letterUndoStack = [], letterRedoStack = [];
let momentsBackToMain = false;
let draftUndoStacks = {};
let draftRedoStacks = {};
let pendingReplies = [];
let autoBackupTimer = null;
let saveReminderTimer = null;
let backupInProgress = false;
let backupLockTimer = null;
let bgUploadTargetId = null;
let selectedBgIndex = -1;
let selectedBgUserId = null;
let toolsBarCollapsed = false;
let toolsRowCollapsed = false;
let toolsBar2Collapsed = true;
let swipeStartX = 0, swipeStartY = 0, swipeItem = null;
let longPressTimer = null;
let saveTimer = null;
let pendingSave = false;
let _pokeTargetId = null;
let _contactBgUserId = null;
let _pokeFromPage = 'chats';
let _momentsFromChat = false;
let _cardsFromPage = 'chats';
let _isVoiceMode = false;
let _momentsFromContactDetail = false;
let _musicFromChat = false;
let musicFloatVisible = false;
let backupFloatVisible = false;
let bookFloatVisible = false;
let movieFloatVisible = false;

let voiceStream = null;
let voiceMediaRecorder = null;
let voiceRecordStartTime = 0;
let voiceRecordTimer = null;
let isRecording = false;
let voiceRecordStartX = 0;
let voiceCancelled = false;
let voiceMoveHandler = null;
let voiceRecordPointerId = null;
let voiceRecordStartPointerX = 0;
let voiceClickRecording = false;

let musicAudio = null;
let musicCurrentPlaylistIndex = 0;
let musicCurrentSongIndex = -1;
let musicMode = 'list';
let musicIsPlaying = false;
let musicFailCount = 0;
let musicAutoSkipPaused = false;
let musicErrorCount = 0;
let musicAdvanceTimer = null;
let currentMusicFloatState = 'ball';
let selectedMusicSongs = new Set();
let currentBookListIndex = 0;
let currentMovieListIndex = 0;
let selectedBooks = new Set();
let selectedMovies = new Set();
let currentVoicePlayingEl = null;
let currentVoiceAudio = null;
let currentVoiceTimer = null;
let currentVoiceDuration = 0;
let currentVoiceElapsed = 0;
let currentCompanionTaskId = null;
let companionTimerInterval = null;
let companionInteractionInterval = null;
let movieTogetherTaskId = null;
let movieTogetherTimerInterval = null;
let movieTogetherInteractionInterval = null;
let companionSlideshowTimer = null;
let backupFloatBall = null, backupFloatPanel = null;
let pageHiddenTimersPaused = false;

// ---------- 常量数据 ----------
const DB_NAME = 'MoDB';
const DB_VERSION = 2;
const STORE_NAME = 'appData';
const MEDIA_STORE = 'mediaStore';
let db = null;

const DEFAULT_EMOJIS = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","😍","🥰","😘","😗","😋","😎","🥳","😔","😭","😤","🤯","😱","🥶","😴","❤️","🔥"];
const SAFE_EMOJIS = DEFAULT_EMOJIS.filter(e => { const chars = Array.from(e); return chars.length === 1 && chars[0].codePointAt(0) !== 0xFE0F && chars[0].codePointAt(0) !== 0x200D; });
const RAW_EMOJI_GROUP = ["✨","🌟","💫","⭐","🌈","☀️","🌤","☁️","🌧","⛈","❄️","💧","💦","🌊","🍎","🍊","🍋","🍉","🍇","🍓","🍒","🍑","🥭","🍍","🥝","🍅","🥑","🥦","🥒","🌶","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🍞","🥖","🧀","🥚","🍳","🥞","🧇","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🥙","🌮","🌯","🥗","🥘","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥤","🧃","🧉","🍵","☕","🍼","🥛","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧊","🍾","🎉","🎊","🎈","🎀","🎁","🎄","🎃","🎅","🤶","🦌","⚡","💥","☄️","🌙","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🎗","🏅","🥇","🥈","🥉","🏆","🎖","🎫","🎟","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟","🎯","🎳","🎮","👾","🕹","💰","💎","💵","💴","💶","💷","💸","🪙","🏧"];
const EMOJI_GROUP = [...DEFAULT_EMOJIS, ...RAW_EMOJI_GROUP.filter(e => { const chars = Array.from(e); return chars.length === 1 && chars[0].codePointAt(0) !== 0xFE0F && chars[0].codePointAt(0) !== 0x200D; })];
const STATUS_LIST = ["在线","忙碌","离开","隐身","生气","开心","工作中","休息","悠闲","思考中","听歌","看书","运动","发呆","害羞","兴奋","失落","焦虑","期待","困了"];
const POKE_PHRASES = ["{from}拍了拍{to}的头","{from}戳了戳{to}","{from}给{to}比了个心","{from}向{to}打了个招呼","{from}摸了摸{to}的脑袋"];
const DEFAULT_CARDS = [
    {name:"肯定/否定",list:["对","不对","要","不要","也许","可能","大概","我不知道","我知道","好","不好","行","不行","可以","不可以","是","不是","有","没有","明白了","没明白","不确定","再说一遍","是的","没错","当然","肯定","绝对","完全正确","错了","不可能"]},
    {name:"情绪感受",list:["开心","不开心","难过","害怕","紧张","焦虑","生气","累了","困了","平静","烦躁"]},
    {name:"动作指令",list:["向左看","向右看","站起来","坐下","别动","过来","往后一点","往前走","闭上眼睛"]},
    {name:"需求请求",list:["我需要休息","我想你陪我一会儿","我需要帮助","我想喝水","我饿了","抱抱我","别走"]},
    {name:"emoji表情",list:EMOJI_GROUP},
    {name:"拍一拍",list:POKE_PHRASES}
];

const BUILTIN_TAROT = [
    {name:"0 愚者", meaning:"新的开始、冒险、天真。逆位：鲁莽、犹豫。"},{name:"I 魔术师", meaning:"创造力、技能、意志。逆位：滥用天赋、缺乏专注。"},
    {name:"II 女祭司", meaning:"直觉、神秘、智慧。逆位：隐藏的知识、沉默。"},{name:"III 女皇", meaning:"丰饶、母性、美丽。逆位：依赖、缺乏自信。"},
    {name:"IV 皇帝", meaning:"权威、权力、领导。逆位：暴政、过度控制。"},{name:"V 教皇", meaning:"传统、指引、精神引导。逆位：非正统、叛逆。"},
    {name:"VI 恋人", meaning:"爱情、和谐、选择。逆位：分手、价值冲突。"},{name:"VII 战车", meaning:"决心、胜利、前进。逆位：失控、挫败。"},
    {name:"VIII 力量", meaning:"勇气、力量、耐心。逆位：软弱、缺乏自信。"},{name:"IX 隐士", meaning:"内省、孤独、寻求真理。逆位：孤立、迷失。"},
    {name:"X 命运之轮", meaning:"转变、命运、轮回。逆位：厄运、抗拒变化。"},{name:"XI 正义", meaning:"公正、真相、法律。逆位：不公、偏见。"},
    {name:"XII 倒吊人", meaning:"牺牲、换个角度看世界。逆位：拖延、无谓的牺牲。"},{name:"XIII 死神", meaning:"结束、转变、重生。逆位：停滞、恐惧改变。"},
    {name:"XIV 节制", meaning:"平衡、调和、中庸。逆位：失衡、过度。"},{name:"XV 恶魔", meaning:"束缚、物质主义、欲望。逆位：摆脱束缚、觉悟。"},
    {name:"XVI 高塔", meaning:"突变、崩溃、启示。逆位：抗拒改变、避免灾难。"},{name:"XVII 星星", meaning:"希望、灵感、宁静。逆位：绝望、缺乏信心。"},
    {name:"XVIII 月亮", meaning:"幻觉、恐惧、潜意识。逆位：揭秘、克服恐惧。"},{name:"XIX 太阳", meaning:"快乐、成功、活力。逆位：暂时的挫折、压抑。"},
    {name:"XX 审判", meaning:"重估、召唤、再生。逆位：逃避审判、拒绝改变。"},{name:"XXI 世界", meaning:"完成、圆满、成就。逆位：未完成、延迟。"},
    {name:"权杖ACE", meaning:"新机遇、成长、行动。逆位：延误、错失良机。"},{name:"权杖二", meaning:"计划、前瞻、决策。逆位：犹豫、规划不足。"},
    {name:"权杖三", meaning:"扩展、探索、远见。逆位：障碍、延迟。"},{name:"权杖四", meaning:"庆祝、和谐、家园。逆位：家庭矛盾、不稳定。"},
    {name:"权杖五", meaning:"冲突、竞争、挑战。逆位：避免冲突、内部矛盾。"},{name:"权杖六", meaning:"胜利、认可、进步。逆位：骄傲、失败。"},
    {name:"权杖七", meaning:"坚持、防御、优势。逆位：放弃、被动。"},{name:"权杖八", meaning:"迅速行动、消息、进展。逆位：延迟、受阻。"},
    {name:"权杖九", meaning:"警惕、韧性、最后的考验。逆位：疲惫、放弃。"},{name:"权杖十", meaning:"负担、责任、压力。逆位：卸下重担、逃避。"},
    {name:"权杖侍从", meaning:"自由、冒险、新消息。逆位：犹豫、坏消息。"},{name:"权杖骑士", meaning:"冲动、旅行、追求。逆位：鲁莽、延迟。"},
    {name:"权杖皇后", meaning:"温暖、独立、魅力。逆位：缺乏自信、善妒。"},{name:"权杖国王", meaning:"领导、创业、慷慨。逆位：暴君、不宽容。"},
    {name:"圣杯ACE", meaning:"爱、喜悦、新感情。逆位：空虚、失恋。"},{name:"圣杯二", meaning:"结合、伙伴、合作。逆位：分离、不平衡。"},
    {name:"圣杯三", meaning:"庆祝、友谊、欢聚。逆位：过度放纵、独处。"},{name:"圣杯四", meaning:"冥想、不满、新机会忽视。逆位：觉醒、抓住机会。"},
    {name:"圣杯五", meaning:"悲伤、失落、遗憾。逆位：接受、恢复。"},{name:"圣杯六", meaning:"回忆、怀旧、童年。逆位：未来、摆脱过去。"},
    {name:"圣杯七", meaning:"幻想、选择、白日梦。逆位：目标明确、现实。"},{name:"圣杯八", meaning:"离去、寻求更高意义。逆位：回归、停止探索。"},
    {name:"圣杯九", meaning:"愿望实现、满足、享乐。逆位：贪婪、不满。"},{name:"圣杯十", meaning:"家庭幸福、圆满、稳定。逆位：破裂、失去。"},
    {name:"圣杯侍从", meaning:"直觉、好奇、学生。逆位：情感不成熟、欺骗。"},{name:"圣杯骑士", meaning:"浪漫、魅力、邀请。逆位：情绪化、不忠。"},
    {name:"圣杯皇后", meaning:"同情、温柔、疗愈。逆位：依赖、脆弱。"},{name:"圣杯国王", meaning:"仁爱、智慧、平衡情绪。逆位：操纵、虚伪。"},
    {name:"宝剑ACE", meaning:"清晰、胜利、新思想。逆位：混乱、失败。"},{name:"宝剑二", meaning:"逃避、僵持、抉择。逆位：打破僵局、释放。"},
    {name:"宝剑三", meaning:"心痛、分离、悲伤。逆位：恢复、释怀。"},{name:"宝剑四", meaning:"休息、冥想、休整。逆位：无法休息、焦虑。"},
    {name:"宝剑五", meaning:"失败、冲突、背叛。逆位：和解、反思。"},{name:"宝剑六", meaning:"过渡、疗伤、前行。逆位：停滞、拒绝离开。"},
    {name:"宝剑七", meaning:"策略、偷窃、诡计。逆位：承认错误、归还。"},{name:"宝剑八", meaning:"束缚、限制、困境。逆位：自由、解脱。"},
    {name:"宝剑九", meaning:"噩梦、焦虑、恐惧。逆位：希望、缓解。"},{name:"宝剑十", meaning:"结局、崩溃、最低点。逆位：重生、转机。"},
    {name:"宝剑侍从", meaning:"警惕、观察、消息。逆位：不成熟、轻率。"},{name:"宝剑骑士", meaning:"冲动、行动、力量。逆位：鲁莽、错误。"},
    {name:"宝剑皇后", meaning:"独立、理性、界限。逆位：孤独、苛刻。"},{name:"宝剑国王", meaning:"权威、公正、逻辑。逆位：专制、无情。"},
    {name:"星币ACE", meaning:"财富、新机会、繁荣。逆位：错失、贪婪。"},{name:"星币二", meaning:"平衡、适应、多变。逆位：混乱、失衡。"},
    {name:"星币三", meaning:"团队合作、技能、工艺。逆位：不协作、低质量。"},{name:"星币四", meaning:"节俭、安全、掌控。逆位：吝啬、失去。"},
    {name:"星币五", meaning:"贫困、失落、孤立。逆位：重建、找到出路。"},{name:"星币六", meaning:"给予、接受、慷慨。逆位：自私、债务。"},
    {name:"星币七", meaning:"评估、耐心、等待成长。逆位：焦虑、无果。"},{name:"星币八", meaning:"勤奋、技能、专注。逆位：懒散、重复。"},
    {name:"星币九", meaning:"自足、优雅、独立。逆位：失落、依赖。"},{name:"星币十", meaning:"遗产、家族、长久。逆位：家庭问题、损失。"},
    {name:"星币侍从", meaning:"务实、学习、新任务。逆位：叛逆、无计划。"},{name:"星币骑士", meaning:"勤奋、可靠、稳定。逆位：懒惰、停滞。"},
    {name:"星币皇后", meaning:"滋养、实用、舒适。逆位：忽视、物质主义。"},{name:"星币国王", meaning:"财富、领导、稳定。逆位：贪婪、腐败。"}
];
const BUILTIN_LENORMAND = [
    {name:"1 骑士", meaning:"消息、运动、速度"},{name:"2 三叶草", meaning:"幸运、小机会、希望"},{name:"3 船", meaning:"旅行、距离、探索"},
    {name:"4 房子", meaning:"家庭、安全、稳定"},{name:"5 树", meaning:"健康、成长、根源"},{name:"6 云", meaning:"困惑、不确定性、隐藏"},
    {name:"7 蛇", meaning:"欺骗、复杂、智慧"},{name:"8 棺材", meaning:"结束、转变、停滞"},{name:"9 花束", meaning:"礼物、赞美、愉悦"},
    {name:"10 镰刀", meaning:"切断、突然、危险"},{name:"11 鞭子", meaning:"冲突、重复、痛苦"},{name:"12 鸟", meaning:"沟通、对话、紧张"},
    {name:"13 小孩", meaning:"新开始、天真、小人物"},{name:"14 狐狸", meaning:"狡猾、警惕、生存"},{name:"15 熊", meaning:"力量、权威、母亲"},
    {name:"16 星星", meaning:"希望、指引、灵感"},{name:"17 鹳", meaning:"变化、迁移、新阶段"},{name:"18 狗", meaning:"朋友、忠诚、信任"},
    {name:"19 塔", meaning:"权威、孤独、机构"},{name:"20 花园", meaning:"社交、公众、聚会"},{name:"21 山", meaning:"障碍、挑战、延迟"},
    {name:"22 十字路口", meaning:"选择、决定、多条路"},{name:"23 老鼠", meaning:"损失、侵蚀、小偷"},{name:"24 心", meaning:"爱、感情、和谐"},
    {name:"25 戒指", meaning:"承诺、婚姻、循环"},{name:"26 书", meaning:"知识、秘密、学习"},{name:"27 信", meaning:"消息、文件、通信"},
    {name:"28 男人", meaning:"男性、询问者"},{name:"29 女人", meaning:"女性、询问者"},{name:"30 百合", meaning:"和平、纯洁、智慧"},
    {name:"31 太阳", meaning:"成功、快乐、能量"},{name:"32 月亮", meaning:"潜意识、声誉、创造力"},{name:"33 钥匙", meaning:"打开、答案、重要"},
    {name:"34 鱼", meaning:"财富、商业、流动"},{name:"35 锚", meaning:"稳定、安全、坚持"},{name:"36 十字架", meaning:"命运、负担、考验"}
];

let appData = {
    globalCardGroups: JSON.parse(JSON.stringify(DEFAULT_CARDS)),
    globalRule: { min:30, max:60, cntMin:3, cntMax:5, combineMin: 1, combineMax: 3 },
    myProfile: { id:'me', name:'我', avt:'', signature:'', status:'在线', bg:'' },
    users: [], groups: [], userEmo: {}, userImages: {}, globalEmojis: [], msg: {}, moments: {},
    letters: {}, letterDrafts: {}, momentsBg: '', hiddenGlobalEmojis: {},
    userDailyCommentCount: {}, disabledGlobalCards: [], disabledUserCards: {},
    quoteHistory: {}, blockedKeywords: [], userBgs: {}, momentsBgs: {}, lastUserMsgTime: {},
    userSoundSettings: {}, autoBackupEnabled: true, autoBackupIntervalSecs: 60, soundVolume: 0.5,
    dataChanged: false, lastBackupTime: 0, hiddenChats: [],
    musicPlaylists: [{ name: "默认歌单", songs: [] }],
    bookLists: [{ name: "默认书单", books: [] }],
    movieLists: [{ name: "默认电影列表", movies: [] }],
    companionTasks: [],
    tarotCards: { tarot: [...BUILTIN_TAROT], lenormand: [...BUILTIN_LENORMAND] },
    unreadBadgeSettings: {},
    globalUnreadBadgeEnabled: true,
    limitEmojiPerMsg: false,
    companionImmersiveMode: false,
    sleepSounds: [],
    dailyCallCount: 0,
    dailyCallCountDate: ''
};

// ---------- IndexedDB 操作 ----------
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = () => reject(request.error);
    });
}
async function saveToDB(dataObj) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(dataObj);
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}
async function deleteDBKey(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}
async function loadFromDB(id = 'appData') {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = reject;
    });
}
async function saveMedia(id, base64) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        store.put({ id, data: base64 });
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}
async function loadMedia(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const store = tx.objectStore(MEDIA_STORE);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = reject;
    });
}
async function deleteMedia(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        store.delete(id);
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}

// ---------- 工具函数 ----------
function escapeHtml(s) { return String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function sanitizeText(text, keepNewlines = false) {
    if (typeof text !== 'string') return text;
    if (keepNewlines) {
        return text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
    } else {
        return text.replace(/[\x00-\x1F\x7F\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
    }
}
function isEmoji(str) {
    if (!str || typeof str !== 'string') return false;
    const emojiRegex = /^[\p{Emoji}\u200D\uFE0F]+$/u;
    return emojiRegex.test(str.trim());
}
function uniqueArr(arr) { return [...new Set(arr.filter(x => typeof x === 'string' && x.trim()))]; }
function deepCleanCardText(text) {
    if (typeof text !== 'string') return '';
    text = text.replace(/[\x00-\x1F\x7F\u200B-\u200D\uFEFF\u00AD]/g, '');
    return text.trim();
}
function deepCleanAllCards() {
    const cleanGroup = (groups) => {
        groups.forEach(g => {
            g.list = g.list.map(c => deepCleanCardText(c)).filter(c => c.length > 0);
        });
    };
    cleanGroup(appData.globalCardGroups);
    appData.users.forEach(u => cleanGroup(u.cardGroups));
    appData.disabledGlobalCards = appData.disabledGlobalCards.map(c => deepCleanCardText(c)).filter(c => c.length > 0);
    Object.keys(appData.disabledUserCards).forEach(uid => {
        appData.disabledUserCards[uid] = appData.disabledUserCards[uid].map(c => deepCleanCardText(c)).filter(c => c.length > 0);
    });
}

function getContact(id) {
    return id === 'me' ? appData.myProfile : (appData.users.find(u => u.id === id) || appData.groups.find(g => g.id === id));
}
function getCardPool(chatId, isGroup = false, excludePoke = false) {
    let globalPool = appData.globalCardGroups.filter(g => !excludePoke || g.name !== '拍一拍').flatMap(g => g.list).filter(c => !appData.disabledGlobalCards.includes(c));
    if (isGroup) return globalPool;
    const t = getContact(chatId);
    let p = t?.cardGroups ? t.cardGroups.filter(g => !excludePoke || g.name !== '拍一拍').flatMap(g => g.list) : [];
    const disabledUser = appData.disabledUserCards[chatId] || [];
    return [...new Set([...globalPool, ...p.filter(c => !disabledUser.includes(c))])];
}
function getAllUserEmojis(chatId = null) {
    if (chatId && getContact(chatId)?.members) return [...new Set([...appData.globalEmojis])];
    return [...new Set([...appData.globalEmojis, ...Object.values(appData.userEmo).flat()])];
}
function getGroupEmojiPool() { return [...appData.globalEmojis]; }

function toast(msg, dur = 2000, clickable = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    t.style.pointerEvents = clickable ? 'auto' : 'none';
    clearTimeout(t._tt);
    t._tt = setTimeout(() => {
        t.classList.remove('show');
        t.style.pointerEvents = 'none';
    }, dur);
}

function showConfirm(msg, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '280px';
    const body = document.createElement('div');
    body.className = 'pop-body';
    body.style.textAlign = 'center';
    body.textContent = msg;
    const footer = document.createElement('div');
    footer.className = 'pop-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => overlay.remove();
    const okBtn = document.createElement('button');
    okBtn.className = 'btn-primary';
    okBtn.textContent = '确定';
    okBtn.onclick = () => { overlay.remove(); onOk(); };
    footer.appendChild(cancelBtn);
    footer.appendChild(okBtn);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showInputDialog(title, placeholder, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '300px';
    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = title;
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'pop-body';
    const textarea = document.createElement('textarea');
    textarea.id = 'inputDialogField';
    textarea.placeholder = placeholder || '';
    textarea.style.cssText = 'width:100%;border-radius:14px;border:1px solid var(--border-light);padding:8px;height:100px;';
    body.appendChild(textarea);
    card.appendChild(body);
    const footer = document.createElement('div');
    footer.className = 'pop-footer';
    const okBtn = document.createElement('button');
    okBtn.className = 'btn-primary';
    okBtn.textContent = '确定';
    okBtn.onclick = () => {
        const val = sanitizeText(textarea.value.trim());
        overlay.remove();
        callback(val);
    };
    footer.appendChild(okBtn);
    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showInputDialogRaw(title, placeholder, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '300px';
    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = title;
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'pop-body';
    const textarea = document.createElement('textarea');
    textarea.id = 'inputDialogField';
    textarea.placeholder = placeholder || '';
    textarea.style.cssText = 'width:100%;border-radius:14px;border:1px solid var(--border-light);padding:8px;height:100px;';
    body.appendChild(textarea);
    card.appendChild(body);
    const footer = document.createElement('div');
    footer.className = 'pop-footer';
    const okBtn = document.createElement('button');
    okBtn.className = 'btn-primary';
    okBtn.textContent = '确定';
    okBtn.onclick = () => {
        const val = textarea.value.trim();
        overlay.remove();
        callback(val);
    };
    footer.appendChild(okBtn);
    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showInputDialogPrefilled(title, prefilledValue, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '300px';
    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = title;
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'pop-body';
    const textarea = document.createElement('textarea');
    textarea.id = 'inputDialogField';
    textarea.style.cssText = 'width:100%;border-radius:14px;border:1px solid var(--border-light);padding:8px;height:100px;';
    textarea.value = prefilledValue || '';
    body.appendChild(textarea);
    card.appendChild(body);
    const footer = document.createElement('div');
    footer.className = 'pop-footer';
    const okBtn = document.createElement('button');
    okBtn.className = 'btn-primary';
    okBtn.textContent = '确定';
    okBtn.onclick = () => {
        const val = textarea.value.trim();
        overlay.remove();
        callback(val);
    };
    footer.appendChild(okBtn);
    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

window.showConfirm = showConfirm;
window.showInputDialog = showInputDialog;

function getIconSVG(name) {
    const icons = {
        'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        'sun': '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
        'edit-3': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
        'circle': '<circle cx="12" cy="12" r="10"/>',
        'image': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
        'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
        'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
        'slash': '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
        'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
        'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        'bell': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
        'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
        'palette': '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2 2 0 0 0 2-2c0-.52-.2-1-.53-1.36a1.8 1.8 0 0 1-.47-1.24c0-.77.63-1.4 1.4-1.4H16c3.31 0 6-2.69 6-6 0-4.41-3.59-8-10-8z"/>',
        'droplet': '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
        'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
        'archive': '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
        'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
        'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'pause-circle': '<circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/>',
        'play-circle': '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
        'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        'user': '<circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/>',
        'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
        'bell-off': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/>',
        'phone-off': '<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="1" y1="1" x2="23" y2="23"/>',
        'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
        'type': '<rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="none"/><text x="12" y="17" text-anchor="middle" font-size="9" font-family="sans-serif" stroke="none" fill="currentColor">abc</text>',
        'mic': '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
        'undo': '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
        'redo': '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>',
        'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
        'skip-back': '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
        'play': '<polygon points="5 3 19 12 5 21 5 3"/>',
        'pause': '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
        'skip-forward': '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
        'repeat': '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
        'repeat-1': '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M11 13v4h2"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
        'shuffle': '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
        'share-2': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
        'move': '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 15 22 12 19 9"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
        'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        'more-vertical': '<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>',
        'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'hand': '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 11V4a2 2 0 0 0-4 0v7"/><path d="M10 11V8a2 2 0 0 0-4 0v4"/><path d="M6 13V6a4 4 0 0 1 8 0v5"/><path d="M18 11a4 4 0 0 0-8 0v1h8z"/><path d="M6 13v3a6 6 0 0 0 12 0v-3"/>',
        'video': '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
        'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        'mail': '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        'film': '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>',
        'minus': '<line x1="5" y1="12" x2="19" y2="12"/>',
        'copy': '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        'folder-plus': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
        'stop-circle': '<circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/>',
        'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'unlock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
        'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        'check': '<polyline points="20 6 9 17 4 12"/>',
        'grid': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>',
        'heart': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    };
    return icons[name] || '';
}

function processImage(file, maxW = 400, quality = 0.95) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    let ratio = Math.min(maxW / w, maxW / h, 1);
                    if (w * h * ratio * ratio > 4000000) {
                        ratio = Math.min(ratio, Math.sqrt(4000000 / (w * h)));
                    }
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } catch (err) { reject(err); }
            };
            img.onerror = () => reject(new Error('图片不兼容'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

async function compressImageForBackup(b64, maxW = 200) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let w = img.width, h = img.height;
            const ratio = Math.min(maxW / w, maxW / h, 1);
            canvas.width = Math.round(w * ratio);
            canvas.height = Math.round(h * ratio);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(b64);
        img.src = b64;
    });
}

function dataUrlToUint8Array(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const match = /^data:([^,]+),([\s\S]*)$/.exec(dataUrl);
    if (!match) return null;
    const header = match[1];
    const body = match[2].replace(/\s/g, '');
    const isBase64 = /;base64/i.test(header);
    if (isBase64) {
        try {
            const raw = atob(body);
            const len = raw.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = raw.charCodeAt(i);
            return bytes;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ---------- 数据持久化 ----------
function markDataChanged() { appData.dataChanged = true; pendingSave = true; }

function save() {
    markDataChanged();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        if (!pendingSave) return;
        const { msg, ...coreData } = appData;
        try { saveToDB({ id: 'appData_core', data: coreData }); } catch (e) {}
        try { saveToDB({ id: 'appData_msg', data: msg }); } catch (e) {}
        try {
            const json = JSON.stringify(appData);
            if (json.length < 5 * 1024 * 1024) {
                localStorage.setItem('Mo_chat_final_v9', json);
            }
        } catch (e) {}
        pendingSave = false;
    }, 300);
}

window.addEventListener('beforeunload', (e) => {
    clearTimeout(saveTimer);
    try { localStorage.setItem('Mo_chat_final_v9', JSON.stringify(appData)); } catch (ex) {}
    try { saveToDB(appData); } catch (ex) {}
    e.preventDefault();
    e.returnValue = '确定离开吗？';
    return e.returnValue;
});

async function load() {
    // ========== 第一步：自动迁移旧数据（jxjDB → MoDB + localStorage）==========
    const MIGRATION_FLAG = 'Mo_data_migrated';
    const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG);

    if (!alreadyMigrated) {
        // IndexedDB 迁移（旧库 → 新库）
        try {
            await migrateIndexedDB();
        } catch (e) {
            console.warn('IndexedDB 迁移失败，将跳过', e);
        }
        // localStorage 键名迁移
        migrateLocalStorageKeys();
        // 打上标记，下次不再迁移
        try { localStorage.setItem(MIGRATION_FLAG, '1'); } catch (e) {}
    }

    // ========== 第二步：正常加载数据 ==========
    let coreData = null, msgData = null;
    try {
        const [core, msg] = await Promise.all([
            loadFromDB('appData_core'),
            loadFromDB('appData_msg')
        ]);
        coreData = core;
        msgData = msg;
    } catch (e) {}

    // 兼容旧版数据结构：如果 appData_core 为空但存在旧的 appData 键
    if (!coreData) {
        try {
            const oldData = await loadFromDB('appData');
            if (oldData) {
                const { msg, ...rest } = oldData;
                coreData = rest;
                msgData = msg;
                try { await saveToDB({ id: 'appData_core', data: coreData }); } catch (e) {}
                try { await saveToDB({ id: 'appData_msg', data: msgData }); } catch (e) {}
                try { await deleteDBKey('appData'); } catch (e) {}
            }
        } catch (e) {}
    }

    if (coreData) {
        appData = { ...appData, ...coreData };
    }
    if (msgData) {
        appData.msg = msgData;
    }

    // localStorage 兜底（仅在 IndexedDB 无数据时使用）
    if (!coreData) {
        const raw = localStorage.getItem('Mo_chat_final_v9');
        if (raw) {
            try {
                const d = JSON.parse(raw);
                if (d.globalCardGroups && d.globalCardGroups.length > 0) {
                    const { msg, ...rest } = d;
                    appData = { ...appData, ...rest, msg: msg || {} };
                }
            } catch (e) {}
        }
    }

    // ========== 第三步：初始化 / 补全缺失字段 ==========
    appData.globalCardGroups = appData.globalCardGroups || JSON.parse(JSON.stringify(DEFAULT_CARDS));
    if (!appData.globalCardGroups.some(g => g.name === '未分组')) appData.globalCardGroups.push({ name: '未分组', list: [] });
    if (!appData.globalCardGroups.some(g => g.name === 'emoji表情')) appData.globalCardGroups.push({ name: 'emoji表情', list: EMOJI_GROUP });
    if (!appData.globalCardGroups.some(g => g.name === '拍一拍')) appData.globalCardGroups.push({ name: '拍一拍', list: POKE_PHRASES });
    appData.myProfile = appData.myProfile || { id: 'me', name: '我', avt: '', signature: '', status: '在线', bg: '' };
    appData.users.forEach(u => {
        u.cardGroups = u.cardGroups || [{ name: '未分组', list: [] }];
        u.rule = u.rule || { min: 30, max: 60, cntMin: 3, cntMax: 5 };
        u.bg = u.bg || '';
        u.noReply = !!u.noReply;
        u.noDisturb = u.noDisturb !== undefined ? u.noDisturb : true;
        u.replyTime = u.replyTime || 86400;
        u.allowInitiative = u.allowInitiative !== undefined ? u.allowInitiative : true;
        u.soundEnabled = u.soundEnabled !== undefined ? u.soundEnabled : true;
        u.hideReplyIndicator = u.hideReplyIndicator !== undefined ? u.hideReplyIndicator : false;
        if (!u.status || !STATUS_LIST.includes(u.status)) u.status = STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)];
        u.muted = u.muted !== undefined ? u.muted : false;
        if (u.combineCount !== undefined) {
            u.combineMin = u.combineMin || 1;
            u.combineMax = u.combineMax || u.combineCount;
            delete u.combineCount;
        }
        if (u.combineMin === undefined) u.combineMin = 0;
        if (u.combineMax === undefined) u.combineMax = 0;
    });
    appData.groups.forEach(g => {
        g.rule = g.rule || { min: 30, max: 60, cntMin: 3, cntMax: 5 };
        g.noReply = !!g.noReply;
        g.noDisturb = g.noDisturb !== undefined ? g.noDisturb : true;
        g.announcement = g.announcement || '';
        g.mutedAll = g.mutedAll !== undefined ? g.mutedAll : false;
        g.mutedMembers = g.mutedMembers || {};
    });
    if (!appData.moments || Array.isArray(appData.moments)) appData.moments = {};
    if (!appData.globalEmojis) appData.globalEmojis = [];
    if (!appData.userEmo) appData.userEmo = {};
    if (!appData.userImages) appData.userImages = {};
    if (!appData.letters) appData.letters = {};
    if (!appData.letterDrafts) appData.letterDrafts = {};
    if (!appData.hiddenGlobalEmojis) appData.hiddenGlobalEmojis = {};
    if (!appData.userDailyCommentCount) appData.userDailyCommentCount = {};
    if (!appData.lastStatusChangeTime) appData.lastStatusChangeTime = {};
    if (!appData.dailyReset) appData.dailyReset = '';
    if (!appData.disabledGlobalCards) appData.disabledGlobalCards = [];
    if (!appData.disabledUserCards) appData.disabledUserCards = {};
    if (!appData.quoteHistory) appData.quoteHistory = {};
    if (!appData.momentsBg) appData.momentsBg = '';
    if (!appData.blockedKeywords) appData.blockedKeywords = [];
    if (!appData.userBgs) appData.userBgs = {};
    if (!appData.momentsBgs) appData.momentsBgs = {};
    if (!appData.lastUserMsgTime) appData.lastUserMsgTime = {};
    if (!appData.userSoundSettings) appData.userSoundSettings = {};
    if (appData.autoBackupEnabled === undefined) appData.autoBackupEnabled = true;
    if (!appData.autoBackupIntervalSecs) appData.autoBackupIntervalSecs = 60;
    if (appData.soundVolume === undefined) appData.soundVolume = 0.5;
    if (appData.dataChanged === undefined) appData.dataChanged = false;
    if (!appData.lastBackupTime) appData.lastBackupTime = 0;
    if (!appData.hiddenChats) appData.hiddenChats = [];
    if (!appData.musicPlaylists || !Array.isArray(appData.musicPlaylists)) appData.musicPlaylists = [{ name: "默认歌单", songs: [] }];
    if (!appData.bookLists || !Array.isArray(appData.bookLists)) appData.bookLists = [{ name: "默认书单", books: [] }];
    if (!appData.movieLists || !Array.isArray(appData.movieLists)) appData.movieLists = [{ name: "默认电影列表", movies: [] }];
    if (!appData.companionTasks) appData.companionTasks = [];
    if (!appData.tarotCards) appData.tarotCards = { tarot: [...BUILTIN_TAROT], lenormand: [...BUILTIN_LENORMAND] };
    if (!appData.userVoices) appData.userVoices = {};
    if (!appData.unreadBadgeSettings) appData.unreadBadgeSettings = {};
    if (appData.globalRule.combineCount !== undefined) {
        if (!appData.globalRule.combineMin) appData.globalRule.combineMin = 1;
        if (!appData.globalRule.combineMax) appData.globalRule.combineMax = appData.globalRule.combineCount;
        delete appData.globalRule.combineCount;
    }
    if (!appData.globalRule.combineMin) appData.globalRule.combineMin = 1;
    if (!appData.globalRule.combineMax) appData.globalRule.combineMax = 3;
    if (!appData.companionBgs) appData.companionBgs = {};
    if (appData.companionBgSlideshow === undefined) appData.companionBgSlideshow = false;
    if (!appData.companionBgSlideshowInterval) appData.companionBgSlideshowInterval = 30;
    for (const uid in appData.letters) {
        (appData.letters[uid] || []).forEach(l => {
            if (l.from !== 'me' && l.read === undefined) l.read = false;
            if (!l.cid) l.cid = 'L' + Date.now() + Math.random().toString(36).substr(2, 6);
        });
    }
    const now = Date.now();
    for (const sender in appData.quoteHistory) {
        for (const msgTime in appData.quoteHistory[sender]) {
            if (now - new Date(msgTime).getTime() > 24 * 3600000) delete appData.quoteHistory[sender][msgTime];
        }
        if (Object.keys(appData.quoteHistory[sender]).length === 0) delete appData.quoteHistory[sender];
    }
    deepCleanAllCards();
    syncMyNicknameGlobally();
    const todayStr = new Date().toDateString();
    if (appData.dailyCallCountDate !== todayStr) {
        appData.dailyCallCount = 0;
        appData.dailyCallCountDate = todayStr;
    }
    appData.dataChanged = false;
    appData.lastBackupTime = Date.now();
    // 注意：旧的 localStorage 迁移代码已删除，已统一到 migrateLocalStorageKeys 中
}

// ========== 数据迁移辅助函数 ==========

/**
 * 迁移 IndexedDB：从旧数据库 jxjDB 复制所有 objectStore 到新数据库 MoDB
 * 仅在 MoDB 尚无核心数据时执行
 */
async function migrateIndexedDB() {
    // 先检查新数据库是否已有数据，有则跳过
    const existing = await loadFromDB('appData_core');
    if (existing) return;

    // 尝试打开旧数据库
    const oldDB = await new Promise((resolve, reject) => {
        const req = indexedDB.open('jxjDB');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('blocked'));
    });

    const storeNames = Array.from(oldDB.objectStoreNames);
    if (storeNames.length === 0) {
        oldDB.close();
        return;
    }

    // 复制所有 objectStore 的数据
    for (const storeName of storeNames) {
        const data = await new Promise((resolve) => {
            const tx = oldDB.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const allReq = store.getAll();
            allReq.onsuccess = () => resolve(allReq.result);
            allReq.onerror = () => resolve([]);
        });

        if (data && data.length > 0) {
            // 写入新数据库
            if (!db) await openDB();
            const tx = db.transaction(storeName, 'readwrite');
            const newStore = tx.objectStore(storeName);
            for (const item of data) {
                newStore.put(item);
            }
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        }
    }

    oldDB.close();
}

/**
 * 迁移 localStorage 键名：jxj_ → Mo_
 * 仅在目标键不存在或为空时复制
 */
function migrateLocalStorageKeys() {
    const mappings = [
        { old: 'jxj_theme_backup', new: 'Mo_theme_backup' },
        { old: 'jxj_chat_final_v9', new: 'Mo_chat_final_v9' }
        // 如果有其他旧键，在这里追加
    ];

    for (const { old, new: newKey } of mappings) {
        const oldVal = localStorage.getItem(old);
        if (oldVal) {
            const newVal = localStorage.getItem(newKey);
            if (!newVal) {
                try { localStorage.setItem(newKey, oldVal); } catch (e) {}
            }
        }
    }
}

// ---------- 字卡与屏蔽词 ----------
const META_WORDS = new Set(['replies','groups','true','false','exportDate','modules','customReplies','customReplyGroups','_groupExport','_groupExportType','id','color','disabled','_collapsed','items','cardGroups','globalCardGroups','phrases','cards','[',']','"','{','}']);

function parseFileContent(c, f) {
    let result = { cards: [], groups: [] };
    const isValidCard = (x) => {
        if (typeof x !== 'string') return false;
        const trimmed = x.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:audio/')) return false;
        if (META_WORDS.has(trimmed.toLowerCase())) return false;
        return true;
    };
    if (f && f.endsWith('.json')) {
        try {
            const o = JSON.parse(c);
            if (o && typeof o === 'object' && !Array.isArray(o)) {
                if (o.customReplyGroups && Array.isArray(o.customReplyGroups)) {
                    const groups = [];
                    o.customReplyGroups.forEach(g => {
                        if (g.name && g.items && Array.isArray(g.items)) {
                            const items = g.items.filter(isValidCard).map(x => x.trim());
                            if (items.length > 0) groups.push({ name: g.name.trim(), list: items });
                        }
                    });
                    if (groups.length > 0) return { cards: [], groups, isMilk: true, totalItems: groups.reduce((s, g) => s + g.list.length, 0) };
                }
                if (o.customReplies && Array.isArray(o.customReplies) && o.customReplies.length > 0) {
                    const cards = o.customReplies.filter(isValidCard).map(x => x.trim());
                    if (cards.length > 0) return { cards, groups: [], isMilk: true, totalItems: cards.length };
                }
                let cards = [], groups = [];
                if (o.cardGroups) { o.cardGroups.forEach(g => { if (g.name && g.list) groups.push({ name: g.name.trim(), list: g.list.filter(isValidCard).map(x => x.trim()) }); }); }
                if (o.globalCardGroups) { o.globalCardGroups.forEach(g => { if (g.name && g.list) groups.push({ name: g.name.trim(), list: g.list.filter(isValidCard).map(x => x.trim()) }); }); }
                if (o.cards) cards = o.cards.filter(isValidCard).map(x => x.trim());
                if (o.phrases) cards = [...cards, ...o.phrases.filter(isValidCard).map(x => x.trim())];
                Object.keys(o).forEach(key => {
                    if (key.startsWith('_') || META_WORDS.has(key)) return;
                    const val = o[key];
                    if (Array.isArray(val)) {
                        val.forEach(item => {
                            if (typeof item === 'string' && item.trim().length > 1 && !/^\d{4}-\d{2}-\d{2}/.test(item) && isValidCard(item))
                                cards.push(item.trim());
                        });
                    }
                });
                cards = uniqueArr(cards);
                if (groups.length > 0 || cards.length > 0) return { cards, groups, totalItems: cards.length + groups.reduce((s, g) => s + g.list.length, 0) };
            } else if (Array.isArray(o)) {
                const cards = o.filter(isValidCard).map(x => x.trim());
                if (cards.length > 0) return { cards, groups: [], totalItems: cards.length };
            }
        } catch (e) { return { cards: [], groups: [], parseError: true }; }
    } else {
        const cards = c.split(/[\r\n]+/)
            .map(line => sanitizeText(line, true))
            .filter(Boolean)
            .filter(line => !META_WORDS.has(line.toLowerCase()))
            .filter(line => !line.startsWith('data:image/') && !line.startsWith('data:audio/'));
        return { cards: uniqueArr(cards), groups: [], totalItems: uniqueArr(cards).length };
    }
    return { cards: [], groups: [], noValidData: true };
}

function importCardsToGlobal(lines, targetGroupName = '未分组', silence = false) {
    const existingSet = new Set(appData.globalCardGroups.flatMap(g => g.list));
    const blocked = [], duplicates = [], fresh = [];
    lines.forEach(line => {
        line = String(line).trim();
        if (line.startsWith('data:image/') || line.startsWith('data:audio/')) return;
        if (!line || META_WORDS.has(line.toLowerCase()) || line.length < 2) return;
        if (isBlocked(line)) { blocked.push(line); if (!appData.disabledGlobalCards.includes(line)) appData.disabledGlobalCards.push(line); return; }
        if (existingSet.has(line)) { duplicates.push(line); } else { fresh.push(line); }
    });
    if (fresh.length > 0) {
        let tg = appData.globalCardGroups.find(g => g.name === targetGroupName);
        if (!tg) { tg = { name: targetGroupName, list: [] }; appData.globalCardGroups.push(tg); }
        tg.list = uniqueArr([...tg.list, ...fresh]);
    }
    markDataChanged(); save();
    if (!silence) {
        let msg = `导入 ${fresh.length} 条到${targetGroupName}`;
        if (blocked.length) msg += `，屏蔽 ${blocked.length} 条`;
        if (duplicates.length) msg += `，跳过 ${duplicates.length} 条重复`;
        toast(msg);
    }
    return { fresh: fresh.length, blocked: blocked.length, duplicates: duplicates.length };
}

function importUserCards(user, lines, targetGroupName = '未分组', silence = false) {
    const globalSet = new Set(appData.globalCardGroups.flatMap(g => g.list));
    const userSet = new Set(user.cardGroups.flatMap(g => g.list));
    const blocked = [], skipGlobal = [], skipSelf = [], fresh = [];
    lines.forEach(line => {
        line = String(line).trim();
        if (line.startsWith('data:image/') || line.startsWith('data:audio/')) return;
        if (!line || META_WORDS.has(line.toLowerCase()) || line.length < 2) return;
        if (isBlocked(line)) { blocked.push(line); if (!appData.disabledUserCards[user.id]) appData.disabledUserCards[user.id] = []; if (!appData.disabledUserCards[user.id].includes(line)) appData.disabledUserCards[user.id].push(line); return; }
        if (globalSet.has(line)) { skipGlobal.push(line); } else if (userSet.has(line)) { skipSelf.push(line); } else { fresh.push(line); }
    });
    if (fresh.length > 0) {
        let tg = user.cardGroups.find(g => g.name === targetGroupName);
        if (!tg) { tg = { name: targetGroupName, list: [] }; user.cardGroups.push(tg); }
        tg.list = uniqueArr([...tg.list, ...fresh]);
    }
    markDataChanged(); save();
    if (!silence) {
        let msg = `导入 ${fresh.length} 条到${targetGroupName}`;
        if (blocked.length) msg += `，屏蔽 ${blocked.length} 条`;
        if (skipGlobal.length) msg += `，跳过全局重复 ${skipGlobal.length} 条`;
        if (skipSelf.length) msg += `，跳过个人重复 ${skipSelf.length} 条`;
        toast(msg);
    }
    return { fresh: fresh.length, blocked: blocked.length, skipGlobal: skipGlobal.length, skipSelf: skipSelf.length };
}

function importMilkGroupsToGlobal(groups) {
    let totalImported = 0;
    let groupCount = 0;
    groups.forEach(g => {
        const result = importCardsToGlobal(g.list, g.name, true);
        if (result.fresh > 0) groupCount++;
        totalImported += result.fresh;
    });
    markDataChanged(); save();
    toast(`识别到 milk 格式，导入 ${groupCount} 个分组，共 ${totalImported} 条字卡`);
}

function importMilkGroupsToUser(user, groups) {
    let totalImported = 0;
    let groupCount = 0;
    groups.forEach(g => {
        const result = importUserCards(user, g.list, g.name, true);
        if (result.fresh > 0) groupCount++;
        totalImported += result.fresh;
    });
    markDataChanged(); save();
    toast(`识别到 milk 格式，导入 ${groupCount} 个分组，共 ${totalImported} 条字卡`);
}

function addBlockedKeyword(keyword) {
    keyword = keyword.trim();
    if (!keyword || appData.blockedKeywords.includes(keyword)) return false;
    appData.blockedKeywords.push(keyword);
    scanAndBlockKeyword(keyword);
    markDataChanged();
    save();
    return true;
}
function removeBlockedKeyword(keyword) {
    const idx = appData.blockedKeywords.indexOf(keyword);
    if (idx > -1) {
        appData.blockedKeywords.splice(idx, 1);
        markDataChanged();
        save();
        return true;
    }
    return false;
}
function isBlocked(text) {
    return appData.blockedKeywords.some(kw => text.includes(kw));
}
function scanAndBlockKeyword(keyword) {
    appData.globalCardGroups.forEach(g => {
        g.list = g.list.filter(card => {
            if (card.includes(keyword)) {
                if (!appData.disabledGlobalCards.includes(card)) appData.disabledGlobalCards.push(card);
                return false;
            }
            return true;
        });
    });
    appData.users.forEach(u => {
        if (!appData.disabledUserCards[u.id]) appData.disabledUserCards[u.id] = [];
        u.cardGroups.forEach(g => {
            g.list = g.list.filter(card => {
                if (card.includes(keyword)) {
                    if (!appData.disabledUserCards[u.id].includes(card)) appData.disabledUserCards[u.id].push(card);
                    return false;
                }
                return true;
            });
        });
    });
}
function batchImportBlockedKeywords(text) {
    const lines = text.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    lines.forEach(kw => { if (addBlockedKeyword(kw)) added++; });
    toast(`已添加 ${added} 个屏蔽词（自动去重）`);
}

// ---------- 回信提示 ----------
function hasUnreadReplies(userId) {
    const u = getContact(userId);
    if (u && u.hideReplyIndicator) return false;
    const letters = appData.letters[userId] || [];
    return letters.some(l => l.from !== 'me' && !l.read);
}
function markReplyAsRead(userId, cid) {
    const letters = appData.letters[userId] || [];
    const found = letters.find(l => l.from !== 'me' && l.cid === cid);
    if (found && !found.read) { found.read = true; markDataChanged(); save(); return true; }
    return false;
}
function toggleHideReplyIndicator(userId) {
    const u = getContact(userId);
    if (!u || u.id === 'me') return;
    u.hideReplyIndicator = !u.hideReplyIndicator;
    markDataChanged();
    save();
    updateReplyIndicatorUI(userId);
    renderChatList();
}
function updateReplyIndicatorUI(userId) {
    const u = getContact(userId);
    const hasUnread = (appData.letters[userId] || []).some(l => l.from !== 'me' && !l.read);
    const floatEl = document.getElementById('replyFloat');
    if (currentChatId === userId) {
        updateChatTitleReplyIndicator(userId);
    }
    if (currentChatId === userId && floatEl) {
        if (hasUnread) {
            if (u && u.hideReplyIndicator) {
                floatEl.innerHTML = '<span class="reply-dot" style="width:14px;height:14px;display:inline-block;"></span>';
                floatEl.classList.add('show');
            } else {
                floatEl.innerHTML = '📬';
                floatEl.classList.add('show');
            }
        } else {
            floatEl.classList.remove('show');
        }
    } else if (floatEl && currentChatId !== userId) {
        floatEl.classList.remove('show');
    }
}
function updateChatTitleReplyIndicator(userId) {
    const target = getContact(userId);
    if (!target || target.id === 'me') return;
    const status = (target.status) ? ` · <span class="status-tag">${target.status}</span>` : '';
    const hasUnread = (appData.letters[userId] || []).some(l => l.from !== 'me' && !l.read);
    let indicatorHtml = '';
    if (hasUnread) {
        if (target.hideReplyIndicator) {
            indicatorHtml = ' · <span class="reply-dot" id="titleReplyDot" style="cursor:pointer;width:10px;height:10px;display:inline-block;" title="有回信(已隐藏)"></span>';
        } else {
            indicatorHtml = ' · <span class="reply-indicator show" id="titleReplyIndicator" style="display:inline;cursor:pointer;">📬 回信</span>';
        }
    }
    document.getElementById('chatTitle').innerHTML = target.name + status + indicatorHtml;
    setTimeout(() => {
        const dot = document.getElementById('titleReplyDot');
        const indicator = document.getElementById('titleReplyIndicator');
        if (dot) dot.onclick = () => toggleHideReplyIndicator(userId);
        if (indicator) indicator.onclick = () => toggleHideReplyIndicator(userId);
        const floatEl = document.getElementById('replyFloat');
        if (floatEl && currentChatId === userId) {
            floatEl.onclick = () => toggleHideReplyIndicator(userId);
        }
    }, 50);
}
function refreshReplyIndicators() {
    renderChatList();
    if (currentChatId && document.getElementById('chatPage').classList.contains('active')) {
        updateReplyIndicatorUI(currentChatId);
    }
}

// ---------- 昵称同步 ----------
function syncMyNicknameGlobally() {
    const myName = appData.myProfile.name;
    Object.values(appData.msg).forEach(msgs => {
        msgs.forEach(m => {
            if (m.me && m.senderId === 'me') m.senderName = myName;
        });
    });
    Object.values(appData.moments).forEach(momentList => {
        momentList.forEach(m => {
            if (m.comments) {
                m.comments.forEach(c => {
                    if (c.userId === 'me') c.name = myName;
                });
            }
        });
    });
    if (appData.moments['me']) {
        appData.moments['me'].forEach(m => { m.name = myName; });
    }
}

// ---------- 主题 ----------
function applyTheme(hex) {
    if (!hex) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const root = document.documentElement;
    root.style.setProperty('--theme', hex);
    root.style.setProperty('--theme-dark', `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`);
    root.style.setProperty('--theme-light', `rgba(${r}, ${g}, ${b}, 0.15)`);
    root.style.setProperty('--bubble-sent', hex);
    root.style.setProperty('--bubble-sent-text', '#fff');
    root.style.setProperty('--bubble-recv', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--bubble-recv-border', `rgba(${r}, ${g}, ${b}, 0.25)`);
    appData.themeColor = hex;
    markDataChanged();
    save();
    try { localStorage.setItem('Mo_theme_backup', hex); } catch (e) {}
}

function applyTransparency() {
    const elements = document.querySelectorAll('.chat-header, .input-area, .emoji-panel, .image-panel, .rich-input, .tool-icon');
    elements.forEach(el => { el.style.backgroundColor = 'rgba(255,255,255,0.06)'; });
    const dynElements = document.querySelectorAll('.pop-body input, .pop-body textarea, .pop-body .rich-input');
    dynElements.forEach(el => { el.style.backgroundColor = 'rgba(255,255,255,0.10)'; });
}

// ---------- 音效 ----------
let audioCtx = null;
function ensureAudioContext() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(() => {}); }
}
function getAudioCtx() { ensureAudioContext(); return audioCtx; }
function playSound(type) {
    try {
        ensureAudioContext();
        const ctx = getAudioCtx();
        if (!ctx || ctx.state === 'suspended') { ensureAudioContext(); return; }
        const vol = appData.soundVolume || 0.5;
        const gain = ctx.createGain();
        gain.gain.value = vol * 0.08;
        gain.connect(ctx.destination);
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.connect(gain);
        osc2.connect(gain);
        switch (type) {
            case 'message':
                osc1.frequency.value = 1000; osc1.type = 'sine';
                osc2.frequency.value = 1200; osc2.type = 'sine';
                osc1.start(); osc2.start();
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
                osc1.stop(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.08);
                break;
            case 'call_out_wait':
                osc1.frequency.value = 440; osc1.type = 'sine';
                osc2.frequency.value = 554; osc2.type = 'sine';
                osc1.start(); osc2.start();
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
                osc1.stop(ctx.currentTime + 0.5); osc2.stop(ctx.currentTime + 0.5);
                break;
            case 'call_in_ring':
                osc1.frequency.value = 800; osc1.type = 'sine';
                osc2.frequency.value = 1000; osc2.type = 'sine';
                osc1.start(); osc2.start();
                osc1.stop(ctx.currentTime + 0.35); osc2.stop(ctx.currentTime + 0.35);
                break;
            case 'call_connect':
                osc1.frequency.value = 1000; osc1.type = 'sine';
                osc2.frequency.value = 1400; osc2.type = 'sine';
                osc1.start(); osc2.start();
                osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
                osc1.stop(ctx.currentTime + 0.1); osc2.stop(ctx.currentTime + 0.1);
                break;
            case 'call_end':
                osc1.frequency.value = 600; osc1.type = 'sine';
                osc2.frequency.value = 400; osc2.type = 'sine';
                osc1.start(); osc2.start();
                osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
                osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
                osc1.stop(ctx.currentTime + 0.2); osc2.stop(ctx.currentTime + 0.2);
                break;
        }
    } catch (e) {}
}

// ---------- 通话状态与计时音效 ----------
let callState = { active: false, phase: 'idle', direction: 'outgoing', startTimestamp: 0, timerInterval: null, callInterval: null, panel: null, pill: null, chatId: null, ending: false, _hangupLock: false, _dragCleanup: null, _pillDragCleanup: null, expectedEndTime: 0, floatBall: null };
let callWaitInterval = null;
function startCallWaitSound() { stopCallWaitSound(); callWaitInterval = setInterval(() => playSound('call_out_wait'), 1200); }
function startCallRingSound() { stopCallWaitSound(); callWaitInterval = setInterval(() => playSound('call_in_ring'), 1200); }
function stopCallWaitSound() { if (callWaitInterval) { clearInterval(callWaitInterval); callWaitInterval = null; } }

// ---------- Service Worker & Wake Lock ----------
if ('serviceWorker' in navigator) {
    const swCode = `self.addEventListener('install', e => self.skipWaiting());self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));`;
    const blob = new Blob([swCode], { type: 'application/javascript' });
    navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
}
if ('wakeLock' in navigator) {
    let wakeLock = null;
    const requestWakeLock = async () => { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !wakeLock) requestWakeLock(); });
    requestWakeLock();
}