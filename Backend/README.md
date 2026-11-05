# LifeTrack Backend (Express + MongoDB Atlas)

## Setup
1. Open the `Backend` folder in VS Code.
2. Run `npm install`.
3. Create a `.env` file in this folder.
4. Add your MongoDB Atlas connection string to `MONGODB_URI` (the legacy `MONGO_URI` name is also accepted), set `PORT=5000`, add a long private value to `JWT_SECRET`, and set `CLIENT_URL` to your frontend origin. The backend allows `http://localhost:3000` and `http://localhost:5173` by default.
   For an Atlas URI, use the `mongodb+srv://` format and URL-encode any special characters in the database user's password.
5. Run `npm run dev`. API runs at `http://localhost:5000`, even if MongoDB is unavailable; the backend logs database connection errors.

Never share your `.env` file or database password.

## Routes
- `POST /api/auth/register` body: `{ "name":"Your Name", "email":"you@example.com", "password":"at-least-8-characters" }`
- `POST /api/auth/login` body: `{ "email":"you@example.com", "password":"..." }`
- `GET /api/auth/me`
- Protected CRUD routes: `/api/tasks`, `/api/expenses`, `/api/bills`, `/api/appointments`, `/api/shopping`, `/api/habits`
- Protected routes require `Authorization: Bearer TOKEN`.
- For each resource: GET list, POST create, PATCH `/:id`, DELETE `/:id`.

Every record is tied to the logged-in user; queries and updates are scoped by user ID.

## Connect the frontend
The frontend calls this API using `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`). Set the backend `CLIENT_URL` to any additional frontend origin, then start the backend and frontend. Sign in or create an account in the frontend; records are stored in MongoDB and scoped to the authenticated user.
