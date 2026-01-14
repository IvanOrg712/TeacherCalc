from rest_framework import serializers
from .models import Schools, Subjects, Groups, Students, GroupStudents, Midterms, Evaluations, Activities, Grades, Attendance


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    group = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Students
        fields = ['id', 'name', 'group']
    
    def create(self, validated_data):
        group_id = validated_data.pop('group', None)
        student = Students.objects.create(**validated_data)
        
        # Create GroupStudents link if group provided
        if group_id:
            from .models import GroupStudents, Groups
            group = Groups.objects.get(id=group_id)
            GroupStudents.objects.create(
                group=group,
                student=student,
                display_order=0
            )
        
        return student


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activities
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True, source='activities_set')

    class Meta:
        model = Evaluations
        fields = '__all__'


class MidtermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Midterms
        fields = '__all__'


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grades
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()

    class Meta:
        model = Subjects
        fields = ['id', 'name', 'absences_allowed', 'school', 'groups']
    
    def get_groups(self, obj):
        # When reading, return the groups using GroupSerializer
        groups = Groups.objects.filter(subject=obj)
        return GroupSerializer(groups, many=True).data
    
    def create(self, validated_data):
        # groups will be in initial_data, not validated_data since it's a SerializerMethodField
        groups_data = self.initial_data.get('groups', [])
        subject = Subjects.objects.create(**validated_data)
        
        # Get the school's midterm count
        school = subject.school
        midterm_count = school.midterm_count
        
        for group_data in groups_data:
            group = Groups.objects.create(subject=subject, **group_data)
            
            # Create midterms for this group
            from .models import Midterms
            for i in range(1, midterm_count + 1):
                Midterms.objects.create(
                    group=group,
                    name=f'Parcial {i}'
                )
        
        return subject
    
    def update(self, instance, validated_data):
        # Update subject fields
        instance.name = validated_data.get('name', instance.name)
        instance.absences_allowed = validated_data.get('absences_allowed', instance.absences_allowed)
        instance.school = validated_data.get('school', instance.school)
        instance.save()
        
        # Handle groups update - delete old groups and create new ones
        groups_data = self.initial_data.get('groups', [])
        if groups_data:
            # Delete existing groups
            Groups.objects.filter(subject=instance).delete()
            # Create new groups
            for group_data in groups_data:
                Groups.objects.create(subject=instance, **group_data)
        
        return instance


class SchoolSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True, source='subjects_set')

    class Meta:
        model = Schools
        fields = '__all__'
        read_only_fields = ['teacher']

    def create(self, validated_data):
        # Automatically assign the teacher from the request context
        user = self.context['request'].user
        validated_data['teacher'] = user
        return super().create(validated_data)
