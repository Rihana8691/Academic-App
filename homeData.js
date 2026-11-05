// Pure data helpers for the Home and Terms tabs. No UI in here, so it can be tested.
import {
  getUser, getAllSemestersWithCourses, getPendingTasks, getAllAttendanceSummaries,
  getTodaysClasses, getTomorrowsClasses, getUpcomingDeadlines, getExamsForCourse,
  getTasksByCourse, getGoalAnalysis, getCourseById, getPrayers, getDailyCompletionRate,
} from './dbHelpers';
import { calculateOverallCGPA } from './gpaCalculator';

export function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d - t) / 86400000);
}

export function dayLabel(d) {
  if (d === null || d === undefined) return '';
  if (d < 0) return 'Overdue';
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `${d} days`;
}

// 'urgent' (3 days or less, or overdue), 'soon' (up to a week), otherwise 'calm'
export function urgency(d) {
  if (d === null || d === undefined) return 'calm';
  if (d <= 3) return 'urgent';
  if (d <= 7) return 'soon';
  return 'calm';
}

function toMin(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

export function pickClasses(today, tomorrow, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const remaining = today.filter((c) => toMin(c.end_time) >= mins);
  const active = remaining.filter((c) => c.exceptionStatus !== 'cancelled');
  let next = active[0] || null;
  let nextDay = 'today';
  if (!next) {
    const t = tomorrow.find((c) => c.exceptionStatus !== 'cancelled');
    if (t) { next = t; nextDay = 'tomorrow'; }
  }
  return { remaining, tomorrow, next, nextDay };
}

// One group per day, so several things due on the same day share a single card.
export function groupByDay(items) {
  const map = new Map();
  items.forEach((x) => {
    if (!map.has(x.days)) map.set(x.days, { days: x.days, date: x.date, items: [] });
    map.get(x.days).items.push(x);
  });
  return [...map.values()].sort((a, b) => a.days - b.days);
}

export function loadHomeData(now = new Date()) {
  const user = getUser() || {};
  const all = getAllSemestersWithCourses();
  const graded = all.flatMap((s) =>
    (s.courses || []).filter((c) => c.grade).map((c) => ({
      creditHours: c.credit_hours, grade: c.grade, courseCode: c.course_code,
    }))
  );
  const cg = calculateOverallCGPA(user.previous_cgpa || 0, user.previous_credits || 0, graded);

  const fromDeadlines = (getUpcomingDeadlines() || []).map((d, i) => ({
    key: `d${i}`, title: d.type, sub: d.course_name, date: d.date, days: daysUntil(d.date, now),
  }));
  const pending = getPendingTasks() || [];
  // Tasks without a course are not included in getUpcomingDeadlines, so add them here.
  const general = pending.filter((t) => !t.course_id && t.deadline).map((t) => ({
    key: `t${t.id}`, title: t.name, sub: 'General', date: t.deadline, days: daysUntil(t.deadline, now),
  }));
  const upNext = [...fromDeadlines, ...general]
    .filter((x) => x.days !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  const ordered = [...all].sort((a, b) => (b.year_number || 1) - (a.year_number || 1) || b.id - a.id);
  const cur = ordered[0] || null;
  const term = cur ? {
    id: cur.id, name: cur.name, year: cur.year_number || 1,
    total: (cur.courses || []).length,
    done: (cur.courses || []).filter((c) => c.is_finished === 1).length,
  } : null;

  const attendance = getAllAttendanceSummaries() || [];

  // Same date key the Daily log screen uses, so both always agree.
  const dateKey = now.toISOString().split('T')[0];
  const day = { prayers: [0, 0, 0, 0, 0], habitsDone: 0, habitsTotal: 0 };
  try {
    const p = getPrayers(dateKey);
    day.prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => (p && p[k] ? 1 : 0));
    const r = getDailyCompletionRate(dateKey);
    day.habitsDone = r.completed;
    day.habitsTotal = r.total;
  } catch (e) { /* daily log tables not ready: show zeros */ }

  return {
    userName: user.name || 'Student',
    cgpa: cg.cgpa,
    credits: cg.totalCredits,
    pendingCount: pending.length,
    upNext,
    upNextGroups: groupByDay(upNext),
    classes: pickClasses(getTodaysClasses() || [], getTomorrowsClasses() || [], now),
    attendance,
    warnings: attendance.filter((a) => a.isWarning),
    needsRecord: (user.previous_credits || 0) === 0 && (user.year || 1) > 1,
    term,
    day,
    dateKey,
  };
}

function courseStatus(c, now) {
  const finished = c.is_finished === 1;
  let days = null;
  let nextText = '';
  if (!finished) {
    const events = [];
    (getExamsForCourse(c.id) || []).forEach((e) => {
      const d = daysUntil(e.exam_date, now);
      if (d !== null && d >= 0) events.push({ d, text: `${e.exam_type || 'Exam'} exam · ${dayLabel(d)}` });
    });
    (getTasksByCourse(c.id) || []).filter((t) => t.status === 'pending' && t.deadline).forEach((t) => {
      const d = daysUntil(t.deadline, now);
      if (d !== null) events.push({ d, text: `${t.name} · ${dayLabel(d)}` });
    });
    events.sort((a, b) => a.d - b.d);
    if (events[0]) { days = events[0].d; nextText = events[0].text; }
  }
  const u = urgency(days);
  return {
    id: c.id,
    name: c.name,
    code: String(c.course_code || c.name).replace(/\s+/g, '').slice(0, 3).toUpperCase(),
    credits: c.credit_hours,
    grade: c.grade || null,
    finished,
    days,
    nextText,
    status: finished ? 'done' : u,
  };
}

export function loadTermsData(now = new Date()) {
  const all = getAllSemestersWithCourses();
  const ordered = [...all].sort((a, b) => (b.year_number || 1) - (a.year_number || 1) || b.id - a.id);
  const current = ordered[0] || null;

  const grouped = {};
  ordered.forEach((s) => { const y = s.year_number || 1; (grouped[y] = grouped[y] || []).push(s); });
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a).map((y) => ({ year: y, semesters: grouped[y] }));

  let road = [];
  if (current) {
    road = (current.courses || []).map((c) => courseStatus(c, now));
    const done = road.filter((r) => r.finished).sort((a, b) => a.id - b.id);
    const open = road.filter((r) => !r.finished).sort((a, b) => {
      if (a.days === null && b.days === null) return a.id - b.id;
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
    road = [...done, ...open];
  }
  return { current, years, road, attendance: getAllAttendanceSummaries() || [] };
}

export function loadCourseGoal(courseId) {
  const c = getCourseById(courseId);
  if (!c) return null;
  const g = getGoalAnalysis(courseId);
  const target = c.target_score || 85;
  const current = parseFloat(g.currentScore) || 0;
  const left = parseFloat(g.remainingMistakePoints) || 0;
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  let message;
  if (!g.weightUsed) message = `Nothing graded yet. You can lose up to ${100 - target} points and still reach ${target}%.`;
  else if (g.isImpossible) message = `Reaching ${target}% is out of reach now. You may want to lower the target.`;
  else message = `You can still lose ${left.toFixed(1)} points and reach ${target}%.${g.isAtRisk ? ' It needs a strong finish.' : ''}`;
  return { target, current, pct, message, impossible: !!g.isImpossible, atRisk: !!g.isAtRisk };
}

export function roadLayout(n) {
  const points = [];
  for (let i = 0; i < n; i++) points.push({ x: n === 1 ? 140 : (i % 2 === 0 ? 70 : 210), y: 44 + i * 82 });
  return { points, height: 44 + Math.max(0, n - 1) * 82 + 66 };
}

export function roadPaths(points, road) {
  const firstOpen = road.findIndex((r) => !r.finished);
  let solid = '';
  let dashed = '';
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = `M${a.x} ${a.y} C${a.x} ${a.y + 41} ${b.x} ${b.y - 41} ${b.x} ${b.y} `;
    if (road[i + 1].finished || i + 1 === firstOpen) solid += seg; else dashed += seg;
  }
  return { solid: solid.trim(), dashed: dashed.trim() };
}
