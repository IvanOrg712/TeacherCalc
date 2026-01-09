# Daily Operations API

## 6. Grades & Attendance

**Upsert Grade**
- Endpoint: `POST /api/grades`
- Description: Enters or updates a grade. Triggers progressive recalculation of the student's partial average.

Request Body:
```json
{
  "student_id": 101,
  "activity_id": 50,
  "score": 18.5  // Raw score based on max_score
}
```

Response (200 OK):
```json
{
  "grade_id": 999,
  "normalized_score": 92.5, // (18.5 / 20) * 100
  "midterm_current_average": 8.4 // Updated partial average
}
```

**Get Attendance Summary**
- Endpoint: `GET /api/groups/{group_id}/attendance/summary`
- Description: Returns total absences per student for alert logic (Compare vs `absences_allowed`).

Response (200 OK):
```json
[
  { "student_id": 101, "total_absences": 3, "alert": false },
  { "student_id": 102, "total_absences": 9, "alert": true } // Exceeds limit
]
```

**Submit Batch Attendance**
- Endpoint: `POST /api/attendance/batch`
- Description: Submits status for the whole class for a specific date (Column-based entry).

Request Body:
```json
{
  "group_id": 1,
  "midterm_id": 1,
  "date": "2025-10-15",
  "records": [
    { "student_id": 101, "status": 1 }, // Present
    { "student_id": 102, "status": 0 }  // Absent
  ]
}
```

**Update Individual Attendance**
- Endpoint: `PUT /api/attendance/{attendance_id}`
- Description: Updates attendance for a specific student.

Request Body:
```json
{
  "student_id": 101,
  "status": 1 // Present
}
```

Response (200 OK):
```json
{
  "attendance_id": 999,
  "student_id": 101,
  "midterm_id": 1,
  "date": "2025-10-15",
  "status": 1 // Present
}
```