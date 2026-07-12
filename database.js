import * as SQLite from 'expo-sqlite';

// Opens (or creates) the database file on the device
export const db = SQLite.openDatabaseSync('studentapp.db');

// Call this once when the app starts, to make sure all tables exist
export function initDatabase() {
  // 1. CORE TABLES (Safe creation)
  const tables = [
    `PRAGMA journal_mode = WAL;`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, university TEXT, previous_cgpa REAL, previous_credits INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS semesters (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT NOT NULL, semester_gpa REAL, total_credits INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));`,
    `CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, semester_id INTEGER, name TEXT NOT NULL, course_code TEXT, credit_hours REAL NOT NULL, grade TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (semester_id) REFERENCES semesters(id));`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, total_classes INTEGER, allowed_absence INTEGER, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS absence_dates (id INTEGER PRIMARY KEY AUTOINCREMENT, attendance_id INTEGER, date TEXT, FOREIGN KEY (attendance_id) REFERENCES attendance(id));`,
    `CREATE TABLE IF NOT EXISTS assessments (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, name TEXT NOT NULL, total_marks REAL, obtained_marks REAL, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, exam_date TEXT, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS revision_topics (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, topic TEXT NOT NULL, notes TEXT, importance TEXT DEFAULT 'medium', completed INTEGER DEFAULT 0, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, day_of_week TEXT, start_time TEXT, end_time TEXT, room TEXT, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, course_id INTEGER, name TEXT NOT NULL, deadline TEXT, status TEXT DEFAULT 'pending', priority TEXT, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, text_content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS note_images (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER, image_uri TEXT, FOREIGN KEY (note_id) REFERENCES notes(id));`,
    `CREATE TABLE IF NOT EXISTS schedule_exceptions (id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER, date TEXT NOT NULL, status TEXT NOT NULL, note TEXT, FOREIGN KEY (schedule_id) REFERENCES schedule(id));`,
    `CREATE TABLE IF NOT EXISTS prayers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT NOT NULL, fajr INTEGER DEFAULT 0, dhuhr INTEGER DEFAULT 0, asr INTEGER DEFAULT 0, maghrib INTEGER DEFAULT 0, isha INTEGER DEFAULT 0, FOREIGN KEY (user_id) REFERENCES users(id));`,
    `CREATE TABLE IF NOT EXISTS personal_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, text_content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));`,
  ];

  // 2. COLUMN MIGRATIONS (Adding new features to existing tables)
  const migrations = [
    { table: 'users', col: 'student_id', type: 'TEXT' },
    { table: 'users', col: 'year', type: 'INTEGER' },
    { table: 'absence_dates', col: 'reason', type: 'TEXT' },
    { table: 'exams', col: 'exam_type', type: 'TEXT DEFAULT "Final"' },
    { table: 'courses', col: 'target_score', type: 'REAL DEFAULT 85.0' },
    { table: 'assessments', col: 'weight', type: 'REAL DEFAULT 0.0' },
    { table: 'assessments', col: 'original_marks', type: 'REAL' },
    { table: 'assessments', col: 'category', type: 'TEXT DEFAULT "Theory"' },
    { table: 'assessments', col: 'deadline', type: 'TEXT' },
    { table: 'schedule', col: 'class_type', type: 'TEXT DEFAULT "Lecture"' },
    { table: 'semesters', col: 'year_number', type: 'INTEGER DEFAULT 1' },
    { table: 'prayers', col: 'no_sugar', type: 'INTEGER DEFAULT 0' },
    { table: 'prayers', col: 'read_book', type: 'INTEGER DEFAULT 0' },
    { table: 'prayers', col: 'study_time', type: 'INTEGER DEFAULT 0' },
    { table: 'users', col: 'theme', type: 'TEXT DEFAULT "light"' },
  ];

  // Execute Table Creation
  tables.forEach(sql => {
    try { db.execSync(sql); } catch (e) { console.error("Table Error:", e); }
  });

  // Execute Migrations
  migrations.forEach(m => {
    try {
      db.execSync(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.type};`);
    } catch (e) {
      // Column already exists, safe to ignore
    }
  });

  console.log('Database initialized safely. All data preserved.');
}