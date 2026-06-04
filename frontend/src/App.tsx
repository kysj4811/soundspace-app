import axios from 'axios'; 
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Home, Search, Library, Music, Activity, Sun, Moon, Shuffle, Repeat } from 'lucide-react';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);

  // 💾 [localStorage] 브라우저를 껐다 켜도 유지되는 데이터
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('soundspace-volume');
    return saved ? Number(saved) : 50;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundspace-theme');
    return saved ? saved === 'dark' : true; // 기본값 다크모드
  });

  // 💾 [sessionStorage] 새로고침 시에만 유지되고 브라우저 닫으면 날아가는 데이터
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(() => {
    const saved = sessionStorage.getItem('soundspace-current-index');
    return saved ? Number(saved) : 0;
  });
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('soundspace-shuffle');
    return saved === 'true';
  });
  const [isRepeat, setIsRepeat] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('soundspace-repeat');
    return saved === 'true';
  });

  // 기타 앱 상태
  const [songs, setSongs] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(30).fill(10));

  // 백엔드에서 음악 데이터 가져오기
// 기존 fetch 코드를 제거하고 보고서 조건에 맞게 axios로 교체합니다!
  useEffect(() => {
    axios.get('/api/songs') // Nginx 리버스 프록시 덕분에 호스트명 없이 /api로만 요청해도 됩니다!
      .then((res) => {
        setSongs(res.data);
      })
      .catch((err) => {
        console.error("데이터 매칭 실패 (Axios):", err);
      });
  }, []);

  // [localStorage 저장] 볼륨 변경 시
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    localStorage.setItem('soundspace-volume', volume.toString());
  }, [volume]);

  // [localStorage 저장] 테마 변경 시
  useEffect(() => {
    localStorage.setItem('soundspace-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // [sessionStorage 저장] 재생 상태들 변경 시
  useEffect(() => {
    sessionStorage.setItem('soundspace-current-index', currentSongIndex.toString());
  }, [currentSongIndex]);

  useEffect(() => {
    sessionStorage.setItem('soundspace-shuffle', isShuffle.toString());
  }, [isShuffle]);

  useEffect(() => {
    sessionStorage.setItem('soundspace-repeat', isRepeat.toString());
  }, [isRepeat]);

  // 오디오 비주얼라이저 효과
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setBars(Array(30).fill(0).map(() => Math.floor(Math.random() * 90) + 10));
      }, 100);
    } else {
      setBars(Array(30).fill(10));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  // 노래가 끝났을 때 처리 (반복재생/셔플/다음곡)
  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      setCurrentSongIndex(randomIndex);
    } else {
      setCurrentSongIndex((prev) => (prev === songs.length - 1 ? 0 : prev + 1));
    }
  };

  const currentSong = songs[currentSongIndex] || { title: "로딩 중...", artist: "...", fileName: "" };

  return (
    <div className={`flex flex-col h-screen font-sans select-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      <audio ref={audioRef} src={`/${currentSong.fileName}`} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />

      <div className="flex flex-1 h-[calc(100vh-90px)] overflow-hidden">
        {/* 사이드바 */}
        <aside className={`w-64 p-6 flex flex-col gap-6 border-r ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-sky-500 font-bold text-xl tracking-wider">
            <div className="flex items-center gap-2"><Activity size={28} /><span>SoundSpace</span></div>
            {/* 테마 토글 버튼 (localStorage 활용) */}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-700/50 transition">
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">내 플레이리스트 (세션 대기열)</p>
            <div className="flex flex-col gap-2 text-sm">
              {songs.map((song, index) => (
                <button 
                  key={song.id} 
                  onClick={() => { setCurrentSongIndex(index); setIsPlaying(false); }}
                  className={`text-left truncate transition ${currentSongIndex === index ? 'text-sky-500 font-bold' : isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🎧 {song.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 메인 화면 */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-8"><h1 className="text-2xl font-bold">안녕하세요, 승준님 👋</h1></header>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-slate-400">현재 트랙 정보</h2>
            <div className={`p-6 rounded-2xl border max-w-sm flex items-center gap-5 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="w-20 h-20 bg-sky-500/10 rounded-xl flex items-center justify-center"><Music size={32} className="text-sky-500" /></div>
              <div>
                <h3 className="font-bold text-lg">{currentSong.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{currentSong.artist}</p>
              </div>
            </div>
          </section>

          <section className={`p-8 rounded-2xl max-w-3xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className="text-sm font-semibold text-slate-400 mb-6">오디오 스펙트럼</h2>
            <div className="h-32 flex items-end justify-between gap-1">
              {bars.map((height, index) => (
                <div key={index} className={`w-full rounded-t-sm transition-all duration-100 ${isPlaying ? 'bg-sky-500' : isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: `${height}%` }}></div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* 하단 플레이 바 */}
      <footer className={`h-24 border-t px-6 flex items-center justify-between z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 w-1/4">
          <div className="truncate">
            <h4 className="text-sm font-semibold truncate">{currentSong.title}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* 중앙 컨트롤러 */}
        <div className="flex flex-col items-center gap-2.5 flex-1 max-w-xl">
          <div className="flex items-center gap-5">
            {/* 셔플 버튼 (sessionStorage) */}
            <button onClick={() => setIsShuffle(!isShuffle)} className={`transition ${isShuffle ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}><Shuffle size={18} /></button>
            <button onClick={() => setCurrentSongIndex((prev) => (prev === 0 ? songs.length - 1 : prev - 1))} className="text-slate-400 hover:text-sky-500 transition"><SkipBack size={20} /></button>
            <button onClick={togglePlay} className={`p-2.5 rounded-full hover:scale-105 transition active:scale-95 shadow-md ${isDarkMode ? 'bg-slate-100 text-slate-950' : 'bg-slate-900 text-white'}`}>
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={() => setCurrentSongIndex((prev) => (prev === songs.length - 1 ? 0 : prev + 1))} className="text-slate-400 hover:text-sky-500 transition"><SkipForward size={20} /></button>
            {/* 반복 재생 버튼 (sessionStorage) */}
            <button onClick={() => setIsRepeat(!isRepeat)} className={`transition ${isRepeat ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}><Repeat size={18} /></button>
          </div>
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
            <div className={`h-1 flex-1 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-full bg-sky-500 transition-all duration-200" style={{ width: `${(currentTime / 180) * 100}%` }}></div>
            </div>
            <span>3:00</span>
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