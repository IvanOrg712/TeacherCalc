# NewActivityOverlay

## Description

The newActivityOverlay is a window that appears when the user clicks on the "+" button on the gradesPage. This window will allow the user to add a new activity to the students. (newActivityOverlay.png for a better understanding)

## Interactivity

The newActivityOverlay has several interactive elements:

- A text input to introduce the name of the activity.
- A text field to introduce the description of the activity.
- A checkbox to indicate if the activity has a fixed weight. If it does, a text field will appear to introduce the weight of the activity. If it doesn't, the system will assign an automatic weight to the activity.
- A text field to introduce the scale of the activity. The scale can be any scale as the system will calculate the final grade based on the scale introduced. Example: 0 / 30, where 0 is the minimum grade and 30 is the maximum grade.
- A checkbox to indicate if the activity is an extra activity, if it is, the system will force the fixed weight checkbox to be checked and the weight to be introduced. This will activity won't be included in the calculation of the final grade, and only matter in the following situations:
    - The student doesn't have the maximum grade without the extra points.
    Examples:
        Suppose we have an extra activity worth 10%.

        The student has a grade of 9/10, if the extra activity is a 10/10, the final grade will be 10.
        The student has a grade of 9.5/10, if the extra activity is a 10/10, the final grade will be 10.
        The student has a grade of 8.5/10, if the extra activity is a 10/10, the final grade will be 9.5.
        The student has a grade of 8/10, if the extra activity is a 10/10, the final grade will be 9.
- A button to create the activity.

## Logic

The newActivityOverlay will allow the user to add a new activity to the students. The user will introduce the name of the activity and the weight of the activity. The weight will be a number between 0 and 100. The system will then add the activity to the students and move to the gradesPage.