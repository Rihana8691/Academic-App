import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPrayers, updatePrayer, getPersonalNotes, addPersonalNote, deletePersonalNote } from '../dbHelpers';

export default function PersonalScreen() {
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
      style={[styles.prayerBtn, prayers[field] && styles.prayerBtnActive]}
      onPress={() => togglePrayer(field)}
    >
      <MaterialCommunityIcons name={icon} size={24} color={prayers[field] ? '#fff' : '#4DB6AC'} />
      <Text style={[styles.prayerLabel, prayers[field] && styles.prayerLabelActive]}>{label}</Text>
      {prayers[field] && <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.check} />}
    </TouchableOpacity>
  );

  const HabitItem = ({ label, field, icon }) => (
    <TouchableOpacity
      style={styles.habitItemRow}
      onPress={() => togglePrayer(field)}
    >
      <View style={styles.habitIconBg}>
        <Ionicons name={icon} size={20} color="#4DB6AC" />
      </View>
      <Text style={styles.habitLabel}>{label}</Text>
      <View style={[styles.checkbox, prayers[field] && styles.checkboxActive]}>
        {prayers[field] ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>My Day</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color="#4DB6AC" style={{marginRight: 5}} />
              <Text style={styles.subheader}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        {/* PRAYER TRACKER */}
        <View style={[styles.card, styles.shadow]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny-outline" size={20} color="#4DB6AC" />
            <Text style={styles.cardTitle}>Prayer Tracker</Text>
          </View>
          <View style={styles.prayerGrid}>
            <PrayerBtn label="Fajr" field="fajr" icon="weather-sunset-up" />
            <PrayerBtn label="Dhuhr" field="dhuhr" icon="weather-sunny" />
            <PrayerBtn label="Asr" field="asr" icon="weather-partly-cloudy" />
            <PrayerBtn label="Maghrib" field="maghrib" icon="weather-sunset-down" />
            <PrayerBtn label="Isha" field="isha" icon="weather-night" />
          </View>
        </View>

        {/* HABIT TRACKER */}
        <View style={[styles.card, styles.shadow]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkbox-outline" size={20} color="#4DB6AC" />
            <Text style={styles.cardTitle}>Daily Habits</Text>
          </View>
          <View style={styles.habitList}>
            <HabitItem label="No Sugar Today" field="no_sugar" icon="nutrition-outline" />
            <HabitItem label="Read a Book" field="read_book" icon="book-outline" />
            <HabitItem label="Studying" field="study_time" icon="pencil-outline" />
          </View>
        </View>

        {/* DAILY JOURNAL */}
        <View style={[styles.card, styles.shadow]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="journal-outline" size={20} color="#4DB6AC" />
            <Text style={styles.cardTitle}>Daily Journal</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's on your mind?..."
            placeholderTextColor="#666"
            multiline
            value={newNote}
            onChangeText={setNewNote}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddNote}>
            <Text style={styles.saveBtnText}>Save Note</Text>
          </TouchableOpacity>

          <View style={styles.notesList}>
            {notes.map(note => (
              <View key={note.id} style={styles.noteItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.noteText}>{note.text_content}</Text>
                  <Text style={styles.noteDate}>{note.created_at.split(' ')[0]}</Text>
                </View>
                <TouchableOpacity onPress={() => { deletePersonalNote(note.id); loadData(); }}>
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerRow: { marginBottom: 24 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderColor: '#333' },
  subheader: { fontSize: 13, color: '#4DB6AC', fontWeight: 'bold' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 16, marginBottom: 20 },
  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#4DB6AC' },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prayerBtn: { flex: 1, minWidth: '30%', backgroundColor: '#262626', padding: 15, borderRadius: 15, alignItems: 'center', position: 'relative' },
  prayerBtnActive: { backgroundColor: '#004D40', borderWidth: 1, borderColor: '#4DB6AC' },
  prayerLabel: { fontSize: 12, fontWeight: 'bold', color: '#B0B0B0', marginTop: 5 },
  prayerLabelActive: { color: '#4DB6AC' },
  check: { position: 'absolute', top: 5, right: 5 },
  input: { backgroundColor: '#262626', borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 15, color: '#FFFFFF', borderColor: '#333333', borderWidth: 1 },
  saveBtn: { backgroundColor: '#4DB6AC', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  notesList: { marginTop: 20 },
  noteItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#262626', flexDirection: 'row', alignItems: 'center' },
  noteText: { fontSize: 14, color: '#E0E0E0', lineHeight: 20 },
  noteDate: { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
  habitItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#262626' },
  habitIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#004D40', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  habitLabel: { flex: 1, fontSize: 15, color: '#E0E0E0', fontWeight: '500' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#4DB6AC', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#4DB6AC' }
});