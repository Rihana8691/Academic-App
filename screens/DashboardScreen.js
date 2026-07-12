import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUser, getAllSemestersWithCourses, getPendingTasks, getAllAttendanceSummaries, getTodaysClasses, setClassException, clearClassException, getUpcomingDeadlines } from '../dbHelpers';
import { calculateOverallCGPA } from '../gpaCalculator';
import { getCountdown, getClassCountdown } from '../utils';

export default function DashboardScreen({ navigation }) {
  const [years, setYears] = useState([]); // Array of { year: 1, semesters: [...] }
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, totalCredits: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [editingMakeupId, setEditingMakeupId] = useState(null);
  const [makeupNote, setMakeupNote] = useState('');
  const [userName, setUserName] = useState('');
  const [expandedYear, setExpandedYear] = useState(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 18) return 'sunny-outline';
    return 'moon-outline';
  };

  function reloadClasses() {
    setTodaysClasses(getTodaysClasses());
  }

  function handleCancelClass(scheduleId) {
    setClassException(scheduleId, todayDate, 'cancelled', null);
    reloadClasses();
  }

  function handleStartMakeup(scheduleId) {
    setEditingMakeupId(scheduleId);
    setMakeupNote('');
  }

  function handleSaveMakeup(scheduleId) {
    setClassException(scheduleId, todayDate, 'makeup', makeupNote.trim());
    setEditingMakeupId(null);
    setMakeupNote('');
    reloadClasses();
  }

  function handleUndoException(scheduleId) {
    clearClassException(scheduleId, todayDate);
    reloadClasses();
  }

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      setUserName(user?.name || 'Student');

      const allSemesters = getAllSemestersWithCourses();

      // Group semesters by Year
      const grouped = {};
      allSemesters.forEach(s => {
        const y = s.year_number || 1;
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(s);
      });

      const yearArray = Object.keys(grouped)
        .sort((a, b) => b - a) // Show highest year first
        .map(y => ({ year: parseInt(y, 10), semesters: grouped[y] }));

      setYears(yearArray);

      // Auto-expand the highest year
      if (yearArray.length > 0 && expandedYear === null) {
        setExpandedYear(yearArray[0].year);
      }

      setUpcomingTasks(getPendingTasks().slice(0, 3));
      setAttendanceSummaries(getAllAttendanceSummaries());
      setDeadlines(getUpcomingDeadlines());
      const rawClasses = getTodaysClasses();
      const now = new Date();
      const filteredClasses = rawClasses.filter(c => {
        const [endH, endM] = c.end_time.split(':').map(Number);
        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);
        return now <= endTime;
      });
      setTodaysClasses(filteredClasses);

      const previousCgpa = user?.previous_cgpa ?? 0;
      const previousCredits = user?.previous_credits ?? 0;

      const gradedCourses = allSemesters.flatMap((s) =>
        (s.courses || [])
          .filter((c) => c.grade)
          .map((c) => ({ creditHours: c.credit_hours, grade: c.grade }))
      );

      const result = calculateOverallCGPA(previousCgpa, previousCredits, gradedCourses);
      setCgpaData(result);
    }, []) // REMOVED dependency to fix infinite loop
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Top Greeting & Profile */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.greetingRow}>
            <Ionicons name={getGreetingIcon()} size={16} color="#757575" style={{marginRight: 4}} />
            <Text style={styles.greetingText}>{getGreeting()},</Text>
          </View>
          <Text style={styles.header}>{userName}</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Personal')}>
            <Ionicons name="sunny-outline" size={24} color="#4DB6AC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('UserSetup')}>
            <Ionicons name="person-outline" size={24} color="#4DB6AC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Compressed Stat Row */}
      <View style={styles.statRow}>
        <View style={[styles.statBox, styles.shadow]}>
          <Text style={styles.statLabel}>GPA</Text>
          <Text style={styles.statValue}>{cgpaData.cgpa.toFixed(2)}</Text>
        </View>
        <View style={[styles.statBox, styles.shadow]}>
          <Text style={styles.statLabel}>Credits</Text>
          <Text style={styles.statValue}>{cgpaData.totalCredits}</Text>
        </View>
        <View style={[styles.statBox, styles.shadow]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{upcomingTasks.length}</Text>
        </View>
      </View>

      {/* Horizontal Deadlines Carousel */}
      {deadlines.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleMain}>Upcoming Priorities</Text>
            <Ionicons name="chevron-forward" size={16} color="#757575" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deadlineCarousel}>
            {deadlines.map((item, index) => (
              <View key={index} style={[styles.deadlineCard, styles.shadow]}>
                <View style={[styles.deadlineTag, { backgroundColor: item.type.includes('Exam') ? '#311B1B' : '#004D40' }]}>
                  <Text style={[styles.deadlineTagText, { color: item.type.includes('Exam') ? '#FFB74D' : '#4DB6AC' }]}>
                    {item.type.split(' ')[0]}
                  </Text>
                </View>
                <Text style={styles.deadlineCourse} numberOfLines={1}>{item.course_name}</Text>
                <Text style={styles.deadlineName} numberOfLines={1}>{item.type}</Text>
                <View style={styles.deadlineFooter}>
                  <Ionicons name="time-outline" size={12} color="#FFB74D" />
                  <Text style={styles.deadlineCountdown}>{getCountdown(item.date)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Timeline Schedule */}
      {todaysClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitleMain}>Today's Timeline</Text>
          <View style={[styles.timelineContainer, styles.shadow]}>
            {todaysClasses.map((c, idx) => (
              <View key={c.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{c.start_time}</Text>
                  <View style={[styles.timelineDot, { backgroundColor: c.exceptionStatus === 'cancelled' ? '#D32F2F' : '#00796B' }]} />
                  {idx !== todaysClasses.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineRight}>
                  <View style={styles.classInfoRow}>
                    <Text style={[styles.timelineClassName, c.exceptionStatus === 'cancelled' && styles.strike]}>{c.course_name}</Text>
                    {c.exceptionStatus ? (
                      <Text style={styles.badgeTextSmall}>{c.exceptionStatus.toUpperCase()}</Text>
                    ) : (
                      <Text style={styles.countdownSmall}>{getClassCountdown(c.start_time, c.end_time)}</Text>
                    )}
                  </View>
                  <Text style={styles.timelineMeta}>{c.class_type} · {c.room || 'TBA'}</Text>

                  {editingMakeupId === c.id ? (
                    <View style={styles.inlineForm}>
                      <TextInput style={styles.inlineInput} placeholder="Note..." placeholderTextColor="#666" value={makeupNote} onChangeText={setMakeupNote} />
                      <TouchableOpacity style={styles.inlineSave} onPress={() => handleSaveMakeup(c.id)}><Text style={styles.inlineSaveText}>Save</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.actionRowTimeline}>
                       <TouchableOpacity onPress={() => !c.exceptionStatus ? handleCancelClass(c.id) : handleUndoException(c.id)}>
                         <Text style={styles.actionBtnTextSmall}>{!c.exceptionStatus ? 'Cancel' : 'Undo'}</Text>
                       </TouchableOpacity>
                       {!c.exceptionStatus && <TouchableOpacity onPress={() => handleStartMakeup(c.id)}><Text style={styles.actionBtnTextSmall}>Reschedule</Text></TouchableOpacity>}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Attendance Circular Progress (Simulated with better bars) */}
      {attendanceSummaries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitleMain}>Attendance</Text>
          <View style={[styles.attendanceGrid, styles.shadow]}>
            {attendanceSummaries.map((a) => (
              <View key={a.courseId} style={styles.attendanceGridItem}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attCourseName} numberOfLines={1}>{a.courseName}</Text>
                  <Text style={[styles.attRemaining, a.isWarning && {color: '#FF5252'}]}>{a.remaining} left</Text>
                </View>
                <View style={styles.attBarBg}>
                  <View style={[styles.attBarFill, { width: `${a.percentage}%`, backgroundColor: a.isWarning ? '#FF5252' : '#4DB6AC' }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitleMain}>Academic Years</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={years}
        keyExtractor={(item) => item.year.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No semesters added yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.yearSection}>
            <TouchableOpacity
              style={[styles.yearHeader, styles.shadow]}
              onPress={() => setExpandedYear(expandedYear === item.year ? null : item.year)}
            >
              <View style={styles.yearTitleRow}>
                <Ionicons
                  name={expandedYear === item.year ? "chevron-down" : "chevron-forward"}
                  size={20} color="#00796B"
                />
                <Text style={styles.yearTitle}>Year {item.year}</Text>
              </View>
              <View style={styles.yearStat}>
                <Text style={styles.yearStatText}>{item.semesters.length} Semesters</Text>
              </View>
            </TouchableOpacity>

            {expandedYear === item.year && (
              <View style={styles.semesterList}>
                {item.semesters.map(semester => (
                  <TouchableOpacity
                    key={semester.id}
                    style={[styles.card, styles.shadow, { marginHorizontal: 20, marginTop: 10 }]}
                    onPress={() => navigation.navigate('SemesterDetail', { semesterId: semester.id, semesterName: semester.name })}
                  >
                    <View style={styles.semesterHeaderRow}>
                      <Text style={styles.semesterName}>{semester.name}</Text>
                      <View style={styles.gpaBadge}>
                        <Text style={styles.gpaBadgeText}>
                          {semester.semester_gpa ? `GPA: ${semester.semester_gpa.toFixed(2)}` : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.coursePreviewRow}>
                       <Ionicons name="book-outline" size={14} color="#B0B0B0" />
                       <Text style={styles.courseCountText}>{semester.courses?.length || 0} Courses</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={[styles.fab, styles.shadow]} onPress={() => navigation.navigate('AddSemester')}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerContent: { paddingHorizontal: 20, paddingTop: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 14, color: '#B0B0B0', fontWeight: '500' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#B0B0B0', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#4DB6AC' },

  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleMain: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },

  deadlineCarousel: { paddingRight: 20 },
  deadlineCard: { backgroundColor: '#1E1E1E', width: 160, padding: 14, borderRadius: 16, marginRight: 12 },
  deadlineTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  deadlineTagText: { fontSize: 10, fontWeight: 'bold' },
  deadlineCourse: { fontSize: 12, color: '#B0B0B0', marginBottom: 2 },
  deadlineName: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  deadlineFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deadlineCountdown: { fontSize: 11, fontWeight: 'bold', color: '#FFB74D' },

  timelineContainer: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20 },
  timelineItem: { flexDirection: 'row', minHeight: 70 },
  timelineLeft: { width: 60, alignItems: 'center' },
  timelineTime: { fontSize: 12, fontWeight: '700', color: '#B0B0B0', marginBottom: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#333333', marginVertical: 4 },
  timelineRight: { flex: 1, paddingLeft: 15, paddingBottom: 20 },
  classInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineClassName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  timelineMeta: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  strike: { textDecorationLine: 'line-through', color: '#555555' },
  countdownSmall: { fontSize: 11, color: '#4DB6AC', fontWeight: 'bold' },
  badgeTextSmall: { fontSize: 10, fontWeight: 'bold', color: '#FF5252', backgroundColor: '#311B1B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  actionRowTimeline: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtnTextSmall: { fontSize: 12, color: '#4DB6AC', fontWeight: '600' },

  attendanceGrid: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 16 },
  attendanceGridItem: { marginBottom: 12 },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  attCourseName: { fontSize: 14, color: '#E0E0E0', fontWeight: '500', flex: 1 },
  attRemaining: { fontSize: 12, fontWeight: '700', color: '#B0B0B0' },
  attBarBg: { height: 6, backgroundColor: '#333333', borderRadius: 3 },
  attBarFill: { height: 6, borderRadius: 3 },

  card: { backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 12 },
  semesterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  semesterName: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF' },
  gpaBadge: { backgroundColor: '#004D40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gpaBadgeText: { color: '#4DB6AC', fontWeight: 'bold', fontSize: 13 },
  coursePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  courseCountText: { fontSize: 13, color: '#B0B0B0' },

  yearSection: { marginBottom: 15 },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4DB6AC'
  },
  yearTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  yearTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  yearStat: { backgroundColor: '#262626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yearStatText: { fontSize: 11, color: '#B0B0B0', fontWeight: 'bold' },
  semesterList: { marginTop: 5 },

  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#4DB6AC', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  inlineForm: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inlineInput: { flex: 1, backgroundColor: '#262626', borderRadius: 8, padding: 8, fontSize: 12, color: '#FFFFFF' },
  inlineSave: { backgroundColor: '#4DB6AC', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8 },
  inlineSaveText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});