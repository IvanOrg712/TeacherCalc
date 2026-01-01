# REST API Documentation

## 2. School Configuration (Universities)

**Create School**
Configures global evaluation parameters.
- Endpoint: `POST /api/schools`
- Business Rule: Defines `passing_grade` (minimum passing score) and `midterm_count` (number of partials) that govern the database structure for this school.

Request Body:
```json
{
  "teacher_id": 1,
  "name": "Technological University",
  "passing_grade": 7.0,   // Passing score
  "midterm_count": 3      // Number of partials
}
```

Response (201 Created):
```json
{
  "school_id": 1,
  "name": "Technological University",
  "passing_grade": 7.0,
  "midterm_count": 3
}
```

**Delete School**
- Endpoint: `DELETE /api/schools/{school_id}`
- Description: Deletes the school and all its dependencies (subjects, groups, midterms, grades).

Request Body:
```json
{
  "name": "Technological University"
}
```

Response (200 OK):
```json
{
  "message": "School deleted successfully"
}
```

**Edit School**
- Endpoint: `PUT /api/schools/{school_id}`
- Description: Updates the school's information.

Request Body:
```json
{
  "name": "Technological University",
  "passing_grade": 7.0,
  "midterm_count": 3
}
```

Response (200 OK):
```json
{
  "school_id": 1,
  "name": "Technological University",
  "passing_grade": 7.0,
  "midterm_count": 3
}
```

**Get School**
- Endpoint: `GET /api/schools/{school_id}`
- Description: Retrieves the school's information.

Request Body:
```json
{
  "school_id": 1
}
```

Response (200 OK):
```json
{
  "school_id": 1,
  "name": "Technological University",
  "passing_grade": 7.0,
  "midterm_count": 3
}
```
