-- =============================================
-- MÓDULO 1: USUARIOS PRINCIPALES, PERFILES Y AUTH
-- =============================================

-- Tabla principal de profesores
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255), -- [ENCRYPTED] ID para pasarela de pagos
    referral_code VARCHAR(50) UNIQUE,
    referred_by_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Política: Un profesor solo ve su propio registro
CREATE POLICY teacher_isolation ON teachers
    USING (id = current_setting('app.current_teacher_id')::INTEGER);

-- Tabla de perfil extendido
CREATE TABLE profiles (
    teacher_id INTEGER PRIMARY KEY REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone_number VARCHAR(255), -- [ENCRYPTED]
    birthdate DATE,
    photo_url TEXT
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_isolation ON profiles
    USING (teacher_id = current_setting('app.current_teacher_id')::INTEGER);


-- =============================================
-- MÓDULO 2: SAAS Y MEMBRESÍAS
-- =============================================

CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    amount_of_users INTEGER NOT NULL CHECK (amount_of_users > 0)
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer planes (Catálogo público)
CREATE POLICY plans_read_public ON plans FOR SELECT USING (true);


CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trial')),
    current_period_start DATE,
    current_period_end DATE,
    auto_renew BOOLEAN DEFAULT TRUE
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_isolation ON subscriptions
    USING (teacher_id = current_setting('app.current_teacher_id')::INTEGER);


-- =============================================
-- MÓDULO 3: MARKETING Y REFERIDOS
-- =============================================

CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL UNIQUE REFERENCES teachers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'qualified', 'fraud', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_self_referral CHECK (referrer_id != referee_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_isolation ON referrals
    USING (referrer_id = current_setting('app.current_teacher_id')::INTEGER);

CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    referral_id INTEGER REFERENCES referrals(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'percentage', 'free_month')),
    value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
    is_redeemed BOOLEAN DEFAULT FALSE,
    expires_at DATE
);
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY reward_isolation ON rewards
    USING (teacher_id = current_setting('app.current_teacher_id')::INTEGER);


-- =============================================
-- MÓDULO 4: ESTRUCTURA ACADÉMICA
-- =============================================

CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    passing_grade NUMERIC(5, 2) CHECK (passing_grade BETWEEN 0 AND 100),
    midterm_count INTEGER NOT NULL CHECK (midterm_count > 0)
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY school_isolation ON schools
    USING (teacher_id = current_setting('app.current_teacher_id')::INTEGER);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    absences_allowed INTEGER DEFAULT 0 CHECK (absences_allowed >= 0)
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Join Policy: Acceso si la escuela padre pertenece al profesor
CREATE POLICY subject_isolation ON subjects
    USING (school_id IN (SELECT id FROM schools WHERE teacher_id = current_setting('app.current_teacher_id')::INTEGER));

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_isolation ON groups
    USING (subject_id IN (
        SELECT s.id FROM subjects s
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

-- TABLA DE ESTUDIANTES (Pool Global vs Privado)
-- Nota: Para mejor aislamiento, se recomienda añadir teacher_id o school_id si no son recursos compartidos.
-- Aquí asumimos que los estudiantes se acceden SOLO a través de sus grupos:
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE TABLE group_students (
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, student_id)
);
ALTER TABLE group_students ENABLE ROW LEVEL SECURITY;

-- Política compleja para Students y Relaciones
-- Un profesor puede ver un estudiante SI este pertenece a uno de sus grupos.
CREATE POLICY student_isolation ON students
    USING (id IN (
        SELECT gs.student_id 
        FROM group_students gs
        JOIN groups g ON gs.group_id = g.id
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

CREATE POLICY group_student_isolation ON group_students
    USING (group_id IN (
        SELECT g.id 
        FROM groups g
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));


-- =============================================
-- MÓDULO 5: EVALUACIÓN Y ASISTENCIA
-- =============================================

CREATE TABLE midterms (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);
ALTER TABLE midterms ENABLE ROW LEVEL SECURITY;

CREATE POLICY midterm_isolation ON midterms
    USING (group_id IN (
        SELECT g.id FROM groups g
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    midterm_id INTEGER NOT NULL REFERENCES midterms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE,
    weight_percentage NUMERIC(5, 2) CHECK (weight_percentage BETWEEN 0 AND 100)
);
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluation_isolation ON evaluations
    USING (midterm_id IN (
        SELECT m.id FROM midterms m
        JOIN groups g ON m.group_id = g.id
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_fixed BOOLEAN DEFAULT FALSE,
    weight_percentage NUMERIC(5, 2) CHECK (weight_percentage BETWEEN 0 AND 100),
    max_score NUMERIC(10, 2) DEFAULT 10 CHECK (max_score > 0),
    is_extra_points BOOLEAN DEFAULT FALSE
);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_isolation ON activities
    USING (evaluation_id IN (
        SELECT e.id FROM evaluations e
        JOIN midterms m ON e.midterm_id = m.id
        JOIN groups g ON m.group_id = g.id
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    score NUMERIC(10, 2) NOT NULL CHECK (score >= 0),
    UNIQUE(student_id, activity_id)
);
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Grades checked via Activity ownership (easier path than student)
CREATE POLICY grades_isolation ON grades
    USING (activity_id IN (
        SELECT a.id FROM activities a
        JOIN evaluations e ON a.evaluation_id = e.id
        JOIN midterms m ON e.midterm_id = m.id
        JOIN groups g ON m.group_id = g.id
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    midterm_id INTEGER NOT NULL REFERENCES midterms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status SMALLINT CHECK (status IN (0, 1)),
    UNIQUE(student_id, group_id, midterm_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Attendance checked via Group ownership
CREATE POLICY attendance_isolation ON attendance
    USING (group_id IN (
        SELECT g.id FROM groups g
        JOIN subjects s ON g.subject_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.teacher_id = current_setting('app.current_teacher_id')::INTEGER
    ));