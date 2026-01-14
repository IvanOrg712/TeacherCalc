# Generated manually to add CASCADE delete constraints
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            # Forward SQL - Add CASCADE constraints
            sql="""
            -- Drop existing foreign key constraints and recreate with CASCADE
            
            -- Subjects table
            ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_school_id_fkey;
            ALTER TABLE subjects ADD CONSTRAINT subjects_school_id_fkey 
                FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
            
            -- Groups table
            ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_subject_id_fkey;
            ALTER TABLE groups ADD CONSTRAINT groups_subject_id_fkey 
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
            
            -- GroupStudents table
            ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_group_id_fkey;
            ALTER TABLE group_students ADD CONSTRAINT group_students_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
            
            ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_student_id_fkey;
            ALTER TABLE group_students ADD CONSTRAINT group_students_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
            
            -- Midterms table
            ALTER TABLE midterms DROP CONSTRAINT IF EXISTS midterms_group_id_fkey;
            ALTER TABLE midterms ADD CONSTRAINT midterms_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
            
            -- Evaluations table
            ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_midterm_id_fkey;
            ALTER TABLE evaluations ADD CONSTRAINT evaluations_midterm_id_fkey 
                FOREIGN KEY (midterm_id) REFERENCES midterms(id) ON DELETE CASCADE;
            
            -- Activities table
            ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_evaluation_id_fkey;
            ALTER TABLE activities ADD CONSTRAINT activities_evaluation_id_fkey 
                FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE;
            
            -- Attendance table
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
            
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_group_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
            
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_midterm_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_midterm_id_fkey 
                FOREIGN KEY (midterm_id) REFERENCES midterms(id) ON DELETE CASCADE;
            
            -- Grades table
            ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_student_id_fkey;
            ALTER TABLE grades ADD CONSTRAINT grades_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
            
            ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_activity_id_fkey;
            ALTER TABLE grades ADD CONSTRAINT grades_activity_id_fkey 
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
            """,
            
            # Reverse SQL - Revert to DO NOTHING (optional, for rollback)
            reverse_sql="""
            -- Revert to DO NOTHING constraints
            
            ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_school_id_fkey;
            ALTER TABLE subjects ADD CONSTRAINT subjects_school_id_fkey 
                FOREIGN KEY (school_id) REFERENCES schools(id);
            
            ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_subject_id_fkey;
            ALTER TABLE groups ADD CONSTRAINT groups_subject_id_fkey 
                FOREIGN KEY (subject_id) REFERENCES subjects(id);
            
            ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_group_id_fkey;
            ALTER TABLE group_students ADD CONSTRAINT group_students_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id);
            
            ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_student_id_fkey;
            ALTER TABLE group_students ADD CONSTRAINT group_students_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id);
            
            ALTER TABLE midterms DROP CONSTRAINT IF EXISTS midterms_group_id_fkey;
            ALTER TABLE midterms ADD CONSTRAINT midterms_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id);
            
            ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_midterm_id_fkey;
            ALTER TABLE evaluations ADD CONSTRAINT evaluations_midterm_id_fkey 
                FOREIGN KEY (midterm_id) REFERENCES midterms(id);
            
            ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_evaluation_id_fkey;
            ALTER TABLE activities ADD CONSTRAINT activities_evaluation_id_fkey 
                FOREIGN KEY (evaluation_id) REFERENCES evaluations(id);
            
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id);
            
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_group_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_group_id_fkey 
                FOREIGN KEY (group_id) REFERENCES groups(id);
            
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_midterm_id_fkey;
            ALTER TABLE attendance ADD CONSTRAINT attendance_midterm_id_fkey 
                FOREIGN KEY (midterm_id) REFERENCES midterms(id);
            
            ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_student_id_fkey;
            ALTER TABLE grades ADD CONSTRAINT grades_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES students(id);
            
            ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_activity_id_fkey;
            ALTER TABLE grades ADD CONSTRAINT grades_activity_id_fkey 
                FOREIGN KEY (activity_id) REFERENCES activities(id);
            """
        ),
    ]
