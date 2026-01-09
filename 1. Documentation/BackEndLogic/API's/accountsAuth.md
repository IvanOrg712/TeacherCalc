## 1. Authentication & Accounts

This API uses JSON format for all requests and responses. HTTP status codes are used to indicate success (200, 201) or validation errors (400, 422).

**Create Account**

- Endpoint: `POST /api/auth/register`
- Description: Creates a new teacher account.

Request Body:
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

Response (201 Created):
```json
{
  "teacher_id": 1,
  "email": "teacher@example.com",
  "name": "Esteban"
}
```

**Update Account**

- Endpoint: `PUT /api/auth/update`
- Description: Updates account information.

Request Body:
```json
{
  "email": "teacher@example.com",
  "name": "Esteban"
}
```

Response (200 OK):
```json
{
  "teacher_id": 1,
  "email": "teacher@example.com",
  "name": "Esteban"
}
```

**Delete Account**

- Endpoint: `DELETE /api/auth/delete`
- Description: Deletes the user's account.

Request Body:
```json
{
  "email": "teacher@example.com"
}
```

Response (200 OK):
```json
{
  "teacher_id": 1,
  "message": "Account deleted successfully"
}
```

**Change Password**

- Endpoint: `PUT /api/auth/change-password`
- Description: Changes the account password.

Request Body:
```json
{
  "email": "teacher@example.com",
  "previousPassword": "password123",
  "newPassword": "password456"
}
```

Response (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Login**
Validates teacher credentials to allow access to the main dashboard.
- Endpoint: `POST /api/auth/login`
- Description: Authenticates the user via email and password.

Request Body:
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "teacher_id": 1,
  "name": "Esteban"
}
```