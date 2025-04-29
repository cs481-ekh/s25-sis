# EIS Tracker
## Abstract
The EIS Tracker is a student monitoring system for the Engineering Innovation Studio at Boise State.
There was a need to track student trends to get analytics for lab usage, especially across majors, as
well as see which students are in the lab and what training they have received in order to improve
lab safety. There was a previous system in place which had grown outdated, so this projects aims
to replace and improve upon it for the future.

This program allows students to sign in and out of the lab, and displays who is signed in and
what permissions they have. While displaying the students it additionally tracks the lab
usage, allowing lab managers to detect and report on usage trends or any other relevant information.
As a web app, this solution is easier to access and maintain, with the lab administrators and 
end user not needing to put in as much effort to access, use, and even export data.

## Overview

The site's main feature is the home page, which consists of a student sign in and a student display.
Students will be able to sign in by entering their student ID, their login will be logged along with the timestamp.
The display page will show which students are logged in, and which tags they have (these correlate to priveleges 
on certain lab machines). These active logins are also present on a standalone display page, which will be
displayed on a monitor above the lab for ease of accessibility.

The program also includes an admin page which supports a number of management operations, including
uploading the student roster automatically via a gradebook export, and manually entering/registering
students. Admins are able to assign students specific tags and priveleges for the lab, and change
any information later if required. There is also an interface to manually clear active logins,
(in case a student leaves without signing out).

A major feature of this page is also the ability to export the log data. As a large part of the 
project was for tracking lab usage, this includes what students logged in at what times, and
what their majors are. This allows us to run reports like how often the lab is being used and 
at what times, and how often students of specific majors are attending the lab.

## Screenshots

Student Login
![Student Login](https://i.imgur.com/jPs6iMM.png)

Display Page
![Display Page](https://i.imgur.com/KhUyjpw.png)

Admin Page
![Admin Page](https://i.imgur.com/JOPz95R.png)

Student Registration
![Student Registration](https://i.imgur.com/IAoT8cQ.png)

## Members

- Ted Moore
- Jered Fennell
- Marc Mangini
- Adam McCall
