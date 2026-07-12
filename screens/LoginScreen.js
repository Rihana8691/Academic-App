import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveUserProfile } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView style={[styles.container, {backgroundColor: colors.background}]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, {backgroundColor: colors.accent, borderColor: colors.border}]}>
            <Ionicons name="school" size={40} color={colors.buttonText} />
          </View>
          <Text style={[styles.header, {color: colors.text}]}>Welcome to StudentApp</Text>
          <Text style={[styles.subheader, {color: colors.subText}]}>Let's get your academic profile ready.</Text>
        </View>

        <View style={[styles.formCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.label, {color: colors.text}]}>Full Name</Text>
          <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
            <Ionicons name="person-outline" size={20} color={colors.accent} style={styles.inputIcon} />
            <TextInput style={[styles.input, {color: colors.text}]} placeholder="Enter your name" placeholderTextColor="#666" value={name} onChangeText={setName} />
          </View>

          <Text style={[styles.label, {color: colors.text}]}>University</Text>
          <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
            <Ionicons name="business-outline" size={20} color={colors.accent} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, {color: colors.text}]}
              placeholder="e.g., Harvard University"
              placeholderTextColor="#666"
              value={university}
              onChangeText={setUniversity}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.label, {color: colors.text}]}>Student ID</Text>
              <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                <Ionicons name="card-outline" size={20} color={colors.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, {color: colors.text}]}
                  placeholder="ID Number"
                  placeholderTextColor="#666"
                  value={studentId}
                  onChangeText={setStudentId}
                />
              </View>
            </View>
            <View style={[styles.flex, { marginLeft: 15 }]}>
              <Text style={[styles.label, {color: colors.text}]}>Year</Text>
              <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                <Ionicons name="time-outline" size={20} color={colors.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, {color: colors.text}]}
                  placeholder="e.g. 3"
                  placeholderTextColor="#666"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {showPreviousRecord && (
            <View style={[styles.recordSection, {borderTopColor: colors.border}]}>
              <View style={[styles.infoBanner, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <Ionicons name="information-circle" size={20} color={colors.accent} />
                <Text style={[styles.infoText, {color: colors.text}]}>Enter your past record for accurate CGPA.</Text>
              </View>

              <Text style={[styles.label, {color: colors.text}]}>Previous CGPA</Text>
              <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={20} color={colors.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, {color: colors.text}]}
                  placeholder="e.g. 3.75"
                  placeholderTextColor="#666"
                  value={previousCgpa}
                  onChangeText={setPreviousCgpa}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={[styles.label, {color: colors.text}]}>Total Credits Completed</Text>
              <View style={[styles.inputWrapper, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, {color: colors.text}]}
                  placeholder="e.g. 120"
                  placeholderTextColor="#666"
                  value={previousCredits}
                  onChangeText={setPreviousCredits}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.continueButton, {backgroundColor: colors.text}]} onPress={handleContinue}>
            <Text style={[styles.continueButtonText, {color: colors.background}]}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  headerSection: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 3 },
  header: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  subheader: { fontSize: 15, textAlign: 'center', marginTop: 8, fontWeight: '700' },
  formCard: { borderRadius: 20, padding: 20, borderWidth: 2, shadowColor: '#000', shadowOffset: {width: 6, height: 6}, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  label: { fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 2 },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, padding: 12, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row' },
  recordSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderStyle: 'dashed' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 15, gap: 10, borderWidth: 1.5 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  continueButton: { borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center', marginTop: 32, flexDirection: 'row' },
  continueButtonText: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
});
