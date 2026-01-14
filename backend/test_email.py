"""
Test script to verify SMTP email configuration.
Run this from the backend directory with: python test_email.py
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


def test_smtp_connection():
    """Test SMTP connection and send a test email."""
    print("=" * 60)
    print("SMTP Email Configuration Test")
    print("=" * 60)
    
    # Display current configuration
    print(f"\nEmail Backend: {settings.EMAIL_BACKEND}")
    print(f"SMTP Host: {settings.EMAIL_HOST}")
    print(f"SMTP Port: {settings.EMAIL_PORT}")
    print(f"Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"Email Host User: {settings.EMAIL_HOST_USER}")
    print(f"Email Host Password: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    # Check if credentials are set
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("\n❌ ERROR: Email credentials not configured!")
        print("Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env file")
        return False
    
    print("\n" + "=" * 60)
    print("Sending test email...")
    print("=" * 60)
    
    try:
        # Send test email
        send_mail(
            subject='TeacherCalc - SMTP Test Email',
            message='This is a test email to verify SMTP configuration is working correctly.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self for testing
            html_message="""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4F46E5;">✅ SMTP Configuration Test</h2>
                    <p>This is a test email to verify your SMTP configuration is working correctly.</p>
                    <p><strong>Configuration Details:</strong></p>
                    <ul>
                        <li>SMTP Host: {}</li>
                        <li>SMTP Port: {}</li>
                        <li>Use TLS: {}</li>
                    </ul>
                    <p style="color: #22c55e; font-weight: bold;">If you're reading this, your email configuration is working! 🎉</p>
                </body>
            </html>
            """.format(settings.EMAIL_HOST, settings.EMAIL_PORT, settings.EMAIL_USE_TLS),
            fail_silently=False,
        )
        
        print(f"\n✅ SUCCESS! Test email sent to: {settings.EMAIL_HOST_USER}")
        print("Please check your inbox to confirm receipt.")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send email")
        print(f"Error details: {str(e)}")
        print("\nCommon issues:")
        print("1. Gmail App Password not configured (if using Gmail)")
        print("2. 'Less secure app access' disabled (for older Gmail accounts)")
        print("3. Incorrect SMTP credentials")
        print("4. Firewall blocking SMTP port 587")
        return False


if __name__ == '__main__':
    test_smtp_connection()
