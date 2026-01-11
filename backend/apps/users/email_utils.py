"""
Email utility functions for sending verification and welcome emails.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_verification_email(user, verification_token):
    """
    Send email verification link to user.
    """
    subject = 'Verify your TeacherCalc account'
    
    # Create verification URL
    verification_url = f"http://localhost:5173/verify-email?token={verification_token}"
    
    # HTML email content
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Welcome to TeacherCalc!</h2>
                <p>Hi{' ' + user.name if user.name else ''},</p>
                <p>Thank you for signing up for TeacherCalc. To complete your registration, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">{verification_url}</p>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    This link will expire in 24 hours. If you didn't create an account with TeacherCalc, you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    TeacherCalc - Simplifying grade management for teachers
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    """
    Send welcome email after successful email verification.
    """
    subject = 'Welcome to TeacherCalc! 🎉'
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Your account is ready!</h2>
                <p>Hi {user.name if user.name else 'there'},</p>
                <p>Your email has been successfully verified. You're all set to start using TeacherCalc!</p>
                
                <h3 style="color: #4F46E5; margin-top: 30px;">Getting Started</h3>
                <ul style="line-height: 2;">
                    <li><strong>Create your first school</strong> - Set up your school with passing grades and midterm count</li>
                    <li><strong>Add subjects</strong> - Organize your classes by subject</li>
                    <li><strong>Create groups</strong> - Set up your class sections</li>
                    <li><strong>Add students</strong> - Import or manually add your students</li>
                    <li><strong>Track attendance</strong> - Mark attendance for each class</li>
                    <li><strong>Manage grades</strong> - Create evaluations and track student performance</li>
                </ul>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="http://localhost:5173/dashboard" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions or need help, feel free to reach out to our support team.</p>
                
                <p>Happy teaching! 📚</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    TeacherCalc - Simplifying grade management for teachers
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
