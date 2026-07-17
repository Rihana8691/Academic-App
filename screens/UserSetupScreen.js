import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, setUserPreviousRecord } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function UserSetupScreen({ navigation }) {
  const { colors } = useTheme();
  const [previousCgpa, setPreviousCgpa] = useState('');
  const [previousCredits, setPreviousCredits] = useState('');
  const [showDetailedEntry, setShowDetailedEntry] = useState(false);
  const [historicalCourses, setHistoricalCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', credits: '', grade: '' });

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      if (user) {
        setPreviousCgpa(user.previous_cgpa?.toString() ?? '');
        setPreviousCredits(user.previous_credits?.toString() ?? '');
      }
    }, [])
  );

  function addHistoricalCourse() {
    if (!newCourse.name || !newCourse.credits || !newCourse.grade) {
      Alert.alert('Missing Fields', 'Please fill in all course fields.');
      return;
    }

    const credits = parseInt(newCourse.credits, 10);
    if (isNaN(credits) || credits <= 0) {
      Alert.alert('Invalid Credits', 'Please enter valid credit hours.');
      return;
    }

    const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
    if (!validGrades.includes(newCourse.grade.toUpperCase())) {
      Alert.alert('Invalid Grade', 'Please enter a valid grade (A, A-, B+, etc.)');
      return;
    }

    setHistoricalCourses([...historicalCourses, {
      ...newCourse,
      credits: credits,
      grade: newCourse.grade.toUpperCase()
    }]);
    setNewCourse({ name: '', credits: '', grade: '' });
  }

  function removeHistoricalCourse(index) {
    const updated = historicalCourses.filter((_, i) => i !== index);
    setHistoricalCourses(updated);
  }

  function calculateFromHistorical() {
    if (historicalCourses.length === 0) return { cgpa: 0, credits: 0 };

    const gradePoints = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 };
    
    let totalPoints = 0;
    let totalCredits = 0;

    historicalCourses.forEach(course => {
      totalPoints += (gradePoints[course.grade] || 0) * course.credits;
      totalCredits += course.credits;
    });

    return {
      cgpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00',
      credits: totalCredits
    };
  }

  function handleSave() {
    let cgpa, credits;

    if (showDetailedEntry && historicalCourses.length > 0) {
      const calculated = calculateFromHistorical();
      cgpa = parseFloat(calculated.cgpa);
      credits = calculated.credits;
    } else {
      cgpa = parseFloat(previousCgpa) || 0;
      credits = parseInt(previousCredits, 10) || 0;
    }

    if (cgpa < 0 || cgpa > 4) {
      Alert.alert('Invalid CGPA', 'Please enter a valid CGPA between 0 and 4.0.');
      return;
    }

    setUserPreviousRecord(cgpa, credits);
    Alert.alert('Saved', 'Your previous academic record has been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  const styles = createStyles(colors);
  const calculated = calculateFromHistorical();

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.header, {color: colors.text}]}>Student File</Text>
      <Text style={[styles.subheader, {color: colors.subText}]}>
        Choose how to enter your previous academic record
      </Text>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, !showDetailedEntry && styles.modeButtonActive, {borderColor: colors.border}]}
          onPress={() => setShowDetailedEntry(false)}
        >
          <Text style={[styles.modeButtonText, !showDetailedEntry && {color: colors.buttonText}, {color: colors.text}]}>
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, showDetailedEntry && styles.modeButtonActive, {borderColor: colors.border}]}
          onPress={() => setShowDetailedEntry(true)}
        >
          <Text style={[styles.modeButtonText, showDetailedEntry && {color: colors.buttonText}, {color: colors.text}]}>
            Detailed
          </Text>
        </TouchableOpacity>
      </View>

      {!showDetailedEntry ? (
        <View>
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
        </View>
      ) : (
        <View>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Add Historical Courses</Text>
          
          <Text style={[styles.label, {color: colors.text}]}>Course Name</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
            placeholder="e.g. Calculus I"
            placeholderTextColor="#666"
            value={newCourse.name}
            onChangeText={(text) => setNewCourse({...newCourse, name: text})}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, {color: colors.text}]}>Credits</Text>
              <TextInput
                style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                placeholder="3"
                placeholderTextColor="#666"
                value={newCourse.credits}
                onChangeText={(text) => setNewCourse({...newCourse, credits: text})}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, {color: colors.text}]}>Grade</Text>
              <TextInput
                style={[styles.input, {backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text}]}
                placeholder="A"
                placeholderTextColor="#666"
                value={newCourse.grade}
                onChangeText={(text) => setNewCourse({...newCourse, grade: text})}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.accent}]} onPress={addHistoricalCourse}>
            <Text style={[styles.addButtonText, {color: colors.buttonText}]}>Add Course</Text>
          </TouchableOpacity>

          {historicalCourses.length > 0 && (
            <View style={[styles.coursesList, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.listTitle, {color: colors.text}]}>Added Courses ({historicalCourses.length})</Text>
              {historicalCourses.map((course, index) => (
                <View key={index} style={[styles.courseItem, {borderBottomColor: colors.border}]}>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseName, {color: colors.text}]}>{course.name}</Text>
                    <Text style={[styles.courseDetails, {color: colors.subText}]}>{course.credits} credits · {course.grade}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeHistoricalCourse(index)}>
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={[styles.calculatedSummary, {borderTopColor: colors.border}]}>
                <Text style={[styles.summaryLabel, {color: colors.subText}]}>Calculated from courses:</Text>
                <Text style={[styles.summaryValue, {color: colors.accent}]}>CGPA: {calculated.cgpa} · Credits: {calculated.credits}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={[styles.saveButton, {backgroundColor: colors.text}]} onPress={handleSave}>
        <Text style={[styles.saveButtonText, {color: colors.background}]}>Save Record</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginTop: 20,
  },
  saveButtonText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
  modeToggle: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  modeButton: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.accent },
  modeButtonText: { fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  addButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  addButtonText: { fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  coursesList: { borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 2 },
  listTitle: { fontSize: 14, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase' },
  courseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 14, fontWeight: '700' },
  courseDetails: { fontSize: 12, marginTop: 2 },
  calculatedSummary: { paddingTop: 12, borderTopWidth: 1, marginTop: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '900', marginTop: 4 },
});
