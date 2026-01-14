from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, SubjectViewSet, GroupViewSet, MidtermViewSet,
    StudentViewSet, EvaluationViewSet, ActivityViewSet, GradeViewSet,
    AttendanceViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='schools')
router.register(r'subjects', SubjectViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'midterms', MidtermViewSet)
router.register(r'students', StudentViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'attendance', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
