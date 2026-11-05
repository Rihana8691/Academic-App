import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTopicNotes, addTopicNote, deleteTopicNote, updateTopicNote } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function ChapterNotesScreen({ route, navigation }) {
  const { topicId, topicName } = route.params;
  const { colors } = useTheme();

  const [notes, setNotes] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // null for new, {id, text} for edit
  const [noteContent, setNoteContent] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  const loadNotes = useCallback(() => {
    setNotes(getTopicNotes(topicId));
  }, [topicId]);

  useFocusEffect(useCallback(() => loadNotes(), [loadNotes]));

  function handleOpenModal(note = null) {
    if (note) {
      setEditingNote(note);
      setNoteContent(note.note_text);
      setIsEditingMode(false); // Default to read-only for existing notes
    } else {
      setEditingNote(null);
      setNoteContent('');
      setIsEditingMode(true); // Default to editing for new notes
    }
    setIsModalVisible(true);
  }

  function handleSaveNote() {
    if (!noteContent.trim()) {
      Alert.alert('Empty Note', 'Please write something before saving.');
      return;
    }

    if (editingNote) {
      updateTopicNote(editingNote.id, noteContent.trim());
    } else {
      addTopicNote(topicId, noteContent.trim());
    }

    setIsModalVisible(false);
    loadNotes();
  }

  function handleDelete(id) {
    Alert.alert('Delete Note', 'Are you sure you want to remove this note entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteTopicNote(id);
        loadNotes();
      }}
    ]);
  }

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerArea}>
        <Text style={[styles.header, { color: colors.text }]}>{topicName}</Text>
        <Text style={[styles.subheader, { color: colors.subText }]}>My Notes</Text>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>No separate notes for this chapter yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleOpenModal(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.notePreview, { color: colors.text }]} numberOfLines={3}>
                {item.note_text}
              </Text>
              <Text style={[styles.noteDate, { color: colors.subText }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.bt, borderColor: colors.border }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={36} color={colors.buttonText} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingNote ? (isEditingMode ? 'Edit Entry' : 'Reading Entry') : 'New Note'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isEditingMode ? (
              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border }]}
                multiline
                placeholder="📝 Start writing your chapter notes here..."
                placeholderTextColor={colors.subText}
                value={noteContent}
                onChangeText={setNoteContent}
                autoFocus
              />
            ) : (
              <ScrollView style={[styles.readOnlyContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {noteContent}
                </Text>
              </ScrollView>
            )}

            {isEditingMode ? (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.text }]} onPress={handleSaveNote}>
                <Text style={[styles.saveBtnText, { color: colors.background }]}>
                  {editingNote ? 'Save Changes' : 'Save Note'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.bt }]} onPress={() => setIsEditingMode(true)}>
                <Text style={[styles.saveBtnText, { color: colors.buttonText }]}>
                  Edit Note
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  headerArea: { padding: 20, paddingBottom: 0 },
  header: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subheader: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  noteCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4
  },
  notePreview: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  noteDate: { fontSize: 11, fontWeight: '800', marginTop: 8 },
  trashBtn: { marginLeft: 12, padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15, fontWeight: '700', textAlign: 'center', maxWidth: '80%' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    height: '80%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  noteInput: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    textAlignVertical: 'top',
    fontWeight: '700',
    marginBottom: 20
  },
  readOnlyContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20
  },
  readOnlyText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24
  },
  saveBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { fontWeight: '800', fontSize: 16 }
});
