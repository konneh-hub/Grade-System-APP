PRAGMA foreign_keys = ON;

-- ============================================
-- ROLES & PERMISSIONS
-- ============================================

INSERT OR IGNORE INTO roles (id, name, description) VALUES
  (1, 'admin', 'System administrator'),
  (2, 'dean', 'Dean of faculty'),
  (3, 'hod', 'Head of department'),
  (4, 'lecturer', 'Course lecturer'),
  (5, 'exam_officer', 'Examination officer'),
  (6, 'student', 'Student user');

INSERT OR IGNORE INTO permissions (id, name, description) VALUES
  (1, 'manage_users', 'Manage users'),
  (2, 'manage_courses', 'Manage courses'),
  (3, 'manage_results', 'Manage results'),
  (4, 'manage_graduation', 'Manage graduation'),
  (5, 'view_reports', 'View reports');

INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
  (2, 3), (2, 4), (2, 5),
  (3, 2), (3, 3), (3, 5),
  (4, 2), (4, 3),
  (5, 3), (5, 4), (5, 5),
  (6, 3);

-- ============================================
-- ORGANIZATIONAL STRUCTURE
-- ============================================

INSERT OR IGNORE INTO faculties (id, name, code, description) VALUES
  (1, 'Faculty of Computing', 'FCOM', 'Computing and digital systems');

INSERT OR IGNORE INTO departments (id, faculty_id, name, code, description) VALUES
  (1, 1, 'Computer Science', 'CSC', 'Computer science department');

INSERT OR IGNORE INTO academic_sessions (id, name, code, start_date, end_date, is_active) VALUES
  (1, '2024/2025 Academic Session', '2024-2025', '2024-09-01', '2025-07-31', 1),
  (2, '2023/2024 Academic Session', '2023-2024', '2023-09-01', '2024-07-31', 0);

INSERT OR IGNORE INTO programs (id, department_id, name, code, duration_years) VALUES
  (1, 1, 'Computer Science', 'CSCI', 4);

-- ============================================
-- USERS - ADMIN
-- ============================================

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, status, registered_at) VALUES
  (1, 'admin@slughub.local', 'demo-hash', 'System', 'Admin', '08000000000', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (1, 1);

-- ============================================
-- USERS - DEAN, HOD, EXAM OFFICER
-- ============================================

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, status, registered_at) VALUES
  (3, 'dean@slughub.local', 'demo-hash', 'Dr. Amara', 'Stevens', '08111111111', 'active', CURRENT_TIMESTAMP),
  (4, 'hod@slughub.local', 'demo-hash', 'Prof. Ibrahim', 'Hassan', '08222222222', 'active', CURRENT_TIMESTAMP),
  (5, 'examofficer@slughub.local', 'demo-hash', 'Mrs. Isatou', 'Conteh', '08333333333', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (3, 2),
  (4, 3),
  (5, 5);

-- ============================================
-- USERS - LECTURERS
-- ============================================

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, status, registered_at) VALUES
  (6, 'lec.smith@slughub.local', 'demo-hash', 'Dr. James', 'Smith', '08444444444', 'active', CURRENT_TIMESTAMP),
  (7, 'lec.johnson@slughub.local', 'demo-hash', 'Dr. Grace', 'Johnson', '08555555555', 'active', CURRENT_TIMESTAMP),
  (8, 'lec.williams@slughub.local', 'demo-hash', 'Dr. Samuel', 'Williams', '08666666666', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (6, 4),
  (7, 4),
  (8, 4);

-- ============================================
-- USERS - STUDENTS (5 test students)
-- ============================================

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, status, registered_at) VALUES
  (2, 'student@slughub.local', 'demo-hash', 'John', 'Doe', '08012345678', 'active', CURRENT_TIMESTAMP),
  (9, 'student2@slughub.local', 'demo-hash', 'Fatima', 'Barrie', '08712345670', 'active', CURRENT_TIMESTAMP),
  (10, 'student3@slughub.local', 'demo-hash', 'Mohamed', 'Kamara', '08812345671', 'active', CURRENT_TIMESTAMP),
  (11, 'student4@slughub.local', 'demo-hash', 'Zainab', 'Sesay', '08912345672', 'active', CURRENT_TIMESTAMP),
  (12, 'student5@slughub.local', 'demo-hash', 'David', 'Thompson', '09012345673', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (2, 6),
  (9, 6),
  (10, 6),
  (11, 6),
  (12, 6);

-- ============================================
-- STUDENT RECORDS
-- ============================================

INSERT OR IGNORE INTO students (id, user_id, matric_number, program_id, department_id, current_level, entry_session_id, graduation_status) VALUES
  (1, 2, 'CSC/001/2021', 1, 1, 200, 1, 'in_progress'),
  (2, 9, 'CSC/002/2021', 1, 1, 200, 1, 'in_progress'),
  (3, 10, 'CSC/003/2021', 1, 1, 200, 1, 'in_progress'),
  (4, 11, 'CSC/004/2022', 1, 1, 100, 1, 'in_progress'),
  (5, 12, 'CSC/005/2020', 1, 1, 300, 1, 'in_progress');

-- ============================================
-- COURSES
-- ============================================

INSERT OR IGNORE INTO courses (id, code, title, description, department_id, credit_units, level, semester, is_active) VALUES
  (1, 'CSC101', 'Introduction to Programming', 'Fundamentals of programming using Python', 1, 3, 100, 'first', 1),
  (2, 'CSC102', 'Web Development Basics', 'HTML, CSS, and JavaScript fundamentals', 1, 3, 100, 'second', 1),
  (3, 'CSC201', 'Data Structures', 'Arrays, linked lists, trees, and graphs', 1, 4, 200, 'first', 1),
  (4, 'CSC202', 'Database Systems', 'Database design, SQL, and ACID properties', 1, 4, 200, 'second', 1),
  (5, 'CSC301', 'Software Engineering', 'Design patterns, SDLC, and testing', 1, 3, 300, 'first', 1),
  (6, 'CSC302', 'Artificial Intelligence', 'Machine learning and neural networks', 1, 3, 300, 'second', 1);

-- ============================================
-- COURSE ASSIGNMENTS (Lecturer assignments)
-- ============================================

INSERT OR IGNORE INTO course_assignments (id, course_id, lecturer_id, academic_session_id, semester, status) VALUES
  (1, 1, 6, 1, 'first', 'active'),
  (2, 2, 7, 1, 'second', 'active'),
  (3, 3, 6, 1, 'first', 'active'),
  (4, 4, 8, 1, 'second', 'active'),
  (5, 5, 7, 1, 'first', 'active'),
  (6, 6, 8, 1, 'second', 'active');

-- ============================================
-- GRADING CONFIGURATION
-- ============================================

INSERT OR IGNORE INTO grading_configurations (id, department_id, academic_session_id, grade_scale, pass_mark, ca_weight, exam_weight) VALUES
  (1, 1, 1, 'standard', 40, 0.4, 0.6);

-- ============================================
-- COURSE ENROLLMENTS
-- ============================================

INSERT OR IGNORE INTO course_enrollments (id, student_id, course_id, academic_session_id, status) VALUES
  (1, 1, 1, 1, 'enrolled'),
  (2, 1, 3, 1, 'enrolled'),
  (3, 1, 5, 1, 'enrolled'),
  (4, 2, 1, 1, 'enrolled'),
  (5, 2, 2, 1, 'enrolled'),
  (6, 2, 3, 1, 'enrolled'),
  (7, 3, 1, 1, 'enrolled'),
  (8, 3, 2, 1, 'enrolled'),
  (9, 3, 3, 1, 'enrolled'),
  (10, 4, 1, 1, 'enrolled'),
  (11, 5, 2, 1, 'enrolled'),
  (12, 5, 4, 1, 'enrolled');

-- ============================================
-- RESULTS (Sample published results)
-- ============================================

INSERT OR IGNORE INTO results (id, student_id, course_id, academic_session_id, ca_score, exam_score, total_score, grade, grade_point, status, submitted_by, approved_by, submitted_at, approved_at) VALUES
  (1, 1, 1, 1, 30, 65, 95, 'A', 5.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 3, 1, 28, 58, 86, 'A', 5.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 1, 5, 1, 25, 52, 77, 'B', 4.0, 'published', 7, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 2, 1, 1, 35, 72, 107, 'A', 5.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 2, 2, 1, 32, 68, 100, 'A', 5.0, 'published', 7, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6, 2, 3, 1, 22, 45, 67, 'C', 3.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (7, 3, 1, 1, 18, 35, 53, 'D', 2.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (8, 3, 2, 1, 20, 38, 58, 'D', 2.0, 'published', 7, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9, 3, 3, 1, 15, 32, 47, 'F', 0.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (10, 4, 1, 1, 35, 70, 105, 'A', 5.0, 'published', 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (11, 5, 2, 1, 28, 55, 83, 'A', 5.0, 'published', 7, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (12, 5, 4, 1, 25, 60, 85, 'A', 5.0, 'published', 8, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- COMPLAINTS (Sample student complaints)
-- ============================================

INSERT OR IGNORE INTO complaints (id, student_id, title, description, category, status, priority, assigned_to) VALUES
  (1, 1, 'Grading Discrepancy', 'I believe my CSC101 result should be higher. The CA score calculation seems incorrect.', 'academic', 'open', 'high', 4),
  (2, 2, 'Missing Assignment Grade', 'My assignment grade for CSC302 was not recorded in the system.', 'academic', 'in_progress', 'high', 7),
  (3, 3, 'Course Registration Issue', 'I was unable to register for CSC204 due to a system error.', 'technical', 'resolved', 'medium', 5),
  (4, 1, 'Transcript Delay', 'My transcript request from last week has not been processed yet.', 'administrative', 'open', 'medium', 5),
  (5, 4, 'Late Grade Release', 'Grades for my courses were released after the stated deadline.', 'academic', 'open', 'low', 4);

-- ============================================
-- APPEALS (Sample grade appeals)
-- ============================================

INSERT OR IGNORE INTO appeals (id, student_id, result_id, title, description, appeal_type, status, priority, assigned_to, submitted_at) VALUES
  (1, 3, 9, 'Grade Appeal for CSC201', 'I believe I should have received a better grade. Please review my exam paper.', 'grade', 'submitted', 'high', 4, CURRENT_TIMESTAMP),
  (2, 2, 6, 'Grade Appeal for CSC201', 'The grading was inconsistent with the rubric provided.', 'grade', 'under_review', 'medium', 4, CURRENT_TIMESTAMP);

-- ============================================
-- RECTIFICATION RECORDS
-- ============================================

INSERT OR IGNORE INTO rectification_records (id, result_id, student_id, course_id, original_score, corrected_score, original_grade, corrected_grade, reason, requested_by, approved_by, status, submitted_at, processed_at) VALUES
  (1, 7, 3, 1, 53, 58, 'D', 'D', 'Exam paper re-marked due to appeal', 7, 5, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- CARRYOVER REQUESTS
-- ============================================

INSERT OR IGNORE INTO carryover_requests (id, student_id, course_id, academic_session_id, reason, status, requested_at, reviewed_at) VALUES
  (1, 3, 3, 1, 'Failed the course in first attempt', 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 2, 1, 'Due to medical reasons', 'pending', CURRENT_TIMESTAMP, NULL);

-- ============================================
-- TRANSCRIPT REQUESTS
-- ============================================

INSERT OR IGNORE INTO transcript_requests (id, student_id, request_type, status, requested_at, processed_at) VALUES
  (1, 1, 'official', 'completed', datetime('now', '-5 days'), datetime('now', '-3 days')),
  (2, 1, 'unofficial', 'completed', datetime('now', '-2 days'), datetime('now', '-1 days')),
  (3, 2, 'official', 'pending', CURRENT_TIMESTAMP, NULL),
  (4, 3, 'unofficial', 'completed', datetime('now', '-7 days'), datetime('now', '-6 days'));

-- ============================================
-- GRADUATION APPLICATIONS
-- ============================================

INSERT OR IGNORE INTO graduation_applications (id, student_id, academic_session_id, status, eligibility_status, remarks, submitted_at, reviewed_at) VALUES
  (1, 5, 1, 'submitted', 'eligible', 'All requirements met. Student is ready for graduation.', datetime('now', '-10 days'), datetime('now', '-5 days'));

-- ============================================
-- GRADUATION REVIEWS
-- ============================================

INSERT OR IGNORE INTO graduation_reviews (id, application_id, reviewer_id, decision, remarks, reviewed_at) VALUES
  (1, 1, 3, 'approved', 'Student has met all academic requirements for graduation.', CURRENT_TIMESTAMP);

-- ============================================
-- NOTIFICATIONS
-- ============================================

INSERT OR IGNORE INTO notifications (id, recipient_id, title, body, channel, is_read) VALUES
  (1, 2, 'Result Published', 'Your results for CSC101 have been published.', 'in_app', 0),
  (2, 2, 'Transcript Ready', 'Your requested transcript is ready for download.', 'in_app', 1),
  (3, 9, 'Grade Appeal Status', 'Your grade appeal has been reviewed. Check your account for details.', 'in_app', 0),
  (4, 4, 'New Complaint', 'A student has submitted a complaint requiring your attention.', 'in_app', 0),
  (5, 5, 'Results Pending Review', 'There are 15 results awaiting your approval.', 'in_app', 0);

-- ============================================
-- AUDIT LOGS
-- ============================================

INSERT OR IGNORE INTO audit_logs (id, actor_id, action, entity_type, entity_id, details) VALUES
  (1, 1, 'CREATE', 'USER', 2, 'Created test student account'),
  (2, 5, 'UPDATE', 'RESULT', 1, 'Approved result submission'),
  (3, 6, 'CREATE', 'RESULT', 1, 'Submitted grades for CSC101'),
  (4, 7, 'UPDATE', 'COMPLAINT', 1, 'Added resolution comment to complaint'),
  (5, 4, 'UPDATE', 'APPEAL', 1, 'Started review of grade appeal');
