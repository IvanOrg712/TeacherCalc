from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import secrets
import re

from .models import Teachers
from .email_utils import send_verification_email, send_welcome_email


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user account.
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    name = request.data.get('name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    
    # Validation
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Email format validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Password strength validation
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return Response({'error': 'Password must contain both letters and numbers'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if Teachers.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        token_expires = timezone.now() + timedelta(hours=24)
        
        # Create user
        user = Teachers.objects.create_user(
            email=email,
            password=password,
            name=name,
            last_name=last_name,
            email_verified=False,
            verification_token=verification_token,
            verification_token_expires=token_expires,
            created_at=timezone.now()
        )
        
        # Send verification email
        try:
            send_verification_email(user, verification_token)
        except Exception as e:
            # Log the error but don't fail registration
            print(f"Failed to send verification email: {e}")
        
        return Response({
            'message': 'Registration successful! Please check your email to verify your account.',
            'email': email
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email with token.
    """
    token = request.GET.get('token', '')
    
    if not token:
        return Response({'error': 'Verification token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find user with this token
        user = Teachers.objects.filter(verification_token=token).first()
        
        if not user:
            return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already verified
        if user.email_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
        
        # Check if token expired
        if user.verification_token_expires and user.verification_token_expires < timezone.now():
            return Response({'error': 'Verification token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify email
        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        user.save()
        
        # Send welcome email
        try:
            send_welcome_email(user)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        
        return Response({
            'message': 'Email verified successfully! You can now log in.',
            'email': user.email
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Verification failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """
    Resend verification email.
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Teachers.objects.filter(email=email).first()
        
        if not user:
            # Don't reveal if email exists or not for security
            return Response({'message': 'If an account exists with this email, a verification email has been sent.'}, status=status.HTTP_200_OK)
        
        if user.email_verified:
            return Response({'error': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new token
        verification_token = secrets.token_urlsafe(32)
        token_expires = timezone.now() + timedelta(hours=24)
        
        user.verification_token = verification_token
        user.verification_token_expires = token_expires
        user.save()
        
        # Send verification email
        send_verification_email(user, verification_token)
        
        return Response({'message': 'Verification email sent successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Failed to resend verification email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
