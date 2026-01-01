## 3. Subjects & Groups

**Create Subject (with Group Generation)**
This is a composite endpoint that creates the subject and its groups automatically.
- Endpoint: `POST /api/subjects`
- Backend Logic: Receives a string of groups (e.g., "710, 711"), applies `.trim()` to each element, and generates the corresponding records in the `Groups` table.

Request Body:
```json
{
  "school_id": 1,
  "name": "Mathematics 1",
  "absences_allowed": 8,            // Limit for attendance alert
  "groups_input": "710, 711, 712"   // Comma-separated string
}
```
Response (201 Created):
```json
{
  "id": 1,
  "school_id": 1,
  "name": "Mathematics 1",
  "absences_allowed": 8,
  "groups": [
    { "id": 1, "name": "710" },
    { "id": 2, "name": "711" },
    { "id": 3, "name": "712" }
  ]
}
```

**Update Subject**
- Endpoint: `PUT /api/subjects/{id}`
- Backend Logic: Updates the subject's name and absences allowed.

Request Body:
```json
{
  "name": "Mathematics 1",
  "absences_allowed": 8
}
```
Response (200 OK):
```json
{
  "id": 1,
  "school_id": 1,
  "name": "Mathematics 1",
  "absences_allowed": 8,
  "groups": [
    { "id": 1, "name": "710" },
    { "id": 2, "name": "711" },
    { "id": 3, "name": "712" }
  ]
}
```

**Delete Subject**
- Endpoint: `DELETE /api/subjects/{id}`
- Backend Logic: Deletes the subject and its groups.

Request Body:
```json
{
  "id": 1
}
```
Response (200 OK):
```json
{
  "message": "Subject deleted successfully"
}
```