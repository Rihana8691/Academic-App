import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCoursesBySemester, updateCourseGrade, updateSemesterGPA } from '../dbHelpers';
import { calculateSemesterGPA, GRADE_POINTS } from '../gpaCalculator';

const GRADE_OPTIONS = Object.keys(GRADE_POINTS); // ['A+','A','B+','B','C+','C','D','F']

export default function FinalGradesScreen({ route, navigation }) {
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
    // Check all courses have a grade selected
    const missing = courses.filter((c) => !grades[c.id]);
    if (missing.length > 0) {
      Alert.alert(
        'Missing grades',
        `Please select a grade for: ${missing.map((c) => c.name).join(', ')}`
      );
      return;
    }

    // Save each grade to the course record
    courses.forEach((c) => {
      updateCourseGrade(c.id, grades[c.id]);
    });

    // Calculate semester GPA using the verified calculator logic
    const courseData = courses.map((c) => ({
      creditHours: c.credit_hours,
      grade: grades[c.id],
    }));
    const result = calculateSemesterGPA(courseData);

    // Save GPA + total credits back to the semester record
    updateSemesterGPA(semesterId, result.gpa, result.totalCredits);

    Alert.alert(
      'Semester GPA Calculated',
      `${semesterName}: GPA ${result.gpa} (${result.totalCredits} credits)`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>{semesterName}</Text>
      <Text style={styles.subheader}>Enter final grades for each course</Text>

      {courses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <Text style={styles.courseName}>
            {course.name} · {course.credit_hours} credits
          </Text>
          <View style={styles.gradeRow}>
            {GRADE_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradeChip,
                  grades[course.id] === g && styles.gradeChipSelected,
                ]}
                onPress={() => selectGrade(course.id, g)}
              >
                <Text
                  style={[
                    styles.gradeChipText,
                    grades[course.id] === g && styles.gradeChipTextSelected,
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
        <Text style={styles.emptyText}>No courses in this semester yet.</Text>
      )}

      {courses.length > 0 && (
        <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
          <Text style={styles.calculateButtonText}>Calculate Semester GPA</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  subheader: { fontSize: 14, color: '#B0B0B0', marginBottom: 20 },
  courseCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  courseName: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#FFFFFF' },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: {
    borderWidth: 1,
    borderColor: '#4DB6AC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  gradeChipSelected: {
    backgroundColor: '#4DB6AC',
  },
  gradeChipText: { color: '#4DB6AC', fontWeight: '600' },
  gradeChipTextSelected: { color: '#FFFFFF' },
  emptyText: { color: '#666666', textAlign: 'center', marginTop: 40 },
  calculateButton: {
    backgroundColor: '#4DB6AC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  calculateButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});