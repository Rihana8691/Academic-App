import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadHomeData } from '../homeData';
import { updatePrayer } from '../dbHelpers';
import { getClassCountdown } from '../utils';
import { useTheme } from '../ThemeContext';
import { Hero, Card, Ring } from '../ui';

const FIELDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [hideBanner, setHideBanner] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    try { setData(loadHomeData()); } catch (e) { console.error('Home load failed', e); }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, 60000); // keeps the class countdown fresh
    return () => clearInterval(id);
  }, [load]));

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const { next, nextDay, remaining, tomorrow } = data.classes;
  const { term, day } = data;
  const prayed = day.prayers.reduce((a, b) => a + b, 0);
  const later = remaining.filter((c) => !next || c.id !== next.id);

  const dashed = { backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 1.5, shadowOpacity: 0, elevation: 0 };
  const cardColors = {
    urgent: { bg: '#F6B8B8', fg: '#501313' },
    soon: { bg: '#FAD9A0', fg: '#412402' },
    calm: { bg: colors.secondary, fg: colors.text },
  };
  const level = (d) => (d <= 3 ? 'urgent' : d <= 7 ? 'soon' : 'calm');

  function togglePrayer(i) {
    updatePrayer(data.dateKey, FIELDS[i], data.day.prayers[i] ? 0 : 1);
    load();
  }

  const Head = ({ title, action, onAction }) => (
    <View style={styles.head}>
      <Text style={[styles.h2, { color: colors.text }]}>{title}</Text>
      {action ? <TouchableOpacity onPress={onAction}><Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{action}</Text></TouchableOpacity> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Hero top style={{ paddingBottom: 24 }}>
          <Text style={styles.greet}>{getGreeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>{data.userName}</Text>
          <View style={styles.ringRow}>
            <Ring size={88} pct={(data.cgpa / 4) * 100}>
              <Text style={styles.ringText}>{data.cgpa.toFixed(2)}</Text>
            </Ring>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Your CGPA</Text>
              <Text style={styles.heroLine}>{data.credits} credits earned</Text>
              <Text style={styles.heroSub}>out of 4.00</Text>
            </View>
          </View>
        </Hero>

        {data.needsRecord && !hideBanner && (
          <Card style={[styles.banner, { backgroundColor: colors.secondary, shadowOpacity: 0, elevation: 0 }]}>
            <Ionicons name="time-outline" size={20} color={colors.accent} />
            <Text style={[styles.bannerText, { color: colors.text }]}>Started mid-way? Add your previous CGPA and credits.</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.bt }]} onPress={() => navigation.navigate('UserSetup')}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHideBanner(true)} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.subText} />
            </TouchableOpacity>
          </Card>
        )}

        {/* two tiles side by side */}
        <View style={[styles.pair, { marginTop: 12 }]}>
          {term ? (
            <TouchableOpacity style={[styles.tile, { backgroundColor: colors.secondary, borderColor: 'transparent' }]} onPress={() => navigation.navigate('Terms')}>
              <Text style={[styles.lab, { color: colors.subText }]}>THIS TERM</Text>
              <View style={styles.termRow}>
                <Ring size={50} stroke={6} pct={term.total ? (term.done / term.total) * 100 : 0} color={colors.bt} track={colors.card}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{term.done}/{term.total}</Text>
                </Ring>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tileTitle, { color: colors.text }]} numberOfLines={1}>{term.name}</Text>
                  <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>Year {term.year}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.tile, dashed, { borderColor: colors.border }]} onPress={() => navigation.navigate('AddSemester')}>
              <Text style={[styles.lab, { color: colors.subText }]}>THIS TERM</Text>
              <Text style={[styles.tileTitle, { color: colors.text, marginTop: 8 }]}>Add your first term</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tile, data.pendingCount > 0 ? { backgroundColor: colors.warn, borderColor: 'transparent' } : { ...dashed, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Tasks')}
          >
            <Text style={[styles.lab, { color: colors.subText }]}>TO DO</Text>
            <Text style={[styles.big, { color: data.pendingCount > 0 ? colors.hl : colors.subText }]}>{data.pendingCount}</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>tasks pending</Text>
          </TouchableOpacity>
        </View>

        {/* sideways strip */}
        <Head title="Up next" action="See all" onAction={() => navigation.navigate('Tasks')} />
        {data.upNext.length === 0 ? (
          <TouchableOpacity style={[styles.tile, dashed, { borderColor: colors.border, marginHorizontal: 14 }]} onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>Nothing due soon</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 3 }}>Exams, assignments and tasks appear here as cards. Tap to add a task.</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {data.upNextGroups.map((g) => {
              const c = cardColors[level(g.days)];
              const late = g.days < 0, today = g.days === 0, many = g.items.length > 1;
              return (
                <TouchableOpacity key={'g' + g.days} style={[styles.upCard, many && styles.upCardWide, { backgroundColor: c.bg }]} onPress={() => navigation.navigate('Tasks')}>
                  <View style={styles.between}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={{ color: c.fg, fontSize: late || today ? 22 : 28, fontWeight: '800' }}>{late ? 'Late' : today ? 'Today' : g.days}</Text>
                      {!late && !today && <Text style={{ color: c.fg, fontSize: 12, fontWeight: '700' }}>{g.days === 1 ? 'day' : 'days'}</Text>}
                    </View>
                    {many && <Text style={{ color: c.fg, fontSize: 11, fontWeight: '800', opacity: 0.8 }}>{g.items.length} things</Text>}
                  </View>
                  <View style={{ marginTop: 'auto', gap: many ? 5 : 0 }}>
                    {g.items.slice(0, 3).map((x) => (
                      <View key={x.key}>
                        <Text style={{ color: c.fg, fontSize: 13, fontWeight: '800' }} numberOfLines={many ? 1 : 2}>{x.title}</Text>
                        <Text style={{ color: c.fg, fontSize: 12, fontWeight: '600', opacity: 0.75 }} numberOfLines={1}>{x.sub}</Text>
                      </View>
                    ))}
                    {g.items.length > 3 && <Text style={{ color: c.fg, fontSize: 11, fontWeight: '800' }}>+{g.items.length - 3} more</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* bold next-class card */}
        <Head title="Classes today" />
        {next ? (
          <>
            <TouchableOpacity activeOpacity={0.9} style={[styles.feat, { backgroundColor: colors.bt }]} onPress={() => setOpen(!open)}>
              <View style={styles.between}>
                <Text style={styles.featLab}>{nextDay === 'tomorrow' ? 'NEXT CLASS · TOMORROW' : 'NEXT CLASS'}</Text>
                <View style={styles.pill}><Text style={styles.pillText}>{nextDay === 'tomorrow' ? 'Tomorrow' : getClassCountdown(next.start_time, next.end_time)}</Text></View>
              </View>
              <View style={styles.featRow}>
                <Text style={styles.featTime}>{next.start_time}</Text>
                <Text style={styles.featName} numberOfLines={1}>{next.course_name}</Text>
              </View>
              <Text style={styles.featSub}>{next.class_type} · {next.room || 'TBA'}</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {later.map((c) => {
                const cancelled = c.exceptionStatus === 'cancelled';
                return (
                  <View key={c.id} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[{ color: cancelled ? colors.subText : colors.text, fontSize: 12, fontWeight: '700' }, cancelled && { textDecorationLine: 'line-through' }]}>{c.start_time} {c.course_name}</Text>
                    {cancelled && <Text style={{ color: colors.error, fontSize: 11, fontWeight: '800' }}> cancelled</Text>}
                  </View>
                );
              })}
              {tomorrow.length > 0 && (
                <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '700' }}>Tomorrow: {tomorrow.length} class{tomorrow.length === 1 ? '' : 'es'}</Text>
                </View>
              )}
            </ScrollView>
            {open && tomorrow.length > 0 && (
              <Card style={{ marginHorizontal: 14, marginTop: 8 }}>
                <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Tomorrow</Text>
                {tomorrow.map((c) => <ClassLine key={c.id} c={c} colors={colors} />)}
              </Card>
            )}
          </>
        ) : (
          <View style={[styles.tile, dashed, { borderColor: colors.border, marginHorizontal: 14 }]}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>No classes today</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 3 }}>Add a class time in a course's Schedule tab and it will show here.</Text>
          </View>
        )}

        {/* compact attendance grid */}
        <Head title="Attendance" />
        {data.attendance.length === 0 ? (
          <View style={[styles.tile, dashed, { borderColor: colors.border, marginHorizontal: 14 }]}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>No attendance policy yet</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 3 }}>Set one in a course's Absence tab to track how many absences you have left.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {data.attendance.map((a) => (
              <TouchableOpacity
                key={a.courseId}
                style={[styles.att, { backgroundColor: a.isWarning ? colors.warn : colors.card, borderColor: a.isWarning ? colors.hl : colors.border }]}
                onPress={() => navigation.navigate('CourseDetail', { courseId: a.courseId, courseName: a.courseName })}
              >
                <Ring size={30} stroke={4} pct={a.percentage} color={a.isWarning ? colors.error : colors.bt} track={colors.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attName, { color: colors.text }]} numberOfLines={1}>{a.courseName}</Text>
                  <Text style={{ color: a.isWarning ? colors.error : colors.subText, fontSize: 11, fontWeight: '800' }}>
                    {a.remaining < 0 ? 'Over limit' : `${a.remaining} left`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* my day */}
        <Head title="My day" action="Daily log" onAction={() => navigation.navigate('Personal')} />
        <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 14 }]}>
          <View style={styles.between}>
            <Text style={[styles.lab, { color: colors.subText }]}>PRAYERS</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '700' }}>{prayed} of 5 prayers</Text>
          </View>
          <View style={[styles.between, { marginTop: 10 }]}>
            {NAMES.map((n, i) => (
              <TouchableOpacity key={n} style={{ alignItems: 'center' }} onPress={() => togglePrayer(i)}>
                <View style={[styles.pd, { backgroundColor: day.prayers[i] ? colors.bt : colors.secondary }]}>
                  <Text style={{ color: day.prayers[i] ? '#fff' : colors.subText, fontSize: 12, fontWeight: '800' }}>{day.prayers[i] ? '✓' : n[0]}</Text>
                </View>
                <Text style={{ color: colors.subText, fontSize: 11, fontWeight: '600', marginTop: 3 }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {day.habitsTotal > 0 && (
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 10 }}>{day.habitsDone} of {day.habitsTotal} habits done today</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ClassLine({ c, colors }) {
  const cancelled = c.exceptionStatus === 'cancelled';
  return (
    <View style={styles.line}>
      <Text style={{ width: 46, color: colors.text, fontWeight: '800', fontSize: 12 }}>{c.start_time}</Text>
      <Text style={[{ flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' }, cancelled && { textDecorationLine: 'line-through', opacity: 0.55 }]} numberOfLines={1}>
        {c.course_name} · {c.class_type}
      </Text>
      {cancelled && <Text style={{ color: colors.error, fontSize: 11, fontWeight: '800' }}>Cancelled</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  greet: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  ringText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  heroLine: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 12 },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 14, marginTop: 18, marginBottom: 9 },
  h2: { fontSize: 16, fontWeight: '800' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pair: { flexDirection: 'row', gap: 10, marginHorizontal: 14 },
  tile: { flex: 1, borderRadius: 20, padding: 12, borderWidth: 0.5 },
  lab: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  tileTitle: { fontSize: 15, fontWeight: '800' },
  big: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  strip: { paddingHorizontal: 14, paddingBottom: 4, gap: 10 },
  upCard: { width: 118, minHeight: 112, borderRadius: 20, padding: 12 },
  upCardWide: { width: 168 },
  feat: { marginHorizontal: 14, borderRadius: 24, padding: 14 },
  featLab: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  pill: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  featRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8 },
  featTime: { color: '#fff', fontSize: 34, fontWeight: '800' },
  featName: { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  featSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  chips: { paddingHorizontal: 14, paddingTop: 8, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 14 },
  att: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 8 },
  attName: { fontSize: 12, fontWeight: '800' },
  pd: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});
