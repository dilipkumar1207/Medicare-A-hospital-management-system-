# MediCare Admin Panel — Setup

This is a frontend-only React + Vite + Tailwind admin panel (dummy data, no backend required).

## Run it
```
npm install
npm run dev
```
Open the printed localhost URL.

## Login
- Email: admin@medicare.com
- Password: admin123

## Pages
- `/` — Landing (Hero) page
- `/login` — Admin login
- `/dashboard` — Doctors overview + stats
- `/add-doctor` — Add a doctor (with schedule slots)
- `/doctors` — List/search/filter/remove doctors
- `/appointments` — Search/filter/cancel appointments
- `/service-dashboard` — Services overview + stats
- `/add-service` — Add a service (instructions + slots)
- `/services` — List/search/edit/remove services
- `/service-appointments` — Search/filter/cancel service bookings

## Notes
- All data is in-memory (`AdminDataContext`) — refresh resets it back to the seed data in `src/assets/dummyData.js`.
- Colors were changed from the original emerald/green theme to a blue/indigo/cyan theme in `src/assets/dummyStyles.js`.
- To wire up a real backend later, replace the functions inside `src/context/AdminDataContext.jsx` and `src/context/AuthContext.jsx` with real API calls.
