import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { addSemester } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Card, PillButton, Chip, inputStyle } from '../ui';

export default function AddSemesterScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [yearNumber, setYearNumber] = useState('1');

  function handleSave() {
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter a semester name, e.g. "Semester 1".'); return; }
    const year = parseInt(yearNumber, 10);
    if (isNaN(year) || year < 1) { Alert.alert('Invalid year', 'Please pick a valid year.'); return; }
    addSemester(name.trim(), year);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 13 }}>
      <Text style={styles.emoji}>🗓️</Text>
      <Text style={[styles.title, { color: colors.text }]}>New semester</Text>
      <Text style={[styles.sub, { color: colors.subText }]}>Give it a name and pick the year.</Text>
      <Card style={{ marginTop: 13 }}>
        <Text style={[styles.label, { color: colors.subText }]}>Name</Text>
        <TextInput style={inputStyle(colors)} placeholder="e.g. Fall semester" placeholderTextColor={colors.subText} value={name} onChangeText={setName} autoFocus />
        <Text style={[styles.label, { color: colors.subText, marginTop: 13 }]}>Academic year</Text>
        <View style={styles.chips}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <Chip key={n} label={`Year ${n}`} active={yearNumber === String(n)} onPress={() => setYearNumber(String(n))} />
          ))}
        </View>
      </Card>
      <PillButton label="Create semester" icon="checkmark-circle" onPress={handleSave} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 37 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
