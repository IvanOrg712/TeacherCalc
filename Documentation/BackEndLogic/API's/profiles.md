# Profile Management API

## 7. Personal Information

**Get Profile**
- Endpoint: `GET /api/profile`
- Description: Retrieves the authenticated teacher's personal profile details.

Request Body:
```json
{
  "teacher_id": 1
}
```

Response (200 OK):
```json
{
  "name": "Esteban Dido",
  "email": "teacher@example.com",
  "phone_number": "+1234567890",
  "birthdate": "1985-05-15",
  "photo_url": "https://example.com/uploads/avatars/1.jpg",
  "created_at": "2024-01-01"
}
```

**Update Profile**
- Endpoint: `PUT /api/profile`
- Description: Updates personal information.

Request Body:
```json
{
  "name": "Esteban Dido Pro",
  "phone_number": "+1987654321",
  "birthdate": "1985-05-15"
}
```

Response (200 OK):
```json
{
  "message": "Profile updated successfully"
}
```

**Upload Avatar**
- Endpoint: `POST /api/profile/avatar`
- Description: Uploads a new profile picture. Expects `multipart/form-data`.

Request Body (Multipart):
- `file`: (Binary image data)

Response (200 OK):
```json
{
  "photo_url": "https://example.com/uploads/avatars/1_new.jpg"
}
```