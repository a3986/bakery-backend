# bakery-backend
Nodejs backend for crumbs.a.microbakery

Bakery Backend Service Setup

This is a Node.js service using Express and PostgreSQL (Supabase) to handle order creation and email notifications.

1. Local Development Setup

Prerequisites: Ensure you have Node.js installed.

Create Folder: Create a new folder named bakery-backend on your computer.

Create Files: Copy the content of api/index.js, package.json, and vercel.json (from the code blocks above) into this folder.

Install Dependencies:

npm install


Environment Variables: Create a .env file in the root of bakery-backend and add the following:

DATABASE_URL="postgres://[user]:[password]@[host]:[port]/[database]"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-specific-password"
OWNER_EMAIL="owner-email@example.com"
PORT=3000


DATABASE_URL: Get this from your Supabase Project Settings -> Database -> Connection String (Nodejs).

EMAIL_PASS: If using Gmail, you MUST use an App Password, not your login password.

Run Locally:

npm start


Your server will start at http://localhost:3000.

2. Deploying to Vercel

GitHub Repo: Push your bakery-backend folder to a new GitHub repository.

Vercel Dashboard:

Log in to Vercel and click "Add New Project".

Import your bakery-backend repository.

Framework Preset: Select "Other".

Root Directory: ./ (default).

Environment Variables: In the Vercel project settings during deployment, add the environment variables defined in step 1.5 (DATABASE_URL, EMAIL_USER, etc.).

Deploy: Click Deploy.

Get URL: Once deployed, copy the domain (e.g., https://bakery-backend.vercel.app).

3. Connecting Frontend

Open your React code (bakery_app_v2.jsx).

Find the BACKEND_API_URL constant inside the Checkout component.

Update it with your Vercel URL:

const BACKEND_API_URL = "[https://your-project-name.vercel.app/api/orders](https://your-project-name.vercel.app/api/orders)";
