Node.js Custom Server Authentication Project
![image](https://github.com/user-attachments/assets/18232dea-b9ad-4d9e-975a-a4e2b349109a)

Description
This project is a simple Node.js-based authentication web application without Express. It uses native HTTP server and custom session management. The app supports user registration, login with CAPTCHA validation, profile viewing and editing, password changes, and logout functionality. Sessions are managed in-memory with secure random session IDs stored in HTTP-only cookies.

What You Can Do
This application provides a basic authentication system where users can:

Register a new account with their name, email, and password
![image](https://github.com/user-attachments/assets/9cb55a23-ba59-43e4-85f9-d9c17cfdeb3a)

Log in using their email and password, with CAPTCHA verification to prevent bots
![image](https://github.com/user-attachments/assets/24112701-d806-4979-9287-361618c5897b)

View their profile information (name and email)
![image](https://github.com/user-attachments/assets/825bf00f-d497-407c-82a9-f2f48a36cb05)

Edit their profile name

Change their password securely

Log out to end their session

This application uses MySQL to store user information, including their name, email, and hashed password.
![image](https://github.com/user-attachments/assets/06d748bd-239a-4268-9595-24f7e5f34e71)

Testing
This project includes unit and integration tests for key functionalities such as registration, login, profile retrieval, and session handling. Tests are written using:

Jest – for unit testing functions and modules.

Supertest – for simulating HTTP requests and testing API endpoints.

node-mocks-http – for mocking req and res objects in low-level route/unit tests.
![image](https://github.com/user-attachments/assets/c1d0c3d6-24dc-4624-bc57-f06ca54fbb85)


Code Files Overview
app.js
Main server file using Node.js http module to handle HTTP requests and route API calls.
Handles serving static files and protects profile page access based on sessions.

utils/sessionUtils.js
Session management utilities including cookie parsing, session store (in-memory), session creation, retrieval, and clearing. Uses Node.js crypto for secure random session IDs.

routes/auth.js
API route handlers for user registration, login, and logout.

routes/user.js
API route handlers for profile retrieval, updating profile name, and changing password.

public/index.html
Homepage with buttons to open login and registration modals.

public/profile.html
Profile page showing user info with forms for editing profile and changing password.

public/functions.js
Frontend JavaScript handling CAPTCHA generation and validation, form submissions for login, registration, profile update, password change, and logout. Also manages modal display.

public/styles.css & stylesprofile.css
CSS styles for the homepage and profile page respectively.

Installation and Running the App
Prerequisites
Node.js (v14 or higher recommended)

npm (Node package manager)

Setup
Clone or download the repository.

Navigate into the project directory:
cd js-auth-page

Create a .env file in the root directory if you want to configure the port or other environment variables, e.g.:
PORT=3000

Install dependencies:
npm install bcrypt dotenv mysql2 nodemon jest node-mocks-http supertest
Note: bcrypt, dotenv, and mysql2 are runtime dependencies; nodemon, jest, node-mocks-http, and supertest are for development/testing.
