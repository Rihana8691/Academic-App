import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUser, getAllSemestersWithCourses, getPendingTasks, getAllAttendanceSummaries, getTodaysClasses, setClassException, clearClassException, getUpcomingDeadlines } from '../dbHelpers';
import { calculateOverallCGPA } from '../gpaCalculator';
import { getCountdown, getClassCountdown } from '../utils';
import { useTheme } from '../ThemeContext';

export default function DashboardScreen({ navigation }) {
  const { theme, colors, toggleTheme } = useTheme();
  const [years, setYears] = useState([]);
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, totalCredits: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [userName, setUserName] = useState('');
  const [expandedYear, setExpandedYear] = useState(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const reloadClasses = useCallback(() => {
    const rawClasses = getTodaysClasses();
    const now = new Date();
    const filteredClasses = rawClasses.filter(c => {
      const [endH, endM] = c.end_time.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);
      return now <= endTime;
    });
    setTodaysClasses(filteredClasses);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      setUserName(user?.name || 'Student');

      const allSemesters = getAllSemestersWithCourses();
      const grouped = {};
      allSemesters.forEach(s => {
        const y = s.year_number || 1;
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(s);
      });

      const yearArray = Object.keys(grouped)
        .sort((a, b) => b - a)
        .map(y => ({ year: parseInt(y, 10), semesters: grouped[y] }));

      setYears(yearArray);
      if (yearArray.length > 0 && expandedYear === null) setExpandedYear(yearArray[0].year);

      setUpcomingTasks(getPendingTasks().slice(0, 3));
      setAttendanceSummaries(getAllAttendanceSummaries());
      setDeadlines(getUpcomingDeadlines());
      reloadClasses();

      const result = calculateOverallCGPA(user?.previous_cgpa || 0, user?.previous_credits || 0, allSemesters.flatMap(s => (s.courses || []).filter(c => c.grade).map(c => ({ creditHours: c.credit_hours, grade: c.grade }))));
      setCgpaData(result);
    }, [reloadClasses])
  );

  const styles = createStyles(colors);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.topBar}>
        <View style={{flex: 1}}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingText, {color: colors.subText}]}>{getGreeting()},</Text>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleMini}>
               <Ionicons name={theme === 'light' ? "moon" : "sunny"} size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.header, {color: colors.text}]}>{userName}</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={[styles.profileBtn, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => navigation.navigate('Personal')}>
            <Ionicons name="sunny-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.profileBtn, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => navigation.navigate('UserSetup')}>
            <Ionicons name="person-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statBox, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.statLabel, {color: colors.text}]}>GPA</Text>
          <Text style={[styles.statValue, {color: colors.accent}]}>{cgpaData.cgpa.toFixed(2)}</Text>
        </View>
        <View style={[styles.statBox, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.statLabel, {color: colors.text}]}>Credits</Text>
          <Text style={[styles.statValue, {color: colors.accent}]}>{cgpaData.totalCredits}</Text>
        </View>
        <View style={[styles.statBox, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.statLabel, {color: colors.text}]}>Pending</Text>
          <Text style={[styles.statValue, {color: colors.accent}]}>{upcomingTasks.length}</Text>
        </View>
      </View>

      {deadlines.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitleMain, {color: colors.text}]}>Upcoming Priorities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deadlineCarousel}>
            {(() => {
              const grouped = deadlines.reduce((acc, item) => {
                if (!acc[item.date]) acc[item.date] = [];
                acc[item.date].push(item);
                return acc;
              }, {});
              return Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b)).map((date) => (
                <View key={date} style={[styles.deadlineCard, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <View style={[styles.deadlineHeader, {borderBottomColor: colors.border}]}>
                    <Ionicons name="calendar-clear-outline" size={14} color={colors.text} />
                    <Text style={[styles.deadlineDateText, {color: colors.text}]}>{date}</Text>
                  </View>
                  {grouped[date].map((item, idx) => (
                    <View key={idx} style={styles.deadlineItemMini}>
                      <View style={[styles.deadlineTag, { backgroundColor: item.type.includes('Exam') ? (theme === 'dark' ? '#311B1B' : '#FFF3E0') : (theme === 'dark' ? '#004D40' : '#E0F2F1'), borderColor: colors.border }]}>
                        <Text style={[styles.deadlineTagText, { color: item.type.includes('Exam') ? colors.error : colors.accent }]}>{item.type.split(' ')[0]}</Text>
                      </View>
                      <Text style={[styles.deadlineCourse, {color: colors.subText}]} numberOfLines={1}>{item.course_name}</Text>
                    </View>
                  ))}
                  <View style={[styles.deadlineFooter, {borderTopColor: colors.border}]}>
                    <Ionicons name="time-outline" size={12} color={colors.accent} />
                    <Text style={[styles.deadlineCountdown, {color: colors.accent}]}>{getCountdown(date)}</Text>
                  </View>
                </View>
              ));
            })()}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitleMain, {color: colors.text}]}>Academic Years</Text>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={years}
        keyExtractor={(item) => item.year.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.yearSection}>
            <TouchableOpacity style={[styles.yearHeader, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => setExpandedYear(expandedYear === item.year ? null : item.year)}>
              <View style={styles.yearTitleRow}>
                <Ionicons name={expandedYear === item.year ? "chevron-down" : "chevron-forward"} size={20} color={colors.accent} />
                <Text style={[styles.yearTitle, {color: colors.text}]}>Year {item.year}</Text>
              </View>
              <View style={[styles.yearStat, {backgroundColor: colors.secondary, borderColor: colors.border}]}><Text style={[styles.yearStatText, {color: colors.text}]}>{item.semesters.length} Semesters</Text></View>
            </TouchableOpacity>
            {expandedYear === item.year && (
              <View style={styles.semesterList}>
                {item.semesters.map(semester => (
                  <TouchableOpacity key={semester.id} style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 20, marginTop: 10}]} onPress={() => navigation.navigate('SemesterDetail', { semesterId: semester.id, semesterName: semester.name })}>
                    <View style={styles.semesterHeaderRow}>
                      <Text style={[styles.semesterName, {color: colors.text}]}>{semester.name}</Text>
                      <View style={[styles.gpaBadge, {backgroundColor: colors.accent}]}><Text style={[styles.gpaBadgeText, {color: colors.buttonText}]}>{semester.semester_gpa ? `GPA: ${semester.semester_gpa.toFixed(2)}` : 'N/A'}</Text></View>
                    </View>
                    <View style={[styles.coursePreviewRow, {borderTopColor: colors.border}]}><Ionicons name="book-outline" size={14} color={colors.subText} /><Text style={[styles.courseCountText, {color: colors.text}]}>{semester.courses?.length || 0} Courses</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />
      <TouchableOpacity style={[styles.fab, styles.shadow, {backgroundColor: colors.accent, borderColor: colors.border}]} onPress={() => navigation.navigate('AddSemester')}>
        <Ionicons name="add" size={36} color={colors.buttonText} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  headerContent: { paddingHorizontal: 20, paddingTop: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greetingText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  themeToggleMini: { padding: 4, borderRadius: 6, backgroundColor: colors.secondary + '40' },
  header: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  profileBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  statLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900' },
  section: { marginBottom: 24 },
  sectionTitleMain: { fontSize: 18, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase' },
  deadlineCarousel: { paddingRight: 20, paddingBottom: 10 },
  deadlineCard: { width: 180, padding: 14, borderRadius: 12, marginRight: 12, borderWidth: 2 },
  deadlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, borderBottomWidth: 1, paddingBottom: 6 },
  deadlineDateText: { fontSize: 11, fontWeight: '900' },
  deadlineItemMini: { marginBottom: 10 },
  deadlineTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4, borderWidth: 1 },
  deadlineTagText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  deadlineCourse: { fontSize: 12, fontWeight: '700' },
  deadlineFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1.5, borderStyle: 'dotted', paddingTop: 8, marginTop: 5 },
  deadlineCountdown: { fontSize: 11, fontWeight: '900' },
  card: { borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 2 },
  semesterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  semesterName: { fontSize: 18, fontWeight: '900' },
  gpaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  gpaBadgeText: { fontWeight: '900', fontSize: 12 },
  coursePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderTopWidth: 1, paddingTop: 10 },
  courseCountText: { fontSize: 13, fontWeight: '700' },
  yearSection: { marginBottom: 20 },
  yearHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, padding: 18, borderRadius: 15, borderWidth: 2, borderBottomWidth: 5 },
  yearTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  yearTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  yearStat: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  yearStatText: { fontSize: 10, fontWeight: '900' },
  shadow: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
});
