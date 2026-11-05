import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCoursesBySemester, updateCourseGrade, updateSemesterGPA } from '../dbHelpers';
import { calculateSemesterGPA, GRADE_POINTS } from '../gpaCalculator';
import { useTheme } from '../ThemeContext';
import { Card, PillButton, Chip } from '../ui';

const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export default function FinalGradesScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState({});

  useFocusEffect(useCallback(() => {
    const list = getCoursesBySemester(semesterId);
    setCourses(list);
    const g = {};
    list.forEach(c => { if (c.grade) g[c.id] = c.grade; });
    setGrades(g);
  }, [semesterId]));

  function handleCalculate() {
    const missing = courses.filter(c => !grades[c.id]);
    if (missing.length > 0) {
      Alert.alert('Missing grades', `Please select a grade for: ${missing.map(c => c.name).join(', ')}`);
      return;
    }
    courses.forEach(c => updateCourseGrade(c.id, grades[c.id]));
    const result = calculateSemesterGPA(courses.map(c => ({ creditHours: c.credit_hours, grade: grades[c.id] })));
    updateSemesterGPA(semesterId, result.gpa, result.totalCredits);
    Alert.alert('Semester GPA ready 🎉', `${semesterName}: GPA ${result.gpa} (${result.totalCredits} credits)`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 13, paddingBottom: 32 }}>
      <Text style={{ fontSize: 37 }}>🎓</Text>
      <Text style={[styles.title, { color: colors.text }]}>{semesterName}</Text>
      <Text style={[styles.sub, { color: colors.subText }]}>Pick your final grade for each course</Text>

      {courses.map(course => (
        <Card key={course.id} style={{ marginTop: 10 }}>
          <Text style={[styles.course, { color: colors.text }]}>{course.name}</Text>
          <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginBottom: 9 }}>{course.credit_hours} credits</Text>
          <View style={styles.grid}>
            {GRADE_OPTIONS.map(g => (
              <Chip key={g} label={g} active={grades[course.id] === g} onPress={() => setGrades(p => ({ ...p, [course.id]: g }))} />
            ))}
          </View>
        </Card>
      ))}

      {courses.length === 0 && <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 26, fontWeight: '600' }}>No courses in this semester yet.</Text>}
      {courses.length > 0 && <PillButton label="Calculate GPA" icon="sparkles" onPress={handleCalculate} style={{ marginTop: 18 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  course: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
});
