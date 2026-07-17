import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPersonalNotes, addPersonalNote, deletePersonalNote } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function JournalScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const loadData = useCallback(() => {
    setNotes(getPersonalNotes());
  }, []);

  useFocusEffect(useCallback(() => loadData(), [loadData]));

  function handleAddNote() {
    if (!newNote.trim()) return;
    addPersonalNote(newNote.trim());
    setNewNote('');
    loadData();
  }

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="journal-outline" size={24} color={colors.accent} />
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
            {notes.length === 0 && (
              <Text style={[styles.emptyText, {color: colors.subText}]}>No journal entries yet. Start writing!</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 15, padding: 18, borderWidth: 2 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  input: { borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 15, borderWidth: 2, fontWeight: '700', marginBottom: 15 },
  saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontWeight: '900', textTransform: 'uppercase' },
  notesList: { marginTop: 20 },
  noteItem: { paddingVertical: 15, borderBottomWidth: 1.5, flexDirection: 'row', alignItems: 'center' },
  noteText: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  noteDate: { fontSize: 12, marginTop: 6, fontWeight: '900' },
  emptyText: { fontSize: 15, color: '#999', fontStyle: 'italic', paddingVertical: 30, textAlign: 'center' },
});
