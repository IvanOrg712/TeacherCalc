"""
Final test to verify email functionality with the custom backend.
Run this from the backend directory with: python test_email_final.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from apps.users.models import Teachers


def test_verification_email():
    """Test the actual verification email function."""
    print("=" * 60)
    print("Testing Email Verification Function")
    print("=" * 60)
    
    # Check if there are any users in the database
    users = Teachers.objects.all()
    
    if not users.exists():
        print("\n⚠️  No users found in database.")
        print("Creating a test user...")
        
        # Create a test user
        test_user = Teachers.objects.create_user(
            email='test@example.com',
            password='testpass123',
            name='Test',
            last_name='User'
        )
        print(f"✅ Created test user: {test_user.email}")
    else:
        test_user = users.first()
        print(f"\n📧 Using existing user: {test_user.email}")
    
    print(f"User name: {test_user.name} {test_user.last_name}")
    
    # Test sending verification email
    print("\n" + "=" * 60)
    print("Sending verification email...")
    print("=" * 60)
    
    try:
        from apps.users.email_utils import send_verification_email
        import secrets
        
        verification_token = secrets.token_urlsafe(32)
        send_verification_email(test_user, verification_token)
        
        print(f"\n✅ SUCCESS! Verification email sent to: {test_user.email}")
        print(f"Verification token: {verification_token}")
        print(f"Verification URL: http://localhost:5173/verify-email?token={verification_token}")
        
        # If we sent to test@example.com, send to the actual configured email too
        if test_user.email == 'test@example.com':
            print(f"\n📧 Also sending to configured email: {settings.EMAIL_HOST_USER}")
            real_user = Teachers.objects.create_user(
                email=settings.EMAIL_HOST_USER,
                password='testpass123',
                name='Real',
                last_name='User'
            )
            send_verification_email(real_user, verification_token)
            print(f"✅ Email sent to: {settings.EMAIL_HOST_USER}")
            # Clean up
            real_user.delete()
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send verification email")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_welcome_email():
    """Test the welcome email function."""
    print("\n" + "=" * 60)
    print("Testing Welcome Email Function")
    print("=" * 60)
    
    try:
        from apps.users.email_utils import send_welcome_email
        
        # Get or create a test user
        test_user, created = Teachers.objects.get_or_create(
            email=settings.EMAIL_HOST_USER,
            defaults={
                'name': 'Test',
                'last_name': 'User',
                'password': 'testpass123'
            }
        )
        
        send_welcome_email(test_user)
        
        print(f"\n✅ SUCCESS! Welcome email sent to: {test_user.email}")
        
        if created:
            test_user.delete()
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send welcome email")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_basic_email():
    """Test basic email sending."""
    print("\n" + "=" * 60)
    print("Testing Basic Email Sending")
    print("=" * 60)
    
    try:
        send_mail(
            subject='TeacherCalc - Email Test',
            message='This is a basic test email.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        
        print(f"\n✅ SUCCESS! Basic email sent to: {settings.EMAIL_HOST_USER}")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send basic email")
        print(f"Error details: {str(e)}")
        return False


if __name__ == '__main__':
    print("\n🔧 Email Configuration:")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"User: {settings.EMAIL_HOST_USER}\n")
    
    # Run tests
    results = []
    results.append(("Basic Email", test_basic_email()))
    results.append(("Verification Email", test_verification_email()))
    results.append(("Welcome Email", test_welcome_email()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    if all_passed:
        print("\n🎉 All email tests passed!")
        print(f"📧 Check your inbox at: {settings.EMAIL_HOST_USER}")
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
