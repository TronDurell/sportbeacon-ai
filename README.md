# SportBeacon AI Components

A suite of AI-powered tools for sports analytics, player insights, and game management.

## Installation

```bash
pip install -r requirements.txt
```

## Components

### 1. Player Insight Engine (`ai/player_insight.py`)

Analyzes player statistics to generate insights about performance, skills, and trends.

```python
from ai.player_insight import PlayerInsightEngine

# Initialize the engine
engine = PlayerInsightEngine()

# Generate player report
player_stats = load_player_data()  # Your data loading function
report = engine.generate_player_report(player_stats)

# Access specific insights
top_skills = report['top_skills']
growth_areas = report['growth_areas']
recent_trends = report['recent_trends']
win_rate = report['win_rate']
```

Features:
- Data normalization using StandardScaler
- Trend analysis with rolling averages
- Top skills identification
- Growth areas detection
- Win rate calculation
- Comprehensive player reports

### 2. FastAPI Backend (`backend/api.py`)

RESTful API endpoints for accessing player analytics and insights.

#### Endpoints:

**GET /api/players/top-winners**
```python
# Get top 5 players by win rate in the last 30 days
GET /api/players/top-winners?time_period_days=30&limit=5

# Response format:
[
    {
        "player_id": 1,
        "player_name": "Player_1",
        "win_rate": 75.0,
        "games_played": 20,
        "avg_points": 22.5,
        "avg_assists": 6.3,
        "avg_rebounds": 8.1
    },
    ...
]
```

## Project Structure

```
/sportbeacon-ai
├── /ai
│   ├── player_insight.py      # Player analytics engine
│   ├── matchmaking_engine.py  # Game matchmaking algorithm
│   ├── highlight_generator.py # Auto-tagging system
│   ├── scheduler_bot.py       # Scheduling assistant
│   └── coach_assistant.py     # LangChain-based chatbot
├── /data
│   ├── player_profiles.json   # Player data
│   └── sample_games.csv       # Game statistics
├── /backend
│   └── api.py                 # FastAPI endpoints
├── /frontend
│   └── ui_components.jsx      # React components
└── README.md
```

## Usage Examples

### Player Insight Analysis

```python
from ai.player_insight import PlayerInsightEngine
import pandas as pd

# Initialize the engine
engine = PlayerInsightEngine()

# Load player statistics
player_stats = pd.DataFrame({
    'points': [20, 25, 18, 30, 22],
    'assists': [5, 7, 4, 8, 6],
    'rebounds': [8, 10, 7, 12, 9],
    'game_date': ['2023-01-01', '2023-01-03', '2023-01-05', '2023-01-07', '2023-01-09']
})

# Generate insights
normalized_stats = engine.normalize_stats(player_stats)
trends = engine.calculate_player_trends(normalized_stats)
top_skills = engine.identify_top_skills(normalized_stats)

print(f"Top Skills: {top_skills}")
print(f"Performance Trends: {trends}")
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

# SportBeaconAI Frontend

A modern, modular AI-powered sports analytics platform.

## Dev Setup

```bash
cd frontend
npm install
```

- Requires Node.js 18+
- Configure your Firebase credentials in `lib/firebase/index.ts`

## Firebase & AI Module Usage

### Firestore Access
All Firestore logic is centralized in `lib/firebase/index.ts`:
- Use `getCollection`, `setDocument`, `updateDocument`, etc. for CRUD operations.
- Import Firestore helpers from `@/lib/firebase`.

### AI Prompt Modules
All AI prompt templates and builders are in `lib/ai/`:
- `DrillSuggestionPrompts.ts`
- `WorkoutPartnerPrompts.ts`
- `FormCoachPrompts.ts`
- `VoiceSummaryPrompts.ts`

Import and use prompt builders for agent/assistant features.

## Testing

- All test stubs are in `frontend/__tests__/`
- Run tests with:

```bash
npm run test
```

- Test coverage includes:
  - Firestore helpers (mocked)
  - AI prompt builders
  - Component rendering (ScoutDashboard, CoachDashboard)

## CI/CD

- Validation workflow in `.github/workflows/validate.yml` runs lint, test, and build on push/PR to main.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
