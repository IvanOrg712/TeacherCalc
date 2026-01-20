from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        """
        Duplicate a group's structure (midterms, evaluations, activities) to a new group.
        
        Request body:
        - target_subject: ID of the subject to create the new group in
        - new_name: Name for the new group
        
        Does NOT copy students, only the evaluation structure.
        """
        source_group = self.get_object()
        
        target_subject_id = request.data.get('target_subject')
        new_name = request.data.get('new_name')
        
        if not target_subject_id:
            return Response(
                {'error': 'target_subject is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_name:
            return Response(
                {'error': 'new_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_subject = Subjects.objects.get(id=target_subject_id)
        except Subjects.DoesNotExist:
            return Response(
                {'error': 'Target subject not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create the new group
        new_group = Groups.objects.create(
            subject=target_subject,
            name=new_name
        )
        
        # Copy midterms
        midterm_mapping = {}  # old_id -> new_id
        for midterm in Midterms.objects.filter(group=source_group):
            new_midterm = Midterms.objects.create(
                group=new_group,
                name=midterm.name
            )
            midterm_mapping[midterm.id] = new_midterm.id
        
        # Copy evaluations
        evaluation_mapping = {}  # old_id -> new_id
        for midterm in Midterms.objects.filter(group=source_group):
            for evaluation in Evaluations.objects.filter(midterm=midterm):
                new_midterm_id = midterm_mapping[midterm.id]
                new_midterm = Midterms.objects.get(id=new_midterm_id)
                
                new_evaluation = Evaluations.objects.create(
                    midterm=new_midterm,
                    name=evaluation.name,
                    is_fixed=evaluation.is_fixed,
                    weight_percentage=evaluation.weight_percentage
                )
                evaluation_mapping[evaluation.id] = new_evaluation.id
        
        # Copy activities
        activities_created = 0
        for old_eval_id, new_eval_id in evaluation_mapping.items():
            for activity in Activities.objects.filter(evaluation_id=old_eval_id):
                new_evaluation = Evaluations.objects.get(id=new_eval_id)
                
                Activities.objects.create(
                    evaluation=new_evaluation,
                    name=activity.name,
                    description=activity.description,
                    is_fixed=activity.is_fixed,
                    weight_percentage=activity.weight_percentage,
                    max_score=activity.max_score,
                    is_extra_points=activity.is_extra_points
                )
                activities_created += 1
        
        return Response({
            'success': True,
            'new_group_id': new_group.id,
            'new_group_name': new_group.name,
            'midterms_copied': len(midterm_mapping),
            'evaluations_copied': len(evaluation_mapping),
            'activities_copied': activities_created
        }, status=status.HTTP_201_CREATED)


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

    @action(detail=False, methods=['post'], url_path='import-csv')
    def import_csv(self, request):
        """
        Import students from a CSV file.
        Expected CSV format:
        - First row: Header with columns 'name' (required) and 'student_number' (optional)
        - Subsequent rows: Student data
        
        Query params:
        - group: ID of the group to add students to (required)
        """
        import csv
        import io
        
        group_id = request.query_params.get('group')
        if not group_id:
            return Response(
                {'error': 'group parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            group = Groups.objects.get(id=group_id)
        except Groups.DoesNotExist:
            return Response(
                {'error': 'Group not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read and decode CSV
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            # Validate headers
            headers = [h.lower().strip() for h in reader.fieldnames or []]
            if 'name' not in headers and 'nombre' not in headers:
                return Response(
                    {'error': 'CSV must have a "name" or "nombre" column'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created_students = []
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 since row 1 is header
                # Normalize keys to lowercase
                row_lower = {k.lower().strip(): v.strip() for k, v in row.items() if v}
                
                name = row_lower.get('name') or row_lower.get('nombre')
                student_number = row_lower.get('student_number') or row_lower.get('numero') or row_lower.get('matricula')
                
                if not name:
                    errors.append(f'Row {row_num}: name is required')
                    continue
                
                # Create student
                student = Students.objects.create(
                    name=name,
                    student_number=student_number
                )
                
                # Link to group
                GroupStudents.objects.create(
                    group=group,
                    student=student,
                    display_order=row_num
                )
                
                created_students.append({
                    'id': student.id,
                    'name': student.name,
                    'student_number': student.student_number
                })
            
            return Response({
                'created': len(created_students),
                'students': created_students,
                'errors': errors
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error parsing CSV: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


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
