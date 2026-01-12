"""
Custom email backend that handles SSL certificate verification issues on macOS.
This is for development only - in production, SSL certificates should be properly configured.
"""
import ssl
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend


class SSLEmailBackend(DjangoEmailBackend):
    """
    Custom email backend that disables SSL certificate verification.
    Use only in development environments.
    """
    
    def open(self):
        """
        Override the open method to use a custom SSL context that doesn't verify certificates.
        """
        if self.connection:
            return False
            
        connection_params = {}
        if self.timeout is not None:
            connection_params['timeout'] = self.timeout
        if self.use_ssl:
            connection_params['context'] = self._create_ssl_context()
            
        try:
            self.connection = self.connection_class(
                self.host, self.port, **connection_params
            )
            
            if not self.use_ssl and self.use_tls:
                # Create SSL context that doesn't verify certificates
                context = self._create_ssl_context()
                self.connection.starttls(context=context)
                
            if self.username and self.password:
                self.connection.login(self.username, self.password)
                
            return True
        except Exception:
            if not self.fail_silently:
                raise
                
    def _create_ssl_context(self):
        """
        Create an SSL context that doesn't verify certificates.
        This is needed for development on macOS where SSL certificates may not be properly installed.
        """
        context = ssl.create_default_context()
        # Disable certificate verification (development only!)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context
