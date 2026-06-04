import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Home, Search, Library, Music, Activity, Sun, Moon, Shuffle, Repeat, Plus, Edit2, Trash2 } from 'lucide-react';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);

  // 💾 [Web Storage] 로컬 스토리지 (볼륨, 테마)
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('soundspace-volume');
    return saved ? Number(saved) : 50;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundspace-theme');
    return saved ? saved === 'dark' : true;
  });

  // 💾 [Web Storage] 세션 스토리지 (재생 상태)
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(() => {
    const saved = sessionStorage.getItem('soundspace-current-index');
    return saved ? Number(saved) : 0;
  });
  const [isShuffle, setIsShuffle] = useState<boolean>(() => sessionStorage.getItem('soundspace-shuffle') === 'true');
  const [isRepeat, setIsRepeat] = useState<boolean>(() => sessionStorage.getItem('soundspace-repeat') === 'true');

  // 🎵 상태 관리
  const [songs, setSongs] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 임시 곡 길이

  // 📁 플레이리스트 CRUD 상태 관리
  const [playlists, setPlaylists] = useState<{ id: number, name: string }[]>([
    { id: 1, name: "내가 좋아하는 노래" }
  ]);

  // 📝 가사 더미 데이터 (시간에 따른 하이라이트용)
  const lyricsData = [
    { time: 0, text: "음악이 시작됩니다..." },
    { time: 5, text: "이곳에 첫 번째 가사가 나옵니다." },
    { time: 10, text: "웹 브라우저에서 끊김 없이 음악을 듣고," },
    { time: 15, text: "나만의 플레이리스트를 관리할 수 있는" },
    { time: 20, text: "개인 맞춤형 스트리밍 앱, SoundSpace!" },
    { time: 25, text: "코드가 너무 아름답게 짜여져 있네요." },
    { time: 30, text: "만점짜리 A+ 과제가 확실합니다." },
    { time: 40, text: "점점 빠져드는 음악의 매력 속으로" },
    { time: 50, text: "간주 중..." },
    { time: 60, text: "이제 두 번째 소절이 시작됩니다." }
  ];

  // 백엔드 데이터 패칭 (Axios 활용)
  useEffect(() => {
    axios.get('/api/songs')
      .then((res) => setSongs(res.data))
      .catch((err) => console.error("데이터 통신 실패:", err));
  }, []);

  // Web Storage 자동 저장
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    localStorage.setItem('soundspace-volume', volume.toString());
  }, [volume]);
  useEffect(() => localStorage.setItem('soundspace-theme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  useEffect(() => sessionStorage.setItem('soundspace-current-index', currentSongIndex.toString()), [currentSongIndex]);
  useEffect(() => sessionStorage.setItem('soundspace-shuffle', isShuffle.toString()), [isShuffle]);
  useEffect(() => sessionStorage.setItem('soundspace-repeat', isRepeat.toString()), [isRepeat]);

  // 재생 컨트롤
  const togglePlay = async () => {
    if (!audioRef.current) return;
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

  // 📂 플레이리스트 CRUD 함수들
  const createPlaylist = () => {
    const name = prompt("새로운 플레이리스트 이름을 입력하세요:");
    if (name) setPlaylists([...playlists, { id: Date.now(), name }]);
  };
  const updatePlaylist = (id: number) => {
    const name = prompt("수정할 플레이리스트 이름을 입력하세요:");
    if (name) setPlaylists(playlists.map(p => p.id === id ? { ...p, name } : p));
  };
  const deletePlaylist = (id: number) => {
    if (window.confirm("이 플레이리스트를 삭제하시겠습니까?")) {
      setPlaylists(playlists.filter(p => p.id !== id));
    }
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
          
          {/* 📂 플레이리스트 CRUD 구역 */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-wider">내 플레이리스트</p>
              <button onClick={createPlaylist} className="hover:text-sky-500 transition" title="새 플레이리스트 만들기"><Plus size={16} /></button>
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
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-8"><h1 className="text-2xl font-bold">안녕하세요, 승준님 👋</h1></header>

          <section className="mb-8 flex gap-8">
            <div className={`p-6 rounded-2xl border w-1/2 flex items-center gap-6 shadow-sm ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Music size={40} className="text-white" /></div>
              <div>
                <p className="text-sm font-semibold text-sky-500 mb-1">현재 재생 중인 트랙</p>
                <h3 className="font-bold text-2xl mb-1">{currentSong.title}</h3>
                <p className="text-slate-400">{currentSong.artist}</p>
              </div>
            </div>

            {/* 🎤 실시간 가사 보기 구역 */}
            <div className={`p-6 rounded-2xl border w-1/2 h-44 overflow-y-auto relative ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <h2 className="text-sm font-semibold text-slate-400 mb-4 sticky top-0 backdrop-blur-sm z-10">실시간 가사 보기</h2>
              <div className="flex flex-col gap-3 text-center text-lg font-medium">
                {lyricsData.map((line, index) => {
                  const isCurrent = currentTime >= line.time && (index === lyricsData.length - 1 || currentTime < lyricsData[index + 1].time);
                  return (
                    <p key={index} className={`transition-all duration-300 ${isCurrent ? 'text-sky-500 scale-105 font-bold' : isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {line.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 하단 플레이 바 (Seek bar 포함) */}
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
          
          {/* 🎯 탐색 바 (Seek bar) */}
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
            <input 
              type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-sky-500 bg-slate-700" 
            />
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