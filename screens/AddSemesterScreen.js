import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSemester } from '../dbHelpers';

export default function AddSemesterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [yearNumber, setYearNumber] = useState('1');

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a semester name, e.g. "Semester 1".');
      return;
    }
    const year = parseInt(yearNumber, 10);
    if (isNaN(year) || year < 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year number.');
      return;
    }
    addSemester(name.trim(), year);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Semester Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fall Semester"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>Academic Year</Text>
        <View style={styles.yearGrid}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.yearChip, yearNumber === num.toString() && styles.yearChipActive]}
              onPress={() => setYearNumber(num.toString())}
            >
              <Text style={[styles.yearChipText, yearNumber === num.toString() && styles.yearChipTextActive]}>
                Year {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.saveButtonText}>Create Semester</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  label: { fontSize: 13, color: '#B0B0B0', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  input: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    color: '#FFFFFF'
  },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  yearChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333333', backgroundColor: '#1E1E1E' },
  yearChipActive: { backgroundColor: '#004D40', borderColor: '#4DB6AC' },
  yearChipText: { fontSize: 14, color: '#B0B0B0', fontWeight: '600' },
  yearChipTextActive: { color: '#4DB6AC' },
  saveButton: {
    backgroundColor: '#4DB6AC',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});