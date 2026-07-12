import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import {
  getCourseById,
  getAttendance,
  setAttendance,
  getAssessments,
  addAssessment,
  deleteAssessment,
  getExamsForCourse,
  setExamDate,
  addAbsenceDate,
  getAbsenceDates,
  deleteAbsenceDate,
  addScheduleEntry,
  getScheduleByCourse,
  deleteScheduleEntry,
  getScheduleConflict,
  getGoalAnalysis,
  updateCourseTarget,
  getRevisionTopics,
  addRevisionTopic,
  toggleRevisionTopic,
  deleteRevisionTopic
} from '../dbHelpers';
import { getCountdown } from '../utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPES = ['Lecture', 'Lab', 'Tutorial'];

export default function CourseDetailScreen({ route }) {
  const { courseId } = route.params;

  const [activeTab, setActiveTab] = useState('Summary'); // 'Summary' | 'Grades' | 'Attendance' | 'Schedule' | 'Study'

  const [course, setCourse] = useState(null);
  const [goalData, setGoalData] = useState(null);
  const [attendance, setAttendanceState] = useState(null);
  const [absenceDates, setAbsenceDates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [exams, setExams] = useState([]);
  const [revisionTopics, setRevisionTopics] = useState([]);
  const [examDates, setExamDates] = useState({ Mid: new Date(), Final: new Date() });
  const [showExamPicker, setShowExamPicker] = useState(null);

  // Form states
  const [targetScore, setTargetScore] = useState('');
  const [assessName, setAssessName] = useState('');
  const [assessTotal, setAssessTotal] = useState('');
  const [assessObtained, setAssessObtained] = useState('');
  const [assessOriginal, setAssessOriginal] = useState('');
  const [assessWeight, setAssessWeight] = useState('');
  const [assessCategory, setAssessCategory] = useState('Theory');
  const [newTopic, setNewTopic] = useState('');
  const [topicImportance, setTopicImportance] = useState('medium');

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedType, setSelectedType] = useState('Lecture');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [room, setRoom] = useState('');

  const [totalClasses, setTotalClasses] = useState('');
  const [allowedAbsence, setAllowedAbsence] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = useCallback(() => {
    const c = getCourseById(courseId);
    setCourse(c);
    setTargetScore(c.target_score?.toString() || '85');
    setGoalData(getGoalAnalysis(courseId));

    const att = getAttendance(courseId);
    setAttendanceState(att);
    if (att) {
      setTotalClasses(att.total_classes?.toString() ?? '');
      setAllowedAbsence(att.allowed_absence?.toString() ?? '');
      setAbsenceDates(getAbsenceDates(att.id));
    }
    setAssessments(getAssessments(courseId));
    const examList = getExamsForCourse(courseId);
    setExams(examList);

    // Sync examDates state with DB values
    const dates = { Mid: new Date(), Final: new Date() };
    examList.forEach(e => {
      if (e.exam_date) dates[e.exam_type] = new Date(e.exam_date);
    });
    setExamDates(dates);

    setScheduleEntries(getScheduleByCourse(courseId));
    setRevisionTopics(getRevisionTopics(courseId));
  }, [courseId]);

  useFocusEffect(useCallback(() => loadData(), [loadData]));

  // Handlers
  function handleSaveExam(examType, selectedDate) {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setExamDate(courseId, examType, formattedDate);
    loadData();
  }

  function handleUpdateTarget() {
    const val = parseFloat(targetScore);
    if (isNaN(val) || val < 0 || val > 100) {
      Alert.alert('Invalid', 'Enter a goal between 0 and 100');
      return;
    }
    updateCourseTarget(courseId, val);
    loadData();
  }

  function handleAddAssessment() {
    const total = parseFloat(assessTotal);
    const obtained = parseFloat(assessObtained);
    const original = parseFloat(assessOriginal) || obtained;
    const weight = parseFloat(assessWeight);
    if (!assessName.trim() || isNaN(total) || isNaN(obtained) || isNaN(weight)) {
      Alert.alert('Error', 'Please fill all assessment fields including Weight %');
      return;
    }
    addAssessment(courseId, assessName.trim(), total, obtained, weight, original, assessCategory, null);
    setAssessName(''); setAssessTotal(''); setAssessObtained(''); setAssessOriginal(''); setAssessWeight('');
    loadData();
  }

  function handleAddSchedule() {
    const start = startTime.getHours().toString().padStart(2, '0') + ":" + startTime.getMinutes().toString().padStart(2, '0');
    const end = endTime.getHours().toString().padStart(2, '0') + ":" + endTime.getMinutes().toString().padStart(2, '0');

    const conflict = getScheduleConflict(selectedDay, start, end);
    if (conflict) {
      Alert.alert('Conflict', `Overlaps with ${conflict.course_name}`);
      return;
    }

    addScheduleEntry(courseId, selectedDay, start, end, room.trim(), selectedType);
    setRoom('');
    loadData();
  }

  function handleSaveAttendance() {
    const total = parseInt(totalClasses, 10);
    const allowed = parseInt(allowedAbsence, 10);
    if (isNaN(total) || isNaN(allowed)) {
      Alert.alert('Invalid', 'Please enter numbers for total classes and allowed absences.');
      return;
    }
    setAttendance(courseId, total, allowed);
    loadData();
  }

  function handleLogAbsence() {
    if (!attendance) {
      Alert.alert('Error', 'Set up attendance first.');
      return;
    }
    const formattedDate = absenceDate.toISOString().split('T')[0];
    addAbsenceDate(attendance.id, formattedDate, '');
    setAbsenceDate(new Date());
    loadData();
  }

  function handleAddTopic() {
    if (!newTopic.trim()) return;
    addRevisionTopic(courseId, newTopic.trim(), '', topicImportance);
    setNewTopic('');
    loadData();
  }

  function handleToggleTopic(id, currentStatus) {
    toggleRevisionTopic(id, !currentStatus);
    loadData();
  }

  if (!course || !goalData) return null;

  const theoryAssessments = assessments.filter(a => a.category === 'Theory');
  const labAssessments = assessments.filter(a => a.category === 'Lab');
  const EXAM_TYPES = ['Mid', 'Final'];

  const masteredCount = revisionTopics.filter(t => t.completed).length;
  const masteryPercent = revisionTopics.length > 0 ? (masteredCount / revisionTopics.length) * 100 : 0;

  // Tab Button Component
  const TabButton = ({ name, icon, label }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === name && styles.tabBtnActive]}
      onPress={() => setActiveTab(name)}
    >
      <Ionicons name={icon} size={20} color={activeTab === name ? '#fff' : '#757575'} />
      <Text style={[styles.tabBtnText, activeTab === name && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.header}>{course.name}</Text>
        <Text style={styles.subheader}>{course.course_code || 'N/A'} · {course.credit_hours} Credits</Text>
      </View>

      {/* Modern Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton name="Summary" icon="stats-chart-outline" label="Home" />
        <TabButton name="Grades" icon="school-outline" label="Grades" />
        <TabButton name="Study" icon="book-outline" label="Study" />
        <TabButton name="Attendance" icon="calendar-outline" label="Absence" />
        <TabButton name="Schedule" icon="time-outline" label="Plan" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {activeTab === 'Summary' && (
          <>
            {/* GOAL COACH CARD */}
            <View style={[styles.card, styles.shadow, { borderLeftColor: goalData.isImpossible ? '#FF5252' : '#4DB6AC', borderLeftWidth: 5 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={22} color="#4DB6AC" />
                <Text style={styles.cardLabel}>Goal Coach</Text>
              </View>

              <View style={styles.goalRow}>
                <View>
                  <Text style={styles.goalLabel}>Current Score</Text>
                  <Text style={styles.goalValue}>{goalData.currentScore}%</Text>
                </View>
                <View style={styles.targetBox}>
                  <Text style={styles.goalLabel}>Target</Text>
                  <TextInput style={styles.targetInput} value={targetScore} onChangeText={setTargetScore} onBlur={handleUpdateTarget} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.progressContainer}>
                 <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${goalData.currentScore}%`, backgroundColor: '#4DB6AC' }]} /></View>
              </View>

              <Text style={[styles.coachText, goalData.isImpossible && { color: '#FF5252' }]}>
                {goalData.isImpossible
                  ? `Goal not fulfilled. Maximum possible is ${(parseFloat(goalData.currentScore) + goalData.remainingWeight).toFixed(1)}%.`
                  : `You can only lose ${goalData.remainingMistakePoints} more points to meet your goal.`}
              </Text>
            </View>

            {/* Study Progress Mini-Card */}
            <TouchableOpacity style={[styles.card, styles.shadow]} onPress={() => setActiveTab('Study')}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={22} color="#4DB6AC" />
                <Text style={styles.cardLabel}>Exam Readiness</Text>
              </View>
              <View style={styles.miniMasteryRow}>
                <View style={[styles.progressBg, { height: 10 }]}><View style={[styles.progressFill, { width: `${masteryPercent}%`, backgroundColor: '#81C784' }]} /></View>
                <Text style={styles.masteryText}>{Math.round(masteryPercent)}% mastered</Text>
              </View>
            </TouchableOpacity>

            {/* EXAMS DATES CARD */}
            <View style={[styles.card, styles.shadow]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alarm-outline" size={22} color="#4DB6AC" />
                <Text style={styles.cardLabel}>Upcoming Exams</Text>
              </View>

              {EXAM_TYPES.map(type => {
                const record = exams.find(e => e.exam_type === type);
                return (
                  <View key={type} style={styles.examItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.examTypeTitle}>{type} Exam Date</Text>
                      {record?.exam_date ? (
                        <Text style={styles.examCountdown}>{getCountdown(record.exam_date)} ({record.exam_date})</Text>
                      ) : (
                        <Text style={styles.emptyText}>No date set</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowExamPicker(type)}>
                      <Ionicons name="calendar-outline" size={20} color="#00796B" />
                    </TouchableOpacity>
                    {showExamPicker === type && (
                      <DateTimePicker
                        value={examDates[type]} mode="date" display="default"
                        onChange={(event, date) => {
                          setShowExamPicker(null);
                          if (date) {
                            handleSaveExam(type, date);
                          }
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'Study' && (
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="library-outline" size={22} color="#4DB6AC" />
              <Text style={styles.cardLabel}>Syllabus Mastery</Text>
            </View>

            <View style={styles.masteryBox}>
              <Text style={styles.goalValue}>{Math.round(masteryPercent)}%</Text>
              <Text style={styles.goalLabel}>Course Preparedness</Text>
            </View>

            {revisionTopics.map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicRow} onPress={() => handleToggleTopic(topic.id, topic.completed)}>
                <Ionicons name={topic.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={topic.completed ? "#4CAF50" : "#ccc"} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.topicName, topic.completed && styles.topicDone]}>{topic.topic}</Text>
                  <View style={[styles.importanceBadge, { backgroundColor: topic.importance === 'high' ? '#FFEBEE' : '#F5F5F5' }]}>
                    <Text style={[styles.importanceText, { color: topic.importance === 'high' ? '#D32F2F' : '#757575' }]}>{topic.importance.toUpperCase()}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { deleteRevisionTopic(topic.id); loadData(); }}>
                  <Ionicons name="close-outline" size={20} color="#ccc" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add Syllabus Topic</Text>
              <TextInput style={styles.inputField} placeholder="e.g. Chapter 4: Calculus" value={newTopic} onChangeText={setNewTopic} />
              <View style={styles.typeRow}>
                {['low', 'medium', 'high'].map(imp => (
                  <TouchableOpacity key={imp} style={[styles.typeBtn, topicImportance === imp && styles.typeBtnActive]} onPress={() => setTopicImportance(imp)}>
                    <Text style={[styles.typeBtnText, topicImportance === imp && styles.typeBtnTextActive]}>{imp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddTopic}><Text style={styles.primaryButtonText}>Add to Study Plan</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Grades' && (
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="layer-group" size={18} color="#4DB6AC" />
              <Text style={styles.cardLabel}>Assessment Breakdown</Text>
            </View>

            {theoryAssessments.length > 0 && <Text style={styles.subCategoryTitle}>Theory / Lecture</Text>}
            {theoryAssessments.map(a => (
              <View key={a.id} style={styles.gradeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gradeName}>{a.name} ({a.weight}%)</Text>
                  <Text style={styles.gradeSub}>Final: {a.obtained_marks}/{a.total_marks}{a.original_marks !== a.obtained_marks && <Text style={styles.originalMarkText}> (Raw: {a.original_marks})</Text>}</Text>
                </View>
                <TouchableOpacity onPress={() => { deleteAssessment(a.id); loadData(); }}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
              </View>
            ))}

            {labAssessments.length > 0 && <Text style={styles.subCategoryTitle}>Lab Section</Text>}
            {labAssessments.map(a => (
              <View key={a.id} style={styles.gradeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gradeName}>{a.name} ({a.weight}%)</Text>
                  <Text style={styles.gradeSub}>Final: {a.obtained_marks}/{a.total_marks}{a.original_marks !== a.obtained_marks && <Text style={styles.originalMarkText}> (Raw: {a.original_marks})</Text>}</Text>
                </View>
                <TouchableOpacity onPress={() => { deleteAssessment(a.id); loadData(); }}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
              </View>
            ))}

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add New Record</Text>
              <View style={styles.typeRow}>
                {['Theory', 'Lab'].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.typeBtn, assessCategory === cat && styles.typeBtnActive]} onPress={() => setAssessCategory(cat)}>
                    <Text style={[styles.typeBtnText, assessCategory === cat && styles.typeBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.inputField} placeholder="Assessment Name" value={assessName} onChangeText={setAssessName} />
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}><Text style={styles.miniLabel}>Raw Mark</Text><TextInput style={styles.inputField} placeholder="8.4" value={assessOriginal} onChangeText={setAssessOriginal} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Text style={styles.miniLabel}>Official Mark</Text><TextInput style={styles.inputField} placeholder="9" value={assessObtained} onChangeText={setAssessObtained} keyboardType="numeric" /></View>
              </View>
              <View style={styles.inputRow}>
                <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="Total Possible" value={assessTotal} onChangeText={setAssessTotal} keyboardType="numeric" />
                <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="Weight %" value={assessWeight} onChangeText={setAssessWeight} keyboardType="numeric" />
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddAssessment}><Text style={styles.primaryButtonText}>Save Grade</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Attendance' && (
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event-busy" size={22} color="#4DB6AC" />
              <Text style={styles.cardLabel}>Absence Log</Text>
            </View>

            {attendance ? (
              <View style={styles.attendanceSummary}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{absenceDates.length}/{attendance.allowed_absence}</Text>
                    <Text style={styles.statLabel}>Used</Text>
                </View>
                <View style={styles.progressContainerMain}>
                  <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${(absenceDates.length / attendance.allowed_absence) * 100}%`, backgroundColor: (attendance.allowed_absence - absenceDates.length) <= 2 ? '#D32F2F' : '#00796B' }]} /></View>
                  <Text style={styles.remainingText}>{attendance.allowed_absence - absenceDates.length} more absences allowed</Text>
                </View>
              </View>
            ) : <Text style={styles.emptyText}>Set up attendance below</Text>}

            {absenceDates.map((d) => (
              <View key={d.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}><Text style={styles.historyDate}>{d.date}</Text></View>
                <TouchableOpacity onPress={() => { deleteAbsenceDate(d.id); loadData(); }}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
              </View>
            ))}

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Report Absence</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
                 <Ionicons name="calendar-outline" size={20} color="#757575" />
                 <Text style={styles.inputText}>{absenceDate.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={absenceDate} mode="date" display="default" maximumDate={new Date()} onChange={(event, d) => { setShowDatePicker(false); if(d) setAbsenceDate(d); }} />}
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogAbsence}><Text style={styles.primaryButtonText}>Add to History</Text></TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.formTitle}>Attendance Policy</Text>
            <View style={styles.inputRow}>
              <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="Total Classes" value={totalClasses} onChangeText={setTotalClasses} keyboardType="numeric" />
              <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="Allowed Absences" value={allowedAbsence} onChangeText={setAllowedAbsence} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveAttendance}><Text style={styles.secondaryButtonText}>Update Policy</Text></TouchableOpacity>
          </View>
        )}

        {activeTab === 'Schedule' && (
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={22} color="#4DB6AC" />
              <Text style={styles.cardLabel}>Weekly Plan</Text>
            </View>

            {scheduleEntries.map((s) => (
              <View key={s.id} style={styles.scheduleItem}>
                <View style={[styles.typeBadge, { backgroundColor: s.class_type === 'Lab' ? '#FF9800' : '#00796B' }]}><Text style={styles.typeBadgeText}>{s.class_type}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timeText}>{s.day_of_week} · {s.start_time} - {s.end_time}</Text>
                  <Text style={styles.roomText}>{s.room || 'TBA'}</Text>
                </View>
                <TouchableOpacity onPress={() => { deleteScheduleEntry(s.id); loadData(); }}><Ionicons name="close-circle" size={20} color="#D32F2F" /></TouchableOpacity>
              </View>
            ))}

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add Class Time</Text>
              <View style={styles.typeRow}>
                {TYPES.map(t => (
                  <TouchableOpacity key={t} style={[styles.typeBtn, selectedType === t && styles.typeBtnActive]} onPress={() => setSelectedType(t)}>
                    <Text style={[styles.typeBtnText, selectedType === t && styles.typeBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dayRow}>
                {DAYS.map(d => (
                  <TouchableOpacity key={d} style={[styles.dayChip, selectedDay === d && styles.dayChipActive]} onPress={() => setSelectedDay(d)}>
                    <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>{d.slice(0,3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.inputField} placeholder="Room / Location" value={room} onChangeText={setRoom} />
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddSchedule}><Text style={styles.primaryButtonText}>Add to Schedule</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, gap: 4 },
  tabBtnActive: { backgroundColor: '#004D40' },
  tabBtnText: { fontSize: 10, color: '#B0B0B0', fontWeight: 'bold' },
  tabBtnTextActive: { color: '#4DB6AC' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  headerArea: { marginBottom: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  subheader: { fontSize: 16, color: '#B0B0B0', marginTop: 4 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  cardLabel: { fontSize: 16, fontWeight: 'bold', color: '#4DB6AC' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  goalLabel: { fontSize: 12, color: '#B0B0B0', textTransform: 'uppercase', letterSpacing: 1 },
  goalValue: { fontSize: 32, fontWeight: 'bold', color: '#4DB6AC' },
  targetBox: { alignItems: 'flex-end' },
  targetInput: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#333333', textAlign: 'right', width: 60 },
  progressContainer: { height: 8, backgroundColor: '#333333', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressContainerMain: { flex: 1 },
  progressBg: { flex: 1, height: 8, backgroundColor: '#333333', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  remainingText: { fontSize: 12, marginTop: 6, color: '#B0B0B0', fontWeight: '600' },
  attendanceSummary: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  statBox: { alignItems: 'center', backgroundColor: '#004D40', padding: 10, borderRadius: 12, minWidth: 80 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#4DB6AC' },
  statLabel: { fontSize: 11, color: '#4DB6AC', textTransform: 'uppercase' },
  historySection: { marginTop: 10, marginBottom: 15 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#E0E0E0', marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#262626' },
  historyDate: { fontSize: 14, color: '#E0E0E0' },
  historyReason: { fontSize: 12, color: '#9E9E9E' },
  divider: { height: 1, backgroundColor: '#262626', marginVertical: 15 },
  secondaryButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#4DB6AC', marginTop: 10 },
  secondaryButtonText: { color: '#4DB6AC', fontWeight: 'bold', fontSize: 13 },
  miniLabel: { fontSize: 11, color: '#B0B0B0', marginBottom: 4, textTransform: 'uppercase' },
  subCategoryTitle: { fontSize: 15, fontWeight: 'bold', color: '#4DB6AC', marginTop: 15, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#004D40' },
  originalMarkText: { color: '#FF5252', fontStyle: 'italic', fontWeight: 'normal' },
  coachText: { fontSize: 14, fontWeight: '600', color: '#E0E0E0', lineHeight: 20 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#262626' },
  gradeName: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
  gradeSub: { fontSize: 13, color: '#B0B0B0' },
  miniMasteryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 },
  masteryText: { fontSize: 13, fontWeight: 'bold', color: '#81C784' },
  masteryBox: { alignItems: 'center', backgroundColor: '#1B3121', padding: 20, borderRadius: 16, marginBottom: 20 },
  topicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#262626' },
  topicName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  topicDone: { textDecorationLine: 'line-through', color: '#666666' },
  importanceBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  importanceText: { fontSize: 10, fontWeight: 'bold' },
  formContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#333333' },
  inputField: { backgroundColor: '#262626', borderRadius: 10, padding: 12, marginBottom: 10, color: '#FFFFFF', borderColor: '#333333', borderWidth: 1 },
  inputRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { backgroundColor: '#4DB6AC', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, backgroundColor: '#262626', padding: 10, borderRadius: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  timeText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  roomText: { fontSize: 12, color: '#B0B0B0' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333333', alignItems: 'center', backgroundColor: '#1E1E1E' },
  typeBtnActive: { backgroundColor: '#4DB6AC', borderColor: '#4DB6AC' },
  typeBtnText: { color: '#B0B0B0', fontSize: 12, fontWeight: 'bold' },
  typeBtnTextActive: { color: '#FFFFFF' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#333333', backgroundColor: '#1E1E1E' },
  dayChipActive: { backgroundColor: '#004D40', borderColor: '#4DB6AC' },
  dayChipText: { fontSize: 12, color: '#B0B0B0' },
  dayChipTextActive: { color: '#4DB6AC', fontWeight: 'bold' },
  examItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#262626', padding: 12, borderRadius: 12, marginBottom: 10 },
  examTypeTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
  examCountdown: { fontSize: 13, color: '#FFB74D', fontWeight: '600' },
  datePickerBtn: { padding: 8, backgroundColor: '#004D40', borderRadius: 8 },
  inputText: { color: '#FFFFFF' },
  emptyText: { color: '#666666', fontStyle: 'italic' },
});