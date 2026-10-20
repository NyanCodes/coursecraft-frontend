# Coursecraft frontend

React/Vite interface for the CSX4107 Online Course Service. Teachers can manage their own courses and view enrolled Students. Students can find courses, view details, enroll, and see their learning list.

## Run locally

Use Node.js 20.19+ or 22.12+. Copy `.env.example` to `.env.local` and set `VITE_API_URL` to the backend origin, such as `http://localhost:3000`.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. The backend database must be seeded first.

## Test users

| Role | Username | Password |
| --- | --- | --- |
| Teacher | teacher1, teacher2, teacher3 | Teacher123! |
| Student | student1, student2, student3 | Student123! |

Each username also has an email address in the form `username@example.com`. These are demonstration accounts.

## Test walkthrough

1. Sign in as `teacher1`, create an Open course, and view its details.
2. Sign in as `student1`, search for the course, enroll, and open **My learning**.
3. Try enrolling again to see duplicate enrollment blocked. Use the other Student accounts to fill seats and test the capacity limit.
4. Sign in as `teacher1` to view the enrolled roster. Change the course to Close, then Cancel, and verify how the Student catalog changes.
5. Create a course with no enrollments and delete it. A course with enrolled Students cannot be deleted.

## Deploy on Vercel

Use the Vite framework preset with this repository as the project root, build command `npm run build`, and output directory `dist`. Set `VITE_API_URL` to the backend's deployed origin without a trailing slash. This app uses hash routing so direct links work on static hosting.

Backend source: https://github.com/NyanCodes/coursecraft-backend

Live frontend: https://coursecraft-frontend-beta.vercel.app

Live API: https://coursecraft-backend-two.vercel.app
