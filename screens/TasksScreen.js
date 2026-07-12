import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllTasks, addTask, updateTaskStatus, deleteTask } from '../dbHelpers';
import { getCountdown } from '../utils';

export default function TasksScreen() {
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

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        ListHeaderComponent={<Text style={styles.header}>Pending Tasks</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.taskCard, styles.shadow, item.status === 'done' && styles.taskCardDone]}>
            <TouchableOpacity style={styles.taskInfo} onPress={() => handleToggleStatus(item)}>
              <Ionicons
                name={item.status === 'done' ? "checkbox" : "square-outline"}
                size={24}
                color={item.status === 'done' ? "#4CAF50" : "#00796B"}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.taskName, item.status === 'done' && styles.taskNameDone]}>
                  {item.name}
                </Text>
                <Text style={styles.taskDeadline}>
                  {item.deadline} {item.status === 'pending' ? `· ${getCountdown(item.deadline)}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.addSectionContainer}
        keyboardVerticalOffset={100}
      >
        <View style={[styles.addSection, styles.shadow]}>
          <Text style={styles.addTitle}>New Task</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="What needs to be done?"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="YYYY-MM-DD"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#FFFFFF' },
  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666666', marginTop: 10, fontSize: 16 },
  taskCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardDone: { backgroundColor: '#1B3121', opacity: 0.8 },
  taskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  taskName: { fontSize: 16, fontWeight: '600', color: '#E0E0E0' },
  taskNameDone: { textDecorationLine: 'line-through', color: '#666666' },
  taskDeadline: { fontSize: 12, color: '#B0B0B0', marginTop: 2 },
  deleteBtn: { padding: 8 },
  addSectionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  addSection: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: '#333333' },
  addTitle: { fontSize: 16, fontWeight: 'bold', color: '#4DB6AC', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: { backgroundColor: '#262626', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#333333', color: '#FFFFFF' },
  addButton: { backgroundColor: '#4DB6AC', borderRadius: 12, padding: 15, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});