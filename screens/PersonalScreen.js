import { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPrayers, updatePrayer, getPersonalNotes, getHabitsWithTracking, addHabit, deleteHabit, toggleHabitTracking, initDefaultHabitTemplates, getHabitTemplates, getHabitHistory, getDailyCompletionRate } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function PersonalScreen({ navigation }) {
  const { colors, theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prayers, setPrayers] = useState({});
  const [notes, setNotes] = useState([]);
  const [habits, setHabits] = useState([]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [reminderTime, setReminderTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHabitForHistory, setSelectedHabitForHistory] = useState(null);
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [showWeekView, setShowWeekView] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [completedHabits, setCompletedHabits] = useState({});
  const scaleAnimations = {};

  const formattedDate = selectedDate.toISOString().split('T')[0];

  const loadData = useCallback(() => {
    setPrayers(getPrayers(formattedDate));
    setNotes(getPersonalNotes());
    setHabits(getHabitsWithTracking(formattedDate));
    setTemplates(getHabitTemplates());
    setDailyProgress(getDailyCompletionRate(formattedDate));
  }, [formattedDate]);

  useEffect(() => {
    initDefaultHabitTemplates();
  }, []);

  useFocusEffect(useCallback(() => loadData(), [loadData]));

  function togglePrayer(field) {
    const newVal = !prayers[field];
    updatePrayer(formattedDate, field, newVal);
    loadData();
  }

  function onDateChange(event, date) {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  }

  function handleAddHabit() {
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim(), 'checkbox-outline', selectedCategory, selectedPriority, reminderTime);
    setNewHabitName('');
    setSelectedCategory('Personal');
    setSelectedPriority('medium');
    setReminderTime('');
    setShowAddHabit(false);
    loadData();
  }

  function handleAddFromTemplate(template) {
    addHabit(template.name, template.icon, template.category, template.priority, null);
    setShowTemplates(false);
    loadData();
  }

  function handleTimeChange(event, time) {
    setShowTimePicker(false);
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      setReminderTime(`${hours}:${minutes}`);
    }
  }

  function handleShowHistory(habit) {
    setSelectedHabitForHistory(habit);
    setShowHistoryModal(true);
  }

  function getWeekDates() {
    const today = selectedDate;
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push({
        date: date,
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString()
      });
    }
    return weekDates;
  }

  function selectDate(date) {
    setSelectedDate(date);
    setShowWeekView(false);
  }

  function getHabitHistoryData(habitId) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const history = getHabitHistory(habitId, thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    const historyMap = {};
    history.forEach(h => {
      historyMap[h.date] = h.completed;
    });
    
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed: historyMap[dateStr] === 1
      });
    }
    return result;
  }

  function handleDeleteHabit(habitId) {
    deleteHabit(habitId);
    loadData();
  }

  function toggleHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const newCompleted = !habit.tracking.completed;
      toggleHabitTracking(habitId, formattedDate, newCompleted);
      loadData();
    }
  }

  const PrayerBtn = ({ label, field, icon }) => (
    <TouchableOpacity
      style={[styles.prayerBtn, {backgroundColor: colors.secondary, borderColor: colors.border}, prayers[field] && {backgroundColor: colors.accent, borderColor: colors.accent}]}
      onPress={() => togglePrayer(field)}
    >
      <MaterialCommunityIcons name={icon} size={24} color={prayers[field] ? colors.buttonText : colors.accent} />
      <Text style={[styles.prayerLabel, {color: colors.text}, prayers[field] && {color: colors.buttonText}]}>{label}</Text>
      {prayers[field] && <View style={styles.check}><Ionicons name="checkmark-circle" size={16} color={colors.buttonText} /></View>}
    </TouchableOpacity>
  );

  const HabitItem = ({ habit }) => {
    const isExpanded = expandedHabitId === habit.id;
    return (
      <TouchableOpacity
        style={[styles.habitItemRow, {borderBottomColor: colors.border}]}
        onPress={() => toggleHabit(habit.id)}
        onLongPress={() => setExpandedHabitId(isExpanded ? null : habit.id)}
      >
        <View style={[styles.habitIconBg, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
          <View>
            <Ionicons name={habit.icon} size={22} color={colors.accent} />
          </View>
        </View>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitLabel, {color: colors.text}]}>{habit.name}</Text>
          {isExpanded && (
            <View style={styles.habitMeta}>
              <Text style={[styles.habitCategory, {color: colors.subText}]}>{habit.category}</Text>
              {habit.streak > 0 && (
                <View style={styles.streakBadge}>
                  <View>
                    <Ionicons name="flame" size={12} color="#FF6B35" />
                  </View>
                  <Text style={styles.streakText}>{habit.streak}</Text>
                </View>
              )}
              <Text style={[styles.weekStats, {color: colors.subText}]}>{habit.weekStats.percentage}% this week</Text>
            </View>
          )}
        </View>
        <View style={[styles.checkbox, {borderColor: colors.border, backgroundColor: colors.card}, habit.tracking.completed && {backgroundColor: colors.accent, borderColor: colors.accent}]}>
          {habit.tracking.completed ? <View><Ionicons name="checkmark" size={18} color={colors.buttonText} /></View> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={[styles.greetingBadge, {backgroundColor: colors.secondary}]}>
                <Ionicons name="sunny-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.header, {color: colors.text}]}>My Day</Text>
            </View>
            <TouchableOpacity onPress={() => setShowWeekView(!showWeekView)} style={[styles.dateBadge, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={{marginRight: 6}}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              </View>
              <Text style={[styles.subheader, {color: colors.accent}]}>{selectedDate.toDateString()}</Text>
              <View style={{marginLeft: 6}}>
                <Ionicons name={showWeekView ? "chevron-up" : "chevron-down"} size={16} color={colors.accent} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {dailyProgress.total > 0 && (
          <View style={[styles.progressCardRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.progressCard}>
              <View style={styles.progressLeft}>
                <Text style={[styles.progressLabel, {color: colors.subText}]}>Today's Progress</Text>
                <Text style={[styles.progressCount, {color: colors.text}]}>{dailyProgress.completed}/{dailyProgress.total} habits</Text>
              </View>
              <View style={[styles.progressCircle, {borderColor: colors.accent}]}>
                <Text style={[styles.progressPercentage, {color: colors.accent}]}>{dailyProgress.percentage}%</Text>
              </View>
            </View>
          </View>
        )}

        {showWeekView && (
          <View style={[styles.weekView, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getWeekDates().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekDay,
                    day.isSelected && [styles.weekDaySelected, {backgroundColor: colors.accent}],
                    day.isToday && !day.isSelected && {borderColor: colors.accent}
                  ]}
                  onPress={() => selectDate(day.date)}
                >
                  <Text style={[
                    styles.weekDayName,
                    day.isSelected ? {color: colors.buttonText} : {color: colors.subText}
                  ]}>{day.dayName}</Text>
                  <Text style={[
                    styles.weekDayNumber,
                    day.isSelected ? {color: colors.buttonText} : {color: colors.text}
                  ]}>{day.dayNumber}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.sectionHeader}>
            <View>
              <Ionicons name="sunny-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, {color: colors.text}]}>Prayer Tracker</Text>
          </View>
          <View style={styles.prayerGrid}>
            <PrayerBtn label="Fajr" field="fajr" icon="weather-sunset-up" />
            <PrayerBtn label="Dhuhr" field="dhuhr" icon="weather-sunny" />
            <PrayerBtn label="Asr" field="asr" icon="weather-partly-cloudy" />
            <PrayerBtn label="Maghrib" field="maghrib" icon="weather-sunset-down" />
            <PrayerBtn label="Isha" field="isha" icon="weather-night" />
          </View>
        </View>

        <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.sectionHeader}>
            <View>
              <Ionicons name="checkbox-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, {color: colors.text}]}>Daily Habits</Text>
            <View style={styles.habitHeaderButtons}>
              <TouchableOpacity onPress={() => setShowTemplates(!showTemplates)} style={styles.headerBtn}>
                <View>
                  <Ionicons name="list-outline" size={20} color={colors.accent} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddHabit(!showAddHabit)} style={styles.headerBtn}>
                <View>
                  <Ionicons name={showAddHabit ? "close-circle" : "add-circle"} size={20} color={colors.accent} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {showTemplates && (
            <View style={styles.templatesContainer}>
              <Text style={[styles.templatesTitle, {color: colors.text}]}>Quick Add from Templates:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                {templates.map(template => (
                  <TouchableOpacity 
                    key={template.id} 
                    style={[styles.templateItem, {backgroundColor: colors.secondary, borderColor: colors.border}]}
                    onPress={() => handleAddFromTemplate(template)}
                  >
                    <View>
                      <Ionicons name={template.icon} size={24} color={colors.accent} />
                    </View>
                    <Text style={[styles.templateName, {color: colors.text}]}>{template.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {showAddHabit && (
            <View style={styles.addHabitContainer}>
              <TextInput
                style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                placeholder="New habit name..."
                placeholderTextColor="#666"
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
              <View style={styles.habitOptions}>
                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, {color: colors.text}]}>Category:</Text>
                  {['Personal', 'Health', 'Study', 'Work'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.optionBtn, selectedCategory === cat && {backgroundColor: colors.accent}]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.optionText, selectedCategory === cat && {color: colors.buttonText}]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, {color: colors.text}]}>Priority:</Text>
                  {['low', 'medium', 'high'].map(pri => (
                    <TouchableOpacity
                      key={pri}
                      style={[styles.optionBtn, selectedPriority === pri && {backgroundColor: colors.accent}]}
                      onPress={() => setSelectedPriority(pri)}
                    >
                      <Text style={[styles.optionText, selectedPriority === pri && {color: colors.buttonText}]}>{pri}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, {color: colors.text}]}>Reminder:</Text>
                  <TouchableOpacity 
                    style={[styles.timeBtn, {backgroundColor: colors.secondary, borderColor: colors.border}]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={[styles.timeText, {color: colors.text}]}>{reminderTime || 'Set time'}</Text>
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </View>
              </View>
              <TouchableOpacity style={[styles.saveBtn, {backgroundColor: colors.text}]} onPress={handleAddHabit}>
                <Text style={[styles.saveBtnText, {color: colors.background}]}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.habitList}>
            {(showAllHabits ? habits : habits.slice(0, 2)).map(habit => (
              <HabitItem key={habit.id} habit={habit} />
            ))}
            {habits.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="sparkles-outline" size={40} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, {color: colors.text}]}>Start Your Journey</Text>
                <Text style={[styles.emptySubtitle, {color: colors.subText}]}>Add your first habit to begin building positive daily routines</Text>
              </View>
            )}
            {habits.length > 2 && (
              <TouchableOpacity 
                style={styles.showMoreBtn}
                onPress={() => setShowAllHabits(!showAllHabits)}
              >
                <Text style={[styles.showMoreText, {color: colors.accent}]}>
                  {showAllHabits ? 'Show Less' : `Show More (${habits.length - 2} more)`}
                </Text>
                <View>
                  <Ionicons 
                    name={showAllHabits ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={colors.accent} 
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Habit History Modal */}
        <Modal
          visible={showHistoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
            <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, {color: colors.text}]}>Habit History</Text>
                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                  <View>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>
              {selectedHabitForHistory && (
                <View>
                  <View style={styles.modalHabitInfo}>
                    <View>
                      <Ionicons name={selectedHabitForHistory.icon} size={32} color={colors.accent} />
                    </View>
                    <View>
                      <Text style={[styles.modalHabitName, {color: colors.text}]}>{selectedHabitForHistory.name}</Text>
                      <Text style={[styles.modalHabitStats, {color: colors.subText}]}>
                        Current streak: {selectedHabitForHistory.streak} days • {selectedHabitForHistory.weekStats.percentage}% this week
                      </Text>
                    </View>
                  </View>
                  <ScrollView style={styles.historyList}>
                    {getHabitHistoryData(selectedHabitForHistory.id).map((item, index) => (
                      <View key={index} style={[styles.historyItem, {borderBottomColor: colors.border}]}>
                        <Text style={[styles.historyDate, {color: colors.text}]}>{item.displayDate}</Text>
                        <View style={[styles.historyStatus, item.completed ? {backgroundColor: colors.accent} : {backgroundColor: colors.secondary}]}>
                          <View>
                            <Ionicons 
                              name={item.completed ? "checkmark" : "close"} 
                              size={16} 
                              color={item.completed ? colors.buttonText : colors.subText} 
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <TouchableOpacity 
          style={[styles.card, styles.shadow, styles.clickableCard, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 2}]}
          onPress={() => navigation.navigate('Journal')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, {backgroundColor: colors.secondary}]}>
              <Ionicons name="journal-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderContent}>
              <Text style={[styles.cardTitle, {color: colors.text}]}>Daily Journal</Text>
              <Text style={[styles.journalPreview, {color: colors.subText}]}>
                {notes.length > 0 ? `${notes.length} entries` : 'Tap to write your journal'}
              </Text>
            </View>
            <View style={{marginLeft: 'auto'}}>
              <Ionicons name="chevron-forward" size={24} color={colors.accent} />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  headerRow: { marginBottom: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerContent: { flex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  greetingBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', borderWidth: 2, height: 40 },
  subheader: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressCardRow: { borderRadius: 16, borderWidth: 2, padding: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' },
  progressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  progressLeft: { flex: 1 },
  progressLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  progressPercentage: { fontSize: 20, fontWeight: '900', lineHeight: 20 },
  progressCount: { fontSize: 13, fontWeight: '700' },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  journalPreview: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  clickableCard: { borderWidth: 2 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardHeaderContent: { flex: 1 },
  weekView: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  weekDay: { width: 52, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2, marginRight: 10, borderColor: 'transparent' },
  weekDaySelected: { borderWidth: 0 },
  weekDayName: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  weekDayNumber: { fontSize: 18, fontWeight: '900' },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 2 },
  shadow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prayerBtn: { flex: 1, minWidth: '30%', padding: 14, borderRadius: 12, alignItems: 'center', position: 'relative', borderWidth: 2 },
  prayerLabel: { fontSize: 10, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  check: { position: 'absolute', top: 4, right: 4 },
  input: { borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 15, borderWidth: 2, fontWeight: '700' },
  saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontWeight: '900', textTransform: 'uppercase' },
  notesList: { marginTop: 20 },
  noteItem: { paddingVertical: 12, borderBottomWidth: 1.5, flexDirection: 'row', alignItems: 'center' },
  noteText: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  noteDate: { fontSize: 11, marginTop: 4, fontWeight: '900' },
  habitItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1.5 },
  habitIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2 },
  habitInfo: { flex: 1 },
  habitLabel: { fontSize: 15, fontWeight: '800' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  habitCategory: { fontSize: 10, fontWeight: '800', marginRight: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0E6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  streakText: { fontSize: 10, fontWeight: '900', color: '#FF6B35', marginLeft: 2 },
  weekStats: { fontSize: 10, fontWeight: '800' },
  checkbox: { width: 26, height: 26, borderRadius: 7, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  historyBtn: { padding: 4, marginRight: 4 },
  deleteHabitBtn: { padding: 4 },
  addHabitContainer: { marginBottom: 15 },
  habitOptions: { marginTop: 15 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  optionLabel: { fontSize: 13, fontWeight: '700', marginRight: 10, minWidth: 70 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, marginRight: 8, marginBottom: 4 },
  optionText: { fontSize: 12, fontWeight: '700' },
  timeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  timeText: { fontSize: 13, fontWeight: '700' },
  habitHeaderButtons: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  templatesContainer: { marginBottom: 15 },
  templatesTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  templatesScroll: { marginBottom: 10 },
  templateItem: { width: 100, padding: 12, borderRadius: 10, alignItems: 'center', marginRight: 10, borderWidth: 1.5 },
  templateName: { fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#999', fontStyle: 'italic', paddingVertical: 24, textAlign: 'center', fontWeight: '600' },
  emptyStateContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, maxHeight: '80%', borderWidth: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalHabitInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1.5, borderBottomColor: '#ddd' },
  modalHabitName: { fontSize: 18, fontWeight: '800' },
  modalHabitStats: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  historyList: { maxHeight: 300 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  historyDate: { fontSize: 14, fontWeight: '600' },
  historyStatus: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10 },
  showMoreText: { fontSize: 14, fontWeight: '800', marginRight: 8 },
});
