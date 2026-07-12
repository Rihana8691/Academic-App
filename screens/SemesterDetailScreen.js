import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCoursesBySemester } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

export default function SemesterDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setCourses(getCoursesBySemester(semesterId));
    }, [semesterId])
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={[styles.header, {color: colors.text}]}>{semesterName}</Text>
            <Text style={[styles.subheader, {color: colors.subText}]}>{courses.length} courses enrolled</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={60} color={colors.subText} />
            <Text style={[styles.emptyText, {color: colors.subText}]}>No courses added to this semester.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseName: item.name })}
          >
            <View style={styles.cardTop}>
              <View style={[styles.codeBadge, {backgroundColor: colors.secondary, borderColor: colors.border}]}>
                <Text style={[styles.codeText, {color: colors.text}]}>{item.course_code || 'N/A'}</Text>
              </View>
              <Text style={[styles.creditText, {color: colors.accent}]}>{item.credit_hours} Credits</Text>
            </View>
            <Text style={[styles.courseName, {color: colors.text}]}>{item.name}</Text>
            <View style={[styles.cardBottom, {borderTopColor: colors.border}]}>
              <Text style={[styles.viewText, {color: colors.accent}]}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={[styles.ledgerBar, styles.shadow, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TouchableOpacity
          style={[styles.ledgerTabMain, {backgroundColor: colors.text}]}
          onPress={() => navigation.navigate('AddCourse', { semesterId })}
        >
          <Ionicons name="add" size={24} color={colors.background} />
          <Text style={[styles.ledgerTabTextMain, {color: colors.background}]}>Enroll Course</Text>
        </TouchableOpacity>

        {courses.length > 0 && (
          <TouchableOpacity
            style={[styles.ledgerTabSide, {backgroundColor: colors.card, borderLeftColor: colors.border}]}
            onPress={() => navigation.navigate('FinalGrades', { semesterId, semesterName })}
          >
            <Ionicons name="calculator-outline" size={20} color={colors.accent} />
            <Text style={[styles.ledgerTabTextSide, {color: colors.text}]}>Audit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { padding: 20, marginBottom: 10 },
  header: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subheader: { fontSize: 16, marginTop: 4, fontWeight: '700' },
  shadow: { shadowColor: '#000', shadowOffset: {width: 4, height: 4}, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  card: { borderRadius: 15, padding: 18, marginBottom: 15, marginHorizontal: 20, borderWidth: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  codeText: { fontWeight: '900', fontSize: 11 },
  creditText: { fontSize: 13, fontWeight: '800' },
  courseName: { fontSize: 20, fontWeight: '900', marginBottom: 15 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1.5, paddingTop: 10 },
  viewText: { fontSize: 13, fontWeight: '900', marginRight: 4, textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, textAlign: 'center', fontWeight: '700' },

  ledgerBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 15,
    flexDirection: 'row',
    borderWidth: 2,
    overflow: 'hidden'
  },
  ledgerTabMain: {
    flex: 2,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  ledgerTabTextMain: { fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  ledgerTabSide: {
    flex: 1,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 2
  },
  ledgerTabTextSide: { fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
});
