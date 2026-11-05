import { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, PanResponder } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getUser, getAllSemestersWithCourses, getAllTasks, updateTaskStatus,
  getAllAttendanceSummaries, getExamsForCourse, getTasksByCourse,
} from '../dbHelpers';
import { calculateOverallCGPA } from '../gpaCalculator';
import { getCountdown } from '../utils';
import { useTheme } from '../ThemeContext';
import { Hero, GlassButton, softShadow } from '../ui';

const CALM = [
  { bg: '#CECBF6', fg: '#3C3489' },
  { bg: '#9FE1CB', fg: '#085041' },
  { bg: '#B5D4F4', fg: '#0C447C' },
];
const SOON = { bg: '#FAC775', fg: '#412402', hl: '#BA7517', pulse: 1800 };
const URGENT = { bg: '#F09595', fg: '#501313', hl: '#A32D2D', pulse: 900 };
const DONE = { bg: '#C0DD97', fg: '#173404' };
const TASK = { bg: '#FFFFFF', fg: '#534AB7' };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d)) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}

/* ---------------- physics ---------------- */
function step(list, dt, W, H) {
  list.forEach((b) => {
    if (b.drag) return;
    b.vx += (Math.random() - 0.5) * 60 * dt;
    b.vy += (Math.random() - 0.5) * 60 * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 60) { b.vx *= 1 - 1.2 * dt; b.vy *= 1 - 1.2 * dt; }
    else if (sp < 14) { b.vx = b.vx * 1.03 + (Math.random() - 0.5) * 2; b.vy = b.vy * 1.03 + (Math.random() - 0.5) * 2; }
    b.x += b.vx * dt; b.y += b.vy * dt;
  });
  list.forEach((b) => {
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.9; }
    if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.9; }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.9; }
    if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.9; }
  });
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], c = list[j];
      const dx = c.x - a.x, dy = c.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01, md = a.r + c.r;
      if (d >= md) continue;
      const nx = dx / d, ny = dy / d, ov = md - d;
      if (!a.drag && !c.drag) { a.x -= nx * ov / 2; a.y -= ny * ov / 2; c.x += nx * ov / 2; c.y += ny * ov / 2; }
      else if (a.drag) { c.x += nx * ov; c.y += ny * ov; }
      else { a.x -= nx * ov; a.y -= ny * ov; }
      const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (rv < 0) {
        const im = (-1.8 * rv) / (1 / a.m + 1 / c.m);
        if (!a.drag) { a.vx -= (im * nx) / a.m; a.vy -= (im * ny) / a.m; }
        if (!c.drag) { c.vx += (im * nx) / c.m; c.vy += (im * ny) / c.m; }
      }
    }
  }
  list.forEach((b) => { b.ax.setValue(b.x - b.r); b.ay.setValue(b.y - b.r); });
}

/* ---------------- bubble ---------------- */
function Bubble({ b, data, selected }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data.style.pulse) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.07, duration: data.style.pulse / 2, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: data.style.pulse / 2, useNativeDriver: true }),
    ]));
    const ping = Animated.loop(Animated.timing(halo, { toValue: 1, duration: data.style.pulse * 1.4, useNativeDriver: true }));
    loop.start(); ping.start();
    return () => { loop.stop(); ping.stop(); };
  }, [data.style.pulse]);

  const finish = (g) => {
    b.drag = false;
    if (b.moved < 8) { b.onSelect(); return; }
    const cl = (v) => Math.max(-300, Math.min(300, v));
    b.vx = cl(g.vx * 600); b.vy = cl(g.vy * 600);
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { b.drag = true; b.sx = b.x; b.sy = b.y; b.moved = 0; b.vx = 0; b.vy = 0; },
    onPanResponderMove: (_, g) => {
      b.moved = Math.max(b.moved, Math.hypot(g.dx, g.dy));
      b.x = Math.min(b.W - b.r, Math.max(b.r, b.sx + g.dx));
      b.y = Math.min(b.H - b.r, Math.max(b.r, b.sy + g.dy));
    },
    onPanResponderRelease: (_, g) => finish(g),
    onPanResponderTerminate: (_, g) => finish(g),
  })).current;

  const size = b.r * 2;
  const s = data.style;
  return (
    <Animated.View
      collapsable={false}
      {...pan.panHandlers}
      style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, zIndex: selected ? 5 : 1, transform: [{ translateX: b.ax }, { translateY: b.ay }] }}
    >
      {s.hl ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: b.r, borderWidth: 2, borderColor: s.hl, opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }] }]}
        />
      ) : null}
      <Animated.View
        style={[styles.bubbleIn, {
          backgroundColor: s.bg, borderRadius: b.r,
          borderColor: selected ? '#26215C' : data.kind === 'task' ? '#6C5CE7' : 'transparent',
          borderStyle: data.kind === 'task' && !selected ? 'dashed' : 'solid',
          borderWidth: data.kind === 'task' ? 2 : 3,
          transform: [{ scale: pulse }],
        }]}
      >
        {data.kind === 'task' ? (
          <Ionicons name="create-outline" size={20} color={s.fg} />
        ) : (
          <>
            <Text style={{ color: s.fg, fontSize: b.r > 36 ? 15 : 13, fontWeight: '800' }} numberOfLines={1}>{data.label}</Text>
            <Text style={{ color: s.fg, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{data.sub}</Text>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function Burst({ x, y, onDone }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(p, { toValue: 1, duration: 650, useNativeDriver: true }).start(onDone); }, []);
  const cols = ['#6C5CE7', '#5DCAA5', '#FAC775', '#ED93B1', '#85B7EB'];
  return (
    <>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 14, dist = 50 + (i % 3) * 12;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute', left: x - 4, top: y - 4, width: 9, height: 9, borderRadius: 5, backgroundColor: cols[i % 5],
              opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * dist] }) },
                { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * dist] }) },
                { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
              ],
            }}
          />
        );
      })}
    </>
  );
}

/* ---------------- screen ---------------- */
export default function DashboardScreen({ navigation }) {
  const { theme, colors, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [cgpa, setCgpa] = useState({ cgpa: 0, totalCredits: 0 });
  const [semesters, setSemesters] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [bursts, setBursts] = useState([]);
  const sim = useRef({});
  const size = useRef({ w: 300, h: 300 });

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  const loadData = useCallback(() => {
    const user = getUser();
    setUserName(user?.name || 'Student');
    const all = getAllSemestersWithCourses();
    const ordered = [...all].sort((a, b) => (b.year_number || 1) - (a.year_number || 1) || b.id - a.id);
    setSemesters(ordered);

    const graded = all.flatMap((s) => (s.courses || []).filter((c) => c.grade).map((c) => ({ creditHours: c.credit_hours, grade: c.grade, courseCode: c.course_code })));
    setCgpa(calculateOverallCGPA(user?.previous_cgpa || 0, user?.previous_credits || 0, graded));

    const att = getAllAttendanceSummaries() || [];
    const latest = ordered[0];
    const courseList = all.flatMap((s) => (s.courses || []).map((c) => ({ ...c, _sem: s.id })));
    const shown = courseList.filter((c) => !c.is_finished || (latest && c._sem === latest.id));

    let calmIdx = 0;
    const courseItems = shown.map((c) => {
      const events = [];
      (getExamsForCourse(c.id) || []).forEach((e) => {
        const d = daysUntil(e.exam_date);
        if (d !== null && d >= 0) events.push({ d, text: `${e.exam_type} exam · ${getCountdown(e.exam_date)}` });
      });
      (getTasksByCourse(c.id) || []).filter((t) => t.status === 'pending').forEach((t) => {
        const d = daysUntil(t.deadline);
        if (d !== null) events.push({ d, text: `${t.name} · ${getCountdown(t.deadline)}` });
      });
      events.sort((a, b) => a.d - b.d);
      const next = events[0];
      let style, sub;
      if (c.is_finished) { style = DONE; sub = c.grade || 'Done'; }
      else if (next && next.d <= 3) { style = URGENT; sub = next.d < 0 ? 'late' : next.d === 0 ? 'today' : `${next.d}d`; }
      else if (next && next.d <= 7) { style = SOON; sub = `${next.d}d`; }
      else { style = CALM[calmIdx++ % CALM.length]; sub = next ? `${next.d}d` : `${c.credit_hours}cr`; }
      const a = att.find((x) => x.courseId === c.id);
      return {
        id: 'c' + c.id, rawId: c.id, kind: 'course', style, sub,
        label: (c.course_code || c.name.slice(0, 3)).toUpperCase().slice(0, 4),
        name: c.name, credits: c.credit_hours, note: next ? next.text : 'Nothing due soon',
        extra: a ? `${a.remaining} absences left` : null, finished: !!c.is_finished, grade: c.grade,
        r: Math.round(20 + (c.credit_hours || 3) * 5.5), rank: c.is_finished ? 3 : style === URGENT ? 0 : style === SOON ? 1 : 2,
      };
    }).sort((a, b) => a.rank - b.rank || b.r - a.r).slice(0, 9);

    const taskItems = (getAllTasks() || []).filter((t) => t.status === 'pending')
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))).slice(0, 6)
      .map((t) => ({ id: 't' + t.id, rawId: t.id, kind: 'task', style: TASK, name: t.name, deadline: t.deadline, r: 24 }));

    const list = [...courseItems, ...taskItems];
    const next = {};
    list.forEach((it) => {
      let s = sim.current[it.id];
      if (!s) {
        const ang = Math.random() * 6.28, sp = 18 + Math.random() * 22;
        s = {
          x: it.r + Math.random() * Math.max(1, size.current.w - it.r * 2),
          y: it.r + Math.random() * Math.max(1, size.current.h - it.r * 2),
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, ax: new Animated.Value(-200), ay: new Animated.Value(-200),
          drag: false, moved: 0, onSelect: () => setSelectedId(it.id),
        };
      }
      s.r = it.r; s.m = it.r * it.r; s.W = size.current.w; s.H = size.current.h;
      next[it.id] = s;
    });
    sim.current = next;
    setBubbles(list);
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    let raf; let last = Date.now();
    const tick = () => {
      const now = Date.now(); const dt = Math.min(0.03, (now - last) / 1000); last = now;
      const list = Object.values(sim.current);
      list.forEach((b) => { b.W = size.current.w; b.H = size.current.h; });
      step(list, dt, size.current.w, size.current.h);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loadData]));

  function markDone(item) {
    const b = sim.current[item.id];
    if (b) setBursts((p) => [...p, { key: Date.now() + '', x: b.x, y: b.y }]);
    updateTaskStatus(item.rawId, 'done');
    setSelectedId(null);
    delete sim.current[item.id];
    loadData();
  }

  const selected = bubbles.find((b) => b.id === selectedId);
  const tasksLeft = bubbles.filter((b) => b.kind === 'task').length;
  const arenaBg = theme === 'light' ? '#E1F5EE' : colors.secondary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Hero top style={{ paddingBottom: 22 }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>Hi, {userName}</Text>
            <Text style={styles.sub}>{cgpa.totalCredits} credits · {tasksLeft} task{tasksLeft === 1 ? '' : 's'} left</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GlassButton name={theme === 'light' ? 'moon' : 'sunny'} onPress={toggleTheme} />
            <GlassButton name="happy-outline" onPress={() => navigation.navigate('Personal')} />
            <GlassButton name="person-outline" onPress={() => navigation.navigate('UserSetup')} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
          <Text style={styles.cgpa}>{cgpa.cgpa.toFixed(2)}</Text>
          <Text style={styles.cgpaLabel}>CGPA</Text>
        </View>
      </Hero>

      <View
        style={[styles.arena, { backgroundColor: arenaBg }]}
        onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
      >
        <View style={styles.legend} pointerEvents="none">
          {[['#CECBF6', 'Calm'], ['#FAC775', 'Soon'], ['#F09595', 'Urgent'], ['#97C459', 'Done']].map(([c, t]) => (
            <View key={t} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: c }]} /><Text style={[styles.legendText, { color: colors.subText }]}>{t}</Text></View>
          ))}
        </View>
        {bubbles.map((it) => (
          <Bubble key={it.id} b={sim.current[it.id]} data={it} selected={it.id === selectedId} />
        ))}
        {bursts.map((bu) => (
          <Burst key={bu.key} x={bu.x} y={bu.y} onDone={() => setBursts((p) => p.filter((x) => x.key !== bu.key))} />
        ))}
        {bubbles.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ color: colors.subText, fontWeight: '700', textAlign: 'center' }}>No courses yet. Add a semester and your bubbles will appear.</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
        {semesters.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.chip, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('SemesterDetail', { semesterId: s.id, semesterName: s.name })}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Y{s.year_number || 1} · {s.name}</Text>
            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>{s.semester_gpa ? s.semester_gpa.toFixed(2) : '—'}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.chip, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('AddSemester')}>
          <Ionicons name="add" size={16} color={colors.buttonText} />
          <Text style={{ color: colors.buttonText, fontWeight: '700', fontSize: 13 }}>Semester</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.panel, softShadow, { backgroundColor: colors.card }]}>
        {!selected && (
          <>
            <Text style={[styles.pTitle, { color: colors.text }]}>Your courses are alive</Text>
            <Text style={[styles.pText, { color: colors.subText }]}>Bigger bubble means more credits. Pulsing means a deadline is close. Drag and throw them, tap for details, and pop the small task bubbles when you finish.</Text>
          </>
        )}
        {selected && selected.kind === 'course' && (
          <>
            <View style={styles.pRow}>
              <Text style={[styles.pTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>{selected.name}</Text>
              <View style={[styles.tag, { backgroundColor: selected.style.bg }]}><Text style={{ color: selected.style.fg, fontWeight: '700', fontSize: 12 }}>{selected.credits} credits</Text></View>
            </View>
            <Text style={[styles.pText, { color: colors.text }]}>{selected.finished ? `Finished${selected.grade ? ' · Grade ' + selected.grade : ''}` : selected.note}</Text>
            {selected.extra ? <Text style={[styles.pText, { color: colors.subText }]}>{selected.extra}</Text> : null}
            <TouchableOpacity style={[styles.pBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('CourseDetail', { courseId: selected.rawId, courseName: selected.name })}>
              <Text style={{ color: colors.buttonText, fontWeight: '700' }}>Open course</Text>
            </TouchableOpacity>
          </>
        )}
        {selected && selected.kind === 'task' && (
          <>
            <Text style={[styles.pTitle, { color: colors.text }]} numberOfLines={1}>{selected.name}</Text>
            <Text style={[styles.pText, { color: colors.subText }]}>{selected.deadline} · {getCountdown(selected.deadline)}</Text>
            <TouchableOpacity style={[styles.pBtn, { backgroundColor: colors.accent }]} onPress={() => markDone(selected)}>
              <Text style={{ color: colors.buttonText, fontWeight: '700' }}>Mark done</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  greet: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  cgpa: { color: '#fff', fontSize: 40, fontWeight: '800', lineHeight: 44 },
  cgpaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  arena: { flex: 1, marginHorizontal: 12, marginTop: 10, borderRadius: 26, overflow: 'hidden' },
  legend: { position: 'absolute', top: 8, left: 12, right: 12, flexDirection: 'row', gap: 12, zIndex: 0 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '600' },
  empty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 30 },
  bubbleIn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  panel: { marginHorizontal: 12, marginBottom: 14, borderRadius: 22, padding: 14, minHeight: 104 },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pTitle: { fontSize: 16, fontWeight: '800' },
  pText: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
});
