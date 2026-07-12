import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSemester } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function AddSemesterScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <Text style={[styles.label, {color: colors.text}]}>Semester Name</Text>
        <TextInput
          style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
          placeholder="e.g. Fall Semester"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[styles.label, {color: colors.text}]}>Academic Year</Text>
        <View style={styles.yearGrid}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.yearChip, {backgroundColor: colors.card, borderColor: colors.border}, yearNumber === num.toString() && {backgroundColor: colors.accent, borderColor: colors.accent}]}
              onPress={() => setYearNumber(num.toString())}
            >
              <Text style={[styles.yearChipText, {color: colors.text}, yearNumber === num.toString() && {color: colors.buttonText}]}>
                Year {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveButton, {backgroundColor: colors.text}]} onPress={handleSave}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} style={{marginRight: 8}} />
          <Text style={[styles.saveButtonText, {color: colors.background}]}>Create Semester</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { borderRadius: 20, padding: 22, borderWidth: 2 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, marginTop: 12, letterSpacing: 0.5 },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 2,
    fontWeight: '700'
  },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  yearChip: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, borderWidth: 2 },
  yearChipText: { fontSize: 13, fontWeight: '900' },
  saveButton: {
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
