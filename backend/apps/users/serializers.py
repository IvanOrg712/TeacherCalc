from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if email is verified
        if not self.user.email_verified:
            raise AuthenticationFailed(
                'Tu correo electrónico no ha sido verificado. Por favor revisa tu correo y verifica tu cuenta antes de iniciar sesión.'
            )
        
        # Add custom user data to the response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': self.user.name,
            'last_name': self.user.last_name,
            'email_verified': self.user.email_verified,
        }
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
