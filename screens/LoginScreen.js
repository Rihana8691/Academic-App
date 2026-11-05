import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveUserProfile } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Hero, Card, PillButton, inputStyle } from '../ui';

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
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter your name.'); return; }
    if (!year.trim() || isNaN(yearNum) || yearNum < 1) { Alert.alert('Invalid year', 'Please enter a valid academic year (1, 2, 3...).'); return; }
    let cgpa = 0, credits = 0;
    if (showPreviousRecord) {
      cgpa = parseFloat(previousCgpa) || 0;
      credits = parseInt(previousCredits, 10) || 0;
      if (previousCgpa && (isNaN(cgpa) || cgpa < 0 || cgpa > 4)) { Alert.alert('Invalid CGPA', 'CGPA must be between 0.0 and 4.0.'); return; }
    }
    try {
      saveUserProfile({ name: name.trim(), university: university.trim(), studentId: studentId.trim(), year: yearNum, previousCgpa: cgpa, previousCredits: credits });
      navigation.navigate('Dashboard');
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  }

  const Label = ({ t }) => <Text style={[styles.label, { color: colors.subText }]}>{t}</Text>;
  const inp = inputStyle(colors);
  const ph = colors.subText;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Hero top style={{ alignItems: 'center', paddingBottom: 52 }}>
        <View style={styles.logo}><Ionicons name="school" size={36} color={colors.accent} /></View>
        <Text style={styles.title}>Welcome! 👋</Text>
        <Text style={styles.sub}>Let's set up your student profile</Text>
      </Hero>

      <View style={{ paddingHorizontal: 13, marginTop: -32 }}>
        <Card>
          <Label t="Full name" />
          <TextInput style={inp} placeholder="Your name" placeholderTextColor={ph} value={name} onChangeText={setName} />
          <Label t="University" />
          <TextInput style={inp} placeholder="e.g. Harvard University" placeholderTextColor={ph} value={university} onChangeText={setUniversity} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Label t="Student ID" />
              <TextInput style={inp} placeholder="ID number" placeholderTextColor={ph} value={studentId} onChangeText={setStudentId} />
            </View>
            <View style={{ flex: 1 }}>
              <Label t="Year" />
              <TextInput style={inp} placeholder="e.g. 3" placeholderTextColor={ph} value={year} onChangeText={setYear} keyboardType="numeric" />
            </View>
          </View>

          {showPreviousRecord && (
            <View style={[styles.record, { backgroundColor: colors.secondary }]}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>📈 Your past record</Text>
              <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>Helps us calculate an accurate CGPA.</Text>
              <Label t="Previous CGPA" />
              <TextInput style={[inp, { backgroundColor: colors.card }]} placeholder="e.g. 3.75" placeholderTextColor={ph} value={previousCgpa} onChangeText={setPreviousCgpa} keyboardType="decimal-pad" />
              <Label t="Credits completed" />
              <TextInput style={[inp, { backgroundColor: colors.card }]} placeholder="e.g. 120" placeholderTextColor={ph} value={previousCredits} onChangeText={setPreviousCredits} keyboardType="numeric" />
            </View>
          )}
        </Card>
        <PillButton label="Get started" icon="arrow-forward" onPress={handleContinue} style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 67, height: 67, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { color: '#fff', fontSize: 27, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 5, marginTop: 9 },
  record: { borderRadius: 13, padding: 10, marginTop: 12 },
});
