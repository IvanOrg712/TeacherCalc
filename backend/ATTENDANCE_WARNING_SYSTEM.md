# Attendance Warning System - Red Cell Highlighting

## ✅ Feature Implemented

The attendance page now **automatically highlights students who have met or exceeded the allowed absences limit** by displaying their absence count in a **red cell with white text**.

## How It Works

### Visual Indicator
When a student's total absences **≥** (greater than or equal to) the subject's allowed absences:
- 🔴 **Background**: Red (`#ef4444`)
- ⚪ **Text Color**: White
- **Font Weight**: Bold

### Example
If a subject allows **3 absences**:
- Student with 2 absences → Normal cell (no highlighting)
- Student with 3 absences → **RED CELL** ⚠️
- Student with 4+ absences → **RED CELL** ⚠️

## Technical Implementation

### Backend
The `Subjects` model already has the `absences_allowed` field:
```python
class Subjects(models.Model):
    school = models.ForeignKey(Schools, models.DO_NOTHING)
    name = models.CharField(max_length=255)
    absences_allowed = models.IntegerField(blank=True, null=True)  # ← This field
```

### Frontend Changes

#### 1. State Management (`AttendancePage.tsx`)
Added state to store the allowed absences:
```typescript
const [absencesAllowed, setAbsencesAllowed] = useState<number | null>(null);
```

#### 2. Data Fetching
Updated the subject fetch to retrieve `absences_allowed`:
```typescript
const subjectRes = await api.get(`/v1/subjects/${subjectId}/`);
setSubjectName(subjectRes.data.name);
setAbsencesAllowed(subjectRes.data.absences_allowed);  // ← New
```

#### 3. Cell Rendering Logic
Updated the "Inasistencias" (absences) column to conditionally apply red styling:
```typescript
{(() => {
    let absences = 0;
    terms.forEach(t => {
        t.dates.forEach((d: string) => {
            const s = getStatus(student.id, t.id, d);
            if (s === 0) absences++;
        });
    });
    
    // Check if absences meet or exceed allowed limit
    const exceedsLimit = absencesAllowed !== null && absences >= absencesAllowed;
    
    return (
        <td 
            className="total-cell-unified" 
            style={{ 
                textAlign: 'center',
                backgroundColor: exceedsLimit ? '#ef4444' : undefined,
                color: exceedsLimit ? 'white' : undefined,
                fontWeight: exceedsLimit ? 'bold' : undefined
            }}
        >
            {absences}
        </td>
    );
})()}
```

## User Experience

### Before
- All absence cells looked the same
- Teachers had to manually compare each student's absences with the limit
- Easy to miss students at risk

### After
- **Instant visual feedback** with red highlighting
- Teachers can quickly identify at-risk students
- Clear warning system for attendance issues

## Configuration

### Setting Allowed Absences
The allowed absences are configured at the **subject level**. To set or modify:

1. Navigate to the subject settings
2. Set the `absences_allowed` field
3. The attendance page will automatically use this value

### Null Handling
If `absences_allowed` is `null` (not set):
- No highlighting occurs
- All cells display normally
- System gracefully handles missing configuration

## Visual Example

```
┌──────────────────┬─────┬─────┬─────┬──────────────┐
│ Student Name     │ ... │ ... │ ... │ Inasistencias│
├──────────────────┼─────┼─────┼─────┼──────────────┤
│ Juan Pérez       │  1  │  0  │  1  │      2       │  ← Normal (< 3)
│ María García     │  0  │  0  │  0  │  🔴  3  🔴   │  ← RED (= 3)
│ Pedro López      │  0  │  0  │  0  │  🔴  5  🔴   │  ← RED (> 3)
└──────────────────┴─────┴─────┴─────┴──────────────┘
```

## Benefits

✅ **Instant Visual Feedback** - Teachers immediately see problem students
✅ **Automatic Calculation** - No manual counting required
✅ **Configurable** - Each subject can have different limits
✅ **Clear Warning** - Red color is universally recognized as a warning
✅ **Accessible** - Bold white text on red background is highly visible

## Files Modified

1. `/frontend/src/pages/Attendance/AttendancePage.tsx`
   - Added `absencesAllowed` state
   - Updated subject data fetch
   - Modified absences cell rendering with conditional styling

## Testing

### Test Scenario 1: Normal Absences
1. Set subject's `absences_allowed` to 3
2. Mark a student with 2 absences
3. Check that cell is **not highlighted**

### Test Scenario 2: At Limit
1. Set subject's `absences_allowed` to 3
2. Mark a student with exactly 3 absences
3. Check that cell is **highlighted in red**

### Test Scenario 3: Exceeds Limit
1. Set subject's `absences_allowed` to 3
2. Mark a student with 5 absences
3. Check that cell is **highlighted in red**

### Test Scenario 4: No Limit Set
1. Leave subject's `absences_allowed` as null
2. Mark students with any number of absences
3. Check that **no cells are highlighted**

## Summary

The attendance warning system provides teachers with **immediate visual feedback** about students who have reached or exceeded the allowed absence limit. The red highlighting makes it impossible to miss at-risk students, helping teachers take timely action to address attendance issues.

🎯 **Key Feature**: Red cell highlighting when absences ≥ allowed limit
🎨 **Visual**: Red background (#ef4444) with white, bold text
⚙️ **Configurable**: Set per subject via `absences_allowed` field
