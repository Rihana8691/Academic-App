import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCoursesBySemester } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

const { height } = Dimensions.get('window');
const ROW_HEIGHT = 60;
const GHOST_LINES_COUNT = Math.ceil(height / ROW_HEIGHT);

export default function SemesterDetailScreen({ route, navigation }) {
  const { colors, theme } = useTheme();
  const { semesterId, semesterName } = route.params;
  const [courses, setCourses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setCourses(getCoursesBySemester(semesterId));
    }, [semesterId])
  );

  // Helper to render the background ledger lines
  const RenderGhostLines = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(GHOST_LINES_COUNT)].map((_, i) => (
        <View
          key={i}
          style={[styles.ghostRow, { borderBottomColor: colors.border + (theme === 'dark' ? '15' : '30'), height: ROW_HEIGHT }]}
        />
      ))}
      <View style={[styles.spineLine, { backgroundColor: colors.accent + (theme === 'dark' ? '30' : '50') }]} />
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <RenderGhostLines />

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={[styles.header, {color: colors.text}]}>{semesterName.toUpperCase()}</Text>
            <View style={[styles.headerDivider, {backgroundColor: colors.accent}]} />
            <Text style={[styles.subheader, {color: colors.subText}]}>Official Course Record · {courses.length} Entries</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.ledgerRow, { height: ROW_HEIGHT, borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseName: item.name })}
          >
            <View style={[styles.idCol, {borderRightColor: colors.border + '40'}]}>
              <Text style={[styles.idText, {color: colors.subText}]}>{item.course_code || '---'}</Text>
            </View>

            <View style={styles.nameCol}>
              <Text style={[styles.courseNameText, {color: colors.text}]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.creditsTextMini, {color: colors.subText}]}>{item.credit_hours} UNITS</Text>
            </View>

            <View style={[styles.gradeCol, {backgroundColor: item.grade ? colors.text : 'transparent'}]}>
              <Text style={[styles.gradeText, {color: item.grade ? colors.background : colors.subText}]}>
                {item.grade || '-'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={[styles.footerBar, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[styles.footerTabMain, {backgroundColor: colors.text}]}
          onPress={() => navigation.navigate('AddCourse', { semesterId })}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={[styles.footerTabTextMain, {color: colors.background}]}>Add Entry</Text>
        </TouchableOpacity>

        {courses.length > 0 && (
          <TouchableOpacity
            style={[styles.footerTabSide, {borderLeftColor: colors.border}]}
            onPress={() => navigation.navigate('FinalGrades', { semesterId, semesterName })}
          >
            <Text style={[styles.footerTabTextSide, {color: colors.text}]}>Audit File</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // TYPOGRAPHY
  headerSection: { padding: 30, paddingTop: 30, marginBottom: 0 },
  header: { fontSize: 20, fontWeight: '300', letterSpacing: 4 },
  headerDivider: { height: 1, width: 30, marginTop: 10, marginBottom: 10 },
  subheader: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

  // LEDGER GRID
  ghostRow: { width: '100%' },
  spineLine: { position: 'absolute', left: 90, top: 0, bottom: 0, width: 1 },

  ledgerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  idCol: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    paddingRight: 10
  },
  idText: { fontSize: 11, fontWeight: '300', letterSpacing: 1 },
  nameCol: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseNameText: { fontSize: 15, fontWeight: '400', letterSpacing: -0.2 },
  creditsTextMini: { fontSize: 8, fontWeight: '800', marginTop: 2, opacity: 0.6 },

  gradeCol: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  gradeText: { fontSize: 13, fontWeight: '900' },

  // FOOTER BAR
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    borderTopWidth: 2,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 15
  },
  footerTabMain: {
    flex: 2,
    height: 45,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  footerTabTextMain: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  footerTabSide: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
  },
  footerTabTextSide: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
});
