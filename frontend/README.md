# LifeTrack Frontend

A responsive Next.js + TypeScript + Tailwind CSS frontend for the LifeTrack Express API.

## Requirements
- Node.js 20.9 or newer
- npm
- VS Code (recommended)

## Run locally
1. Configure and start the backend using `../Backend/README.md`. The API needs a JWT secret; database-backed requests need a valid MongoDB connection.
2. The frontend defaults to `http://localhost:5000/api`. If the API uses another URL, create `.env.local` in this folder and set `NEXT_PUBLIC_API_URL` to that URL.
3. Install dependencies and start the frontend:

```bash
npm install
npm run dev
```

4. Open http://localhost:3000, then create an account or sign in.

If port 3000 is busy, Next.js will show another local URL (for example http://localhost:3001).

## Included
- Responsive sidebar and mobile navigation
- Account registration and sign-in through the backend
- User-specific tasks, expenses, bills, appointments, shopping items, and habits
- Create, update, and delete actions for planner records
- Overview and reports based on account data
- Authentication token saved in browser localStorage; passwords are never saved there

## API connection

The frontend calls the Express API at `NEXT_PUBLIC_API_URL`. For local development, the default is `http://localhost:5000/api`. The API URL must be reachable by the user's browser, and the backend `CLIENT_URL` must allow the frontend origin.

If the backend is unavailable or rejects a request, the frontend displays the API error instead of silently falling back to demo data.

## Production build check
```bash
npm run build
```
