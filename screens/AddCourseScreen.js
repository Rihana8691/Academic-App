import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addCourse } from '../dbHelpers';

export default function AddCourseScreen({ route, navigation }) {
  const { semesterId } = route.params;
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [creditHours, setCreditHours] = useState('');

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a course name.');
      return;
    }
    const credits = parseFloat(creditHours);
    if (isNaN(credits) || credits <= 0) {
      Alert.alert('Invalid credit hours', 'Please enter a valid number, e.g. 3 or 4.');
      return;
    }

    addCourse(semesterId, name.trim(), courseCode.trim(), credits);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Course Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Database Systems"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={styles.label}>Course ID (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. SE301"
        value={courseCode}
        onChangeText={setCourseCode}
      />

      <Text style={styles.label}>Credit Hours</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3"
        value={creditHours}
        onChangeText={setCreditHours}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  label: { fontSize: 14, color: '#B0B0B0', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF'
  },
  saveButton: {
    backgroundColor: '#4DB6AC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});