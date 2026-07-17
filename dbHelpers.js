import { db } from './database';

// ---------- SEMESTERS ----------

export function addSemester(name, yearNumber) {
  // Ensure yearNumber is a valid primitive number
  const y = parseInt(yearNumber, 10) || 1;
  const result = db.runSync(`INSERT INTO semesters (name, year_number) VALUES (?, ?);`, [name, y]);
  return result.lastInsertRowId;
}

export function getSemesters() {
  return db.getAllSync(`SELECT * FROM semesters ORDER BY created_at DESC;`);
}

export function deleteSemester(id) {
  db.runSync(`DELETE FROM semesters WHERE id = ?;`, [id]);
}

// ---------- COURSES ----------

export function addCourse(semesterId, name, courseCode, creditHours) {
  const result = db.runSync(
    `INSERT INTO courses (semester_id, name, course_code, credit_hours) VALUES (?, ?, ?, ?);`,
    [semesterId, name, courseCode, creditHours]
  );
  return result.lastInsertRowId;
}

export function getCoursesBySemester(semesterId) {
  return db.getAllSync(
    `SELECT * FROM courses WHERE semester_id = ? ORDER BY created_at ASC;`,
    [semesterId]
  );
}

export function getCourseById(id) {
  return db.getFirstSync(`SELECT * FROM courses WHERE id = ?;`, [id]);
}

export function deleteCourse(id) {
  db.runSync(`DELETE FROM courses WHERE id = ?;`, [id]);
}

export function updateCourseGrade(courseId, grade) {
  db.runSync(`UPDATE courses SET grade = ? WHERE id = ?;`, [grade, courseId]);
}

// ---------- SEMESTER GPA ----------

export function updateSemesterGPA(semesterId, gpa, totalCredits) {
  db.runSync(
    `UPDATE semesters SET semester_gpa = ?, total_credits = ? WHERE id = ?;`,
    [gpa, totalCredits, semesterId]
  );
}

// ---------- USER (previous CGPA / credits) ----------

export function getUser() {
  return db.getFirstSync(`SELECT * FROM users LIMIT 1;`);
}

export function isUserSetupComplete() {
  const user = getUser();
  return !!(user && user.name);
}

export function saveUserProfile({ name, university, studentId, year, previousCgpa, previousCredits }) {
  const existing = getUser();
  if (existing) {
    db.runSync(
      `UPDATE users SET name = ?, university = ?, student_id = ?, year = ?, previous_cgpa = ?, previous_credits = ? WHERE id = ?;`,
      [name, university, studentId, year, previousCgpa || 0, previousCredits || 0, existing.id]
    );
  } else {
    db.runSync(
      `INSERT INTO users (name, university, student_id, year, previous_cgpa, previous_credits) VALUES (?, ?, ?, ?, ?, ?);`,
      [name, university, studentId, year, previousCgpa || 0, previousCredits || 0]
    );
  }
}

export function setUserPreviousRecord(previousCgpa, previousCredits) {
  const existing = getUser();
  if (existing) {
    db.runSync(
      `UPDATE users SET previous_cgpa = ?, previous_credits = ? WHERE id = ?;`,
      [previousCgpa, previousCredits, existing.id]
    );
  } else {
    db.runSync(
      `INSERT INTO users (previous_cgpa, previous_credits) VALUES (?, ?);`,
      [previousCgpa, previousCredits]
    );
  }
}

// ---------- OVERALL CGPA DATA ----------

export function getAllSemestersWithCourses() {
  const semesters = getSemesters();
  return semesters.map((s) => ({
    ...s,
    courses: getCoursesBySemester(s.id),
  }));
}

// ---------- DASHBOARD AGGREGATION ----------

// Returns attendance info for every course that has attendance set up,
// including course name and calculated percentage/remaining absences
export function getAllAttendanceSummaries() {
  const rows = db.getAllSync(`
    SELECT attendance.id as attendance_id, attendance.total_classes, attendance.allowed_absence,
           courses.id as course_id, courses.name as course_name
    FROM attendance
    JOIN courses ON attendance.course_id = courses.id;
  `);

  return rows.map((row) => {
    const absenceCount = db.getFirstSync(
      `SELECT COUNT(*) as count FROM absence_dates WHERE attendance_id = ?;`,
      [row.attendance_id]
    ).count;

    const remaining = row.allowed_absence - absenceCount;
    const percentage = row.total_classes > 0
      ? Math.round(((row.total_classes - absenceCount) / row.total_classes) * 100)
      : 0;

    return {
      courseId: row.course_id,
      courseName: row.course_name,
      percentage,
      remaining,
      isWarning: remaining <= 2,
    };
  });
}

// ---------- SCHEDULE ----------

export function addScheduleEntry(courseId, dayOfWeek, startTime, endTime, room, classType) {
  const result = db.runSync(
    `INSERT INTO schedule (course_id, day_of_week, start_time, end_time, room, class_type) VALUES (?, ?, ?, ?, ?, ?);`,
    [courseId, dayOfWeek, startTime, endTime, room || null, classType || 'Lecture']
  );
  return result.lastInsertRowId;
}

export function getScheduleByCourse(courseId) {
  return db.getAllSync(`SELECT * FROM schedule WHERE course_id = ? ORDER BY day_of_week, start_time;`, [courseId]);
}

export function deleteScheduleEntry(id) {
  db.runSync(`DELETE FROM schedule WHERE id = ?;`, [id]);
}

// Checks if a proposed time slot overlaps with ANY existing class (any course) on the same day.
// Returns the conflicting entry (with course name) if found, otherwise null.
export function getScheduleConflict(dayOfWeek, startTime, endTime, excludeScheduleId) {
  const existing = db.getAllSync(`
    SELECT schedule.id, schedule.start_time, schedule.end_time, courses.name as course_name
    FROM schedule
    JOIN courses ON schedule.course_id = courses.id
    WHERE schedule.day_of_week = ?;
  `, [dayOfWeek]);

  for (const entry of existing) {
    if (excludeScheduleId && entry.id === excludeScheduleId) continue;
    // Overlap if new start is before existing end AND new end is after existing start
    const overlaps = startTime < entry.end_time && endTime > entry.start_time;
    if (overlaps) return entry;
  }
  return null;
}

// Returns today's classes across all courses, sorted by start time,
// each with the course name attached, plus today's exception status if any
export function getTodaysClasses() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];

  const classes = db.getAllSync(`
    SELECT schedule.id, schedule.start_time, schedule.end_time, schedule.room, schedule.class_type,
           courses.name as course_name
    FROM schedule
    JOIN courses ON schedule.course_id = courses.id
    WHERE schedule.day_of_week = ?
    ORDER BY schedule.start_time ASC;
  `, [today]);

  return classes.map((c) => {
    const exception = db.getFirstSync(
      `SELECT status, note FROM schedule_exceptions WHERE schedule_id = ? AND date = ?;`,
      [c.id, todayDate]
    );
    return { ...c, exceptionStatus: exception?.status ?? null, exceptionNote: exception?.note ?? null };
  });
}

// ---------- SCHEDULE EXCEPTIONS (per-date cancel / makeup) ----------

export function setClassException(scheduleId, date, status, note) {
  const existing = db.getFirstSync(
    `SELECT id FROM schedule_exceptions WHERE schedule_id = ? AND date = ?;`,
    [scheduleId, date]
  );
  if (existing) {
    db.runSync(
      `UPDATE schedule_exceptions SET status = ?, note = ? WHERE id = ?;`,
      [status, note || null, existing.id]
    );
  } else {
    db.runSync(
      `INSERT INTO schedule_exceptions (schedule_id, date, status, note) VALUES (?, ?, ?, ?);`,
      [scheduleId, date, status, note || null]
    );
  }
}

export function clearClassException(scheduleId, date) {
  db.runSync(`DELETE FROM schedule_exceptions WHERE schedule_id = ? AND date = ?;`, [scheduleId, date]);
}

// ---------- TASKS ----------

export function addTask(name, deadline, courseId, priority) {
  const result = db.runSync(
    `INSERT INTO tasks (name, deadline, course_id, priority, status) VALUES (?, ?, ?, ?, 'pending');`,
    [name, deadline, courseId || null, priority || null]
  );
  return result.lastInsertRowId;
}

export function getAllTasks() {
  return db.getAllSync(`SELECT * FROM tasks ORDER BY deadline ASC;`);
}

export function getPendingTasks() {
  return db.getAllSync(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY deadline ASC;`);
}

export function updateTaskStatus(id, status) {
  db.runSync(`UPDATE tasks SET status = ? WHERE id = ?;`, [status, id]);
}

export function deleteTask(id) {
  db.runSync(`DELETE FROM tasks WHERE id = ?;`, [id]);
}

// ---------- ATTENDANCE ----------

export function getAttendance(courseId) {
  return db.getFirstSync(`SELECT * FROM attendance WHERE course_id = ?;`, [courseId]);
}

export function setAttendance(courseId, totalClasses, allowedAbsence) {
  const existing = getAttendance(courseId);
  if (existing) {
    db.runSync(
      `UPDATE attendance SET total_classes = ?, allowed_absence = ? WHERE course_id = ?;`,
      [totalClasses, allowedAbsence, courseId]
    );
  } else {
    db.runSync(
      `INSERT INTO attendance (course_id, total_classes, allowed_absence) VALUES (?, ?, ?);`,
      [courseId, totalClasses, allowedAbsence]
    );
  }
}

export function addAbsenceDate(attendanceId, date, reason) {
  db.runSync(
    `INSERT INTO absence_dates (attendance_id, date, reason) VALUES (?, ?, ?);`,
    [attendanceId, date, reason || null]
  );
}

export function getAbsenceDates(attendanceId) {
  return db.getAllSync(`SELECT * FROM absence_dates WHERE attendance_id = ? ORDER BY date DESC;`, [attendanceId]);
}

export function deleteAbsenceDate(id) {
  db.runSync(`DELETE FROM absence_dates WHERE id = ?;`, [id]);
}

// ---------- ASSESSMENTS ----------

export function addAssessment(courseId, name, totalMarks, obtainedMarks, weight, originalMarks, category, deadline) {
  const w = parseFloat(weight) || 0;
  const tm = parseFloat(totalMarks) || 0;
  const om = parseFloat(obtainedMarks) || tm;
  const orm = parseFloat(originalMarks) || om;

  const result = db.runSync(
    `INSERT INTO assessments (course_id, name, total_marks, obtained_marks, weight, original_marks, category, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [courseId, name, tm, om, w, orm, category || 'Theory', deadline || null]
  );
  return result.lastInsertRowId;
}

/**
 * Returns a list of all upcoming "High Stake" items:
 * For each course, it picks the Mid Exam first. Once the Mid is passed,
 * it switches to the Final Exam. It also includes pending assessments.
 */
export function getUpcomingDeadlines() {
  const now = new Date();
  now.setHours(0,0,0,0);

  // 1. Get all courses to evaluate exams sequentially
  const courses = db.getAllSync(`SELECT id, name FROM courses;`);
  const relevantExams = [];

  courses.forEach(course => {
    // Look for Mid Exam first
    const mid = db.getFirstSync(
      `SELECT exam_date FROM exams WHERE course_id = ? AND exam_type = 'Mid' AND exam_date IS NOT NULL;`,
      [course.id]
    );

    if (mid && new Date(mid.exam_date) >= now) {
      // Mid exists and is today or in the future
      relevantExams.push({ date: mid.exam_date, type: 'Mid Exam', course_name: course.name });
    } else {
      // Mid passed (yesterday or older) or doesn't exist - look for Final
      const final = db.getFirstSync(
        `SELECT exam_date FROM exams WHERE course_id = ? AND exam_type = 'Final' AND exam_date IS NOT NULL;`,
        [course.id]
      );
      if (final && new Date(final.exam_date) >= now) {
        relevantExams.push({ date: final.exam_date, type: 'Final Exam', course_name: course.name });
      }
    }
  });

  // 2. Get pending assessments with deadlines
  const assessments = db.getAllSync(`
    SELECT assessments.deadline as date, assessments.name as type, courses.name as course_name
    FROM assessments
    JOIN courses ON assessments.course_id = courses.id
    WHERE assessments.deadline IS NOT NULL AND assessments.obtained_marks IS NULL;
  `);

  // 3. Combine, filter out past items, and sort
  const all = [...relevantExams, ...assessments]
    .filter(item => new Date(item.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return all.slice(0, 4); // return top 4 soonest items
}

export function getAssessments(courseId) {
  return db.getAllSync(`SELECT * FROM assessments WHERE course_id = ? ORDER BY id ASC;`, [courseId]);
}

export function updateAssessment(id, obtainedMarks, weight) {
  db.runSync(`UPDATE assessments SET obtained_marks = ?, weight = ? WHERE id = ?;`, [obtainedMarks, weight, id]);
}

export function updateCourseTarget(courseId, targetScore) {
  db.runSync(`UPDATE courses SET target_score = ? WHERE id = ?;`, [targetScore, courseId]);
}

/**
 * Perform the "What-If" Analysis:
 * Calculates current points vs target points and returns how many
 * points are needed from remaining weight.
 */
export function getGoalAnalysis(courseId) {
  const course = db.getFirstSync(`SELECT target_score FROM courses WHERE id = ?;`, [courseId]);
  const assessments = db.getAllSync(`SELECT * FROM assessments WHERE course_id = ?;`, [courseId]);
  const groups = db.getAllSync(`SELECT * FROM assessment_groups WHERE course_id = ?;`, [courseId]);
  const exams = db.getAllSync(`SELECT * FROM exams WHERE course_id = ?;`, [courseId]);

  let currentContribution = 0;
  let weightUsed = 0;

  // Track whichAssessments are in groups to avoid double counting
  const groupedAssessmentIds = new Set();
  groups.forEach(group => {
    const groupItems = db.getAllSync(`SELECT assessment_id FROM assessment_group_items WHERE group_id = ?;`, [group.id]);
    groupItems.forEach(item => groupedAssessmentIds.add(item.assessment_id));
    
    // Use group weight directly
    if (group.weight > 0) {
      let groupScore = 0;
      const items = getAssessmentGroupItems(group.id);
      
      // Calculate group score from individual assessments
      const totalObtained = items.reduce((sum, item) => sum + (item.obtained_marks || 0), 0);
      const totalPossible = items.reduce((sum, item) => sum + (item.total_marks || 0), 0);
      
      // Use rounded score if available, otherwise use calculated score
      if (group.rounded_score !== null && group.rounded_total !== null && group.rounded_total > 0) {
        groupScore = group.rounded_score / group.rounded_total;
      } else if (totalPossible > 0) {
        groupScore = totalObtained / totalPossible;
      }
      
      currentContribution += (groupScore * group.weight);
      weightUsed += group.weight;
    }
  });

  assessments.forEach(a => {
    // Skip if this assessment is in a group (already counted)
    if (groupedAssessmentIds.has(a.id)) return;

    // Use rounded score if available, otherwise use raw score
    const obtainedScore = (a.is_rounded && a.rounded_score !== null && a.rounded_total !== null) 
      ? a.rounded_score / a.rounded_total 
      : (a.total_marks > 0 ? a.obtained_marks / a.total_marks : 0);
    
    currentContribution += (obtainedScore * a.weight);
    weightUsed += a.weight;
  });

  // Add exams to calculation
  exams.forEach(e => {
    if (e.obtained_marks !== null && e.total_marks !== null && e.total_marks > 0 && e.weight > 0) {
      const examScore = (e.is_rounded && e.rounded_score !== null && e.rounded_total !== null)
        ? e.rounded_score / e.rounded_total
        : e.obtained_marks / e.total_marks;
      currentContribution += (examScore * e.weight);
      weightUsed += e.weight;
    }
  });

  const target = course.target_score || 85;
  const needed = target - currentContribution;
  const remainingWeight = 100 - weightUsed;

  // Required percentage on future work to meet target
  const requiredAverage = remainingWeight > 0 ? (needed / remainingWeight) * 100 : 0;

  const allowedToLose = 100 - target;
  const alreadyLost = weightUsed - currentContribution;
  const remainingMistakePoints = allowedToLose - alreadyLost;

  return {
    currentScore: currentContribution.toFixed(1),
    weightUsed,
    remainingWeight,
    neededPoints: needed.toFixed(1),
    requiredAverage: requiredAverage.toFixed(1),
    remainingMistakePoints: remainingMistakePoints.toFixed(1),
    isImpossible: remainingMistakePoints < 0,
    isAtRisk: requiredAverage > 85,
  };
}

export function deleteAssessment(id) {
  db.runSync(`DELETE FROM assessments WHERE id = ?;`, [id]);
}

// ---------- EXAMS (Mid / Final) ----------

export function getExamsForCourse(courseId) {
  return db.getAllSync(`SELECT * FROM exams WHERE course_id = ?;`, [courseId]);
}

export function getExamByType(courseId, examType) {
  return db.getFirstSync(`SELECT * FROM exams WHERE course_id = ? AND exam_type = ?;`, [courseId, examType]);
}

export function setExamDate(courseId, examType, examDate) {
  const existing = getExamByType(courseId, examType);
  if (existing) {
    db.runSync(`UPDATE exams SET exam_date = ? WHERE id = ?;`, [examDate, existing.id]);
  } else {
    db.runSync(
      `INSERT INTO exams (course_id, exam_type, exam_date) VALUES (?, ?, ?);`,
      [courseId, examType, examDate]
    );
  }
}

export function setExamGrades(courseId, examType, obtainedMarks, totalMarks) {
  const existing = getExamByType(courseId, examType);
  if (existing) {
    db.runSync(`UPDATE exams SET obtained_marks = ?, total_marks = ? WHERE id = ?;`, [obtainedMarks, totalMarks, existing.id]);
  } else {
    db.runSync(`INSERT INTO exams (course_id, exam_type, obtained_marks, total_marks) VALUES (?, ?, ?, ?);`, [courseId, examType, obtainedMarks, totalMarks]);
  }
}

export function setExamWeight(courseId, examType, weight) {
  const exam = getExamByType(courseId, examType);
  if (exam) {
    db.runSync(`UPDATE exams SET weight = ? WHERE id = ?;`, [weight, exam.id]);
  }
}

export function setExamRounding(courseId, examType, roundedScore, roundedTotal, reason) {
  const exam = getExamByType(courseId, examType);
  if (!exam) return;

  // Log to history before updating
  db.runSync(
    `INSERT INTO rounding_history (assessment_id, raw_score, raw_total, rounded_score, rounded_total, reason) VALUES (?, ?, ?, ?, ?, ?);`,
    [exam.id, exam.obtained_marks, exam.total_marks, roundedScore, roundedTotal, reason || null]
  );

  // Update exam with rounded values
  db.runSync(
    `UPDATE exams SET rounded_score = ?, rounded_total = ?, is_rounded = 1 WHERE id = ?;`,
    [roundedScore, roundedTotal, exam.id]
  );
}

export function clearExamRounding(courseId, examType) {
  const exam = getExamByType(courseId, examType);
  if (exam) {
    db.runSync(`UPDATE exams SET rounded_score = NULL, rounded_total = NULL, is_rounded = 0 WHERE id = ?;`, [exam.id]);
  }
}

// Returns the single nearest upcoming exam (Mid or Final) across all courses
export function getNearestUpcomingExam() {
  const rows = db.getAllSync(`
    SELECT exams.exam_date, exams.exam_type, courses.name as course_name
    FROM exams
    JOIN courses ON exams.course_id = courses.id
    WHERE exams.exam_date IS NOT NULL;
  `);

  const now = new Date();
  const future = rows
    .filter((r) => new Date(r.exam_date) > now)
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

  return future.length > 0 ? future[0] : null;
}

// ---------- REVISION TOPICS ----------

export function addRevisionTopic(courseId, topic, notes, importance, understandingLevel, revisionNotes, imagePath) {
  const result = db.runSync(
    `INSERT INTO revision_topics (course_id, topic, notes, importance, understanding_level, revision_notes, image_path) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [courseId, topic, notes, importance, understandingLevel || 'not_fully', revisionNotes || null, imagePath || null]
  );
  return result.lastInsertRowId;
}

export function getRevisionTopics(courseId) {
  return db.getAllSync(`SELECT * FROM revision_topics WHERE course_id = ? ORDER BY id ASC;`, [courseId]);
}

export function toggleRevisionTopic(id, completed) {
  db.runSync(`UPDATE revision_topics SET completed = ? WHERE id = ?;`, [completed ? 1 : 0, id]);
}

export function updateTopicUnderstanding(id, understandingLevel) {
  db.runSync(`UPDATE revision_topics SET understanding_level = ? WHERE id = ?;`, [understandingLevel, id]);
}

export function updateTopicRevisionNotes(id, revisionNotes) {
  db.runSync(`UPDATE revision_topics SET revision_notes = ? WHERE id = ?;`, [revisionNotes, id]);
}

export function updateTopicImage(id, imagePath) {
  db.runSync(`UPDATE revision_topics SET image_path = ? WHERE id = ?;`, [imagePath, id]);
}

export function getSortedRevisionTopics(courseId) {
  const understandingOrder = { 'dont_understand': 0, 'not_fully': 1, 'understand': 2 };
  const importanceOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  
  const topics = db.getAllSync(`SELECT * FROM revision_topics WHERE course_id = ?;`, [courseId]);
  
  return topics.sort((a, b) => {
    // First sort by understanding level (don't understand first)
    const aUnderstanding = understandingOrder[a.understanding_level] || 1;
    const bUnderstanding = understandingOrder[b.understanding_level] || 1;
    if (aUnderstanding !== bUnderstanding) {
      return aUnderstanding - bUnderstanding;
    }
    // Then sort by importance (high first)
    const aImportance = importanceOrder[a.importance] || 1;
    const bImportance = importanceOrder[b.importance] || 1;
    if (aImportance !== bImportance) {
      return aImportance - bImportance;
    }
    // Finally by ID
    return a.id - b.id;
  });
}

export function deleteRevisionTopic(id) {
  db.runSync(`DELETE FROM revision_topics WHERE id = ?;`, [id]);
}

// ---------- TOPIC IMAGES ----------

export function addTopicImage(topicId, imageUri) {
  const result = db.runSync(
    `INSERT INTO topic_images (topic_id, image_uri) VALUES (?, ?);`,
    [topicId, imageUri]
  );
  return result.lastInsertRowId;
}

export function getTopicImages(topicId) {
  return db.getAllSync(`SELECT * FROM topic_images WHERE topic_id = ? ORDER BY id ASC;`, [topicId]);
}

export function deleteTopicImage(imageId) {
  db.runSync(`DELETE FROM topic_images WHERE id = ?;`, [imageId]);
}

// ---------- ASSESSMENT ROUNDING ----------

export function setAssessmentRounding(assessmentId, roundedScore, roundedTotal, reason) {
  const assessment = db.getFirstSync(`SELECT * FROM assessments WHERE id = ?;`, [assessmentId]);
  if (!assessment) return;

  // Log to history before updating
  db.runSync(
    `INSERT INTO rounding_history (assessment_id, raw_score, raw_total, rounded_score, rounded_total, reason) VALUES (?, ?, ?, ?, ?, ?);`,
    [assessmentId, assessment.obtained_marks, assessment.total_marks, roundedScore, roundedTotal, reason || null]
  );

  // Update assessment with rounded values
  db.runSync(
    `UPDATE assessments SET rounded_score = ?, rounded_total = ?, is_rounded = 1 WHERE id = ?;`,
    [roundedScore, roundedTotal, assessmentId]
  );
}

export function clearAssessmentRounding(assessmentId) {
  db.runSync(`UPDATE assessments SET rounded_score = NULL, rounded_total = NULL, is_rounded = 0 WHERE id = ?;`, [assessmentId]);
}

// ---------- ASSESSMENT GROUPING ----------

export function createAssessmentGroup(courseId, groupName, weight, roundedScore, roundedTotal) {
  const result = db.runSync(
    `INSERT INTO assessment_groups (course_id, group_name, weight, rounded_score, rounded_total) VALUES (?, ?, ?, ?, ?);`,
    [courseId, groupName, weight, roundedScore, roundedTotal]
  );
  return result.lastInsertRowId;
}

export function updateGroupWeight(groupId, weight) {
  db.runSync(`UPDATE assessment_groups SET weight = ? WHERE id = ?;`, [weight, groupId]);
}

export function addAssessmentToGroup(groupId, assessmentId) {
  const result = db.runSync(
    `INSERT INTO assessment_group_items (group_id, assessment_id) VALUES (?, ?);`,
    [groupId, assessmentId]
  );
  return result.lastInsertRowId;
}

export function removeAssessmentFromGroup(groupId, assessmentId) {
  db.runSync(`DELETE FROM assessment_group_items WHERE group_id = ? AND assessment_id = ?;`, [groupId, assessmentId]);
}

export function getAssessmentGroups(courseId) {
  return db.getAllSync(`SELECT * FROM assessment_groups WHERE course_id = ? ORDER BY created_at DESC;`, [courseId]);
}

export function getAssessmentGroupItems(groupId) {
  return db.getAllSync(`
    SELECT assessment_group_items.*, assessments.name, assessments.obtained_marks, assessments.total_marks, assessments.weight
    FROM assessment_group_items
    JOIN assessments ON assessment_group_items.assessment_id = assessments.id
    WHERE assessment_group_items.group_id = ?;
  `, [groupId]);
}

export function deleteAssessmentGroup(groupId) {
  db.runSync(`DELETE FROM assessment_group_items WHERE group_id = ?;`, [groupId]);
  db.runSync(`DELETE FROM assessment_groups WHERE id = ?;`, [groupId]);
}

export function updateGroupRounding(groupId, roundedScore, roundedTotal, reason) {
  const group = db.getFirstSync(`SELECT * FROM assessment_groups WHERE id = ?;`, [groupId]);
  if (!group) return;

  // Calculate raw total from group items
  const items = getAssessmentGroupItems(groupId);
  const rawScore = items.reduce((sum, item) => sum + (item.obtained_marks || 0), 0);
  const rawTotal = items.reduce((sum, item) => sum + (item.total_marks || 0), 0);

  // Log to history
  db.runSync(
    `INSERT INTO rounding_history (group_id, raw_score, raw_total, rounded_score, rounded_total, reason) VALUES (?, ?, ?, ?, ?, ?);`,
    [groupId, rawScore, rawTotal, roundedScore, roundedTotal, reason || null]
  );

  // Update group with rounded values
  db.runSync(
    `UPDATE assessment_groups SET rounded_score = ?, rounded_total = ? WHERE id = ?;`,
    [roundedScore, roundedTotal, groupId]
  );
}

// ---------- ROUNDING HISTORY ----------

export function getRoundingHistory(assessmentId) {
  return db.getAllSync(`SELECT * FROM rounding_history WHERE assessment_id = ? ORDER BY created_at DESC;`, [assessmentId]);
}

export function getGroupRoundingHistory(groupId) {
  return db.getAllSync(`SELECT * FROM rounding_history WHERE group_id = ? ORDER BY created_at DESC;`, [groupId]);
}

export function getAllRoundingHistory(courseId) {
  return db.getAllSync(`
    SELECT rounding_history.*, 
           CASE 
             WHEN rounding_history.assessment_id IS NOT NULL THEN 
               (SELECT name FROM assessments WHERE id = rounding_history.assessment_id)
             ELSE 
               (SELECT group_name FROM assessment_groups WHERE id = rounding_history.group_id)
           END as item_name,
           CASE 
             WHEN rounding_history.assessment_id IS NOT NULL THEN 'Assessment'
             ELSE 'Group'
           END as item_type
    FROM rounding_history
    WHERE rounding_history.assessment_id IN (SELECT id FROM assessments WHERE course_id = ?)
       OR rounding_history.group_id IN (SELECT id FROM assessment_groups WHERE course_id = ?)
    ORDER BY created_at DESC;
  `, [courseId, courseId]);
}

// ---------- PERSONAL / PRAYERS ----------

export function getPrayers(date) {
  let row = db.getFirstSync(`SELECT * FROM prayers WHERE date = ?;`, [date]);
  if (!row) {
    db.runSync(`INSERT INTO prayers (date, fajr, dhuhr, asr, maghrib, isha, no_sugar, read_book, study_time) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0);`, [date]);
    row = db.getFirstSync(`SELECT * FROM prayers WHERE date = ?;`, [date]);
  }
  return row;
}

export function updatePrayer(date, field, val) {
  db.runSync(`UPDATE prayers SET ${field} = ? WHERE date = ?;`, [val ? 1 : 0, date]);
}

export function getPersonalNotes() {
  return db.getAllSync(`SELECT * FROM personal_notes ORDER BY created_at DESC;`);
}

export function addPersonalNote(text) {
  db.runSync(`INSERT INTO personal_notes (text_content) VALUES (?);`, [text]);
}

export function deletePersonalNote(id) {
  db.runSync(`DELETE FROM personal_notes WHERE id = ?;`, [id]);
}

// ---------- HABITS ----------

export function getHabits() {
  return db.getAllSync(`SELECT * FROM habits ORDER BY created_at ASC;`);
}

export function addHabit(name, icon, category, priority, reminderTime) {
  const result = db.runSync(
    `INSERT INTO habits (name, icon, category, priority, reminder_time) VALUES (?, ?, ?, ?, ?);`,
    [name, icon || 'checkbox-outline', category || 'Personal', priority || 'medium', reminderTime || null]
  );
  return result.lastInsertRowId;
}

export function deleteHabit(id) {
  db.runSync(`DELETE FROM habit_tracking WHERE habit_id = ?;`, [id]);
  db.runSync(`DELETE FROM habits WHERE id = ?;`, [id]);
}

export function getHabitTracking(habitId, date) {
  let row = db.getFirstSync(`SELECT * FROM habit_tracking WHERE habit_id = ? AND date = ?;`, [habitId, date]);
  if (!row) {
    db.runSync(`INSERT INTO habit_tracking (habit_id, date, completed) VALUES (?, ?, 0);`, [habitId, date]);
    row = db.getFirstSync(`SELECT * FROM habit_tracking WHERE habit_id = ? AND date = ?;`, [habitId, date]);
  }
  return row;
}

export function toggleHabitTracking(habitId, date, completed) {
  db.runSync(`UPDATE habit_tracking SET completed = ? WHERE habit_id = ? AND date = ?;`, [completed ? 1 : 0, habitId, date]);
}

export function getHabitsWithTracking(date) {
  const habits = getHabits();
  return habits.map(habit => ({
    ...habit,
    tracking: getHabitTracking(habit.id, date),
    streak: getHabitStreak(habit.id),
    weekStats: getHabitWeekStats(habit.id)
  }));
}

export function getDailyCompletionRate(date) {
  const habits = getHabits();
  if (habits.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  let completed = 0;
  habits.forEach(habit => {
    const tracking = getHabitTracking(habit.id, date);
    if (tracking && tracking.completed === 1) {
      completed++;
    }
  });
  
  return {
    completed,
    total: habits.length,
    percentage: Math.round((completed / habits.length) * 100)
  };
}

export function getHabitStreak(habitId) {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const tracking = db.getFirstSync(
      `SELECT completed FROM habit_tracking WHERE habit_id = ? AND date = ?;`,
      [habitId, dateStr]
    );
    
    if (tracking && tracking.completed === 1) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateStr === today.toISOString().split('T')[0]) {
      // Today not completed yet, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export function getHabitWeekStats(habitId) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const tracking = db.getAllSync(
    `SELECT completed FROM habit_tracking WHERE habit_id = ? AND date >= ? AND date <= ?;`,
    [habitId, weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]]
  );
  
  const completed = tracking.filter(t => t.completed === 1).length;
  const total = tracking.length;
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

export function getHabitHistory(habitId, startDate, endDate) {
  return db.getAllSync(
    `SELECT date, completed FROM habit_tracking WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC;`,
    [habitId, startDate, endDate]
  );
}

export function updateHabit(habitId, name, icon, category, priority, reminderTime) {
  db.runSync(
    `UPDATE habits SET name = ?, icon = ?, category = ?, priority = ?, reminder_time = ? WHERE id = ?;`,
    [name, icon, category, priority, reminderTime, habitId]
  );
}

export function getHabitsByCategory(category) {
  return db.getAllSync(`SELECT * FROM habits WHERE category = ? ORDER BY created_at ASC;`, [category]);
}

export function getHabitsByPriority(priority) {
  return db.getAllSync(`SELECT * FROM habits WHERE priority = ? ORDER BY created_at ASC;`, [priority]);
}

export function getHabitsWithReminders() {
  return db.getAllSync(`SELECT * FROM habits WHERE reminder_time IS NOT NULL ORDER BY reminder_time ASC;`);
}

// ---------- HABIT TEMPLATES ----------

export function getHabitTemplates() {
  return db.getAllSync(`SELECT * FROM habit_templates ORDER BY id ASC;`);
}

export function addHabitTemplate(name, icon, category, priority) {
  const result = db.runSync(
    `INSERT INTO habit_templates (name, icon, category, priority) VALUES (?, ?, ?, ?);`,
    [name, icon || 'checkbox-outline', category || 'Personal', priority || 'medium']
  );
  return result.lastInsertRowId;
}

export function deleteHabitTemplate(id) {
  db.runSync(`DELETE FROM habit_templates WHERE id = ?;`, [id]);
}

export function initDefaultHabitTemplates() {
  const existing = getHabitTemplates();
  if (existing.length === 0) {
    addHabitTemplate('Exercise', 'fitness-outline', 'Health', 'high');
    addHabitTemplate('Read 30 mins', 'book-outline', 'Personal', 'medium');
    addHabitTemplate('Meditation', 'leaf-outline', 'Health', 'medium');
    addHabitTemplate('Drink Water', 'water-outline', 'Health', 'low');
    addHabitTemplate('Study', 'pencil-outline', 'Study', 'high');
    addHabitTemplate('No Sugar', 'nutrition-outline', 'Health', 'medium');
    addHabitTemplate('Sleep 8 hours', 'moon-outline', 'Health', 'high');
    addHabitTemplate('Journal', 'journal-outline', 'Personal', 'low');
  }
}

// ---------- THEME SETTINGS ----------

export function getTheme() {
  try {
    const user = getUser();
    return user?.theme || 'light';
  } catch (e) {
    return 'light'; // Fallback if table doesn't exist yet
  }
}

export function setTheme(themeName) {
  try {
    const user = getUser();
    if (user) {
      db.runSync(`UPDATE users SET theme = ? WHERE id = ?;`, [themeName, user.id]);
    }
  } catch (e) {
    console.error("Failed to save theme:", e);
  }
}