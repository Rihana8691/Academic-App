import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveUserProfile } from '../dbHelpers';

export default function LoginScreen({ navigation }) {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('');
  const [previousCgpa, setPreviousCgpa] = useState('');
  const [previousCredits, setPreviousCredits] = useState('');

  const yearNum = parseInt(year, 10);
  const showPreviousRecord = !isNaN(yearNum) && yearNum > 1;

  function handleContinue() {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name to personalize your experience.');
      return;
    }
    if (!year.trim() || isNaN(yearNum) || yearNum < 1) {
      Alert.alert('Invalid Year', 'Please enter a valid academic year (e.g., 1, 2, 3...).');
      return;
    }

    let cgpa = 0;
    let credits = 0;
    if (showPreviousRecord) {
      cgpa = parseFloat(previousCgpa) || 0;
      credits = parseInt(previousCredits, 10) || 0;
      if (previousCgpa && (isNaN(cgpa) || cgpa < 0 || cgpa > 4)) {
        Alert.alert('Invalid CGPA', 'CGPA must be between 0.0 and 4.0.');
        return;
      }
    }

    saveUserProfile({
      name: name.trim(),
      university: university.trim(),
      studentId: studentId.trim(),
      year: yearNum,
      previousCgpa: cgpa,
      previousCredits: credits,
    });

    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={40} color="#fff" />
          </View>
          <Text style={styles.header}>Welcome to StudentApp</Text>
          <Text style={styles.subheader}>Let's get your academic profile ready.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#00796B" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />
          </View>

          <Text style={styles.label}>University</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color="#00796B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Harvard University"
              value={university}
              onChangeText={setUniversity}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Student ID</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color="#00796B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ID Number"
                  value={studentId}
                  onChangeText={setStudentId}
                />
              </View>
            </View>
            <View style={[styles.flex, { marginLeft: 15 }]}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color="#00796B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {showPreviousRecord && (
            <View style={styles.recordSection}>
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={20} color="#00796B" />
                <Text style={styles.infoText}>Enter your past record for accurate CGPA.</Text>
              </View>

              <Text style={styles.label}>Previous CGPA</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={20} color="#00796B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3.75"
                  value={previousCgpa}
                  onChangeText={setPreviousCgpa}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.label}>Total Credits Completed</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#00796B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 120"
                  value={previousCredits}
                  onChangeText={setPreviousCredits}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  headerSection: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logoCircle: { backgroundColor: '#4DB6AC', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#4DB6AC', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  subheader: { fontSize: 15, color: '#B0B0B0', textAlign: 'center', marginTop: 8 },
  formCard: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 2 },
  label: { fontSize: 13, fontWeight: '700', color: '#B0B0B0', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#262626', borderRadius: 12, borderWidth: 1, borderColor: '#333333' },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, padding: 12, fontSize: 16, color: '#FFFFFF' },
  row: { flexDirection: 'row' },
  recordSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333333' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#004D40', padding: 12, borderRadius: 12, marginBottom: 15, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#4DB6AC', lineHeight: 18 },
  continueButton: { backgroundColor: '#4DB6AC', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', marginTop: 32, flexDirection: 'row', shadowColor: '#4DB6AC', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
});