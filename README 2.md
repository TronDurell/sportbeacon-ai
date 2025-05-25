<<<<<<< HEAD
# SportBeacon AI 🏆
=======
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
>>>>>>> 1803eaf7773001b897e49397f3a23b2781c08560

[![Build Status](https://github.com/TronDurell/sportbeacon-ai/actions/workflows/main.yml/badge.svg)](https://github.com/TronDurell/sportbeacon-ai/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-orange)](https://firebase.google.com/)

SportBeacon AI is a next-generation sports analytics platform that combines AI-powered insights with social features to help athletes improve their performance and monetize their skills.

## 🌟 Features

### Player Analytics
- **AI Video Analysis**: Automated skill assessment and technique breakdown
- **Performance Tracking**: Track progress with detailed metrics and insights
- **Custom Drills**: AI-generated training recommendations

### Social & Monetization
- **Creator Dashboard**: Track earnings, views, and engagement
- **Tipping System**: Receive tips from fans and supporters
- **Badge System**: Earn badges and unlock multipliers
- **Referral Program**: Multi-tier referral system with rewards

### Technical Features
- **OpenGraph Integration**: Dynamic player cards for social sharing
- **PDF Report Generation**: Detailed performance reports with charts
- **Weekly Email Summaries**: Automated performance updates
- **Role-Based Access**: Coach and player-specific views

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
# Clone the repository
git clone https://github.com/TronDurell/sportbeacon-ai.git

# Install dependencies
cd sportbeacon-ai
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🏗️ Architecture

### Frontend
- Next.js with TypeScript
- Material-UI for components
- Framer Motion for animations
- React-PDF for report generation

### Backend
- Firebase Cloud Functions
- Firestore for data storage
- SendGrid for email delivery
- Vercel for OpenGraph image generation

## 📊 Data Models

### Player Profile
```typescript
interface PlayerProfile {
  id: string;
  name: string;
  badge: {
    tier: 'Bronze' | 'Silver' | 'Gold';
    progress: number;
  };
  stats: {
    totalTips: number;
    weeklyViews: number;
    shareCount: number;
  };
  preferences: {
    profilePublic: boolean;
    receiveWeeklyEmail: boolean;
  };
}
```

### Assessment Data
```typescript
interface Assessment {
  playerId: string;
  timestamp: Date;
  metrics: {
    technique: number;
    speed: number;
    accuracy: number;
    consistency: number;
  };
  aiInsights: string[];
  recommendedDrills: string[];
}
```

## 🔒 Security

- Role-based access control for features
- Profile visibility controls
- Firebase Authentication
- Secure API endpoints

## 📱 Mobile Responsiveness

The platform is fully responsive with:
- Adaptive layouts
- Touch-friendly controls
- Optimized video playback
- Mobile-first design approach

<<<<<<< HEAD
## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
=======
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
>>>>>>> 1803eaf7773001b897e49397f3a23b2781c08560

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [@TronDurell](https://github.com/TronDurell) - Lead Developer
- Additional contributors welcome!

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for hosting and OpenGraph support
- [Firebase](https://firebase.google.com) for backend infrastructure
- [Material-UI](https://mui.com) for UI components

### 🧠 AI Module Overview
- `player_insight.py`: Analyzes stats to detect top skills and trends
- `highlight_tagging_engine.py`: Auto-tags events like hot streaks or clutch plays using configurable scores
- `coach_assistant.py`: Evaluates player/team performance based on strategic goals
- `highlight_generator.py`: Suggests highlight-worthy events from matches

#### Leaderboard Module
The `useLeaderboard` hook ranks players by win rate, assists, and points, providing a dynamic leaderboard for competitive analysis.

Example usage:
```jsx
const { players, loading } = useLeaderboard();
```

### 🧪 API Endpoints
- `GET /api/posts`: Retrieve a list of posts
- `GET /api/insights`: Fetch insights generated by the AI
- `GET /api/player/:id/timeline`: Get the timeline of a specific player
- `GET /api/venues/:id/stats`: Retrieve statistics for a specific venue

Example curl commands:
```
curl -X GET http://localhost:3000/api/posts
curl -X GET http://localhost:3000/api/insights
curl -X GET http://localhost:3000/api/player/123/timeline
curl -X GET http://localhost:3000/api/venues/456/stats
```

### 🧠 API Module Overview

#### ARStatOverlay
The `ARStatOverlay` component displays live player statistics in an augmented reality overlay. It uses the `usePlayerStats` hook to fetch and display data such as player name, win rate, and trend.

Example usage:
```jsx
<ARStatOverlay venueId="12345" />
```

#### usePlayerStats
The `usePlayerStats` hook fetches player statistics from Firestore based on a given venue ID. It returns the data along with loading and error states.

Example usage:
```jsx
const { data, loading, error } = usePlayerStats('12345');
``` 