# GradesPage

## Description

The grades page objective is to show the grades of the students in a table format. Check gradesPage.png for a better understanding and the design of the page. This page will allow the teacher to add activities, add evaluations, and calculate the final grade of each student based on certain criteria we'll define below.

## Interactivity

Same general interactivity as the attendancePage. Students names can be modified by clicking on them and introducing the new name. The user can click on the "+" button to add a new activity, the newActivityOverlay will appear (newActivityOverlay.png for a better understanding). The user can click on the "+ Evaluacion" button to add a new evaluation, the newEvaluationOverlay will appear (newEvaluationOverlay.png for a better understanding). As the attendancePage, the user clicks on a cell to modify the grade of the student, and the system will move to the next cell in a cascading manner. Above the "Attendance" and "Grades" buttons there are a n amount of buttons (depending on the ammount of midterms indicated in the University's settings). Clicking on one of them will move the system to the corresponding midtermPage with its corresponding grades.

The student list, by default, is ordered alphabetically, but the user can click and drag a student to reorder said student. Hoover will allow the user to see more clearly the student's name and grade. When hoovering over the name cell, the system will enlarge the whole row of the student, so the user can see the student's name and grade more clearly, this will also be the case for the columns, so the user can see and identify easily the activity or attendance data. Finally, when the user hoovers over a cell, the system will enlarge the row and column of the cell, so the user can identify specifically the data of that particular cell.

## Logic

This page will provide the teacher with the ability to add activities and evaluations to the students. Lets make an example:

Suppose we have a Math subject:

### Weights

The teacher decides 100% of the subjects grade will be based on activities, a project and a final exam, these 3 elements we can call **weights**; the app allows the teacher to create as many weights as he wants, but the sum of all weights must be 100%, always, and the system will warn the teacher if the sum of weights is not 100%. As the teacher creates a new weight, the system will ask if the weight has a fixed value, if it does, the system will ask for the value, and check if the value of the weight is between 0 and 100, if it is not, the system will warn the teacher and ask for the value again. The following example shows the logic of the weights:

**Correct weight system:**

| Projects | Activities | Final Exam |
| --- | --- | --- |
| 40% | automatic | 30% |

This is correct because the sum of the fixed weights is 70%, and the automatic weight assigns itself the remaining 30% to the weight.

**Correct weight system:**

| Projects | Activities | Final Exam |
| --- | --- | --- |
| 40% | automatic | 50% |

This is a correct weight system because the sum of the fixed weights is 90%, and the automatic weight assigns itself the remaining 10% to the weight.

**Incorrect weight system:**

| Projects | Activities | Final Exam |
| --- | --- | --- |
| 40% | automatic | 60% |

On paper this is correct, but the system will warn the teacher that one of the evaluations has a weight of 0%, so it won't be added to the final grade. This warning will be shown when one of 2 things happen (in this scenario):

- The user creates creates a new weight when the sum of the already existing weights is 100%. So the new weight will be 0%.
- The user creates a new weight with a fixed value, and it doesn't allow the automatic weight to assign itself a greater value than 0%.

**Incorrect weight system:**

| Projects | Activities | Final Exam |
| --- | --- | --- |
| 40% | automatic | 70% |

This is incorrect because the sum of the fixed weights is 110%, so the final grade cannot be calculated properly.

### Weights within activities

This same weights system will be used within activities, so the teacher can assign a fixed or automatic weight to each activity. The same checks will be applied to the weights within activities, so the sum of the weights must allways be 100%, counting the fixed and automatic weights.

### Final grade

The final grade will be calculated based on the weights of the activities and evaluations. The final grade will be the sum of the products of the weights and the grades of the activities and evaluations. The final grade will be rounded to 2 decimal places.