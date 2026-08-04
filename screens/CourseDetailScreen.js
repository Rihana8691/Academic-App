import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import {
  getCourseById,
  updateCourseDetails,
  getAttendance,
  setAttendance,
  getAssessments,
  addAssessment,
  deleteAssessment,
  getExamsForCourse,
  setExamDate,
  setExamGrades,
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
  getSortedRevisionTopics,
  addRevisionTopic,
  toggleRevisionTopic,
  deleteRevisionTopic,
  updateTopicUnderstanding,
  updateTopicRevisionNotes,
  updateTopicImage,
  addTopicImage,
  getTopicImages,
  deleteTopicImage,
  addTopicNote,
  getTopicNotes,
  deleteTopicNote,
  addTask,
  getTasksByCourse,
  deleteTask,
  updateTaskStatus
} from '../dbHelpers';
import { useTheme } from '../ThemeContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPES = ['Lecture', 'Lab', 'Tutorial'];

export default function CourseDetailScreen({ route, navigation }) {
  const { colors, theme } = useTheme();
  const { courseId } = route.params;

  const [activeTab, setActiveTab] = useState('Summary');

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
  const [courseTasks, setCourseTasks] = useState([]);

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
  const [topicUnderstanding, setTopicUnderstanding] = useState('not_fully');
  const [topicRevisionNotes, setTopicRevisionNotes] = useState('');
  const [newSeparateNote, setNewSeparateNote] = useState('');
  const [topicImagePaths, setTopicImagePaths] = useState([]);
  const [showUnderstandingModal, setShowUnderstandingModal] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(null);

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [showTaskDatePicker, setShowTaskDeadlinePicker] = useState(false);
  const [taskDeadlineDate, setTaskDeadlineDate] = useState(new Date());

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCredits, setEditCredits] = useState('');

  // Exam grades state
  const [midObtained, setMidObtained] = useState('');
  const [midTotal, setMidTotal] = useState('');
  const [finalObtained, setFinalObtained] = useState('');
  const [finalTotal, setFinalTotal] = useState('');

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
    setScheduleEntries(getScheduleByCourse(courseId));
    setRevisionTopics(getSortedRevisionTopics(courseId));
    setCourseTasks(getTasksByCourse(courseId));

    // Load exam grades
    const midExam = exams.find(e => e.exam_type === 'Mid');
    const finalExam = exams.find(e => e.exam_type === 'Final');
    if (midExam) {
      setMidObtained(midExam.obtained_marks?.toString() || '');
      setMidTotal(midExam.total_marks?.toString() || '');
    }
    if (finalExam) {
      setFinalObtained(finalExam.obtained_marks?.toString() || '');
      setFinalTotal(finalExam.total_marks?.toString() || '');
    }
  }, [courseId]);

  useFocusEffect(useCallback(() => loadData(), [loadData]));

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
    const topicId = addRevisionTopic(courseId, newTopic.trim(), '', topicImportance, topicUnderstanding, topicRevisionNotes, null);
    
    // Add multiple images to the new topic
    topicImagePaths.forEach(imageUri => {
      addTopicImage(topicId, imageUri);
    });
    
    setNewTopic('');
    setTopicRevisionNotes('');
    setTopicImagePaths([]);
    setTopicUnderstanding('not_fully');
    loadData();
  }

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setTopicImagePaths([...topicImagePaths, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }

  function handleRemoveImage(index) {
    const updated = topicImagePaths.filter((_, i) => i !== index);
    setTopicImagePaths(updated);
  }

  function handleUpdateUnderstanding(topicId, level) {
    updateTopicUnderstanding(topicId, level);
    loadData();
  }

  function handleUpdateNotes(topicId, notes) {
    updateTopicRevisionNotes(topicId, notes);
    loadData();
  }

  function handleAddSeparateNote(topicId) {
    if (!newSeparateNote.trim()) return;
    addTopicNote(topicId, newSeparateNote.trim());
    setNewSeparateNote('');
    loadData();
  }

  function handleDeleteSeparateNote(noteId) {
    deleteTopicNote(noteId);
    loadData();
  }

  function handleAddTaskForCourse() {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name.');
      return;
    }
    const deadlineStr = taskDeadlineDate.toISOString().split('T')[0];
    addTask(taskName.trim(), deadlineStr, courseId, 'medium');
    setTaskName('');
    setShowTaskDeadlinePicker(false);
    loadData();
  }

  function handleToggleTaskStatus(task) {
    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    updateTaskStatus(task.id, newStatus);
    loadData();
  }

  function handleDeleteTask(id) {
    deleteTask(id);
    loadData();
  }

  // Exam grade handlers
  function handleSaveMidGrades() {
    setExamGrades(courseId, 'Mid', parseFloat(midObtained), parseFloat(midTotal));
    loadData();
  }

  function handleSaveFinalGrades() {
    setExamGrades(courseId, 'Final', parseFloat(finalObtained), parseFloat(finalTotal));
    loadData();
  }

  function handleClearExamGrades(examType) {
    Alert.alert('Reset Grade', `Are you sure you want to clear the ${examType} Exam score?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setExamGrades(courseId, examType, null, null);
          loadData();
        }
      }
    ]);
  }

  function handleToggleTopic(id, currentStatus) {
    toggleRevisionTopic(id, !currentStatus);
    loadData();
  }

  function handleStartEditingHeader() {
    setEditName(course.name);
    setEditCode(course.course_code || '');
    setEditCredits(course.credit_hours.toString());
    setIsEditingHeader(true);
  }

  function handleSaveHeader() {
    const credits = parseFloat(editCredits);
    if (!editName.trim() || isNaN(credits)) {
      Alert.alert('Error', 'Please enter a valid name and credits.');
      return;
    }
    updateCourseDetails(courseId, editName.trim(), editCode.trim(), credits);
    setIsEditingHeader(false);
    loadData();
  }

  if (!course || !goalData) return null;

  const theoryAssessments = assessments.filter(a => a.category === 'Theory');
  const labAssessments = assessments.filter(a => a.category === 'Lab');

  const masteredCount = revisionTopics.filter(t => t.completed).length;
  const masteryPercent = revisionTopics.length > 0 ? (masteredCount / revisionTopics.length) * 100 : 0;

  const TabButton = ({ name, icon, label }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === name && {backgroundColor: colors.accent}]}
      onPress={() => setActiveTab(name)}
    >
      <Ionicons name={icon} size={20} color={activeTab === name ? colors.buttonText : colors.subText} />
      <Text style={[styles.tabBtnText, {color: activeTab === name ? colors.buttonText : colors.subText}]}>{label}</Text>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.headerArea}>
        {isEditingHeader ? (
          <View style={[styles.card, {padding: 10, marginBottom: 10}]}>
            <TextInput
              style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text, marginBottom: 8}]}
              value={editName} onChangeText={setEditName} placeholder="Course Name"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                value={editCode} onChangeText={setEditCode} placeholder="Course ID"
              />
              <TextInput
                style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                value={editCredits} onChangeText={setEditCredits} placeholder="Credits" keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, backgroundColor: colors.accent}]} onPress={handleSaveHeader}>
                <Text style={{color: colors.buttonText, fontWeight: '900'}}>SAVE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, backgroundColor: colors.subText}]} onPress={() => setIsEditingHeader(false)}>
                <Text style={{color: colors.background, fontWeight: '900'}}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View style={{flex: 1}}>
              <Text style={[styles.header, {color: colors.text}]}>{course.name}</Text>
              <Text style={[styles.subheader, {color: colors.subText}]}>{course.course_code || 'N/A'} · {course.credit_hours} Credits</Text>
            </View>
            <TouchableOpacity onPress={handleStartEditingHeader} style={{padding: 8}}>
              <Ionicons name="create-outline" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.tabBar, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TabButton name="Summary" icon="stats-chart-outline" label="Home" />
        <TabButton name="Grades" icon="school-outline" label="Grades" />
        <TabButton name="Study" icon="book-outline" label="Study" />
        <TabButton name="Attendance" icon="calendar-outline" label="Absence" />
        <TabButton name="Schedule" icon="time-outline" label="Plan" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {activeTab === 'Summary' && (
          <View>
            <View style={[styles.card, styles.shadow, { borderLeftColor: goalData.isImpossible ? colors.error : colors.accent, borderLeftWidth: 5, backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={22} color={colors.accent} />
                <Text style={[styles.cardLabel, {color: colors.accent}]}>Goal Coach</Text>
              </View>

              <View style={styles.goalRow}>
                <View>
                  <Text style={[styles.goalLabel, {color: colors.subText}]}>Current Score</Text>
                  <Text style={[styles.goalValue, {color: colors.accent}]}>{goalData.currentScore}%</Text>
                </View>
                <View style={styles.targetBox}>
                  <Text style={[styles.goalLabel, {color: colors.subText}]}>Target</Text>
                  <TextInput style={[styles.targetInput, {color: colors.text, borderBottomColor: colors.accent}]} value={targetScore} onChangeText={setTargetScore} onBlur={handleUpdateTarget} keyboardType="numeric" />
                </View>
              </View>

              <View style={[styles.progressContainer, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                 <View style={[styles.progressFill, { width: `${goalData.currentScore}%`, backgroundColor: colors.accent }]} />
              </View>

              <Text style={[styles.coachText, {color: colors.text}, goalData.isImpossible && { color: colors.error }]}>
                {goalData.isImpossible
                  ? `Goal not fulfilled. Maximum possible is ${(parseFloat(goalData.currentScore) + goalData.remainingWeight).toFixed(1)}%.`
                  : `You can only lose ${goalData.remainingMistakePoints} more points to meet your goal.`}
              </Text>
            </View>

            <TouchableOpacity style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => setActiveTab('Study')}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={22} color={colors.accent} />
                <Text style={[styles.cardLabel, {color: colors.accent}]}>Exam Readiness</Text>
              </View>
              <View style={styles.miniMasteryRow}>
                <View style={[styles.progressContainer, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border }]}><View style={[styles.progressFill, { width: `${masteryPercent}%`, backgroundColor: colors.success }]} /></View>
                <Text style={[styles.masteryText, {color: colors.success}]}>{Math.round(masteryPercent)}% mastered</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alarm-outline" size={22} color={colors.accent} />
                <Text style={[styles.cardLabel, {color: colors.accent}]}>Upcoming Exams</Text>
              </View>

              {['Mid', 'Final'].map(type => {
                const record = exams.find(e => e.exam_type === type);
                return (
                  <View key={type} style={[styles.examItem, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.examTypeTitle, {color: colors.text}]}>{type} Exam Date</Text>
                      {record?.exam_date ? (
                        <Text style={[styles.examCountdown, {color: colors.accent}]}>{getCountdown(record.exam_date)} ({record.exam_date})</Text>
                      ) : (
                        <Text style={[styles.emptyText, {color: colors.subText}]}>No date set</Text>
                      )}
                    </View>
                    <TouchableOpacity style={[styles.datePickerBtn, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => setShowExamPicker(type)}>
                      <Ionicons name="calendar-outline" size={20} color={colors.accent} />
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
          </View>
        )}

        {activeTab === 'Study' && (
          <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="library-outline" size={22} color={colors.accent} />
              <Text style={[styles.cardLabel, {color: colors.accent}]}>Syllabus Mastery</Text>
            </View>

            <View style={[styles.masteryBox, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
              <Text style={[styles.goalValue, {color: colors.accent}]}>{Math.round(masteryPercent)}%</Text>
              <Text style={[styles.goalLabel, {color: colors.text}]}>Course Preparedness</Text>
            </View>

            {revisionTopics.map((topic) => {
              const topicImages = getTopicImages(topic.id);
              const topicNotes = getTopicNotes(topic.id);
              return (
                <View key={topic.id} style={[styles.topicRow, {borderBottomColor: colors.border}]}>
                  <TouchableOpacity onPress={() => setShowUnderstandingModal(topic.id)}>
                    <View style={[styles.understandingBadge, { 
                      backgroundColor: topic.understanding_level === 'dont_understand' ? colors.error : 
                                     topic.understanding_level === 'not_fully' ? colors.warning : colors.success,
                      borderColor: colors.border 
                    }]}>
                      <Text style={[styles.understandingText, {color: colors.buttonText}]}>
                        {topic.understanding_level === 'dont_understand' ? '❓' : 
                         topic.understanding_level === 'not_fully' ? '📚' : '✅'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.topicName, {color: colors.text}]}>{topic.topic}</Text>
                    <View style={styles.topicMeta}>
                      <View style={[styles.importanceBadge, { backgroundColor: topic.importance === 'high' ? colors.error : colors.secondary, borderColor: colors.border }]}>
                        <Text style={[styles.importanceText, { color: topic.importance === 'high' ? colors.buttonText : colors.text }]}>{topic.importance.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity onPress={() => navigation.navigate('ChapterImages', { topicId: topic.id, topicName: topic.topic })}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                          <Ionicons name="image-outline" size={16} color={colors.accent} />
                          {topicImages.length > 0 && (
                            <Text style={[styles.imageCount, {color: colors.accent}]}>{topicImages.length}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => navigation.navigate('ChapterNotes', { topicId: topic.id, topicName: topic.topic })}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                          <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                          {topicNotes.length > 0 && (
                            <Text style={[styles.imageCount, {color: colors.accent}]}>{topicNotes.length}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => { deleteRevisionTopic(topic.id); loadData(); }}>
                    <Ionicons name="close-outline" size={20} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Understanding Level Modal */}
            {showUnderstandingModal && (
              <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
                <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[styles.modalTitle, {color: colors.text}]}>Understanding Level</Text>
                  {['dont_understand', 'not_fully', 'understand'].map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.understandingOption, {backgroundColor: colors.secondary, borderColor: colors.border}]}
                      onPress={() => {
                        handleUpdateUnderstanding(showUnderstandingModal, level);
                        setShowUnderstandingModal(null);
                      }}
                    >
                      <Text style={[styles.understandingOptionText, {color: colors.text}]}>
                        {level === 'dont_understand' ? '❓ Don\'t Understand' : 
                         level === 'not_fully' ? '📚 Not Fully' : '✅ Finished'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.text}]} onPress={() => setShowUnderstandingModal(null)}>
                    <Text style={[styles.modalCloseText, {color: colors.background}]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
              <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
                <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[styles.modalTitle, {color: colors.text}]}>
                    Revision Notes
                  </Text>
                  <View>
                    <View style={[styles.notesHeader, {borderBottomColor: colors.border}]}>
                      <Ionicons name="create-outline" size={20} color={colors.accent} />
                      <Text style={[styles.notesHeaderText, {color: colors.text}]}>Separate Notes</Text>
                    </View>

                    <ScrollView style={{maxHeight: 300, marginBottom: 15}}>
                      {getTopicNotes(showNotesModal.id).map((n) => (
                        <View key={n.id} style={[styles.noteItem, {borderBottomColor: colors.border}]}>
                          <View style={{flex: 1}}>
                            <Text style={[styles.noteText, {color: colors.text}]}>{n.note_text}</Text>
                            <Text style={[styles.noteDate, {color: colors.subText}]}>{new Date(n.created_at).toLocaleDateString()}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteSeparateNote(n.id)}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>

                    <TextInput
                      style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                      placeholder="Add a separate note for this chapter..."
                      placeholderTextColor="#888"
                      value={newSeparateNote}
                      onChangeText={setNewSeparateNote}
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, {backgroundColor: colors.accent, marginBottom: 10}]}
                      onPress={() => handleAddSeparateNote(showNotesModal.id)}
                    >
                      <Text style={[styles.primaryButtonText, {color: colors.buttonText}]}>Add Note Entry</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.text}]} onPress={() => setShowNotesModal(null)}>
                      <Text style={[styles.modalCloseText, {color: colors.background}]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
              <Text style={[styles.formTitle, {color: colors.text}]}>Add Syllabus Topic</Text>
              <TextInput style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} placeholder="e.g. Chapter 4: Calculus" placeholderTextColor="#666" value={newTopic} onChangeText={setNewTopic} />
              
              <View style={styles.typeRow}>
                {['low', 'medium', 'high'].map(imp => (
                  <TouchableOpacity key={imp} style={[styles.typeBtn, {backgroundColor: colors.card, borderColor: colors.border}, topicImportance === imp && {backgroundColor: colors.text}]} onPress={() => setTopicImportance(imp)}>
                    <Text style={[styles.typeBtnText, {color: colors.text}, topicImportance === imp && {color: colors.background}]}>{imp}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.notesSection, {borderColor: colors.border}]}>
                <View style={styles.notesSectionHeader}>
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                  <Text style={[styles.notesSectionTitle, {color: colors.text}]}>Study Notes</Text>
                </View>
                <TextInput
                  style={[styles.notesInput, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                  multiline
                  placeholder="📝 Add key points, formulas, or summaries..."
                  placeholderTextColor="#888"
                  value={topicRevisionNotes}
                  onChangeText={setTopicRevisionNotes}
                />
              </View>

              <TouchableOpacity style={[styles.secondaryButton, {borderColor: colors.accent}]} onPress={handlePickImage}>
                <Text style={[styles.secondaryButtonText, {color: colors.accent}]}>
                  + Add Image
                </Text>
              </TouchableOpacity>

              {topicImagePaths.length > 0 && (
                <ScrollView style={styles.selectedImagesScroll} horizontal showsHorizontalScrollIndicator={false}>
                  {topicImagePaths.map((uri, index) => (
                    <View key={index} style={styles.selectedImageContainer}>
                      <Image source={{ uri }} style={styles.selectedImage} />
                      <TouchableOpacity 
                        style={[styles.removeSelectedImageBtn, {backgroundColor: colors.error}]}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close" size={12} color={colors.buttonText} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleAddTopic}><Text style={[styles.primaryButtonText, {color: colors.background}]}>Add to Study Plan</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Grades' && (
          <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="layer-group" size={18} color={colors.accent} />
              <Text style={[styles.cardLabel, {color: colors.accent}]}>Assessment Breakdown</Text>
            </View>

            {/* Mid Exam */}
            <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Mid Exam</Text>
            {exams.find(e => e.exam_type === 'Mid')?.obtained_marks !== null ? (
              <View style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeSub, {color: colors.subText}]}>
                    Score: {exams.find(e => e.exam_type === 'Mid')?.obtained_marks}/{exams.find(e => e.exam_type === 'Mid')?.total_marks}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleClearExamGrades('Mid')}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.examGradeForm, {borderBottomColor: colors.border}]}>
                <View style={styles.inputRow}>
                  <View style={{flex: 1}}>
                    <Text style={[styles.inputLabel, {color: colors.text}]}>Score</Text>
                    <TextInput 
                      style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                      placeholder="0" 
                      placeholderTextColor="#666"
                      value={midObtained}
                      onChangeText={setMidObtained}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.inputLabel, {color: colors.text}]}>Total</Text>
                    <TextInput 
                      style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                      placeholder="0" 
                      placeholderTextColor="#666"
                      value={midTotal}
                      onChangeText={setMidTotal}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleSaveMidGrades}>
                  <Text style={[styles.primaryButtonText, {color: colors.background}]}>Save Mid Grade</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Final Exam */}
            <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Final Exam</Text>
            {exams.find(e => e.exam_type === 'Final')?.obtained_marks !== null ? (
              <View style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeSub, {color: colors.subText}]}>
                    Score: {exams.find(e => e.exam_type === 'Final')?.obtained_marks}/{exams.find(e => e.exam_type === 'Final')?.total_marks}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleClearExamGrades('Final')}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.examGradeForm, {borderBottomColor: colors.border}]}>
                <View style={styles.inputRow}>
                  <View style={{flex: 1}}>
                    <Text style={[styles.inputLabel, {color: colors.text}]}>Score</Text>
                    <TextInput 
                      style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                      placeholder="0" 
                      placeholderTextColor="#666"
                      value={finalObtained}
                      onChangeText={setFinalObtained}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.inputLabel, {color: colors.text}]}>Total</Text>
                    <TextInput 
                      style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                      placeholder="0" 
                      placeholderTextColor="#666"
                      value={finalTotal}
                      onChangeText={setFinalTotal}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleSaveFinalGrades}>
                  <Text style={[styles.primaryButtonText, {color: colors.background}]}>Save Final Grade</Text>
                </TouchableOpacity>
              </View>
            )}

            {theoryAssessments.length > 0 && <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Theory / Lecture</Text>}
            {theoryAssessments.map(a => (
              <View key={a.id} style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeName, {color: colors.text}]}>{a.name} ({a.weight}%)</Text>
                  <Text style={[styles.gradeSub, {color: colors.subText}]}>
                    Score: {a.obtained_marks}/{a.total_marks}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => { deleteAssessment(a.id); loadData(); }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {labAssessments.length > 0 && <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Lab Section</Text>}
            {labAssessments.map(a => (
              <View key={a.id} style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeName, {color: colors.text}]}>{a.name} ({a.weight}%)</Text>
                  <Text style={[styles.gradeSub, {color: colors.subText}]}>
                    Score: {a.obtained_marks}/{a.total_marks}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => { deleteAssessment(a.id); loadData(); }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
              <Text style={[styles.formTitle, {color: colors.text}]}>Add New Record</Text>
              <View style={styles.typeRow}>
                {['Theory', 'Lab'].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.typeBtn, {backgroundColor: colors.card, borderColor: colors.border}, assessCategory === cat && {backgroundColor: colors.text}]} onPress={() => setAssessCategory(cat)}>
                    <Text style={[styles.typeBtnText, {color: colors.text}, assessCategory === cat && {color: colors.background}]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} placeholder="Assessment Name" placeholderTextColor="#666" value={assessName} onChangeText={setAssessName} />
              <View style={styles.inputRow}>
                <TextInput style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]} placeholder="Score" placeholderTextColor="#666" value={assessObtained} onChangeText={setAssessObtained} keyboardType="numeric" />
                <TextInput style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]} placeholder="Total" placeholderTextColor="#666" value={assessTotal} onChangeText={setAssessTotal} keyboardType="numeric" />
              </View>
              <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleAddAssessment}><Text style={[styles.primaryButtonText, {color: colors.background}]}>Save Grade</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Attendance' && (
          <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event-busy" size={22} color={colors.accent} />
              <Text style={[styles.cardLabel, {color: colors.accent}]}>Absence Log</Text>
            </View>

            {attendance ? (
              <View style={styles.attendanceSummary}>
                <View style={[styles.statBox, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                    <Text style={[styles.statValue, {color: colors.text}]}>{absenceDates.length}/{attendance.allowed_absence}</Text>
                    <Text style={[styles.statLabel, {color: colors.text}]}>Used</Text>
                </View>
                <View style={styles.progressContainerMain}>
                  <View style={[styles.progressContainer, {backgroundColor: colors.secondary, borderColor: colors.border}]}><View style={[styles.progressFill, { width: `${(absenceDates.length / attendance.allowed_absence) * 100}%`, backgroundColor: (attendance.allowed_absence - absenceDates.length) <= 2 ? colors.error : colors.accent }]} /></View>
                  <Text style={[styles.remainingText, {color: colors.text}]}>{attendance.allowed_absence - absenceDates.length} more absences allowed</Text>
                </View>
              </View>
            ) : <Text style={[styles.emptyText, {color: colors.subText}]}>Set up attendance below</Text>}

            {absenceDates.map((d) => (
              <View key={d.id} style={[styles.historyRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}><Text style={[styles.historyDate, {color: colors.text}]}>{d.date}</Text></View>
                <TouchableOpacity onPress={() => { deleteAbsenceDate(d.id); loadData(); }}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity>
              </View>
            ))}

            <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
              <Text style={[styles.formTitle, {color: colors.text}]}>Report Absence</Text>
              <TouchableOpacity style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border}]} onPress={() => setShowDatePicker(true)}>
                 <Ionicons name="calendar-outline" size={20} color={colors.subText} />
                 <Text style={[styles.inputText, {color: colors.text}]}>{absenceDate.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={absenceDate} mode="date" display="default" maximumDate={new Date()} onChange={(event, d) => { setShowDatePicker(false); if(d) setAbsenceDate(d); }} />}
              <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleLogAbsence}><Text style={[styles.primaryButtonText, {color: colors.background}]}>Add to History</Text></TouchableOpacity>
            </View>

            <View style={[styles.divider, {backgroundColor: colors.text}]} />
            <Text style={[styles.formTitle, {color: colors.text}]}>Attendance Policy</Text>
            <View style={styles.inputRow}>
              <TextInput style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]} placeholder="Total Classes" placeholderTextColor="#666" value={totalClasses} onChangeText={setTotalClasses} keyboardType="numeric" />
              <TextInput style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]} placeholder="Allowed Absences" placeholderTextColor="#666" value={allowedAbsence} onChangeText={setAllowedAbsence} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={[styles.secondaryButton, {borderColor: colors.accent}]} onPress={handleSaveAttendance}><Text style={[styles.secondaryButtonText, {color: colors.accent}]}>Update Policy</Text></TouchableOpacity>
          </View>
        )}

        {activeTab === 'Schedule' && (
          <View>
            <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={22} color={colors.accent} />
                <Text style={[styles.cardLabel, {color: colors.accent}]}>Weekly Plan</Text>
              </View>

              {scheduleEntries.map((s) => (
                <View key={s.id} style={[styles.scheduleItem, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                  <View style={[styles.typeBadge, { backgroundColor: s.class_type === 'Lab' ? colors.warning : colors.accent, borderColor: colors.border }]}><Text style={[styles.typeBadgeText, {color: colors.buttonText}]}>{s.class_type}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timeText, {color: colors.text}]}>{s.day_of_week} · {s.start_time} - {s.end_time}</Text>
                    <Text style={[styles.roomText, {color: colors.subText}]}>{s.room || 'TBA'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { deleteScheduleEntry(s.id); loadData(); }}><Ionicons name="close-circle" size={20} color={colors.error} /></TouchableOpacity>
                </View>
              ))}

              <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
                <Text style={[styles.formTitle, {color: colors.text}]}>Add Class Time</Text>
                <View style={styles.typeRow}>
                  {TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.typeBtn, {backgroundColor: colors.card, borderColor: colors.border}, selectedType === t && {backgroundColor: colors.text}]} onPress={() => setSelectedType(t)}>
                      <Text style={[styles.typeBtnText, {color: colors.text}, selectedType === t && {color: colors.background}]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.dayRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity key={d} style={[styles.dayChip, {backgroundColor: colors.card, borderColor: colors.border}, selectedDay === d && {backgroundColor: colors.accent, borderColor: colors.accent}]} onPress={() => setSelectedDay(d)}>
                      <Text style={[styles.dayChipText, {color: colors.text}, selectedDay === d && {color: colors.buttonText}]}>{d.slice(0,3)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={() => setShowStartPicker(true)}>
                    <Text style={[styles.inputText, {color: colors.text}]}>Start: {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.inputField, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={() => setShowEndPicker(true)}>
                    <Text style={[styles.inputText, {color: colors.text}]}>End: {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </TouchableOpacity>
                </View>

                {showStartPicker && (
                  <DateTimePicker
                    value={startTime} mode="time" display="default"
                    onChange={(event, date) => { setShowStartPicker(false); if(date) setStartTime(date); }}
                  />
                )}
                {showEndPicker && (
                  <DateTimePicker
                    value={endTime} mode="time" display="default"
                    onChange={(event, date) => { setShowEndPicker(false); if(date) setEndTime(date); }}
                  />
                )}

                <TextInput style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} placeholder="Room / Location" placeholderTextColor="#666" value={room} onChangeText={setRoom} />
                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.text}]} onPress={handleAddSchedule}><Text style={[styles.primaryButtonText, {color: colors.background}]}>Add to Schedule</Text></TouchableOpacity>
              </View>
            </View>

            {/* NEW ASSIGNMENTS / HOMEWORK SECTION */}
            <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="clipboard-outline" size={22} color={colors.accent} />
                <Text style={[styles.cardLabel, {color: colors.accent}]}>Assignments & Homework</Text>
              </View>

              {courseTasks.map((t) => (
                <View key={t.id} style={[styles.scheduleItem, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                  <TouchableOpacity onPress={() => handleToggleTaskStatus(t)}>
                    <Ionicons name={t.status === 'done' ? "checkbox" : "square-outline"} size={22} color={t.status === 'done' ? colors.success : colors.accent} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.timeText, {color: colors.text, textDecorationLine: t.status === 'done' ? 'line-through' : 'none'}]}>{t.name}</Text>
                    <Text style={[styles.roomText, {color: colors.subText}]}>Due: {t.deadline}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteTask(t.id)}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity>
                </View>
              ))}

              <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
                <Text style={[styles.formTitle, {color: colors.text}]}>New Assignment</Text>
                <TextInput
                  style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                  placeholder="Task description..."
                  placeholderTextColor="#666"
                  value={taskName}
                  onChangeText={setTaskName}
                />

                <TouchableOpacity
                  style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border}]}
                  onPress={() => setShowTaskDeadlinePicker(true)}
                >
                  <Text style={[styles.inputText, {color: colors.text}]}>
                    Due Date: {taskDeadlineDate.toISOString().split('T')[0]}
                  </Text>
                </TouchableOpacity>

                {showTaskDatePicker && (
                  <DateTimePicker
                    value={taskDeadlineDate} mode="date" display="default"
                    onChange={(event, date) => { setShowTaskDeadlinePicker(false); if(date) setTaskDeadlineDate(date); }}
                  />
                )}

                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: colors.accent}]} onPress={handleAddTaskForCourse}>
                  <Text style={[styles.primaryButtonText, {color: colors.buttonText}]}>Set Assignment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, gap: 4 },
  tabBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  container: { flex: 1, padding: 20 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0
  },
  headerArea: { marginBottom: 20 },
  header: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subheader: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  card: { borderRadius: 15, padding: 12, marginBottom: 15, borderWidth: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  cardLabel: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalLabel: { fontSize: 9, textTransform: 'uppercase', fontWeight: '900' },
  goalValue: { fontSize: 28, fontWeight: '900' },
  targetBox: { alignItems: 'flex-end' },
  targetInput: { fontSize: 20, fontWeight: '900', borderBottomWidth: 3, textAlign: 'right', width: 50 },
  progressContainer: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10, borderWidth: 1.5 },
  progressContainerMain: { flex: 1 },
  progressFill: { height: '100%' },
  remainingText: { fontSize: 11, marginTop: 4, fontWeight: '800' },
  attendanceSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  statBox: { alignItems: 'center', padding: 10, borderRadius: 12, minWidth: 75, borderWidth: 2 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 8, textTransform: 'uppercase', fontWeight: '900' },
  historySection: { marginTop: 8, marginBottom: 12 },
  historyTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  historyDate: { fontSize: 13, fontWeight: '700' },
  historyReason: { fontSize: 11 },
  divider: { height: 2, marginVertical: 12, borderStyle: 'dashed' },
  secondaryButton: { padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 2, marginTop: 8 },
  secondaryButtonText: { fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  miniLabel: { fontSize: 9, marginBottom: 2, textTransform: 'uppercase', fontWeight: '900' },
  subCategoryTitle: { fontSize: 13, fontWeight: '900', marginTop: 12, marginBottom: 6, textTransform: 'uppercase', borderBottomWidth: 2 },
  originalMarkText: { color: '#E63946', fontStyle: 'italic', fontWeight: '900' },
  coachText: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  gradeName: { fontSize: 14, fontWeight: '900' },
  gradeSub: { fontSize: 12, fontWeight: '700' },
  miniMasteryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  masteryText: { fontSize: 12, fontWeight: '900' },
  masteryBox: { alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 2 },
  topicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  topicName: { fontSize: 14, fontWeight: '800' },
  topicDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  topicMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  understandingBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  understandingText: { fontSize: 16 },
  importanceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  importanceText: { fontSize: 9, fontWeight: '900' },
  imageCount: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: '80%', maxWidth: 400, borderRadius: 16, padding: 20, borderWidth: 2 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase' },
  understandingOption: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 2, alignItems: 'center' },
  understandingOptionText: { fontSize: 14, fontWeight: '700' },
  modalCloseBtn: { padding: 12, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 2 },
  notesHeaderText: { fontSize: 16, fontWeight: '900' },
  notesFooter: { marginTop: 8, marginBottom: 12 },
  notesHint: { fontSize: 12, fontStyle: 'italic' },
  notesSection: { marginTop: 12, paddingTop: 12, borderWidth: 2, borderRadius: 12 },
  notesSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notesSectionTitle: { fontSize: 14, fontWeight: '900' },
  notesInput: { borderRadius: 12, padding: 12, borderWidth: 2, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  topicImage: { width: 200, height: 200, borderRadius: 12, resizeMode: 'contain', marginBottom: 12 },
  imageScroll: { maxHeight: 250, marginBottom: 12 },
  imageContainer: { marginRight: 12, position: 'relative' },
  deleteImageBtn: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  selectedImagesScroll: { maxHeight: 80, marginBottom: 12 },
  selectedImageContainer: { marginRight: 8, position: 'relative' },
  selectedImage: { width: 60, height: 60, borderRadius: 8 },
  removeSelectedImageBtn: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  roundedMarkText: { fontWeight: '900' },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  assessmentList: { maxHeight: 200, marginBottom: 12 },
  assessmentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 2 },
  assessmentItemText: { fontSize: 14, fontWeight: '700' },
  historyList: { maxHeight: 300, marginBottom: 12 },
  historyItem: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 2 },
  historyItemName: { fontSize: 14, fontWeight: '900' },
  historyItemDetail: { fontSize: 12, fontWeight: '700' },
  historyItemReason: { fontSize: 11, marginTop: 4 },
  historyItemDate: { fontSize: 10, marginTop: 4, opacity: 0.7 },
  formContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 2 },
  formSubtitle: { fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
  examGradeForm: { padding: 10, marginBottom: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  inputField: { borderRadius: 12, padding: 8, marginBottom: 8, borderWidth: 2, fontWeight: '700', fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { padding: 10, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, padding: 10, borderRadius: 12, borderWidth: 2 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  timeText: { fontSize: 13, fontWeight: '900' },
  roomText: { fontSize: 11, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  typeBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  dayChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2 },
  dayChipText: { fontSize: 10, fontWeight: '900' },
  examItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 8, borderWidth: 2 },
  examTypeTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  examCountdown: { fontSize: 11, fontWeight: '900' },
  datePickerBtn: { padding: 6, borderRadius: 8, borderWidth: 1.5 },
  inputText: { fontWeight: '700', fontSize: 13 },
  emptyText: { fontStyle: 'italic', fontWeight: '700', fontSize: 12 },
});
