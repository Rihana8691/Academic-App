import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCoursesBySemester } from '../dbHelpers';

export default function SemesterDetailScreen({ route, navigation }) {
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setCourses(getCoursesBySemester(semesterId));
    }, [semesterId])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.header}>{semesterName}</Text>
            <Text style={styles.subheader}>{courses.length} courses enrolled</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={60} color="#333" />
            <Text style={styles.emptyText}>No courses added to this semester.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, styles.shadow]}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseName: item.name })}
          >
            <View style={styles.cardTop}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{item.course_code || 'N/A'}</Text>
              </View>
              <Text style={styles.creditText}>{item.credit_hours} Credits</Text>
            </View>
            <Text style={styles.courseName}>{item.name}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.viewText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#4DB6AC" />
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, styles.shadow]}
          onPress={() => navigation.navigate('AddCourse', { semesterId })}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Course</Text>
        </TouchableOpacity>

        {courses.length > 0 && (
          <TouchableOpacity
            style={[styles.gradesButton, styles.shadow]}
            onPress={() => navigation.navigate('FinalGrades', { semesterId, semesterName })}
          >
            <Ionicons name="calculator-outline" size={20} color="#4DB6AC" />
            <Text style={styles.gradesButtonText}>GPA Calculator</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerSection: { marginBottom: 24 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  subheader: { fontSize: 16, color: '#B0B0B0', marginTop: 4 },
  shadow: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBadge: { backgroundColor: '#004D40', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  codeText: { color: '#4DB6AC', fontWeight: 'bold', fontSize: 12 },
  creditText: { fontSize: 13, color: '#B0B0B0', fontWeight: '600' },
  courseName: { fontSize: 18, fontWeight: 'bold', color: '#E0E0E0', marginBottom: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 10 },
  viewText: { fontSize: 13, color: '#4DB6AC', fontWeight: 'bold', marginRight: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666666', marginTop: 10, fontSize: 16, textAlign: 'center' },
  buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(18, 18, 18, 0.9)', flexDirection: 'row', gap: 12 },
  addButton: { flex: 2, backgroundColor: '#4DB6AC', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  gradesButton: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#4DB6AC' },
  gradesButtonText: { color: '#4DB6AC', fontWeight: 'bold', fontSize: 14 },
});