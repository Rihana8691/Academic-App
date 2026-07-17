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
    `CREATE TABLE IF NOT EXISTS topic_images (id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER, image_uri TEXT, FOREIGN KEY (topic_id) REFERENCES revision_topics(id));`,
    `CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, day_of_week TEXT, start_time TEXT, end_time TEXT, room TEXT, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, course_id INTEGER, name TEXT NOT NULL, deadline TEXT, status TEXT DEFAULT 'pending', priority TEXT, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, text_content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS note_images (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER, image_uri TEXT, FOREIGN KEY (note_id) REFERENCES notes(id));`,
    `CREATE TABLE IF NOT EXISTS schedule_exceptions (id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER, date TEXT NOT NULL, status TEXT NOT NULL, note TEXT, FOREIGN KEY (schedule_id) REFERENCES schedule(id));`,
    `CREATE TABLE IF NOT EXISTS prayers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT NOT NULL, fajr INTEGER DEFAULT 0, dhuhr INTEGER DEFAULT 0, asr INTEGER DEFAULT 0, maghrib INTEGER DEFAULT 0, isha INTEGER DEFAULT 0, FOREIGN KEY (user_id) REFERENCES users(id));`,
    `CREATE TABLE IF NOT EXISTS personal_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, text_content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));`,
    `CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT DEFAULT 'checkbox-outline', category TEXT DEFAULT 'Personal', priority TEXT DEFAULT 'medium', reminder_time TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS habit_tracking (id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER, date TEXT NOT NULL, completed INTEGER DEFAULT 0, FOREIGN KEY (habit_id) REFERENCES habits(id));`,
    `CREATE TABLE IF NOT EXISTS habit_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT DEFAULT 'checkbox-outline', category TEXT DEFAULT 'Personal', priority TEXT DEFAULT 'medium');`,
    `CREATE TABLE IF NOT EXISTS assessment_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, group_name TEXT, weight REAL DEFAULT 0, rounded_score REAL, rounded_total REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (course_id) REFERENCES courses(id));`,
    `CREATE TABLE IF NOT EXISTS assessment_group_items (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER, assessment_id INTEGER, FOREIGN KEY (group_id) REFERENCES assessment_groups(id), FOREIGN KEY (assessment_id) REFERENCES assessments(id));`,
    `CREATE TABLE IF NOT EXISTS rounding_history (id INTEGER PRIMARY KEY AUTOINCREMENT, assessment_id INTEGER, group_id INTEGER, raw_score REAL, raw_total REAL, rounded_score REAL, rounded_total REAL, reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (assessment_id) REFERENCES assessments(id), FOREIGN KEY (group_id) REFERENCES assessment_groups(id));`,
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
    { table: 'habits', col: 'category', type: 'TEXT DEFAULT "Personal"' },
    { table: 'habits', col: 'priority', type: 'TEXT DEFAULT "medium"' },
    { table: 'habits', col: 'reminder_time', type: 'TEXT' },
    { table: 'revision_topics', col: 'understanding_level', type: 'TEXT DEFAULT "not_fully"' },
    { table: 'revision_topics', col: 'revision_notes', type: 'TEXT' },
    { table: 'revision_topics', col: 'image_path', type: 'TEXT' },
    { table: 'assessments', col: 'rounded_score', type: 'REAL' },
    { table: 'assessments', col: 'rounded_total', type: 'REAL' },
    { table: 'assessments', col: 'is_rounded', type: 'INTEGER DEFAULT 0' },
    { table: 'exams', col: 'obtained_marks', type: 'REAL' },
    { table: 'exams', col: 'total_marks', type: 'REAL' },
    { table: 'exams', col: 'weight', type: 'REAL DEFAULT 0' },
    { table: 'exams', col: 'rounded_score', type: 'REAL' },
    { table: 'exams', col: 'rounded_total', type: 'REAL' },
    { table: 'exams', col: 'is_rounded', type: 'INTEGER DEFAULT 0' },
    { table: 'assessment_groups', col: 'weight', type: 'REAL DEFAULT 0' },
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