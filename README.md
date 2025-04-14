<<<<<<< HEAD
# 🏅 SportBeacon AI

**SportBeacon AI** is an AI-powered platform for sports analytics, athlete development, and game management. It combines machine learning, real-time data tracking, and interactive components to provide players, coaches, and fans with smart insights and immersive tools.

---

## 🚀 Features at a Glance

- 📊 **Player Insight Engine**  
  Understand athlete performance using trend detection, skill breakdowns, and growth metrics.

- 🧠 **AI-Enhanced Social Feed**  
  Auto-analyzes workouts or recipes in video posts, recommends local stores, and personalizes feed results.

- 📍 **Immersive Map System (3D & AR)**  
  Explore live sports events, venues, teams, and players using 3D or AR view with real-time overlays.

- 🧰 **Real-Time Drill Logger**  
  Coaches and players can log and view drills with performance summaries.

- 🛠️ **Role-Based Admin Tools**  
  Role-specific access for players, coaches, scouts, and admins.

- 💬 **Smart Feed AI Assistant**  
  Summarizes posts, tags content, and scores relevance for user timelines.

---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/IronDurell/sportbeacon-ai.git
cd sportbeacon-ai

# Install Python backend requirements
pip install -r requirements.txt

# Install frontend dependencies (from /frontend folder)
cd frontend
npm install


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
Roadmap Preview
Feature	Status
Player Insights Engine	✅ Complete
Role-Based Auth & Access	✅ Complete
Drill Logger	✅ Complete
Social Feed AI Analysis	✅ Complete
Immersive Map + AR	🚧 In Progress
Scout/Coach Dashboard	🔜 Planned
Reward System	🔜 Planned```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
Built by Antron TronDurell Snider @CultureHustling Twitter/X
With tools like: Firebase, OpenAI, Google Maps API, Unreal Engine, Next.js
## License

MIT License 
=======
# sportbeacon-ai
>>>>>>> 7d54d1e021c29d45614c1094a09bc40019eb550d
