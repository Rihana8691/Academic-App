import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPersonalNotes, addPersonalNote, deletePersonalNote } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Hero, Card, PillButton, inputStyle } from '../ui';

export default function JournalScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const loadData = useCallback(() => setNotes(getPersonalNotes()), []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function handleAdd() {
    if (!newNote.trim()) return;
    addPersonalNote(newNote.trim());
    setNewNote(''); loadData();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 26 }} keyboardShouldPersistTaps="handled">
        <Hero>
          <Text style={styles.title}>Journal ✍️</Text>
          <Text style={styles.sub}>{notes.length} {notes.length === 1 ? 'entry' : 'entries'}</Text>
        </Hero>

        <View style={{ paddingHorizontal: 13, marginTop: -23 }}>
          <Card>
            <TextInput
              style={[inputStyle(colors), { height: 88, textAlignVertical: 'top', marginBottom: 9 }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.subText}
              multiline
              value={newNote}
              onChangeText={setNewNote}
            />
            <PillButton label="Save entry" icon="bookmark" onPress={handleAdd} />
          </Card>

          {notes.length === 0 && (
            <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 20, fontWeight: '600' }}>No entries yet. Start writing! 🌱</Text>
          )}
          {notes.map(note => (
            <Card key={note.id} style={styles.note}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noteText, { color: colors.text }]}>{note.text_content}</Text>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 5 }}>{note.created_at.split(' ')[0]}</Text>
              </View>
              <TouchableOpacity onPress={() => { deletePersonalNote(note.id); loadData(); }} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={19} color={colors.error} />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 27, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  note: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 9 },
  noteText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
