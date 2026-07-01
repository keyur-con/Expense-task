# Expense Tracker

A simple expense management app with login, dashboard, and approval workflow.

## Tech Stack
- Backend: Node.js, Express, JSON file storage
- Frontend: HTML, CSS, JavaScript

## How to Run

1. Install dependencies:
   ```
   npm install express cors jsonwebtoken
   ```
2. Start the server:
   ```
   node server.js
   ```
3. Open `login.html` in your browser.


## Features
- Login with JWT
- View, add, edit, delete expenses
- Search by title or amount
- Filter by status and department
- Pagination
- Approved expenses can only have their comment edited
- Shows total pending amount
