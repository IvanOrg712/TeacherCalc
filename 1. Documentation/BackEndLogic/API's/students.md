# Student Management API

## 4. Roster Management

**Get Class Roster**
- Endpoint: `GET /api/groups/{group_id}/students`
- Description: Retrieves the list of students in a specific group, ordered by `display_order` to respect custom sorting.

Response (200 OK):
```json
[
  { "student_id": 101, "name": "Alice Johnson", "display_order": 1 },
  { "student_id": 102, "name": "Bob Smith", "display_order": 2 }
]
```

**Add Student**
- Endpoint: `POST /api/groups/{group_id}/students`
- Description: Adds a new student to the group.

Request Body:
```json
{
  "name": "Charlie Brown"
}
```

Response (201 Created):
```json
{
  "student_id": 103,
  "name": "Charlie Brown",
  "display_order": 3 // Auto-incremented
}
```

**Add Batch Students**
- Endpoint: `POST /api/groups/{group_id}/students/batch`
- Description: Adds multiple students to the group.

Request Body:
```json
{
  "names": "Alice Johnson, Bob Smith"
}
```

Response (201 Created):
```json
[
  { "student_id": 101, "name": "Alice Johnson", "display_order": 1 },
  { "student_id": 102, "name": "Bob Smith", "display_order": 2 }
]
```

**Update Student**
- Endpoint: `PUT /api/students/{id}`
- Description: Corrections to student name.

Request Body:
```json
{
  "name": "Charles Brown",
  "newName": "Charles Brown - Updated"
}
```

Response (200 OK):
```json
{
  "student_id": 101,
  "name": "Charles Brown - Updated"
}
```

**Remove Student**
- Endpoint: `DELETE /api/groups/{group_id}/students/{student_id}`
- Description: Removes a student from a group (and cascades deletions of their grades/attendance for that group).

Request Body:
```json
{
  "name": "Charles Brown"
}
```

Response (200 OK):
```json
{
  "student_id": 101,
  "message": "Student deleted successfully"
}
```

**Reorder Roster (Drag & Drop)**
- Endpoint: `PUT /api/groups/{group_id}/students/reorder`
- Description: Updates the `display_order` for an individual student and reorders the rest of the students to maintain the order.

Request Body:
```json
{
  "student_id": 101,
  "display_order": 2
}
```

Response (200 OK):
```json
{
  "student_id": 101,
  "display_order": 2
}
```