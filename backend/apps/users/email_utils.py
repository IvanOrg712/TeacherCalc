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
    subject = 'Verifica tu cuenta de TeacherCalc'
    
    # Create verification URL
    verification_url = f"http://localhost:5173/verify-email?token={verification_token}"
    
    # HTML email content
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">¡Bienvenido a TeacherCalc!</h2>
                <p>Hola{' ' + user.name if user.name else ''},</p>
                <p>Gracias por registrarte en TeacherCalc. Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verificar Correo Electrónico
                    </a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="color: #666; word-break: break-all;">{verification_url}</p>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Este enlace expirará en 24 horas. Si no creaste una cuenta en TeacherCalc, puedes ignorar este correo de forma segura.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    TeacherCalc - Simplificando la gestión de calificaciones para maestros
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
    subject = '¡Bienvenido a TeacherCalc! 🎉'
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">¡Tu cuenta está lista!</h2>
                <p>Hola {user.name if user.name else 'ahí'},</p>
                <p>Tu correo electrónico ha sido verificado exitosamente. ¡Estás listo para comenzar a usar TeacherCalc!</p>
                
                <h3 style="color: #4F46E5; margin-top: 30px;">Primeros Pasos</h3>
                <ul style="line-height: 2;">
                    <li><strong>Crea tu primera escuela</strong> - Configura tu escuela con calificaciones aprobatorias y número de parciales</li>
                    <li><strong>Agrega materias</strong> - Organiza tus clases por materia</li>
                    <li><strong>Crea grupos</strong> - Configura las secciones de tus clases</li>
                    <li><strong>Agrega estudiantes</strong> - Importa o agrega manualmente a tus estudiantes</li>
                    <li><strong>Registra asistencia</strong> - Marca la asistencia para cada clase</li>
                    <li><strong>Gestiona calificaciones</strong> - Crea evaluaciones y da seguimiento al desempeño de los estudiantes</li>
                </ul>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="http://localhost:5173/dashboard" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Ir al Panel de Control
                    </a>
                </div>
                
                <p style="margin-top: 30px;">Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.</p>
                
                <p>¡Feliz enseñanza! 📚</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    TeacherCalc - Simplificando la gestión de calificaciones para maestros
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
