# Assignment Workflow Portal – Backend

## Overview

This project is the **backend service** for the Assignment Workflow Portal built using **Node.js and Express.js**.

It provides RESTful APIs for authentication, assignment management, and student submissions.

---

## Features

### Authentication

* Single login endpoint
* Users log in using **email and password**
* Backend returns:

  * JWT token
  * User role (teacher or student)

The frontend redirects users to their dashboards based on the role.

---

## Assignment Workflow

Assignments move through the following states:

Draft → Published → Completed

Draft

* Editable
* Deletable

Published

* Visible to students
* Cannot be deleted

Completed

* Locked after review
* No further changes allowed

---

## Teacher Capabilities

Teachers can:

* Create assignments
* Edit assignments
* Delete assignments in Draft state
* Publish assignments
* Mark assignments as Completed
* View all student submissions

Each submission includes:

* Student name
* Submitted answer
* Submission date

Teachers may optionally mark submissions as reviewed.

---

## Student Capabilities

Students can:

* View **Published assignments**
* Submit answers
* View their submitted answers

Restrictions:

* Only one submission allowed per assignment
* Submissions cannot be edited after submission

---

## Technology Used

* Node.js
* Express.js

---

## Setup Instructions

Clone the repository:

git clone <repository-url>

Navigate to the project directory:

cd assignment-portal-backend

Install dependencies:

npm install

Start the server:

npm start

The backend server will run locally on:

http://localhost:5000

---

## API Responsibilities

The backend provides APIs for:

* User authentication
* Assignment creation and management
* Viewing assignments
* Submitting answers
* Viewing submissions

---

## Security

* Role-based access control is implemented.
* Teacher-only routes are protected.
* Input validation is performed on server-side.

---

## Notes

* The system focuses on **workflow-driven assignment management**, not only CRUD operations.
* The backend ensures proper access control between teachers and students.

---

## Future Enhancements

* Prevent submissions after due date
* Pagination for assignment listings
* Teacher dashboard analytics
