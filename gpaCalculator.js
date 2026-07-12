// ============================================
// GPA / CGPA Calculator - Core Logic
// Grade Scale: A+/A=4.0, B+=3.75, B=3.0, C+=2.75, C=2.0, D=1.0, F=0.0
// Retake policy: new grade REPLACES old grade
// (This is the same logic verified earlier - just ES module syntax for RN)
// ============================================

export const GRADE_POINTS = {
  'A+': 4.0,
  'A': 4.0,
  'B+': 3.75,
  'B': 3.0,
  'C+': 2.75,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

export function calculateSemesterGPA(courses) {
  if (!courses || courses.length === 0) {
    return { gpa: 0, totalCredits: 0, totalQualityPoints: 0 };
  }

  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const course of courses) {
    const { creditHours, grade } = course;
    if (!(grade in GRADE_POINTS)) continue; // skip ungraded courses
    if (typeof creditHours !== 'number' || creditHours <= 0) continue;

    const gradePoint = GRADE_POINTS[grade];
    totalCredits += creditHours;
    totalQualityPoints += creditHours * gradePoint;
  }

  const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return {
    gpa: round2(gpa),
    totalCredits,
    totalQualityPoints: round2(totalQualityPoints),
  };
}

export function calculateOverallCGPA(previousCgpa, previousCredits, allSemesterCourses) {
  let prevCredits = previousCredits || 0;
  let prevQualityPoints = (previousCgpa || 0) * prevCredits;

  const result = calculateSemesterGPA(allSemesterCourses);

  const totalCredits = prevCredits + result.totalCredits;
  const totalQualityPoints = prevQualityPoints + result.totalQualityPoints;

  const cgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return {
    cgpa: round2(cgpa),
    totalCredits,
    totalQualityPoints: round2(totalQualityPoints),
  };
}

function round2(num) {
  return Math.round(num * 100) / 100;
}