import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllTasks, addTask, updateTaskStatus, deleteTask } from '../dbHelpers';
import { getCountdown } from '../utils';
import { useTheme } from '../ThemeContext';
import { emitTasksChanged } from '../events';
import { Hero, Card, PillButton, inputStyle, softShadow } from '../ui';

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');

  const loadTasks = useCallback(() => setTasks(getAllTasks()), []);
  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  function handleAddTask() {
    if (!name.trim() || !deadline.trim()) {
      Alert.alert('Missing info', 'Please enter a task name and a deadline (YYYY-MM-DD).');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline.trim()) || isNaN(new Date(deadline.trim()).getTime())) {
      Alert.alert('Check the date', 'Please use the format YYYY-MM-DD, for example 2026-11-05.');
      return;
    }
    addTask(name.trim(), deadline.trim(), null, null);
    setName(''); setDeadline(''); loadTasks(); emitTasksChanged();
  }
  const toggle = (t) => { updateTaskStatus(t.id, t.status === 'pending' ? 'done' : 'pending'); loadTasks(); emitTasksChanged(); };
  const remove = (id) => { deleteTask(id); loadTasks(); emitTasksChanged(); };
  const pending = tasks.filter(t => t.status === 'pending').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={tasks}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingBottom: 169 }}
        ListHeaderComponent={
          <Hero top style={{ marginBottom: 13 }}>
            <Text style={styles.title}>My tasks</Text>
            <Text style={styles.sub}>{pending === 0 ? "You're all caught up 🎉" : `${pending} thing${pending > 1 ? 's' : ''} to do`}</Text>
          </Hero>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 46 }}>🎉</Text>
            <Text style={{ color: colors.subText, fontWeight: '700', marginTop: 5 }}>Nothing here yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = item.status === 'done';
          return (
            <Card style={[styles.task, done && { opacity: 0.6 }]}>
              <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
                <View style={[styles.check, { borderColor: done ? colors.success : colors.accentLight }, done && { backgroundColor: colors.success }]}>
                  {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1, marginLeft: 9 }}>
                  <Text style={[styles.taskName, { color: colors.text }, done && { textDecorationLine: 'line-through' }]}>{item.name}</Text>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
                    {item.deadline}{!done ? ` · ${getCountdown(item.deadline)}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={19} color={colors.error} />
              </TouchableOpacity>
            </Card>
          );
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100} style={styles.sheetWrap}>
        <View style={[styles.sheet, softShadow, { backgroundColor: colors.card, shadowOffset: { width: 0, height: -6 } }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <TextInput style={[inputStyle(colors), { marginBottom: 6 }]} placeholder="What needs to be done?" placeholderTextColor={colors.subText} value={name} onChangeText={setName} />
          <TextInput style={[inputStyle(colors), { marginBottom: 9 }]} placeholder="Deadline (YYYY-MM-DD)" placeholderTextColor={colors.subText} value={deadline} onChangeText={setDeadline} />
          <PillButton label="Add task" icon="add-circle" onPress={handleAddTask} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 27, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  task: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 13, marginBottom: 8, padding: 10 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  taskName: { fontSize: 14, fontWeight: '700' },
  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 13, paddingBottom: Platform.OS === 'ios' ? 36 : 22 },
  handle: { width: 35, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 10 },
});
