import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, setUserPreviousRecord } from '../dbHelpers';

export default function UserSetupScreen({ navigation }) {
  const [previousCgpa, setPreviousCgpa] = useState('');
  const [previousCredits, setPreviousCredits] = useState('');

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      if (user) {
        setPreviousCgpa(user.previous_cgpa?.toString() ?? '');
        setPreviousCredits(user.previous_credits?.toString() ?? '');
      }
    }, [])
  );

  function handleSave() {
    const cgpa = parseFloat(previousCgpa) || 0;
    const credits = parseInt(previousCredits, 10) || 0;

    if (previousCgpa && (isNaN(cgpa) || cgpa < 0 || cgpa > 4)) {
      Alert.alert('Invalid CGPA', 'Please enter a valid CGPA between 0 and 4.0.');
      return;
    }

    setUserPreviousRecord(cgpa, credits);
    Alert.alert('Saved', 'Your previous academic record has been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Previous Academic Record</Text>
      <Text style={styles.subheader}>
        If this is your first semester, leave both fields as 0.
      </Text>

      <Text style={styles.label}>Previous CGPA</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3.34"
        value={previousCgpa}
        onChangeText={setPreviousCgpa}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Completed Credit Hours</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 60"
        value={previousCredits}
        onChangeText={setPreviousCredits}
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
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#FFFFFF' },
  subheader: { fontSize: 14, color: '#B0B0B0', marginBottom: 24 },
  label: { fontSize: 14, color: '#B0B0B0', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF'
  },
  saveButton: {
    backgroundColor: '#4DB6AC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});