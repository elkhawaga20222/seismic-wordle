import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, BookOpen, Check, Clock3, HelpCircle, RotateCcw, Settings, Share2, Volume2, VolumeX, X } from 'lucide-react';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';
type GameStatus = 'playing' | 'won' | 'lost';
type Stats = { played: number; wins: number; currentStreak: number; maxStreak: number; distribution: number[]; lastPlayed?: string; lastResult?: GameStatus };
type Modal = 'how' | 'stats' | 'result' | 'share' | null;
type Character = { name: string; image: string };
type Reaction = { character: Character; message: string };
type ShareCardData = { guesses: string[]; answer: string; status: GameStatus; streak: number };

const CHARACTERS: Character[] = [
  { name: 'Xealistt', image: '/characters/xealistt.png' },
  { name: 'NoxxW3', image: '/characters/noxxw3.png' },
  { name: 'Heathcliff', image: '/characters/heathcliff_eth.png' },
  { name: 'Lyronctk', image: '/characters/lyronctk.png' },
];
const REACTION_MESSAGES = ['Keep going!', 'Nice one!', 'You got this!', 'Almost there!', 'Try another word!', 'Stay sharp!', 'Think Seismic!', 'One more try!', 'Good guess!', "Don't give up!"];

const WORDS = ['BLEND', 'PRISM', 'AVVIO', 'SHIFT', 'TOKEN', 'CHAIN', 'BLOCK', 'PROOF', 'TRUST', 'STAKE', 'YIELD', 'TRADE', 'ASSET', 'COINS', 'LAYER', 'VAULT', 'QUERY', 'SPEND', 'MERGE', 'SHARE', 'AUDIT', 'FINAL', 'NODES', 'MINER', 'ROCKY', 'STONE', 'QUAKE', 'FAULT', 'WAVES', 'MAGMA', 'PLATE', 'CRUST', 'CLOAK', 'GUARD', 'CACHE', 'PRIVY', 'SHARD', 'BYTES', 'NONCE', 'ERROR', 'PATCH', 'DEBUG', 'STACK', 'QUEUE', 'STORE', 'FETCH', 'INPUT', 'GRAPH', 'INDEX', 'MATCH'];
const WORD_INFO: Record<string, { category: string; hint: string }> = {
  BLEND: { category: 'Seismic Partner', hint: 'A Seismic partner focused on yield infrastructure.' },
  PRISM: { category: 'Seismic Partner', hint: 'A Seismic partner exploring clear, composable data.' },
  AVVIO: { category: 'Seismic Partner', hint: 'A Seismic partner helping ideas get started.' },
  SHIFT: { category: 'Seismic Partner', hint: 'A Seismic partner moving the ecosystem forward.' },
  TOKEN: { category: 'Blockchain Term', hint: 'A digital asset on a blockchain.' },
  CHAIN: { category: 'Blockchain Term', hint: 'A connected sequence of blocks.' },
  BLOCK: { category: 'Blockchain Term', hint: 'A package of records added to a chain.' },
  PROOF: { category: 'Blockchain Term', hint: 'Evidence used to verify a network action.' },
  TRUST: { category: 'Blockchain Term', hint: 'Confidence that a system will behave as expected.' },
  STAKE: { category: 'Blockchain Term', hint: 'Value committed to help secure a network.' },
  YIELD: { category: 'Blockchain Term', hint: 'A return earned from putting assets to work.' },
  TRADE: { category: 'Blockchain Term', hint: 'The exchange of one asset for another.' },
  ASSET: { category: 'Blockchain Term', hint: 'Something with value that can be owned or exchanged.' },
  COINS: { category: 'Blockchain Term', hint: 'Digital units used as money on a network.' },
  LAYER: { category: 'Blockchain Term', hint: 'A level in a stack of network infrastructure.' },
  VAULT: { category: 'Blockchain Term', hint: 'A secure place for storing valuable assets.' },
  QUERY: { category: 'Blockchain Term', hint: 'A request for specific information.' },
  SPEND: { category: 'Blockchain Term', hint: 'To use an asset in an exchange.' },
  MERGE: { category: 'Blockchain Term', hint: 'To combine separate parts into one.' },
  SHARE: { category: 'Blockchain Term', hint: 'To make information or value available to others.' },
  AUDIT: { category: 'Blockchain Term', hint: 'A careful review of records or code.' },
  FINAL: { category: 'Blockchain Term', hint: 'Complete, settled, and no longer changing.' },
  NODES: { category: 'Technical Term', hint: 'Computers that participate in a network.' },
  MINER: { category: 'Technical Term', hint: 'A participant that helps verify certain network records.' },
  STACK: { category: 'Technical Term', hint: 'A collection where the last item added comes out first.' },
  QUEUE: { category: 'Technical Term', hint: 'A line of tasks waiting to be processed.' },
  STORE: { category: 'Technical Term', hint: 'A place or action for keeping data.' },
  FETCH: { category: 'Technical Term', hint: 'To retrieve information from a source.' },
  INPUT: { category: 'Technical Term', hint: 'Information supplied to a system.' },
  GRAPH: { category: 'Technical Term', hint: 'A structure that connects points and relationships.' },
  INDEX: { category: 'Technical Term', hint: 'A shortcut that helps find data quickly.' },
  MATCH: { category: 'Technical Term', hint: 'A successful correspondence between two things.' },
  PATCH: { category: 'Technical Term', hint: 'A small update that fixes or improves software.' },
  DEBUG: { category: 'Technical Term', hint: 'To find and remove problems in code.' },
  BYTES: { category: 'Technical Term', hint: 'Small units used to measure digital data.' },
  NONCE: { category: 'Technical Term', hint: 'A number used once in a computational process.' },
  ERROR: { category: 'Technical Term', hint: 'A signal that something did not work correctly.' },
  CACHE: { category: 'Privacy Concept', hint: 'A temporary copy kept for faster access.' },
  PRIVY: { category: 'Privacy Concept', hint: 'Having special access to private information.' },
  SHARD: { category: 'Privacy Concept', hint: 'A separated piece of a larger dataset.' },
  CLOAK: { category: 'Privacy Concept', hint: 'To conceal something from view.' },
  GUARD: { category: 'Privacy Concept', hint: 'A layer of protection around something valuable.' },
  PLATE: { category: 'Privacy Concept', hint: 'A broad surface or layer in a larger system.' },
  CRUST: { category: 'Privacy Concept', hint: 'The outer layer surrounding something deeper.' },
  ROCKY: { category: 'Seismic Name', hint: 'Describing terrain that is rough and full of stone.' },
  STONE: { category: 'Seismic Name', hint: 'A solid piece of rock shaped by the earth.' },
  QUAKE: { category: 'Seismic Name', hint: 'A sudden shaking of the ground.' },
  FAULT: { category: 'Seismic Name', hint: 'A fracture where movement can happen underground.' },
  WAVES: { category: 'Seismic Name', hint: 'Patterns of energy moving through space or material.' },
  MAGMA: { category: 'Seismic Name', hint: 'Molten rock beneath the earth’s surface.' },
};
const KEY_ROWS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M']];
const STORAGE_KEY = 'seismic-wordle-progress-v1';
const MUTE_KEY = 'seismic-wordle-muted';

function dateKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
function dayNumber(date = new Date()): number { return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000); }
function seededOrder(seed: number): string[] {
  const list = [...WORDS];
  let value = Math.abs(seed) + 97;
  for (let i = list.length - 1; i > 0; i -= 1) {
    value = (value * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((value / 4294967296) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function dailyWord(date = new Date()): string {
  const day = dayNumber(date);
  const cycle = Math.floor(day / WORDS.length);
  return seededOrder(cycle + 2026)[day % WORDS.length];
}
function emptyStats(): Stats { return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] }; }
function loadStats(): Stats { try { return { ...emptyStats(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } as Stats; } catch { return emptyStats(); } }
function getTimeLeft(): { hours: number; minutes: number; seconds: number } {
  const next = new Date(); next.setHours(24, 0, 0, 0);
  const total = Math.max(0, next.getTime() - Date.now());
  return { hours: Math.floor(total / 3600000), minutes: Math.floor((total % 3600000) / 60000), seconds: Math.floor((total % 60000) / 1000) };
}
function getShareRank(data: ShareCardData): { label: string; tone: 'gold' | 'silver' | 'bronze' | 'gray'; accent: string } {
  if (data.status !== 'won') return { label: 'Try Again', tone: 'gray', accent: '#666666' };
  if (data.guesses.length <= 2) return { label: 'Legendary', tone: 'gold', accent: '#FFD700' };
  if (data.guesses.length <= 4) return { label: 'Great', tone: 'silver', accent: '#C0C0C0' };
  return { label: 'Good', tone: 'bronze', accent: '#CD7F32' };
}
function shareTextFor(data: ShareCardData): string {
  const result = data.status === 'won' ? `${data.guesses.length}/6` : 'X/6';
  const squares = data.guesses.map((guess) => guess.split('').map((letter, index) => letter === data.answer[index] ? '🟩' : data.answer.includes(letter) ? '🟨' : '⬛').join('')).join('\n');
  return `Seismic Wordle ${result}\n${squares}`;
}

function App() {
  const answer = useMemo(() => dailyWord(), []);
  const today = dateKey();
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(`seismic-game-${today}`) || 'null') as { guesses: string[]; status: GameStatus } | null; } catch { return null; } }, [today]);
  const [guesses, setGuesses] = useState<string[]>(saved?.guesses || []);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState<GameStatus>(saved?.status || 'playing');
  const [keyStates, setKeyStates] = useState<Record<string, TileState>>({});
  const [modal, setModal] = useState<Modal>(null);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true');
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [error, setError] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [resultCharacter, setResultCharacter] = useState<Character | null>(null);
  const [hintUsed, setHintUsed] = useState(() => localStorage.getItem(`seismic-hint-${today}`) === 'true');
  const [hintOpen, setHintOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const reactionTimeout = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const playTone = useCallback((kind: 'type' | 'flip' | 'win' | 'loss' | 'error') => {
    if (muted) return;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    audio.current ??= new AudioCtor();
    const ctx = audio.current; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    const tones = { type: [190, 0.035], flip: [280, 0.07], win: [440, 0.16], loss: [180, 0.16], error: [95, 0.12] };
    const [frequency, duration] = tones[kind];
    osc.type = kind === 'error' ? 'sawtooth' : 'sine'; osc.frequency.value = frequency;
    if (kind === 'win') osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
    if (kind === 'loss') osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration + 0.02);
  }, [muted]);

  useEffect(() => { const timer = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const next: Record<string, TileState> = {};
    guesses.forEach((guess) => guess.split('').forEach((letter, index) => { const state = letter === answer[index] ? 'correct' : answer.includes(letter) ? 'present' : 'absent'; if (next[letter] !== 'correct' && !(next[letter] === 'present' && state === 'absent')) next[letter] = state; }));
    setKeyStates(next);
  }, [answer, guesses]);
  useEffect(() => { if (!localStorage.getItem(STORAGE_KEY)) setModal('how'); }, []);
  useEffect(() => { localStorage.setItem(`seismic-game-${today}`, JSON.stringify({ guesses, status })); }, [guesses, status, today]);
  useEffect(() => {
    if (status !== 'playing') return;
    const scheduleReaction = () => {
      reactionTimeout.current = window.setTimeout(() => {
        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const message = REACTION_MESSAGES[Math.floor(Math.random() * REACTION_MESSAGES.length)];
        setReaction({ character, message });
        reactionTimeout.current = window.setTimeout(() => { setReaction(null); scheduleReaction(); }, 6000);
      }, 20000 + Math.random() * 10000);
    };
    scheduleReaction();
    return () => { if (reactionTimeout.current !== null) window.clearTimeout(reactionTimeout.current); };
  }, [status]);

  const finish = useCallback((nextStatus: GameStatus, count: number, completedGuesses: string[]) => {
    setStatus(nextStatus); setModal('result'); setReaction(null); setResultCharacter(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
    const nextStats = loadStats(); const won = nextStatus === 'won';
    nextStats.played += 1; if (won) { nextStats.wins += 1; nextStats.currentStreak = nextStats.lastPlayed === dateKey(new Date(Date.now() - 86400000)) && nextStats.lastResult === 'won' ? nextStats.currentStreak + 1 : 1; nextStats.maxStreak = Math.max(nextStats.maxStreak, nextStats.currentStreak); nextStats.distribution[count - 1] += 1; } else nextStats.currentStreak = 0;
    nextStats.lastPlayed = today; nextStats.lastResult = nextStatus; setStats(nextStats); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStats));
    setShareData({ guesses: completedGuesses, answer, status: nextStatus, streak: nextStats.currentStreak }); setModal('share');
    if (won) { setCelebrate(true); playTone('win'); } else playTone('loss');
  }, [answer, playTone, today]);

  const submit = useCallback(() => {
    if (status !== 'playing') return;
    if (current.length !== 5 || !WORDS.includes(current)) { setError(true); playTone('error'); window.setTimeout(() => setError(false), 500); return; }
    const nextGuesses = [...guesses, current]; setGuesses(nextGuesses); setCurrent(''); playTone('flip');
    if (current === answer) finish('won', nextGuesses.length, nextGuesses); else if (nextGuesses.length === 6) finish('lost', nextGuesses.length, nextGuesses);
  }, [answer, current, finish, guesses, playTone, status]);

  const press = useCallback((key: string) => { if (key === 'ENTER') submit(); else if (key === 'BACKSPACE') setCurrent((value) => value.slice(0, -1)); else if (/^[A-Z]$/.test(key) && current.length < 5 && status === 'playing') { setCurrent((value) => value + key); playTone('type'); } }, [current.length, playTone, status, submit]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Enter') press('ENTER'); else if (event.key === 'Backspace') press('BACKSPACE'); else if (/^[a-zA-Z]$/.test(event.key)) press(event.key.toUpperCase()); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [press]);

  const openCurrentShareCard = () => { setShareData({ guesses, answer, status, streak: stats.currentStreak }); setModal('share'); };
  const copyResult = async (data: ShareCardData) => { await navigator.clipboard?.writeText(shareTextFor(data)); };
  const openXShare = (data: ShareCardData) => { window.open(`https://x.com/intent/post?text=${encodeURIComponent(shareTextFor(data))}`, '_blank', 'noopener,noreferrer'); };
  const downloadShareCard = (data: ShareCardData) => {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1080;
    const context = canvas.getContext('2d'); if (!context) return;
    const { accent, label } = getShareRank(data); const background = new Image(); const logo = new Image(); let loaded = 0;
    const drawCard = () => {
      loaded += 1; if (loaded < 2) return;
      context.fillStyle = '#111111'; context.fillRect(0, 0, 1080, 1080);
      if (background.naturalWidth > 0) { const scale = Math.max(1080 / background.naturalWidth, 1080 / background.naturalHeight); const width = background.naturalWidth * scale; const height = background.naturalHeight * scale; context.drawImage(background, (1080 - width) / 2, (1080 - height) / 2, width, height); }
      context.fillStyle = 'rgba(0, 0, 0, .5)'; context.fillRect(0, 0, 1080, 1080); context.strokeStyle = accent; context.lineWidth = 8; context.strokeRect(28, 28, 1024, 1024);
      context.fillStyle = accent; context.font = '600 42px sans-serif'; context.fillText(`Seismic Wordle #${dayNumber()}`, 76, 108);
      context.fillStyle = '#eae7dd'; context.font = '22px monospace'; context.fillText(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 78, 148);
      const size = 112; const gap = 16; const gridX = (1080 - (5 * size + 4 * gap)) / 2; const gridY = 250;
      data.guesses.forEach((guess, row) => guess.split('').forEach((letter, column) => { context.fillStyle = letter === data.answer[column] ? '#68735e' : data.answer.includes(letter) ? '#948960' : '#3b3c38'; context.fillRect(gridX + column * (size + gap), gridY + row * (size + gap), size, size); }));
      context.fillStyle = accent; context.font = '600 34px sans-serif'; context.fillText(`🔥 ${data.streak} day streak`, 76, 920);
      if (logo.naturalWidth > 0) context.drawImage(logo, 76, 790, 120, 100);
      context.fillStyle = '#eae7dd'; context.font = '22px monospace'; context.fillText('Play at seismic-wordle.vercel.app', 76, 1002);
      context.fillStyle = accent; context.fillRect(820, 74, 184, 52); context.fillStyle = '#111111'; context.font = '600 20px sans-serif'; context.fillText(label.toUpperCase(), 842, 108);
      const link = document.createElement('a'); link.download = `seismic-wordle-${dayNumber()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    };
    background.onload = drawCard; background.onerror = drawCard; logo.onload = drawCard; logo.onerror = drawCard; background.src = '/Back.png'; logo.src = '/Picsart_26-04-26_18-29-10-990 copy.png';
  };
  const tileState = (row: number, col: number): TileState => { const guess = guesses[row]; if (!guess) return row === guesses.length && current[col] ? 'filled' : 'empty'; const letter = guess[col]; return letter === answer[col] ? 'correct' : answer.includes(letter) ? 'present' : 'absent'; };
  const formattedTime = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
  const wordInfo = WORD_INFO[answer];
  const useHint = () => { if (hintUsed) return; setHintUsed(true); setHintOpen(true); localStorage.setItem(`seismic-hint-${today}`, 'true'); };

  return <main className="app-shell">
    <div className="grain" /><div className="particles" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ left: `${(index * 43) % 100}%`, animationDelay: `${(index * 1.7) % 12}s`, animationDuration: `${12 + (index % 6) * 2}s`, opacity: 0.3 + (index % 3) * 0.1 }} />)}</div>
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark"><img src="/Picsart_26-01-12_21-47-55-195.png" alt="" /></div><div><p className="eyebrow">A daily seismic ritual</p><h1>SEISMIC <span>WORDLE</span></h1></div></div>
      <div className="top-actions"><button className="icon-button" aria-label="How to play" onClick={() => setModal('how')}><HelpCircle size={19} /></button><button className="icon-button" aria-label="Statistics" onClick={() => setModal('stats')}><BarChart3 size={19} /></button><button className="icon-button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { setMuted(!muted); localStorage.setItem(MUTE_KEY, String(!muted)); }}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button><div className="settings-wrap"><button className="icon-button" aria-label="Settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}><Settings size={19} /></button>{settingsOpen && <div className="settings-menu"><span>SHARE CARD</span><button onClick={() => { setSettingsOpen(false); setShareData({ guesses: ['BLEND', 'PRISM', 'SHIFT', 'TOKEN'], answer: 'TOKEN', status: 'won', streak: 5 }); setModal('share'); }}>Preview Card</button></div>}</div></div>
    </header>
    <section className="hero-line"><div className="hero-meta"><div><span className="status-dot" /> DAILY CHALLENGE <span className="date-label">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><div className="category-line">Category: {wordInfo.category}</div><div className="streak-line">{stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} day streak` : 'Start your streak today!'}</div></div><div className="hero-rule" /><div className="hero-actions"><div className="hint-wrap"><button className="hint-button" disabled={hintUsed} onClick={useHint}>{hintUsed ? 'Hint used' : 'Hint'}</button>{hintOpen && <div className="hint-popover" role="status">{wordInfo.hint}</div>}</div><button className="share-card-button" onClick={openCurrentShareCard}><Share2 size={14} /> Share Card</button></div><img className="crystal" src="/Picsart_26-04-26_18-29-10-990.png" alt="" /></section>
    <section className={`game-area ${error ? 'shake' : ''}`} aria-label="Word grid">
      <div className="grid">{Array.from({ length: 6 }, (_, row) => <div className="row" key={row}>{Array.from({ length: 5 }, (_, col) => { const letter = guesses[row]?.[col] || (row === guesses.length ? current[col] : ''); return <div className={`tile ${tileState(row, col)} ${row === guesses.length - 1 && status !== 'playing' ? 'last-tile' : ''}`} key={col} style={{ animationDelay: `${col * 80}ms` }}>{letter}</div>; })}</div>)}</div>
      <p className="hint">{status === 'playing' ? 'Find the fault line.' : status === 'won' ? 'The pattern has settled.' : `The word was ${answer}.`}</p>
    </section>
    <section className="keyboard" aria-label="On-screen keyboard">{KEY_ROWS.map((row, rowIndex) => <div className="key-row" key={rowIndex}>{rowIndex === 2 && <button className="key key-wide" onClick={() => press('ENTER')}>ENTER</button>}{row.map((key) => <button className={`key ${keyStates[key] || ''}`} key={key} onClick={() => press(key)}>{key}</button>)}{rowIndex === 2 && <button className="key key-wide" onClick={() => press('BACKSPACE')}>⌫</button>}</div>)}</section>
    {reaction && status === 'playing' && <aside className="community-reaction" aria-live="polite"><div className="speech-bubble">{reaction.message}</div><div className="reaction-avatar"><img src={reaction.character.image} alt={reaction.character.name} onError={() => setReaction(null)} /></div><span>{reaction.character.name}</span></aside>}
    <footer><div className="footer-copy">BUILT BY <strong>ADELKHATER</strong> <span>•</span> ELKHAWAGA20222</div><nav><a href="https://seismic-glossary.lovable.app" target="_blank" rel="noreferrer">Seismic Glossary</a><a href="https://seismic-quiz-arena.lovable.app" target="_blank" rel="noreferrer">Seismic Quiz Arena</a><a href="https://x.com/SeismicSys" target="_blank" rel="noreferrer">@SeismicSys</a></nav></footer>
    {modal && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="modal-card">{modal === 'how' && <><div className="modal-heading"><span className="modal-kicker">FIELD NOTES 01</span><button onClick={() => setModal(null)}><X size={20} /></button></div><h2>Read the terrain.</h2><p>Guess the hidden five-letter word in six attempts. Each tile reveals how close your reading was.</p><div className="legend"><div className="legend-item"><span className="legend-tile correct">A</span><span><b>Correct position</b><small>The letter is locked in.</small></span></div><div className="legend-item"><span className="legend-tile present">R</span><span><b>Wrong position</b><small>The letter is in the word.</small></span></div><div className="legend-item"><span className="legend-tile absent">T</span><span><b>Not in word</b><small>Leave this signal behind.</small></span></div></div><button className="primary-button" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); setModal(null); }}>START EXPLORING <span>→</span></button></>}{modal === 'stats' && <><div className="modal-heading"><span className="modal-kicker">YOUR SEISMIC LOG</span><button onClick={() => setModal(null)}><X size={20} /></button></div><h2>Read your history.</h2><div className="stat-grid"><div><strong>{stats.played}</strong><span>Played</span></div><div><strong>{stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%</strong><span>Win rate</span></div><div><strong>{stats.currentStreak}</strong><span>Streak</span></div><div><strong>{stats.maxStreak}</strong><span>Best</span></div></div><h3>GUESS DISTRIBUTION</h3><div className="distribution">{stats.distribution.map((value, i) => <div className="dist-row" key={i}><span>{i + 1}</span><div className="dist-bar" style={{ width: `${Math.max(8, (value / Math.max(1, Math.max(...stats.distribution))) * 100)}%` }}>{value}</div></div>)}</div></>}{modal === 'share' && shareData && <><div className="modal-heading"><span className="modal-kicker">SHARE CARD</span><button onClick={() => setModal(null)}><X size={20} /></button></div><div className="share-modal-card"><div className={`share-card-surface ${getShareRank(shareData).tone}`}><div className="share-card-badge">{getShareRank(shareData).label}</div><h2>Seismic Wordle #{dayNumber()}</h2><div className="share-card-grid">{shareData.guesses.map((guess, row) => <div key={row}>{guess.split('').map((letter, column) => <i className={letter === shareData.answer[column] ? 'correct' : shareData.answer.includes(letter) ? 'present' : 'absent'} key={column} />)}</div>)}</div><strong>🔥 {shareData.streak} day streak</strong><img className="share-card-logo" src="/Picsart_26-04-26_18-29-10-990 copy.png" alt="Seismic" /><small>Play at seismic-wordle.vercel.app</small></div><div className="share-modal-actions"><button className="primary-button" onClick={() => downloadShareCard(shareData)}>Download PNG</button><button className="secondary-button" onClick={() => copyResult(shareData)}>Copy Text</button><button className="secondary-button" onClick={() => openXShare(shareData)}>Share on X</button><button className="secondary-button" onClick={() => setModal(null)}>Close</button></div></div></>}{modal === 'result' && <><div className="modal-heading"><span className="modal-kicker">{status === 'won' ? 'SIGNAL FOUND' : 'SIGNAL LOST'}</span><button onClick={() => { setModal(null); setResultCharacter(null); }}><X size={20} /></button></div>{resultCharacter && <div className={`result-character ${status === 'won' ? 'result-character-win' : ''}`}><div className="result-avatar"><img src={resultCharacter.image} alt={resultCharacter.name} onError={() => setResultCharacter(null)} /></div><span>{resultCharacter.name}</span></div>}<h2>{status === 'won' ? 'Congratulations.' : 'Better luck tomorrow.'}</h2><p>{status === 'won' ? `You found ${answer} in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}.` : `The hidden word was ${answer}. The fault line resets at midnight.`}</p><div className="countdown"><Clock3 size={17} /><span>NEXT WORD IN <b>{formattedTime}</b></span></div><div className="share-actions"><button className="primary-button" onClick={() => shareData && downloadShareCard(shareData)}><Share2 size={17} /> Share Result</button><button className="secondary-button" onClick={() => shareData && copyResult(shareData)}>Copy Text</button></div></>}</div></div>}
    {celebrate && <div className="confetti" onAnimationEnd={() => setCelebrate(false)}>{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${(i * 47) % 100}%`, animationDelay: `${(i % 8) * 90}ms`, background: i % 3 === 0 ? '#948960' : i % 3 === 1 ? '#eae7dd' : '#60706a' }} />)}</div>}
  </main>;
}

export default App;
