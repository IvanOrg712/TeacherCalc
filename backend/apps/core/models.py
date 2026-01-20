from django.db import models

class Schools(models.Model):
    teacher = models.ForeignKey('users.Teachers', models.DO_NOTHING)
    name = models.CharField(max_length=255)
    passing_grade = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    midterm_count = models.IntegerField()

    class Meta:
        managed = True
        db_table = 'schools'


class Subjects(models.Model):
    school = models.ForeignKey(Schools, models.DO_NOTHING)
    name = models.CharField(max_length=255)
    absences_allowed = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'subjects'


class Groups(models.Model):
    subject = models.ForeignKey(Subjects, models.DO_NOTHING)
    name = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'groups'


class Students(models.Model):
    name = models.CharField(max_length=255)
    student_number = models.CharField(max_length=50, blank=True, null=True)  # Optional student ID/number

    class Meta:
        managed = True
        db_table = 'students'


class GroupStudents(models.Model):
    group = models.ForeignKey(Groups, models.CASCADE)
    student = models.ForeignKey(Students, models.CASCADE)
    display_order = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'group_students'
        unique_together = (('group', 'student'),)


class Midterms(models.Model):
    group = models.ForeignKey(Groups, models.DO_NOTHING)
    name = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'midterms'


class Evaluations(models.Model):
    midterm = models.ForeignKey(Midterms, models.DO_NOTHING)
    name = models.CharField(max_length=255)
    is_fixed = models.BooleanField(blank=True, null=True)
    weight_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'evaluations'


class Activities(models.Model):
    evaluation = models.ForeignKey(Evaluations, models.DO_NOTHING)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_fixed = models.BooleanField(blank=True, null=True)
    weight_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    max_score = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_extra_points = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'activities'


class Attendance(models.Model):
    student = models.ForeignKey(Students, models.DO_NOTHING)
    group = models.ForeignKey(Groups, models.DO_NOTHING)
    midterm = models.ForeignKey(Midterms, models.DO_NOTHING)
    date = models.DateTimeField()  # Changed to DateTimeField to allow multiple records per day
    status = models.SmallIntegerField(null=True, blank=True)  # Allow NULL for empty cells

    class Meta:
        managed = True
        db_table = 'attendance'
        unique_together = (('student', 'group', 'midterm', 'date'),)


class Grades(models.Model):
    student = models.ForeignKey(Students, models.DO_NOTHING)
    activity = models.ForeignKey(Activities, models.DO_NOTHING)
    score = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = True
        db_table = 'grades'
        unique_together = (('student', 'activity'),)
