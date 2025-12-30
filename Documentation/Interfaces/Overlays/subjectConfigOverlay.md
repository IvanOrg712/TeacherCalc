# SubjectConfigOverlay

## Description

The subjectConfigOverlay is a window that appears when the user clicks on the "+" button on the mainPage and under the University's section. This window will allow the user to configure a new subject, such as name, allowed absences, amount of groups, and the name of the groups.

## Interactivity

The subjectConfigOverlay has several interactive elements:

- A text input to introduce the name of the subject.
- A text field to introduce the absences allowed. The absences allowed can be any number, this number will be used to check if the student has exceeded the absences allowed, and in the attendacePage, if the student has exceeded the absences allowed, the background of the cell will be red, otherwise, it will be green.
- A text field to introduce the amount of groups. The amount of groups can be any number, this number will be used to create the groups.
- A text field to introduce the name of the groups. The name of the groups can be any string, this string will be used to create the groups. The system will check if the number of groups names is equal to the amount of groups, if it is not, the system will warn the user and ask for the name of the groups again. The system expects group names to be introduces separated by a comma. Example: Group 1, Group 2, Group 3. The system will remove the spaces at the front and back of the string, not the spaces in the group names. Based on the previous example, the system will create 3 groups named "Group 1", "Group 2", and "Group 3".
- A button to create the subject.

## Logic

The subjectConfigOverlay will allow the user to configure the subject, such as the name, the scale, the absences allowed, and the midterms. The user will introduce the name of the subject and the scale of the subject. The scale will be a number between 0 and 100. The system will then add the subject to the students and move to the gradesPage.