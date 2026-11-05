import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { loadTermsData, loadCourseGoal, roadLayout, roadPaths } from '../homeData';
import { useTheme } from '../ThemeContext';
import { Card, IconBubble, Ring, statusBarPad } from '../ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const VB_W = 280;

const STATUS = {
  done: { bg: '#B7D9A0', fg: '#1F4A0E' },
  urgent: { bg: '#F09595', fg: '#501313' },
  soon: { bg: '#FAC775', fg: '#412402' },
};

export default function TermsScreen({ navigation }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState({});
  const [width, setWidth] = useState(300);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useFocusEffect(useCallback(() => {
    try {
      const d = loadTermsData();
      setData(d);
      setSel((prev) => {
        if (prev && d.road.some((r) => r.id === prev)) return prev;
        const firstOpen = d.road.find((r) => !r.finished);
        return (firstOpen || d.road[0] || {}).id ?? null;
      });
      setOpen((prev) => (Object.keys(prev).length || !d.years[0] ? prev : { [d.years[0].year]: true }));
    } catch (e) { console.error('Terms load failed', e); }
  }, []));

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const { current, years, road, attendance } = data;
  const doneCount = road.filter((r) => r.finished).length;
  const selected = road.find((r) => r.id === sel) || null;
  const goal = selected && !selected.finished ? safeGoal(selected.id) : null;
  const att = selected ? attendance.find((a) => a.courseId === selected.id) : null;

  const layout = roadLayout(road.length);
  const paths = roadPaths(layout.points, road);
  const scale = width / VB_W;
  const firstOpenId = (road.find((r) => !r.finished) || {}).id;

  const haloR = pulse.interpolate({ inputRange: [0, 1], outputRange: [27, 41] });
  const haloO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: statusBarPad() + 8, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>Terms</Text>
        <TouchableOpacity style={[styles.newBtn, { backgroundColor: colors.bt }]} onPress={() => navigation.navigate('AddSemester')}>
          <Ionicons name="add" size={15} color="#fff" />
          <Text style={styles.newBtnText}>New term</Text>
        </TouchableOpacity>
      </View>

      {!current ? (
        <Card style={styles.block}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>No terms yet</Text>
          <Text style={{ color: colors.subText, fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 19 }}>Add your first term and its courses will appear here as a road you can follow.</Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: colors.bt }]} onPress={() => navigation.navigate('AddSemester')}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Add a term</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('SemesterDetail', { semesterId: current.id, semesterName: current.name })}>
            <Text style={[styles.sub, { color: colors.subText }]}>
              Year {current.year_number || 1} · {current.name} · {doneCount} of {road.length} courses done  <Text style={{ color: colors.accent, fontWeight: '800' }}>Open</Text>
            </Text>
          </TouchableOpacity>

          {road.length === 0 ? (
            <Card style={styles.block}>
              <Text style={{ color: colors.subText, fontWeight: '600' }}>This term has no courses yet.</Text>
              <TouchableOpacity style={[styles.cta, { backgroundColor: colors.bt }]} onPress={() => navigation.navigate('AddCourse', { semesterId: current.id })}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Add a course</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={{ marginHorizontal: 14 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
              <View style={{ width, height: layout.height * scale }}>
              <Svg width={width} height={layout.height * scale} viewBox={`0 0 ${VB_W} ${layout.height}`}>
                {!!paths.dashed && <Path d={paths.dashed} stroke={colors.border} strokeWidth={5} strokeDasharray="2 10" strokeLinecap="round" fill="none" />}
                {!!paths.solid && <Path d={paths.solid} stroke={colors.bt} strokeWidth={5} strokeLinecap="round" fill="none" />}
                {road.map((c, i) => {
                  const p = layout.points[i];
                  const isNow = c.id === firstOpenId && (c.status === 'urgent' || c.status === 'soon');
                  const r = isNow ? 27 : 22;
                  const st = STATUS[c.status] || { bg: colors.secondary, fg: colors.accent };
                  return (
                    <G key={c.id}>
                      {isNow && <AnimatedCircle cx={p.x} cy={p.y} r={haloR} stroke={c.status === 'urgent' ? '#E24B4A' : '#BA7517'} strokeWidth={2} fill="none" opacity={haloO} />}
                      <Circle cx={p.x} cy={p.y} r={r} fill={st.bg} stroke={sel === c.id ? colors.text : colors.card} strokeWidth={3} />
                      <SvgText x={p.x} y={p.y + 5} fontSize={c.finished ? 13 : 12} fontWeight="700" fill={st.fg} textAnchor="middle">{c.finished && c.grade ? c.grade : c.code}</SvgText>
                      <SvgText x={p.x} y={p.y + r + 15} fontSize={11} fill={colors.subText} textAnchor="middle">{c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name}</SvgText>
                      {c.finished && <Circle cx={p.x + 16} cy={p.y - 16} r={8} fill="#3B6D11" />}
                      {c.finished && <SvgText x={p.x + 16} y={p.y - 12} fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle">✓</SvgText>}
                    </G>
                  );
                })}
              </Svg>
              {/* SVG press handlers are unreliable on the new architecture, so each stop gets a native touch target */}
              {road.map((c, i) => {
                const p = layout.points[i];
                return (
                  <TouchableOpacity
                    key={`hit${c.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${c.name}`}
                    onPress={() => setSel(c.id)}
                    style={{ position: 'absolute', left: p.x * scale - 38, top: p.y * scale - 36, width: 76, height: 90 }}
                  />
                );
              })}
              </View>
            </View>
          )}

          {selected && (
            <Card style={styles.block}>
              <View style={styles.goalRow}>
                {goal && (
                  <Ring size={66} stroke={8} pct={goal.pct} color={goal.impossible ? colors.error : colors.bt} track={colors.secondary}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{goal.pct}%</Text>
                  </Ring>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.between}>
                    <Text style={{ color: colors.subText, fontSize: 11, fontWeight: '700' }}>{selected.finished ? 'Finished' : 'Goal coach'}</Text>
                    {goal && <Text style={[styles.tag, { backgroundColor: colors.secondary, color: colors.text }]}>Target {goal.target}%</Text>}
                  </View>
                  <Text style={[styles.rowTitle, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>{selected.name}</Text>
                  <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 3, lineHeight: 17 }}>
                    {selected.finished
                      ? `Grade ${selected.grade || '—'} · ${selected.credits} credits earned.`
                      : [selected.nextText, goal ? goal.message : null].filter(Boolean).join('. ')}
                  </Text>
                </View>
              </View>

              {!selected.finished && (
                <View style={[styles.attBlock, { borderTopColor: colors.border }]}>
                  {att ? (
                    <>
                      <View style={styles.between}>
                        <Text style={{ color: att.isWarning ? colors.error : colors.subText, fontSize: 12, fontWeight: '700' }}>
                          Attendance {att.percentage}% · {att.remaining < 0 ? 'over the limit' : `${att.remaining} absence${att.remaining === 1 ? '' : 's'} left`}
                        </Text>
                      </View>
                      <View style={[styles.bar, { backgroundColor: colors.secondary }]}>
                        <View style={{ width: `${Math.max(0, Math.min(100, att.percentage))}%`, height: '100%', borderRadius: 4, backgroundColor: att.isWarning ? colors.error : colors.bt }} />
                      </View>
                    </>
                  ) : (
                    <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>No attendance policy yet. Set one in the course's Absence tab.</Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={[styles.cta, { backgroundColor: colors.bt }]} onPress={() => navigation.navigate('CourseDetail', { courseId: selected.id, courseName: selected.name })}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Open course</Text>
              </TouchableOpacity>
            </Card>
          )}
        </>
      )}

      {years.length > 0 && <Text style={[styles.h2, { color: colors.text }]}>Academic years</Text>}
      {years.map((y) => {
        const isOpen = !!open[y.year];
        return (
          <View key={y.year}>
            <Card style={[styles.block, styles.yearRow]} onPress={() => setOpen({ ...open, [y.year]: !isOpen })}>
              <IconBubble name={isOpen ? 'folder-open' : 'folder'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Year {y.year}</Text>
                <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>{y.semesters.length} semester{y.semesters.length === 1 ? '' : 's'}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} color={colors.accent} />
            </Card>
            {isOpen && y.semesters.map((s) => (
              <Card key={s.id} style={[styles.block, styles.yearRow, { marginLeft: 28 }]} onPress={() => navigation.navigate('SemesterDetail', { semesterId: s.id, semesterName: s.name })}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{s.name}</Text>
                  <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>{(s.courses || []).length} courses</Text>
                </View>
                <View style={[styles.gpa, { backgroundColor: s.semester_gpa ? colors.bt : colors.secondary }]}>
                  <Text style={{ color: s.semester_gpa ? '#fff' : colors.subText, fontWeight: '800', fontSize: 12 }}>{s.semester_gpa ? Number(s.semester_gpa).toFixed(2) : '—'}</Text>
                </View>
              </Card>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function safeGoal(id) {
  try { return loadCourseGoal(id); } catch (e) { return null; }
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  newBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  sub: { marginHorizontal: 14, marginTop: 4, marginBottom: 6, fontSize: 12, fontWeight: '600' },
  block: { marginHorizontal: 14, marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: '800', marginHorizontal: 14, marginTop: 14, marginBottom: 8 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  attBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 0.5 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  cta: { alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, marginTop: 12 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpa: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
});
