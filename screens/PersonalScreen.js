import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPrayers, updatePrayer, getPersonalNotes, addPersonalNote, deletePersonalNote } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function PersonalScreen() {
  const { colors, theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prayers, setPrayers] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const formattedDate = selectedDate.toISOString().split('T')[0];

  const loadData = useCallback(() => {
    setPrayers(getPrayers(formattedDate));
    setNotes(getPersonalNotes());
  }, [formattedDate]);

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

  function handleAddNote() {
    if (!newNote.trim()) return;
    addPersonalNote(newNote.trim());
    setNewNote('');
    loadData();
  }

  const PrayerBtn = ({ label, field, icon }) => (
    <TouchableOpacity
      style={[styles.prayerBtn, {backgroundColor: colors.secondary, borderColor: colors.border}, prayers[field] && {backgroundColor: colors.accent, borderColor: colors.accent}]}
      onPress={() => togglePrayer(field)}
    >
      <MaterialCommunityIcons name={icon} size={24} color={prayers[field] ? colors.buttonText : colors.accent} />
      <Text style={[styles.prayerLabel, {color: colors.text}, prayers[field] && {color: colors.buttonText}]}>{label}</Text>
      {prayers[field] && <Ionicons name="checkmark-circle" size={16} color={colors.buttonText} style={styles.check} />}
    </TouchableOpacity>
  );

  const HabitItem = ({ label, field, icon }) => (
    <TouchableOpacity
      style={[styles.habitItemRow, {borderBottomColor: colors.border}]}
      onPress={() => togglePrayer(field)}
    >
      <View style={[styles.habitIconBg, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <Text style={[styles.habitLabel, {color: colors.text}]}>{label}</Text>
      <View style={[styles.checkbox, {borderColor: colors.border, backgroundColor: colors.card}, prayers[field] && {backgroundColor: colors.accent, borderColor: colors.accent}]}>
        {prayers[field] ? <Ionicons name="checkmark" size={16} color={colors.buttonText} /> : null}
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.header, {color: colors.text}]}>My Day</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateBadge, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} style={{marginRight: 5}} />
              <Text style={[styles.subheader, {color: colors.accent}]}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny-outline" size={20} color={colors.accent} />
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
            <Ionicons name="checkbox-outline" size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, {color: colors.text}]}>Daily Habits</Text>
          </View>
          <View style={styles.habitList}>
            <HabitItem label="No Sugar Today" field="no_sugar" icon="nutrition-outline" />
            <HabitItem label="Read a Book" field="read_book" icon="book-outline" />
            <HabitItem label="Studying" field="study_time" icon="pencil-outline" />
          </View>
        </View>

        <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="journal-outline" size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, {color: colors.text}]}>Daily Journal</Text>
          </View>

          <TextInput
            style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
            placeholder="What's on your mind?..."
            placeholderTextColor="#666"
            multiline
            value={newNote}
            onChangeText={setNewNote}
          />
          <TouchableOpacity style={[styles.saveBtn, {backgroundColor: colors.text}]} onPress={handleAddNote}>
            <Text style={[styles.saveBtnText, {color: colors.background}]}>Save Note</Text>
          </TouchableOpacity>

          <View style={styles.notesList}>
            {notes.map(note => (
              <View key={note.id} style={[styles.noteItem, {borderBottomColor: colors.border}]}>
                <View style={{flex: 1}}>
                  <Text style={[styles.noteText, {color: colors.text}]}>{note.text_content}</Text>
                  <Text style={[styles.noteDate, {color: colors.subText}]}>{note.created_at.split(' ')[0]}</Text>
                </View>
                <TouchableOpacity onPress={() => { deletePersonalNote(note.id); loadData(); }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  headerRow: { marginBottom: 24 },
  header: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginTop: 10, borderWidth: 2 },
  subheader: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  card: { borderRadius: 15, padding: 18, marginBottom: 20, borderWidth: 2 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prayerBtn: { flex: 1, minWidth: '30%', padding: 15, borderRadius: 12, alignItems: 'center', position: 'relative', borderWidth: 1.5 },
  prayerLabel: { fontSize: 10, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' },
  check: { position: 'absolute', top: 5, right: 5 },
  input: { borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 15, borderWidth: 2, fontWeight: '700' },
  saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontWeight: '900', textTransform: 'uppercase' },
  notesList: { marginTop: 20 },
  noteItem: { paddingVertical: 12, borderBottomWidth: 1.5, flexDirection: 'row', alignItems: 'center' },
  noteText: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  noteDate: { fontSize: 11, marginTop: 4, fontWeight: '900' },
  habitItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1.5 },
  habitIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5 },
  habitLabel: { flex: 1, fontSize: 15, fontWeight: '800' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
});
