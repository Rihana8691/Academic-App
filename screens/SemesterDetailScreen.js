import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCoursesBySemester } from '../dbHelpers';
import { calculateSemesterGPA } from '../gpaCalculator';
import { useTheme } from '../ThemeContext';
import { Hero, Card, PillButton, PASTELS } from '../ui';

export default function SemesterDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);

  useFocusEffect(useCallback(() => { setCourses(getCoursesBySemester(semesterId)); }, [semesterId]));

  const totalCredits = courses.reduce((s, c) => s + (c.credit_hours || 0), 0);
  const graded = courses.filter(c => c.grade);
  let gpa = 0;
  if (graded.length > 0) {
    gpa = Number(calculateSemesterGPA(graded.map(c => ({ creditHours: c.credit_hours, grade: c.grade }))).gpa) || 0;
  }

  const header = (
    <View>
      <Hero>
        <Text style={styles.kicker}>Semester</Text>
        <Text style={styles.title}>{semesterName}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}><Ionicons name="trophy" size={14} color="#fff" /><Text style={styles.chipText}>GPA {gpa.toFixed(2)}</Text></View>
          <View style={styles.chip}><Ionicons name="ribbon" size={14} color="#fff" /><Text style={styles.chipText}>{totalCredits} credits</Text></View>
          <View style={styles.chip}><Ionicons name="book" size={14} color="#fff" /><Text style={styles.chipText}>{courses.length} courses</Text></View>
        </View>
      </Hero>
      <Text style={[styles.listTitle, { color: colors.text }]}>Courses</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={courses}
        keyExtractor={(i) => i.id.toString()}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 84 + insets.bottom }}
        ListEmptyComponent={<Text style={{ color: colors.subText, textAlign: 'center', marginTop: 13, fontWeight: '600' }}>No courses yet. Add your first one 👇</Text>}
        renderItem={({ item, index }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseName: item.name })}
          >
            <View style={[styles.avatar, { backgroundColor: PASTELS[index % PASTELS.length] }]}>
              <Text style={styles.avatarText}>{(item.course_code || item.name).slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 9 }}>
              <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 3 }}>
                {item.course_code || 'No code'} · {item.credit_hours} credits
              </Text>
            </View>
            {item.is_finished === 1 ? (
              <View style={[styles.badge, { backgroundColor: colors.success + '22' }]}>
                <Text style={{ color: colors.success, fontWeight: '800', fontSize: 12 }}>{item.grade || 'Done'}</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Text style={{ color: colors.subText, fontWeight: '700', fontSize: 12 }}>{item.grade || 'Active'}</Text>
              </View>
            )}
          </Card>
        )}
      />
      <View style={[styles.footer, { bottom: 24 + insets.bottom }]}>
        <PillButton label="Add course" icon="add" style={{ flex: 1 }} onPress={() => navigation.navigate('AddCourse', { semesterId })} />
        {courses.length > 0 && (
          <PillButton label="Grades" icon="school" soft style={{ flex: 1, backgroundColor: colors.card }} onPress={() => navigation.navigate('FinalGrades', { semesterId, semesterName })} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  title: { color: '#fff', fontSize: 27, fontWeight: '800', marginTop: 2, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 649 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listTitle: { fontSize: 17, fontWeight: '800', marginHorizontal: 13, marginTop: 14, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 13, marginBottom: 8, padding: 9 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1E1B4B', fontWeight: '800', fontSize: 14 },
  courseName: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 649 },
  footer: { position: 'absolute', bottom: 24, left: 20, right: 20, flexDirection: 'row', gap: 8 },
});
