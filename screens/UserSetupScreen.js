import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, setUserPreviousRecord } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function UserSetupScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.header, {color: colors.text}]}>Previous Academic Record</Text>
      <Text style={[styles.subheader, {color: colors.subText}]}>
        If this is your first semester, leave both fields as 0.
      </Text>

      <Text style={[styles.label, {color: colors.text}]}>Previous CGPA</Text>
      <TextInput
        style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
        placeholder="e.g. 3.34"
        placeholderTextColor="#666"
        value={previousCgpa}
        onChangeText={setPreviousCgpa}
        keyboardType="decimal-pad"
      />

      <Text style={[styles.label, {color: colors.text}]}>Completed Credit Hours</Text>
      <TextInput
        style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
        placeholder="e.g. 60"
        placeholderTextColor="#666"
        value={previousCredits}
        onChangeText={setPreviousCredits}
        keyboardType="numeric"
      />

      <TouchableOpacity style={[styles.saveButton, {backgroundColor: colors.text}]} onPress={handleSave}>
        <Text style={[styles.saveButtonText, {color: colors.background}]}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: -1 },
  subheader: { fontSize: 14, marginBottom: 24, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 8, fontWeight: '900', textTransform: 'uppercase' },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '700'
  },
  saveButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
