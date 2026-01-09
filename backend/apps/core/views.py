from rest_framework import viewsets
from .models import Schools
from .serializers import SchoolSerializer

class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schools.objects.all()
    serializer_class = SchoolSerializer
