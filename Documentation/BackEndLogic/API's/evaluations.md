# Grading Structure API

## 5. Academic Configuration (Evaluations & Activities)

**Get Academic Structure**
- Endpoint: `GET /api/groups/{group_id}/midterms`
- Description: Fetches the entire tree of Midterms -> Evaluations -> Activities. Vital for rendering the main spreadsheet view.

Response (200 OK):
```json
[
  {
    "midterm_id": 1,
    "name": "Partial 1",
    "evaluations": [
      {
        "id": 10,
        "name": "Exams",
        "weight_percentage": 60,
        "is_fixed": true,
        "activities": [
           { "id": 50, "name": "Exam 1", "max_score": 100 }
        ]
      }
    ]
  }
]
```

**Create Evaluation Category**
- Endpoint: `POST /api/evaluations`
- Business Rule: Validates that the sum of strict weights (`is_fixed=true`) for the midterm does not exceed 100%.

Request Body:
```json
{
  "midterm_id": 1,
  "name": "Homework",
  "weight_percentage": 40,
  "is_fixed": true
}
```

Response (201 Created):
```json
{
  "evaluation_id": 10,
  "name": "Homework",
  "weight_percentage": 40,
  "is_fixed": true
}
```
Response (422 Unprocessable Entity):
```json
{
  "message": "The sum of strict weights for this midterm exceeds 100%"
}
```

**Create Activity**
- Endpoint: `POST /api/activities`
- Description: Creates a specific assignment. Supports "Extra Points" logic.

Request Body:
```json
{
  "evaluation_id": 10,
  "name": "Essay #1",
  "description": "History of Computing",
  "max_score": 20,          // Score scale (e.g., 20 points)
  "is_extra_points": false
}
```

Response (201 Created):
```json
{
  "activity_id": 50,
  "name": "Essay #1",
  "description": "History of Computing",
  "max_score": 20,
  "is_extra_points": false
}
```

**Update Activity**
- Endpoint: `PUT /api/activities/{id}`
- Description: Updates details. If `max_score` changes, triggers grade renormalization.

Request Body:
```json
{
  "name": "Essay #1 - Revised",
  "max_score": 25
}
```
