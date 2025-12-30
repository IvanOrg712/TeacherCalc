# newEvaluationOverlay

## Description

The newEvaluationOverlay is a window that appears when the user clicks on the "+ Evaluacion" button on the gradesPage. This window will allow the user to configure a new evaluation, such as name and weight.

## Interactivity

The newEvaluationOverlay has several interactive elements:

- A text input to introduce the name of the evaluation.
- A checkbox to indicate if the evaluation is fixed or automatic. If the evaluation is fixed, the user will be asked to introduce the weight of the evaluation.
- A button to create the evaluation.

## Logic

The newEvaluationOverlay will allow the user to configure the evaluation, such as the name and the weight. The user will introduce the name of the evaluation and the weight of the evaluation in case the evaluation is fixed. The weight will be a number between 0 and 100. The system will then add the evaluation to the students and move to the gradesPage.

If the evaluation is automatic, the system will assign itself a weight. In the case that the evaluation is fixed, the system will check if the weight fits the remaining weight of the evaluations. If it doesn't, the system will warn the user and ask for the weight again.