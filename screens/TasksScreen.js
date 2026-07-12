import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllTasks, addTask, updateTaskStatus, deleteTask } from '../dbHelpers';
import { getCountdown } from '../utils';
import { useTheme } from '../ThemeContext';

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');

  const loadTasks = useCallback(() => {
    setTasks(getAllTasks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  function handleAddTask() {
    if (!name.trim() || !deadline.trim()) {
      Alert.alert('Missing Info', 'Please enter a task name and a deadline (YYYY-MM-DD).');
      return;
    }
    addTask(name.trim(), deadline.trim(), null, null);
    setName('');
    setDeadline('');
    loadTasks();
  }

  function handleToggleStatus(task) {
    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    updateTaskStatus(task.id, newStatus);
    loadTasks();
  }

  function handleDelete(id) {
    deleteTask(id);
    loadTasks();
  }

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        ListHeaderComponent={<Text style={[styles.header, {color: colors.text}]}>Pending Tasks</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.subText} />
            <Text style={[styles.emptyText, {color: colors.subText}]}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.taskCard, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}, item.status === 'done' && {backgroundColor: colors.secondary}]}>
            <TouchableOpacity style={styles.taskInfo} onPress={() => handleToggleStatus(item)}>
              <Ionicons
                name={item.status === 'done' ? "checkbox" : "square-outline"}
                size={24}
                color={item.status === 'done' ? colors.success : colors.accent}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.taskName, {color: colors.text}, item.status === 'done' && styles.taskNameDone]}>
                  {item.name}
                </Text>
                <Text style={[styles.taskDeadline, {color: colors.accent}]}>
                  {item.deadline} {item.status === 'pending' ? `· ${getCountdown(item.deadline)}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.addSectionContainer}
        keyboardVerticalOffset={100}
      >
        <View style={[styles.addSection, styles.shadow, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <Text style={[styles.addTitle, {color: colors.accent}]}>New Task</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 2, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]}
              placeholder="What needs to be done?"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
          <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.text}]} onPress={handleAddTask}>
            <Text style={[styles.addButtonText, {color: colors.background}]}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: '900', marginBottom: 20, padding: 20, textTransform: 'uppercase', letterSpacing: -1 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0
  },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: '700' },
  taskCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
  },
  taskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  taskName: { fontSize: 16, fontWeight: '800' },
  taskNameDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskDeadline: { fontSize: 11, marginTop: 4, fontWeight: '900', textTransform: 'uppercase' },
  deleteBtn: { padding: 8 },
  addSectionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  addSection: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 3 },
  addTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 2, fontWeight: '700' },
  addButton: { borderRadius: 12, padding: 15, alignItems: 'center' },
  addButtonText: { fontWeight: '900', textTransform: 'uppercase' },
});
