"""
Test script to verify SMTP email configuration with SSL fix.
Run this from the backend directory with: python test_email_ssl_fix.py
"""
import os
import sys
import django
import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.conf import settings


def test_smtp_direct():
    """Test SMTP connection directly without Django's send_mail."""
    print("=" * 60)
    print("SMTP Email Configuration Test (Direct Connection)")
    print("=" * 60)
    
    # Display current configuration
    print(f"\nSMTP Host: {settings.EMAIL_HOST}")
    print(f"SMTP Port: {settings.EMAIL_PORT}")
    print(f"Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"Email Host User: {settings.EMAIL_HOST_USER}")
    print(f"Email Host Password: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    
    # Check if credentials are set
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("\n❌ ERROR: Email credentials not configured!")
        return False
    
    print("\n" + "=" * 60)
    print("Testing SMTP connection...")
    print("=" * 60)
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'TeacherCalc - SMTP Test Email'
        msg['From'] = settings.EMAIL_HOST_USER
        msg['To'] = settings.EMAIL_HOST_USER
        
        # Create HTML and plain text versions
        text = "This is a test email to verify SMTP configuration is working correctly."
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4F46E5;">✅ SMTP Configuration Test</h2>
                <p>This is a test email to verify your SMTP configuration is working correctly.</p>
                <p><strong>Configuration Details:</strong></p>
                <ul>
                    <li>SMTP Host: {settings.EMAIL_HOST}</li>
                    <li>SMTP Port: {settings.EMAIL_PORT}</li>
                    <li>Use TLS: {settings.EMAIL_USE_TLS}</li>
                </ul>
                <p style="color: #22c55e; font-weight: bold;">If you're reading this, your email configuration is working! 🎉</p>
            </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Create SMTP session with SSL context that doesn't verify certificates
        # This is for development only - in production, you should fix the SSL certificates
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        print("Connecting to SMTP server...")
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.set_debuglevel(0)  # Set to 1 for verbose output
            print("Starting TLS...")
            server.starttls(context=context)
            print("Logging in...")
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            print("Sending email...")
            server.send_message(msg)
        
        print(f"\n✅ SUCCESS! Test email sent to: {settings.EMAIL_HOST_USER}")
        print("Please check your inbox to confirm receipt.")
        print("\n⚠️  Note: SSL certificate verification is disabled for this test.")
        print("   This is acceptable for development but should be fixed for production.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ AUTHENTICATION ERROR: {str(e)}")
        print("\nPossible solutions:")
        print("1. If using Gmail, make sure you're using an App Password, not your regular password")
        print("2. Enable 2-factor authentication and generate an App Password at:")
        print("   https://myaccount.google.com/apppasswords")
        print("3. Verify the email and password in your .env file are correct")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send email")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        return False


def check_ssl_certificates():
    """Check SSL certificate installation on macOS."""
    print("\n" + "=" * 60)
    print("Checking SSL Certificates")
    print("=" * 60)
    
    import certifi
    print(f"\nCertifi certificates location: {certifi.where()}")
    
    # Check if running on macOS
    if sys.platform == 'darwin':
        print("\n⚠️  Running on macOS")
        print("If you encounter SSL issues, you may need to install certificates:")
        print("Run: /Applications/Python\\ 3.*/Install\\ Certificates.command")
        print("Or: pip install --upgrade certifi")


if __name__ == '__main__':
    check_ssl_certificates()
    print()
    test_smtp_direct()
