# AttendancePage

## Description

The attendance page is the first page the user will see when clicking the group button in the mainPage. This page shows the attendance of the students using a binary system, 0 for absent and 1 for present. The whole system will be on a table format. Check attendancePage.png for a better understanding and the design of the page.

## Interactivity

This page has several interactive elements:

- A button to go back to the mainPage.
- A button to add a new student (This student will be added to the group so the student will also be added to the gradesPage).
- A button to add a new attendance (This is a vertical button on the last column within each midterm), clicking it will create a new column for the attendance with the current date.
- The user can click on the attendance of a student to change it from 0 to 1 or from 1 to 0. To facilitate attendance change, the user can click on a student's attendance and once it introduces the change, the system will move to the next student on a cascading manner, this until the whole attendance is registered.
- At the bottom of the page, there is 2 buttons, they will act as windows, one is for "Attendance" and the other for "Grades". When clicking on one of them, the system will move to the attendancePage or gradesPage respectively.
- The user can click on the name of a student to change the name of the student.
- The user can click on the name of the subject to change the name of the subject.
- The user can click on the name of the group to change the name of the group.

## Other Details

At the end of the table, there is a column for the total inattendance of each student, this column will compare the absences to the absences allowed and will put the backgrounf of the cell red if the student has exceeded the absences allowed.