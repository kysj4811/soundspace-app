const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // SQLite에서 PostgreSQL용 pg 모듈로 교체!

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 💾 [PostgreSQL 연결 설정]
// 💡 나중에 Docker Compose로 띄울 때 환경변수(process.env)를 바라보도록 유연하게 설계합니다.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/soundspace'
});

// 💾 [DBMS 테이블 생성 및 초기 데이터 주입]
async function initDB() {
  // 1. 회원 정보 테이블 (과제 조건 반영)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  // 2. 전체 음악 목록 테이블 (과제 조건 반영)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS songs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      artist VARCHAR(100) NOT NULL,
      file_name VARCHAR(100) NOT NULL,
      theme_color VARCHAR(30)
    )
  `);

  // 3. 유저 저장 플레이리스트 데이터 테이블 (과제 조건 반영)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS playlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(100) NOT NULL
    )
  `);

  // 초기 음악 데이터 주입 (테이블이 비어있을 때만 실행)
  const res = await pool.query('SELECT COUNT(*) FROM songs');
  if (parseInt(res.rows[0].count) === 0) {
    await pool.query("INSERT INTO songs (title, artist, file_name, theme_color) VALUES ('My First Track', '로컬 음악', 'music.mp3', 'sky')");
    await pool.query("INSERT INTO songs (title, artist, file_name, theme_color) VALUES ('코딩할 때 듣는 로파이', 'SoundSpace DJ', 'music.mp3', 'purple')");
    await pool.query("INSERT INTO songs (title, artist, file_name, theme_color) VALUES ('신나는 런닝머신 비트', 'Workout Music', 'music.mp3', 'emerald')");
    console.log("💾 DBMS (PostgreSQL): 초기 음악 테이블 세팅 완료!");
  }
}

// 초기화 가동
initDB().catch(err => console.error("🚨 PostgreSQL 연결 실패 (로컬에 DB가 안 켜져 있으면 에러가 날 수 있으나 Docker 빌드 시 해결됩니다):", err.message));

// 🌟 [API] 음악 목록 가져오기 (PostgreSQL Query)
app.get('/api/songs', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, artist, file_name AS "fileName", theme_color AS "themeColor" FROM songs');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PostgreSQL 조회 오류" });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: "🎉 PostgreSQL 기반 서버 가동 중!" });
});

app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});