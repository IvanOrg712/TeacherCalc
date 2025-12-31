# Backend Responsibilities & Logic

The backend acts as the logical engine of the system, handling persistence, strict business rule validation, and dynamic calculation of grades and attendance.

# 1. Structure & Global Parameter Management

**School Configuration**: Persistence of the minimum passing grade (`passing_grade`) and the number of partial exams (`midterm_count`) to structure the evaluation logic.

**Subject Creation (`POST /subjects`)**: Upon receiving a list of groups (e.g., "710, 711"), the backend must trim whitespace from each name and automatically generate the corresponding records in the `Groups` table.

**Student Management**: Enable editing of student names and ensure that the manual order (`display_order`) persists to maintain custom organization via drag-and-drop in the tables.

# 2. Weighting & Grading Engine

**Weight Validation (`POST /evaluations`)**: Before inserting any category, the backend must sum the `weight_percentage` of items marked as `is_fixed`. If the sum exceeds 100%, it must return an error capturable by the ErrorOverlay indicating that the value exceeds the partial's limit.

**Automatic Distribution**: For items with `is_fixed: false`, the backend must calculate and proportionally assign the remaining percentage of the 100%.

**Dynamic Scaling & Normalization**: The backend must use the `max_score` of each activity to normalize grades. For example, if a student scores 15 on a scale of 30, their normalized grade for the average calculation represents 50% of the assigned weight.

# 3. Extra Points Logic
The backend implements the additive bonus using the following mathematical formula:

```javascript
const finalGrade = Math.round(Math.min(baseGrade + extraBonus, maxScale) * 100) / 100;
```

**Direct Application**: Activities with `is_extra_points: true` are calculated independently and added directly to the student's final accumulated average.

**Cap Control**: A `MIN(final_grade, max_grade)` must be applied to ensure the result does not exceed the school's scale limit (e.g., 10 or 100).

**Precision**: All final results must be rounded and stored with 2-decimal precision.

# 4. Attendance & Alert Control

**Binary Computation**: Process attendance records using a binary system where 0 is absence and 1 is presence.

**Absence Management**: When querying the attendance page, the backend must compare the total count of `status = 0` against the `absences_allowed` value defined in the subject.

**Alert Signal**: Send a visual alert flag to the frontend if the student has exceeded the allowed absences, so the interface can paint the cell red.

# 5. Data Integrity & Flow

**Cascading Deletion**: `ON DELETE CASCADE` is implemented in hierarchical relationships. If a school is deleted, the system must automatically delete its associated subjects, groups, midterms, and grades.

**Progressive Update**: When modifying an individual grade or attendance cell, the backend must recalculate and immediately return the new totals for the partial to maintain synchronization in the frontend.

**Security**: Validate that the teacher authenticated via email and password can only interact with data from universities and groups belonging to them.
