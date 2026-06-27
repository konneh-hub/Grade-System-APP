PRAGMA foreign_keys = ON;

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

INSERT OR IGNORE INTO faculties (id, name, code, description) VALUES
  (1, 'Faculty of Computing', 'FCOM', 'Computing and digital systems');

INSERT OR IGNORE INTO departments (id, faculty_id, name, code, description) VALUES
  (1, 1, 'Computer Science', 'CSC', 'Computer science department');

INSERT OR IGNORE INTO academic_sessions (id, name, code, start_date, end_date, is_active) VALUES
  (1, '2024/2025 Academic Session', '2024-2025', '2024-09-01', '2025-07-31', 1);

INSERT OR IGNORE INTO programs (id, department_id, name, code, duration_years) VALUES
  (1, 1, 'Computer Science', 'CSCI', 4);

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, status, registered_at) VALUES
  (1, 'admin@slughub.local', 'demo-hash', 'System', 'Admin', '08000000000', 'active', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (1, 1);
