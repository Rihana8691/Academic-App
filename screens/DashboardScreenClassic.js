import { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUser, getAllSemestersWithCourses, getPendingTasks, getAllAttendanceSummaries, getTodaysClasses, getTomorrowsClasses, getUpcomingDeadlines } from '../dbHelpers';
import { calculateOverallCGPA } from '../gpaCalculator';
import { getCountdown, getClassCountdown } from '../utils';
import { useTheme } from '../ThemeContext';
import { Hero, Card, IconBubble, GlassButton, Fab, SectionTitle, PASTELS } from '../ui';

export default function DashboardScreen({ navigation }) {
  const { theme, colors, toggleTheme } = useTheme();
  const [years, setYears] = useState([]);
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, totalCredits: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [attendanceSummaries, setAttendanceSummaries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [tomorrowsClasses, setTomorrowsClasses] = useState([]);
  const [userName, setUserName] = useState('');
  const [expandedYear, setExpandedYear] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const reloadClasses = useCallback(() => {
    const now = new Date();
    setTodaysClasses(getTodaysClasses().filter(c => {
      const [h, m] = c.end_time.split(':').map(Number);
      const end = new Date(); end.setHours(h, m, 0, 0);
      return now <= end;
    }));
  }, []);

  const getNextClass = () => {
    const now = new Date();
    return todaysClasses.find(c => {
      const [h, m] = c.start_time.split(':').map(Number);
      const s = new Date(); s.setHours(h, m, 0, 0);
      return s >= now;
    }) || null;
  };

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      setUserName(user?.name || 'Student');
      const all = getAllSemestersWithCourses();
      const grouped = {};
      all.forEach(s => { const y = s.year_number || 1; (grouped[y] = grouped[y] || []).push(s); });
      const arr = Object.keys(grouped).sort((a, b) => b - a).map(y => ({ year: parseInt(y, 10), semesters: grouped[y] }));
      setYears(arr);
      if (arr.length > 0 && expandedYear === null) setExpandedYear(arr[0].year);
      setPendingCount(getPendingTasks().length);
      setAttendanceSummaries(getAllAttendanceSummaries());
      setDeadlines(getUpcomingDeadlines());
      setTomorrowsClasses(getTomorrowsClasses());
      reloadClasses();
      const graded = all.flatMap(s => (s.courses || []).filter(c => c.grade).map(c => ({ creditHours: c.credit_hours, grade: c.grade, courseCode: c.course_code })));
      setCgpaData(calculateOverallCGPA(user?.previous_cgpa || 0, user?.previous_credits || 0, graded));
    }, [reloadClasses])
  );

  const next = getNextClass();
  const groupedDeadlines = deadlines.reduce((acc, d) => { (acc[d.date] = acc[d.date] || []).push(d); return acc; }, {});

  const Stat = ({ icon, label, value, tint }) => (
    <Card style={{ flex: 1, padding: 9, alignItems: 'center' }}>
      <IconBubble name={icon} size={32} bg={tint + '33'} color={tint} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subText }]}>{label}</Text>
    </Card>
  );

  const Timeline = ({ list, highlight }) => (
    <Card>
      {list.map((c, idx) => {
        const isNext = highlight && next && c.id === next.id;
        const cancelled = c.exceptionStatus === 'cancelled';
        return (
          <View key={c.id} style={[styles.tlRow, isNext && { backgroundColor: colors.secondary, borderRadius: 12 }]}>
            <View style={[styles.tlTime, { backgroundColor: isNext ? colors.accent : colors.secondary }]}>
              <Text style={{ color: isNext ? colors.buttonText : colors.text, fontWeight: '800', fontSize: 12 }}>{c.start_time}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.tlName, { color: colors.text }, cancelled && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                {c.course_name}{isNext ? '  • next' : ''}
              </Text>
              <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{c.class_type} · {c.room || 'TBA'}</Text>
            </View>
            {highlight && !c.exceptionStatus && (
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{getClassCountdown(c.start_time, c.end_time)}</Text>
            )}
          </View>
        );
      })}
    </Card>
  );

  const renderHeader = () => (
    <View>
      <Hero top>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{getGreeting()} 👋</Text>
            <Text style={styles.name} numberOfLines={1}>{userName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <GlassButton name={theme === 'light' ? 'moon' : 'sunny'} onPress={toggleTheme} />
            <GlassButton name="happy-outline" onPress={() => navigation.navigate('Personal')} />
            <GlassButton name="person-outline" onPress={() => navigation.navigate('UserSetup')} />
          </View>
        </View>
        <Text style={styles.heroLabel}>Your CGPA</Text>
        <Text style={styles.heroValue}>{cgpaData.cgpa.toFixed(2)}</Text>
        <Text style={styles.heroSub}>out of 4.00</Text>
      </Hero>

      <View style={styles.body}>
        <View style={styles.statRow}>
          <Stat icon="ribbon" label="Credits" value={cgpaData.totalCredits} tint="#6C5CE7" />
          <Stat icon="checkmark-done" label="Pending" value={pendingCount} tint="#FF9F7A" />
          <Stat icon="library" label="Years" value={years.length} tint="#00B894" />
        </View>

        {deadlines.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Coming up ⏰" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -13 }} contentContainerStyle={{ paddingHorizontal: 13, gap: 8 }}>
              {Object.keys(groupedDeadlines).sort((a, b) => new Date(a) - new Date(b)).map((date, i) => (
                <View key={date} style={[styles.dlCard, { backgroundColor: PASTELS[i % PASTELS.length] }]}>
                  <Text style={styles.dlCountdown}>{getCountdown(date)}</Text>
                  <Text style={styles.dlDate}>{date}</Text>
                  {groupedDeadlines[date].map((item, idx) => (
                    <Text key={idx} style={styles.dlCourse} numberOfLines={1}>• {item.course_name}</Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {todaysClasses.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Today" />
            <Timeline list={todaysClasses} highlight />
          </View>
        )}

        {tomorrowsClasses.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Tomorrow" />
            <Timeline list={tomorrowsClasses} />
          </View>
        )}

        <View style={styles.section}>
          <SectionTitle title="Attendance" />
          <Card>
            {attendanceSummaries.length > 0 ? attendanceSummaries.map(a => (
              <View key={a.courseId} style={{ marginBottom: 9 }}>
                <View style={styles.attHead}>
                  <Text style={[styles.attName, { color: colors.text }]} numberOfLines={1}>{a.courseName}</Text>
                  <Text style={{ color: a.isWarning ? colors.error : colors.accent, fontSize: 12, fontWeight: '800' }}>{a.remaining} left</Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.secondary }]}>
                  <View style={{ width: `${a.percentage}%`, height: '100%', borderRadius: 4, backgroundColor: a.isWarning ? colors.error : colors.accent }} />
                </View>
              </View>
            )) : (
              <View style={{ alignItems: 'center', paddingVertical: 5 }}>
                <Text style={{ color: colors.subText, fontWeight: '700' }}>No attendance records yet</Text>
                <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Set a policy in the "Absence" tab of a course.</Text>
              </View>
            )}
          </Card>
        </View>

        <SectionTitle title="My semesters 🎓" />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={years}
        keyExtractor={(i) => i.year.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 78 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const open = expandedYear === item.year;
          return (
            <View style={{ paddingHorizontal: 13, marginBottom: 8 }}>
              <Card onPress={() => setExpandedYear(open ? null : item.year)} style={styles.yearHeader}>
                <IconBubble name={open ? 'folder-open' : 'folder'} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.yearTitle, { color: colors.text }]}>Year {item.year}</Text>
                  <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>{item.semesters.length} semesters</Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.accent} />
              </Card>
              {open && item.semesters.map(s => (
                <Card key={s.id} style={styles.semCard} onPress={() => navigation.navigate('SemesterDetail', { semesterId: s.id, semesterName: s.name })}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.semName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{s.courses?.length || 0} courses</Text>
                  </View>
                  <View style={[styles.gpaPill, { backgroundColor: s.semester_gpa ? colors.accent : colors.secondary }]}>
                    <Text style={{ color: s.semester_gpa ? colors.buttonText : colors.subText, fontWeight: '800', fontSize: 12 }}>
                      {s.semester_gpa ? s.semester_gpa.toFixed(2) : '—'}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          );
        }}
      />
      <Fab onPress={() => navigation.navigate('AddSemester')} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  greet: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -2, lineHeight: 50 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  body: { paddingHorizontal: 13, marginTop: -26 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  statValue: { fontSize: 19, fontWeight: '800', marginTop: 5 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 13 },
  dlCard: { width: 120, borderRadius: 16, padding: 10 },
  dlCountdown: { color: '#1E1B4B', fontSize: 16, fontWeight: '800' },
  dlDate: { color: 'rgba(30,27,75,0.7)', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  dlCourse: { color: '#1E1B4B', fontSize: 12, fontWeight: '600', marginTop: 2 },
  tlRow: { flexDirection: 'row', alignItems: 'center', padding: 6 },
  tlTime: { paddingHorizontal: 6, paddingVertical: 5, borderRadius: 9, minWidth: 38, alignItems: 'center' },
  tlName: { fontSize: 13, fontWeight: '700' },
  attHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  attName: { fontSize: 12, fontWeight: '700', flex: 1, marginRight: 5 },
  barBg: { height: 10, borderRadius: 4, overflow: 'hidden' },
  yearHeader: { flexDirection: 'row', alignItems: 'center' },
  yearTitle: { fontSize: 16, fontWeight: '800' },
  semCard: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 10 },
  semName: { fontSize: 14, fontWeight: '700' },
  gpaPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 649 },
});
