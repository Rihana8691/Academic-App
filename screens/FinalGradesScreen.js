import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCoursesBySemester, updateCourseGrade, updateSemesterGPA } from '../dbHelpers';
import { calculateSemesterGPA, GRADE_POINTS } from '../gpaCalculator';
import { useTheme } from '../ThemeContext';

const GRADE_OPTIONS = Object.keys(GRADE_POINTS); // ['A+','A','B+','B','C+','C','D','F']

export default function FinalGradesScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState({}); // { courseId: 'A+' }

  useFocusEffect(
    useCallback(() => {
      const list = getCoursesBySemester(semesterId);
      setCourses(list);
      const initialGrades = {};
      list.forEach((c) => {
        if (c.grade) initialGrades[c.id] = c.grade;
      });
      setGrades(initialGrades);
    }, [semesterId])
  );

  function selectGrade(courseId, grade) {
    setGrades((prev) => ({ ...prev, [courseId]: grade }));
  }

  function handleCalculate() {
    const missing = courses.filter((c) => !grades[c.id]);
    if (missing.length > 0) {
      Alert.alert(
        'Missing grades',
        `Please select a grade for: ${missing.map((c) => c.name).join(', ')}`
      );
      return;
    }

    courses.forEach((c) => {
      updateCourseGrade(c.id, grades[c.id]);
    });

    const courseData = courses.map((c) => ({
      creditHours: c.credit_hours,
      grade: grades[c.id],
    }));
    const result = calculateSemesterGPA(courseData);

    updateSemesterGPA(semesterId, result.gpa, result.totalCredits);

    Alert.alert(
      'Semester GPA Calculated',
      `${semesterName}: GPA ${result.gpa} (${result.totalCredits} credits)`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  const styles = createStyles(colors);

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.header, {color: colors.text}]}>{semesterName}</Text>
      <Text style={[styles.subheader, {color: colors.subText}]}>Enter final grades for each course</Text>

      {courses.map((course) => (
        <View key={course.id} style={[styles.courseCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.courseName, {color: colors.text}]}>
            {course.name} · {course.credit_hours} credits
          </Text>
          <View style={styles.gradeRow}>
            {GRADE_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradeChip,
                  {borderColor: colors.border, backgroundColor: colors.card},
                  grades[course.id] === g && {backgroundColor: colors.accent, borderColor: colors.accent},
                ]}
                onPress={() => selectGrade(course.id, g)}
              >
                <Text
                  style={[
                    styles.gradeChipText,
                    {color: colors.text},
                    grades[course.id] === g && {color: colors.buttonText},
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {courses.length === 0 && (
        <Text style={[styles.emptyText, {color: colors.subText}]}>No courses in this semester yet.</Text>
      )}

      {courses.length > 0 && (
        <TouchableOpacity style={[styles.calculateButton, {backgroundColor: colors.text}]} onPress={handleCalculate}>
          <Text style={[styles.calculateButtonText, {color: colors.background}]}>Calculate Semester GPA</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  subheader: { fontSize: 14, marginBottom: 20, fontWeight: '700' },
  courseCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  courseName: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gradeChipText: { fontWeight: '900', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 40, fontWeight: '700' },
  calculateButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  calculateButtonText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
