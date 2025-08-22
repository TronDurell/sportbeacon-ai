# SportBeacon AI

A suite of AI-powered tools for sports analytics, player insights, and game management.

## Quickstart (Local)

- Frontend: http://localhost:3002
- Backend:  http://localhost:8000

### Backend
```bash
python -m pip install -r requirements.txt
uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

Health: `GET http://localhost:8000/health`

### Frontend
```bash
cd frontend
npm ci || npm install
npm run dev
```

Configure API URL via `frontend/.env.development`:
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints (samples)

- GET `/api/players/top-winners?time_period_days=30&limit=5`
- POST `/api/players/analyze`
- POST `/api/drills/recommend`
- POST `/api/matchmaking/create-teams`

## Project Structure
```
/sportbeacon-ai
├── ai/
├── backend/
├── frontend/
└── README.md
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License
