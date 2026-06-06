import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Home, Search, Library, Music, Activity, Sun, Moon, Shuffle, Repeat, Plus, Edit2, Trash2 } from 'lucide-react';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 🎛️ Web Audio API 관련 참조 (비주얼라이저용)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const requestRef = useRef<number>(0);

  // 💾 상태 관리
  const [volume, setVolume] = useState<number>(() => {
  const saved = localStorage.getItem('soundspace-volume');
  return saved !== null ? Number(saved) : 50;
});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => (localStorage.getItem('soundspace-theme') || 'dark') === 'dark');
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(() => Number(sessionStorage.getItem('soundspace-current-index')) || 0);
  const [isShuffle, setIsShuffle] = useState<boolean>(() => sessionStorage.getItem('soundspace-shuffle') === 'true');
  const [isRepeat, setIsRepeat] = useState<boolean>(() => sessionStorage.getItem('soundspace-repeat') === 'true');

  const [songs, setSongs] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);

  const [playlists, setPlaylists] = useState<{ id: number, name: string }[]>([
    { id: 1, name: "과제용 BGM 모음" }
  ]);

  const trackNotes = [
    { time: 0, text: "잔잔한 멜로디로 시작됩니다 🎵" },
    { time: 10, text: "리듬악기가 서서히 더해지는 구간" },
    { time: 20, text: "메인 테마가 전개됩니다 🚀" },
    { time: 35, text: "사운드가 더욱 풍성해지는 하이라이트!" },
    { time: 50, text: "잠시 쉬어가는 브릿지 구간..." },
    { time: 65, text: "다시 한번 강렬하게 터지는 비트 💥" },
    { time: 80, text: "아웃트로를 향해 달려갑니다" }
  ];

  useEffect(() => {
    axios.get('/api/songs').then((res) => setSongs(res.data)).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    localStorage.setItem('soundspace-volume', volume.toString());
  }, [volume]);
  useEffect(() => localStorage.setItem('soundspace-theme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  useEffect(() => sessionStorage.setItem('soundspace-current-index', currentSongIndex.toString()), [currentSongIndex]);
  useEffect(() => sessionStorage.setItem('soundspace-shuffle', isShuffle.toString()), [isShuffle]);
  useEffect(() => sessionStorage.setItem('soundspace-repeat', isRepeat.toString()), [isRepeat]);

  // 🎨 비주얼라이저 그리기 함수
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]; // 높이 조절
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (isDarkMode) {
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0.9)');
        } else {
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.8)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };
    draw();
  };

  // 🎵 오디오 초기화 및 재생
  const togglePlay = async () => {
    if (!audioRef.current) return;

    // 리액트 환경에서 오디오 컨텍스트가 중복 생성되지 않도록 안전 장치 마련
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128; // 막대 개수
        
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        drawVisualizer();
      } catch (err) {
        console.error("비주얼라이저 초기화 실패:", err);
      }
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) { console.error(err); }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const createPlaylist = () => {
    const name = prompt("새로운 플레이리스트 이름을 입력하세요:");
    if (name) setPlaylists([...playlists, { id: Date.now(), name }]);
  };
  const updatePlaylist = (id: number) => {
    const name = prompt("수정할 플레이리스트 이름을 입력하세요:");
    if (name) setPlaylists(playlists.map(p => p.id === id ? { ...p, name } : p));
  };
  const deletePlaylist = (id: number) => {
    if (window.confirm("이 플레이리스트를 삭제하시겠습니까?")) setPlaylists(playlists.filter(p => p.id !== id));
  };

  const currentSong = songs[currentSongIndex] || { title: "로딩 중...", artist: "...", fileName: "" };

  return (
    <div className={`flex flex-col h-screen font-sans select-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <audio ref={audioRef} src={`/${currentSong.fileName}`} onTimeUpdate={handleTimeUpdate} />

      <div className="flex flex-1 h-[calc(100vh-90px)] overflow-hidden">
        {/* 사이드바 */}
        <aside className={`w-64 p-6 flex flex-col gap-6 border-r ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-sky-500 font-bold text-xl tracking-wider">
            <div className="flex items-center gap-2"><Activity size={28} /><span>SoundSpace</span></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-lg hover:bg-slate-800/10 transition">
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>
          </div>
          <nav className={`flex flex-col gap-4 font-medium text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <a href="#" className={`flex items-center gap-3 transition ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><Home size={20} /> 홈</a>
            <a href="#" className="flex items-center gap-3 hover:text-sky-500 transition"><Search size={20} /> 검색하기</a>
            <a href="#" className="flex items-center gap-3 hover:text-sky-500 transition"><Library size={20} /> 내 라이브러리</a>
          </nav>
          <hr className={isDarkMode ? 'border-slate-800' : 'border-slate-200'} />
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-wider">내 플레이리스트</p>
              <button onClick={createPlaylist} className="hover:text-sky-500 transition"><Plus size={16} /></button>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              {playlists.map((playlist) => (
                <div key={playlist.id} className={`group flex items-center justify-between p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                  <span className="truncate flex-1">{playlist.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => updatePlaylist(playlist.id)} className="text-slate-400 hover:text-sky-500"><Edit2 size={14} /></button>
                    <button onClick={() => deletePlaylist(playlist.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 메인 화면 */}
        <main className="flex-1 p-8 overflow-y-auto flex flex-col">
          <header className="mb-8"><h1 className="text-2xl font-bold">안녕하세요, 승준님 👋</h1></header>

          <section className="mb-8 flex gap-8 h-72">
            {/* 좌측: 현재 재생 중인 곡 정보 */}
            <div className={`p-6 rounded-2xl border w-1/3 flex flex-col justify-center gap-6 shadow-sm ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Music size={32} className="text-white" /></div>
              <div>
                <p className="text-sm font-semibold text-sky-500 mb-1">현재 재생 중</p>
                <h3 className="font-bold text-2xl mb-1">{currentSong.title}</h3>
                <p className="text-slate-400">{currentSong.artist}</p>
              </div>
            </div>

            {/* 우측: 상단 가사 + 하단 비주얼라이저 분리형 UI */}
            <div className={`flex flex-col flex-1 rounded-2xl border shadow-inner overflow-hidden ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              
              {/* 구역 1: 가사창 (위쪽) */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {trackNotes.map((note, index) => {
                  const isCurrent = currentTime >= note.time && (index === trackNotes.length - 1 || currentTime < trackNotes[index + 1].time);
                  if (!isCurrent) return null;
                  return (
                    <p key={index} className="text-xl font-bold text-sky-500 drop-shadow-sm animate-fade-in-up">
                      {note.text}
                    </p>
                  );
                })}
              </div>

              {/* 구역 2: 비주얼라이저 전용 구역 (아래쪽) */}
              <div className="h-28 w-full relative">
                {/* 캔버스의 실제 픽셀 크기를 넉넉하게 잡고 부모 요소에 꽉 차게 만듭니다 */}
                <canvas ref={canvasRef} width={800} height={150} className="absolute bottom-0 w-full h-full"></canvas>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 하단 플레이 바 */}
      <footer className={`h-24 border-t px-6 flex items-center justify-between z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 w-1/4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center"><Music size={20} className="text-slate-400" /></div>
          <div className="truncate">
            <h4 className="text-sm font-semibold truncate">{currentSong.title}</h4>
            <p className="text-xs text-slate-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsShuffle(!isShuffle)} className={`transition ${isShuffle ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}><Shuffle size={18} /></button>
            <button onClick={() => setCurrentSongIndex((prev) => (prev === 0 ? songs.length - 1 : prev - 1))} className="text-slate-400 hover:text-sky-500 transition"><SkipBack size={20} /></button>
            <button onClick={togglePlay} className={`p-3 rounded-full hover:scale-105 transition active:scale-95 shadow-md ${isDarkMode ? 'bg-slate-100 text-slate-950' : 'bg-slate-900 text-white'}`}>
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={() => setCurrentSongIndex((prev) => (prev === songs.length - 1 ? 0 : prev + 1))} className="text-slate-400 hover:text-sky-500 transition"><SkipForward size={20} /></button>
            <button onClick={() => setIsRepeat(!isRepeat)} className={`transition ${isRepeat ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}><Repeat size={18} /></button>
          </div>
          
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
            <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-sky-500 bg-slate-700" />
            <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-1/4 justify-end text-slate-400">
          <ListMusic size={20} />
          <div className="flex items-center gap-2">
            <Volume2 size={20} />
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 h-1 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-slate-700" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;