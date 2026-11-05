import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { addCourse } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Card, PillButton, inputStyle } from '../ui';

export default function AddCourseScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { semesterId } = route.params;
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [creditHours, setCreditHours] = useState('');

  function handleSave() {
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter a course name.'); return; }
    const credits = parseFloat(creditHours);
    if (isNaN(credits) || credits <= 0) { Alert.alert('Invalid credit hours', 'Please enter a valid number, e.g. 3 or 4.'); return; }
    addCourse(semesterId, name.trim(), courseCode.trim(), credits);
    navigation.goBack();
  }

  const Label = ({ t }) => <Text style={[styles.label, { color: colors.subText }]}>{t}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 13 }}>
      <Text style={styles.emoji}>📚</Text>
      <Text style={[styles.title, { color: colors.text }]}>New course</Text>
      <Card style={{ marginTop: 13 }}>
        <Label t="Course name" />
        <TextInput style={inputStyle(colors)} placeholder="e.g. Database Systems" placeholderTextColor={colors.subText} value={name} onChangeText={setName} autoFocus />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label t="Course ID (optional)" />
            <TextInput style={inputStyle(colors)} placeholder="SE301" placeholderTextColor={colors.subText} value={courseCode} onChangeText={setCourseCode} />
          </View>
          <View style={{ flex: 1 }}>
            <Label t="Credit hours" />
            <TextInput style={inputStyle(colors)} placeholder="3" placeholderTextColor={colors.subText} value={creditHours} onChangeText={setCreditHours} keyboardType="numeric" />
          </View>
        </View>
      </Card>
      <PillButton label="Save course" icon="checkmark-circle" onPress={handleSave} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 37 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 5, marginTop: 9 },
  row: { flexDirection: 'row', gap: 8 },
});
