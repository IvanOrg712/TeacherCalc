from rest_framework import viewsets, permissions
from .models import Schools, Subjects, Groups, Students, GroupStudents, Midterms, Evaluations, Activities, Grades, Attendance
from .serializers import (
    SchoolSerializer, SubjectSerializer, GroupSerializer, MidtermSerializer,
    StudentSerializer, EvaluationSerializer, ActivitySerializer, GradeSerializer,
    AttendanceSerializer
)

class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return schools belonging to the logged-in teacher
        return Schools.objects.filter(teacher=self.request.user)

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subjects.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Groups.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class MidtermViewSet(viewsets.ModelViewSet):
    queryset = Midterms.objects.all()
    serializer_class = MidtermSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Midterms.objects.all()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Students.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Students.objects.all()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(groupstudents__group_id=group_id)
        return queryset


class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluations.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Evaluations.objects.all()
        midterm_id = self.request.query_params.get('midterm')
        if midterm_id:
            queryset = queryset.filter(midterm_id=midterm_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        self._redistribute_weights(instance.midterm_id)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._redistribute_weights(instance.midterm_id)

    def perform_destroy(self, instance):
        midterm_id = instance.midterm_id
        instance.delete()
        self._redistribute_weights(midterm_id)

    def _redistribute_weights(self, midterm_id):
        """
        Redistributes remaining weight (100 - fixed) among non-fixed evaluations.
        """
        evals = Evaluations.objects.filter(midterm_id=midterm_id)
        fixed_evals = evals.filter(is_fixed=True)
        non_fixed_evals = evals.filter(is_fixed=False)
        
        # Calculate total fixed weight
        total_fixed = sum(e.weight_percentage or 0 for e in fixed_evals)
        
        # Calculate remaining weight for non-fixed evaluations
        remaining = 100 - total_fixed
        count = non_fixed_evals.count()
        
        if count > 0:
            # Distribute equally
            new_weight = max(0, remaining) / count
            non_fixed_evals.update(weight_percentage=new_weight)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activities.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Activities.objects.all()
        evaluation_id = self.request.query_params.get('evaluation')
        if evaluation_id:
            queryset = queryset.filter(evaluation_id=evaluation_id)
        return queryset


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grades.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Grades.objects.all()
        student_id = self.request.query_params.get('student')
        activity_id = self.request.query_params.get('activity')
        group_id = self.request.query_params.get('group')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        if group_id:
            # Assuming GroupStudents links Students to Groups
            # Adjust 'groupstudents' if related_name is different (default is lowercased model name + _set, but django converts CamelCase to lower)
            # InspectDB created GroupStudents.
            queryset = queryset.filter(student__groupstudents__group_id=group_id)
        return queryset


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.all()
        student_id = self.request.query_params.get('student')
        group_id = self.request.query_params.get('group')
        midterm_id = self.request.query_params.get('midterm')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if midterm_id:
            queryset = queryset.filter(midterm_id=midterm_id)
        return queryset
