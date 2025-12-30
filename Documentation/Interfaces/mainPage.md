# MainPage

## Description

This is the main page of the app, it is a dashboard that shows the user's subjects and universities he teaches in, and allows the user to navigate to the different subjects.

## Components

The main page has 2 buttons to start interactions with the app:

- A button to create a new university. This button is always visible. When pressed, it will open the school config overlay.
- A button only visible when the user has at least one university. When pressed, it will open the subject config overlay. This button remains visible once the user has created at least one university. And the button is visible in every university the user has created.

## Navigation

The main page contains a list of the user's universities first, and then a sublist of the user's subjects for each university. The user can navigate to the different subjects by tapping on the subject group name. Each subject can have multiple groups, and the user can navigate to the different groups by tapping on the group name.