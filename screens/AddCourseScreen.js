import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addCourse } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function AddCourseScreen({ route, navigation }) {
  const { colors } = useTheme();
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

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.label, {color: colors.text}]}>Course Name</Text>
      <TextInput
        style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
        placeholder="e.g. Database Systems"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={[styles.label, {color: colors.text}]}>Course ID (optional)</Text>
      <TextInput
        style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
        placeholder="e.g. SE301"
        placeholderTextColor="#666"
        value={courseCode}
        onChangeText={setCourseCode}
      />

      <Text style={[styles.label, {color: colors.text}]}>Credit Hours</Text>
      <TextInput
        style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
        placeholder="e.g. 3"
        placeholderTextColor="#666"
        value={creditHours}
        onChangeText={setCreditHours}
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
  label: { fontSize: 12, marginBottom: 8, marginTop: 15, fontWeight: '900', textTransform: 'uppercase' },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontWeight: '700'
  },
  saveButton: {
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
