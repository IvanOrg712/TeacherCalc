# Generated migration to add id column to group_students table
# This fixes the schema for databases that had the old composite primary key

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            # Forward SQL: Add id column and make it primary key
            sql="""
                -- Check if id column doesn't exist, then add it
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='group_students' AND column_name='id'
                    ) THEN
                        -- Add serial id column
                        ALTER TABLE group_students ADD COLUMN id SERIAL;
                        
                        -- Drop old primary key constraint if exists
                        ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_pkey;
                        
                        -- Set new primary key
                        ALTER TABLE group_students ADD PRIMARY KEY (id);
                        
                        -- Add unique constraint for group_id + student_id if not exists
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'group_students_group_id_student_id_key'
                        ) THEN
                            ALTER TABLE group_students ADD CONSTRAINT group_students_group_id_student_id_key 
                                UNIQUE (group_id, student_id);
                        END IF;
                    END IF;
                END $$;
            """,
            # Reverse SQL: Remove id column (if you need to rollback)
            reverse_sql="""
                -- This is a destructive operation, be careful
                ALTER TABLE group_students DROP CONSTRAINT IF EXISTS group_students_pkey;
                ALTER TABLE group_students DROP COLUMN IF EXISTS id;
            """
        ),
    ]
