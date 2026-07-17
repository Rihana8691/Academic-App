import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
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
  setExamGrades,
  setExamWeight,
  setExamRounding,
  clearExamRounding,
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
  setAssessmentRounding,
  clearAssessmentRounding,
  createAssessmentGroup,
  updateGroupWeight,
  addAssessmentToGroup,
  removeAssessmentFromGroup,
  getAssessmentGroups,
  getAssessmentGroupItems,
  deleteAssessmentGroup,
  updateGroupRounding,
  getAllRoundingHistory
} from '../dbHelpers';
import { getCountdown } from '../utils';
import { useTheme } from '../ThemeContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPES = ['Lecture', 'Lab', 'Tutorial'];

export default function CourseDetailScreen({ route }) {
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
  const [topicImagePaths, setTopicImagePaths] = useState([]);
  const [showUnderstandingModal, setShowUnderstandingModal] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(null);
  
  // Rounding state
  const [showRoundingModal, setShowRoundingModal] = useState(null);
  const [roundedScore, setRoundedScore] = useState('');
  const [roundedTotal, setRoundedTotal] = useState('');
  const [roundingReason, setRoundingReason] = useState('');
  
  // Grouping state
  const [showGroupingModal, setShowGroupingModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupWeight, setGroupWeight] = useState('');
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [assessmentGroups, setAssessmentGroups] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [roundingHistory, setRoundingHistory] = useState([]);
  
  // Exam weight state
  const [showExamWeightModal, setShowExamWeightModal] = useState(null);
  const [examWeightInput, setExamWeightInput] = useState('');
  
  // Exam grades state
  const [midObtained, setMidObtained] = useState('');
  const [midTotal, setMidTotal] = useState('');
  const [midWeight, setMidWeight] = useState('');
  const [finalObtained, setFinalObtained] = useState('');
  const [finalTotal, setFinalTotal] = useState('');
  const [finalWeight, setFinalWeight] = useState('');

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

    const dates = { Mid: new Date(), Final: new Date() };
    examList.forEach(e => {
      if (e.exam_date) dates[e.exam_type] = new Date(e.exam_date);
    });
    setExamDates(dates);

    setScheduleEntries(getScheduleByCourse(courseId));
    setRevisionTopics(getSortedRevisionTopics(courseId));
    setAssessmentGroups(getAssessmentGroups(courseId));
    
    // Load exam grades
    const midExam = exams.find(e => e.exam_type === 'Mid');
    const finalExam = exams.find(e => e.exam_type === 'Final');
    if (midExam) {
      setMidObtained(midExam.obtained_marks?.toString() || '');
      setMidTotal(midExam.total_marks?.toString() || '');
      setMidWeight(midExam.weight?.toString() || '');
    }
    if (finalExam) {
      setFinalObtained(finalExam.obtained_marks?.toString() || '');
      setFinalTotal(finalExam.total_marks?.toString() || '');
      setFinalWeight(finalExam.weight?.toString() || '');
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

  async function handleAddImageToTopic(topicId) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        addTopicImage(topicId, result.assets[0].uri);
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }

  function handleDeleteTopicImage(imageId) {
    deleteTopicImage(imageId);
    loadData();
  }

  // Rounding functions
  function handleSetRounding() {
    if (!showRoundingModal || !roundedScore || !roundedTotal) return;
    setAssessmentRounding(showRoundingModal, parseFloat(roundedScore), parseFloat(roundedTotal), roundingReason);
    setShowRoundingModal(null);
    setRoundedScore('');
    setRoundedTotal('');
    setRoundingReason('');
    loadData();
  }

  function handleClearRounding(assessmentId) {
    clearAssessmentRounding(assessmentId);
    loadData();
  }

  // Grouping functions
  function handleCreateGroup() {
    if (!groupName.trim() || selectedAssessments.length === 0) return;
    const groupId = createAssessmentGroup(courseId, groupName.trim(), parseFloat(groupWeight) || 0, null, null);
    selectedAssessments.forEach(assessmentId => {
      addAssessmentToGroup(groupId, assessmentId);
    });
    setGroupName('');
    setGroupWeight('');
    setSelectedAssessments([]);
    setShowGroupingModal(false);
    loadData();
  }

  function handleToggleAssessmentSelection(assessmentId) {
    if (selectedAssessments.includes(assessmentId)) {
      setSelectedAssessments(selectedAssessments.filter(id => id !== assessmentId));
    } else {
      setSelectedAssessments([...selectedAssessments, assessmentId]);
    }
  }

  function handleDeleteGroup(groupId) {
    deleteAssessmentGroup(groupId);
    loadData();
  }

  function handleSetGroupRounding(groupId, roundedScore, roundedTotal, reason) {
    updateGroupRounding(groupId, roundedScore, roundedTotal, reason);
    loadData();
  }

  function handleShowHistory() {
    setRoundingHistory(getAllRoundingHistory(courseId));
    setShowHistoryModal(true);
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

  function handleSetExamWeight(examType, weight) {
    setExamWeight(courseId, examType, parseFloat(weight));
    loadData();
  }

  function handleSetExamRounding(examType) {
    const exam = exams.find(e => e.exam_type === examType);
    if (!exam) return;
    
    const obtained = examType === 'Mid' ? midObtained : finalObtained;
    const total = examType === 'Mid' ? midTotal : finalTotal;
    
    setExamRounding(courseId, examType, parseFloat(roundedScore), parseFloat(roundedTotal), roundingReason);
    setShowRoundingModal(null);
    setRoundedScore('');
    setRoundedTotal('');
    setRoundingReason('');
    loadData();
  }

  function handleClearExamRounding(examType) {
    clearExamRounding(courseId, examType);
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
        <Text style={[styles.header, {color: colors.text}]}>{course.name}</Text>
        <Text style={[styles.subheader, {color: colors.subText}]}>{course.course_code || 'N/A'} · {course.credit_hours} Credits</Text>
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

              {EXAM_TYPES.map(type => {
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
                      {topicImages.length > 0 && (
                        <TouchableOpacity onPress={() => setShowNotesModal({id: topic.id, type: 'image'})}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <Ionicons name="image-outline" size={16} color={colors.accent} />
                            <Text style={[styles.imageCount, {color: colors.accent}]}>{topicImages.length}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {topic.revision_notes && (
                        <TouchableOpacity onPress={() => setShowNotesModal({id: topic.id, type: 'notes'})}>
                          <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                        </TouchableOpacity>
                      )}
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
                         level === 'not_fully' ? '📚 Not Fully' : '✅ Understand'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.text}]} onPress={() => setShowUnderstandingModal(null)}>
                    <Text style={[styles.modalCloseText, {color: colors.background}]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Notes/Image Modal */}
            {showNotesModal && (
              <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
                <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[styles.modalTitle, {color: colors.text}]}>
                    {showNotesModal.type === 'image' ? 'Topic Images' : 'Revision Notes'}
                  </Text>
                  {showNotesModal.type === 'image' ? (
                    <View>
                      <ScrollView style={styles.imageScroll} horizontal showsHorizontalScrollIndicator={false}>
                        {getTopicImages(showNotesModal.id).map((img) => (
                          <View key={img.id} style={styles.imageContainer}>
                            <Image 
                              source={{ uri: img.image_uri }} 
                              style={styles.topicImage} 
                            />
                            <TouchableOpacity 
                              style={[styles.deleteImageBtn, {backgroundColor: colors.error}]}
                              onPress={() => handleDeleteTopicImage(img.id)}
                            >
                              <Ionicons name="close" size={16} color={colors.buttonText} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.accent}]} onPress={() => handleAddImageToTopic(showNotesModal.id)}>
                        <Text style={[styles.modalCloseText, {color: colors.buttonText}]}>+ Add Image</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.text}]} onPress={() => setShowNotesModal(null)}>
                        <Text style={[styles.modalCloseText, {color: colors.background}]}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        style={[styles.notesInput, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                        multiline
                        placeholder="Add revision notes for exam..."
                        placeholderTextColor="#666"
                        value={revisionTopics.find(t => t.id === showNotesModal.id)?.revision_notes || ''}
                        onChangeText={(text) => handleUpdateNotes(showNotesModal.id, text)}
                      />
                      <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: colors.text}]} onPress={() => setShowNotesModal(null)}>
                        <Text style={[styles.modalCloseText, {color: colors.background}]}>Save & Close</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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

              <View style={styles.typeRow}>
                {['dont_understand', 'not_fully', 'understand'].map(level => (
                  <TouchableOpacity key={level} style={[styles.typeBtn, {backgroundColor: colors.card, borderColor: colors.border}, topicUnderstanding === level && {backgroundColor: colors.text}]} onPress={() => setTopicUnderstanding(level)}>
                    <Text style={[styles.typeBtnText, {color: colors.text}, topicUnderstanding === level && {color: colors.background}]}>
                      {level === 'dont_understand' ? '❓' : level === 'not_fully' ? '📚' : '✅'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                multiline
                placeholder="Revision notes for exam..."
                placeholderTextColor="#666"
                value={topicRevisionNotes}
                onChangeText={setTopicRevisionNotes}
              />

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
              <TouchableOpacity onPress={handleShowHistory} style={{ marginLeft: 'auto' }}>
                <Ionicons name="time-outline" size={20} color={colors.subText} />
              </TouchableOpacity>
            </View>

            {/* Mid Exam */}
            <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Mid Exam</Text>
            {exams.find(e => e.exam_type === 'Mid')?.obtained_marks !== null ? (
              <View style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                <View style={{ flex: 1 }}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Text style={[styles.gradeName, {color: colors.text}]}>Mid Exam ({exams.find(e => e.exam_type === 'Mid')?.weight || 0}%)</Text>
                    {exams.find(e => e.exam_type === 'Mid')?.is_rounded && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                  </View>
                  {exams.find(e => e.exam_type === 'Mid')?.is_rounded ? (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      <Text style={styles.originalMarkText}>Raw: {exams.find(e => e.exam_type === 'Mid')?.obtained_marks}/{exams.find(e => e.exam_type === 'Mid')?.total_marks}</Text>
                      <Text> → </Text>
                      <Text style={[styles.roundedMarkText, {color: colors.accent}]}>Rounded: {exams.find(e => e.exam_type === 'Mid')?.rounded_score}/{exams.find(e => e.exam_type === 'Mid')?.rounded_total}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      Score: {exams.find(e => e.exam_type === 'Mid')?.obtained_marks}/{exams.find(e => e.exam_type === 'Mid')?.total_marks}
                    </Text>
                  )}
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => setShowExamWeightModal('Mid')}>
                    <Ionicons name="options-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowRoundingModal('exam_Mid')}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.examGradeForm, {borderBottomColor: colors.border}]}>
                <View style={styles.inputRow}>
                  <TextInput 
                    style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                    placeholder="Score" 
                    placeholderTextColor="#666"
                    value={midObtained}
                    onChangeText={setMidObtained}
                    keyboardType="numeric"
                  />
                  <TextInput 
                    style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                    placeholder="Total" 
                    placeholderTextColor="#666"
                    value={midTotal}
                    onChangeText={setMidTotal}
                    keyboardType="numeric"
                  />
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
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Text style={[styles.gradeName, {color: colors.text}]}>Final Exam ({exams.find(e => e.exam_type === 'Final')?.weight || 0}%)</Text>
                    {exams.find(e => e.exam_type === 'Final')?.is_rounded && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                  </View>
                  {exams.find(e => e.exam_type === 'Final')?.is_rounded ? (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      <Text style={styles.originalMarkText}>Raw: {exams.find(e => e.exam_type === 'Final')?.obtained_marks}/{exams.find(e => e.exam_type === 'Final')?.total_marks}</Text>
                      <Text> → </Text>
                      <Text style={[styles.roundedMarkText, {color: colors.accent}]}>Rounded: {exams.find(e => e.exam_type === 'Final')?.rounded_score}/{exams.find(e => e.exam_type === 'Final')?.rounded_total}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      Score: {exams.find(e => e.exam_type === 'Final')?.obtained_marks}/{exams.find(e => e.exam_type === 'Final')?.total_marks}
                    </Text>
                  )}
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => setShowRoundingModal('exam_Final')}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.examGradeForm, {borderBottomColor: colors.border}]}>
                <View style={styles.inputRow}>
                  <TextInput 
                    style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                    placeholder="Score" 
                    placeholderTextColor="#666"
                    value={finalObtained}
                    onChangeText={setFinalObtained}
                    keyboardType="numeric"
                  />
                  <TextInput 
                    style={[styles.inputField, {flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                    placeholder="Total" 
                    placeholderTextColor="#666"
                    value={finalTotal}
                    onChangeText={setFinalTotal}
                    keyboardType="numeric"
                  />
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
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Text style={[styles.gradeName, {color: colors.text}]}>{a.name} ({a.weight}%)</Text>
                    {a.is_rounded && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                  </View>
                  {a.is_rounded ? (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      <Text style={styles.originalMarkText}>Raw: {a.obtained_marks}/{a.total_marks}</Text>
                      <Text> → </Text>
                      <Text style={[styles.roundedMarkText, {color: colors.accent}]}>Rounded: {a.rounded_score}/{a.rounded_total}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      Final: {a.obtained_marks}/{a.total_marks}
                      {a.original_marks !== a.obtained_marks && <Text style={styles.originalMarkText}> (Raw: {a.original_marks})</Text>}
                    </Text>
                  )}
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => setShowRoundingModal(a.id)}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
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
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Text style={[styles.gradeName, {color: colors.text}]}>{a.name} ({a.weight}%)</Text>
                    {a.is_rounded && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                  </View>
                  {a.is_rounded ? (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      <Text style={styles.originalMarkText}>Raw: {a.obtained_marks}/{a.total_marks}</Text>
                      <Text> → </Text>
                      <Text style={[styles.roundedMarkText, {color: colors.accent}]}>Rounded: {a.rounded_score}/{a.rounded_total}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.gradeSub, {color: colors.subText}]}>
                      Final: {a.obtained_marks}/{a.total_marks}
                      {a.original_marks !== a.obtained_marks && <Text style={styles.originalMarkText}> (Raw: {a.original_marks})</Text>}
                    </Text>
                  )}
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => setShowRoundingModal(a.id)}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { deleteAssessment(a.id); loadData(); }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* End of Course Grouping */}
            <View style={[styles.formContainer, {borderTopColor: colors.border}]}>
              <Text style={[styles.formTitle, {color: colors.text}]}>End of Course Processing</Text>
              <Text style={[styles.formSubtitle, {color: colors.subText}]}>Group assessments for teacher rounding</Text>
              
              {/* Assessment Groups */}
              {assessmentGroups.length > 0 && <Text style={[styles.subCategoryTitle, {color: colors.accent, borderBottomColor: colors.border}]}>Assessment Groups</Text>}
              {assessmentGroups.map(group => {
                const groupItems = getAssessmentGroupItems(group.id);
                return (
                  <View key={group.id} style={[styles.gradeRow, {borderBottomColor: colors.border}]}>
                    <View style={{ flex: 1 }}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Text style={[styles.gradeName, {color: colors.text}]}>{group.group_name} ({group.weight || 0}%)</Text>
                        {group.rounded_score !== null && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                      </View>
                      <Text style={[styles.gradeSub, {color: colors.subText}]}>
                        {groupItems.map(item => item.name).join(', ')}
                      </Text>
                      {group.rounded_score !== null ? (
                        <Text style={[styles.gradeSub, {color: colors.subText}]}>
                          <Text style={styles.originalMarkText}>Raw: {groupItems.reduce((s, i) => s + (i.obtained_marks || 0), 0)}/{groupItems.reduce((s, i) => s + (i.total_marks || 0), 0)}</Text>
                          <Text> → </Text>
                          <Text style={[styles.roundedMarkText, {color: colors.accent}]}>Rounded: {group.rounded_score}/{group.rounded_total}</Text>
                        </Text>
                      ) : null}
                    </View>
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <TouchableOpacity onPress={() => setShowRoundingModal(`group_${group.id}`)}>
                        <Ionicons name="create-outline" size={18} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteGroup(group.id)}>
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              
              <TouchableOpacity style={[styles.secondaryButton, {borderColor: colors.accent}]} onPress={() => setShowGroupingModal(true)}>
                <Text style={[styles.secondaryButtonText, {color: colors.accent}]}>+ Create Assessment Group</Text>
              </TouchableOpacity>
            </View>

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

        {/* Rounding Modal */}
        {showRoundingModal && (
          <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
            <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {typeof showRoundingModal === 'string' && showRoundingModal.startsWith('group_') ? 'Group Rounding' : 
                 typeof showRoundingModal === 'string' && showRoundingModal.startsWith('exam_') ? 'Exam Rounding' : 'Assessment Rounding'}
              </Text>
              <TextInput 
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                placeholder="Rounded Score" 
                placeholderTextColor="#666"
                value={roundedScore}
                onChangeText={setRoundedScore}
                keyboardType="numeric"
              />
              <TextInput 
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                placeholder="Rounded Total" 
                placeholderTextColor="#666"
                value={roundedTotal}
                onChangeText={setRoundedTotal}
                keyboardType="numeric"
              />
              <TextInput 
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                placeholder="Reason (optional)" 
                placeholderTextColor="#666"
                value={roundingReason}
                onChangeText={setRoundingReason}
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, {backgroundColor: colors.text}]} 
                  onPress={() => {
                    if (typeof showRoundingModal === 'string' && showRoundingModal.startsWith('group_')) {
                      const groupId = parseInt(showRoundingModal.split('_')[1]);
                      handleSetGroupRounding(groupId, parseFloat(roundedScore), parseFloat(roundedTotal), roundingReason);
                    } else if (typeof showRoundingModal === 'string' && showRoundingModal.startsWith('exam_')) {
                      const examType = showRoundingModal.split('_')[1];
                      handleSetExamRounding(examType);
                    } else {
                      handleSetRounding();
                    }
                  }}
                >
                  <Text style={[styles.modalButtonText, {color: colors.background}]}>Apply Rounding</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, {backgroundColor: colors.card, borderColor: colors.border}]} 
                  onPress={() => {
                    setShowRoundingModal(null);
                    setRoundedScore('');
                    setRoundedTotal('');
                    setRoundingReason('');
                  }}
                >
                  <Text style={[styles.modalButtonText, {color: colors.text}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Grouping Modal */}
        {showGroupingModal && (
          <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
            <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>Create Assessment Group</Text>
              <TextInput 
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                placeholder="Group Name (e.g., Quizzes)" 
                placeholderTextColor="#666"
                value={groupName}
                onChangeText={setGroupName}
              />
              <TextInput 
                style={[styles.inputField, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]} 
                placeholder="Weight % (e.g., 20)" 
                placeholderTextColor="#666"
                value={groupWeight}
                onChangeText={setGroupWeight}
                keyboardType="numeric"
              />
              <Text style={[styles.formTitle, {color: colors.text}]}>Select Assessments:</Text>
              <ScrollView style={styles.assessmentList}>
                {assessments.map(a => (
                  <TouchableOpacity 
                    key={a.id} 
                    style={[styles.assessmentItem, {backgroundColor: colors.secondary, borderColor: colors.border}, selectedAssessments.includes(a.id) && {backgroundColor: colors.accent}]}
                    onPress={() => handleToggleAssessmentSelection(a.id)}
                  >
                    <Text style={[styles.assessmentItemText, {color: selectedAssessments.includes(a.id) ? colors.buttonText : colors.text}]}>{a.name}</Text>
                    {selectedAssessments.includes(a.id) && <Ionicons name="checkmark" size={16} color={colors.buttonText} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, {backgroundColor: colors.text}]} 
                  onPress={handleCreateGroup}
                >
                  <Text style={[styles.modalButtonText, {color: colors.background}]}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, {backgroundColor: colors.card, borderColor: colors.border}]} 
                  onPress={() => {
                    setShowGroupingModal(false);
                    setGroupName('');
                    setGroupWeight('');
                    setSelectedAssessments([]);
                  }}
                >
                  <Text style={[styles.modalButtonText, {color: colors.text}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
            <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>Rounding History</Text>
              <ScrollView style={styles.historyList}>
                {roundingHistory.length === 0 ? (
                  <Text style={[styles.emptyText, {color: colors.subText}]}>No rounding history</Text>
                ) : (
                  roundingHistory.map(h => (
                    <View key={h.id} style={[styles.historyItem, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                      <Text style={[styles.historyItemName, {color: colors.text}]}>{h.item_name} ({h.item_type})</Text>
                      <Text style={[styles.historyItemDetail, {color: colors.subText}]}>
                        {h.raw_score}/{h.raw_total} → {h.rounded_score}/{h.rounded_total}
                      </Text>
                      {h.reason && <Text style={[styles.historyItemReason, {color: colors.subText}]}>Reason: {h.reason}</Text>}
                      <Text style={[styles.historyItemDate, {color: colors.subText}]}>{new Date(h.created_at).toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity 
                style={[styles.modalButton, {backgroundColor: colors.text}]} 
                onPress={() => setShowHistoryModal(false)}
              >
                <Text style={[styles.modalButtonText, {color: colors.background}]}>Close</Text>
              </TouchableOpacity>
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
  card: { borderRadius: 15, padding: 18, marginBottom: 20, borderWidth: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  cardLabel: { fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  goalLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '900' },
  goalValue: { fontSize: 36, fontWeight: '900' },
  targetBox: { alignItems: 'flex-end' },
  targetInput: { fontSize: 24, fontWeight: '900', borderBottomWidth: 3, textAlign: 'right', width: 60 },
  progressContainer: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12, borderWidth: 1.5 },
  progressContainerMain: { flex: 1 },
  progressFill: { height: '100%' },
  remainingText: { fontSize: 12, marginTop: 6, fontWeight: '800' },
  attendanceSummary: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  statBox: { alignItems: 'center', padding: 12, borderRadius: 12, minWidth: 85, borderWidth: 2 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, textTransform: 'uppercase', fontWeight: '900' },
  historySection: { marginTop: 10, marginBottom: 15 },
  historyTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  historyDate: { fontSize: 14, fontWeight: '700' },
  historyReason: { fontSize: 12 },
  divider: { height: 2, marginVertical: 15, borderStyle: 'dashed' },
  secondaryButton: { padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2, marginTop: 10 },
  secondaryButtonText: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },
  miniLabel: { fontSize: 10, marginBottom: 4, textTransform: 'uppercase', fontWeight: '900' },
  subCategoryTitle: { fontSize: 15, fontWeight: '900', marginTop: 15, marginBottom: 8, textTransform: 'uppercase', borderBottomWidth: 2 },
  originalMarkText: { color: '#E63946', fontStyle: 'italic', fontWeight: '900' },
  coachText: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  gradeName: { fontSize: 16, fontWeight: '900' },
  gradeSub: { fontSize: 13, fontWeight: '700' },
  miniMasteryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 },
  masteryText: { fontSize: 13, fontWeight: '900' },
  masteryBox: { alignItems: 'center', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 2 },
  topicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  topicName: { fontSize: 15, fontWeight: '800' },
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
  examGradeForm: { padding: 12, marginBottom: 12 },
  inputField: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 2, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  primaryButtonText: { fontWeight: '900', textTransform: 'uppercase' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 12, borderRadius: 12, borderWidth: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  timeText: { fontSize: 14, fontWeight: '900' },
  roomText: { fontSize: 12, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  typeBtnText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 2 },
  dayChipText: { fontSize: 11, fontWeight: '900' },
  examItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 2 },
  examTypeTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  examCountdown: { fontSize: 12, fontWeight: '900' },
  datePickerBtn: { padding: 8, borderRadius: 8, borderWidth: 1.5 },
  inputText: { fontWeight: '700' },
  emptyText: { fontStyle: 'italic', fontWeight: '700' },
});
