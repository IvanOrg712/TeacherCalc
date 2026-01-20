from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class TeacherManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Plans(models.Model):
    name = models.CharField(unique=True, max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    amount_of_users = models.IntegerField()

    class Meta:
        managed = True
        db_table = 'plans'


class Teachers(AbstractBaseUser, PermissionsMixin):
    email = models.CharField(unique=True, max_length=255)
    password = models.CharField(max_length=255, db_column='password_hash')
    
    # Profile fields
    name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    profile_picture_url = models.TextField(blank=True, null=True)
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, blank=True, null=True)
    verification_token_expires = models.DateTimeField(blank=True, null=True)
    
    # Other fields
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    referral_code = models.CharField(unique=True, max_length=50, blank=True, null=True)
    referred_by_code = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = TeacherManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        managed = True
        db_table = 'teachers'


class Profiles(models.Model):
    teacher = models.OneToOneField(Teachers, models.DO_NOTHING, primary_key=True)
    name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=255, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)
    photo_url = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'profiles'


class Referrals(models.Model):
    referrer = models.ForeignKey(Teachers, models.DO_NOTHING)
    referee = models.OneToOneField(Teachers, models.DO_NOTHING, related_name='referrals_referee_set')
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'referrals'


class Rewards(models.Model):
    teacher = models.ForeignKey(Teachers, models.DO_NOTHING)
    referral = models.ForeignKey(Referrals, models.DO_NOTHING, blank=True, null=True)
    type = models.CharField(max_length=50)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    is_redeemed = models.BooleanField(blank=True, null=True)
    expires_at = models.DateField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'rewards'


class Subscriptions(models.Model):
    teacher = models.ForeignKey(Teachers, models.DO_NOTHING)
    plan = models.ForeignKey(Plans, models.DO_NOTHING)
    status = models.CharField(max_length=50)
    current_period_start = models.DateField(blank=True, null=True)
    current_period_end = models.DateField(blank=True, null=True)
    auto_renew = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'subscriptions'
