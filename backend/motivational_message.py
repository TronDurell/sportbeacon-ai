from typing import List, Dict, Optional
from datetime import datetime
import random

class MotivationalMessageGenerator:
    def __init__(self):
        self.general_messages = [
            "Every rep counts. Let's finish the week strong! 💪",
            "You showed up today — that's how champions are made. 🏆",
            "Small steps, big results. Keep pushing! 🚀",
            "Success is built one drill at a time. 🎯",
            "Your future self will thank you for today's effort. ⭐",
            "Champions are made when no one is watching. 👊",
            "Trust the process. Embrace the grind. 💯",
            "Today's practice is tomorrow's victory. 🌟"
        ]
        
        self.streak_messages = [
            "🔥 {streak} days and counting! You're on fire!",
            "⚡ {streak}-day streak! Unstoppable!",
            "🎯 {streak} days of consistency! Building habits!",
            "💫 {streak} days strong! Keep the momentum!"
        ]
        
        self.comeback_messages = [
            "Welcome back! Ready to pick up where you left off? 💪",
            "It's a new day to start fresh! 🌅",
            "The comeback is always stronger than the setback! 🚀",
            "You're back on track - let's make it count! ⭐"
        ]
        
        self.achievement_messages = [
            "🎉 Amazing! You completed {completion_rate}% of your drills this week!",
            "⭐ Incredible work! {completion_rate}% completion rate!",
            "🏆 Outstanding! {completion_rate}% of drills completed!"
        ]
        
        self.improvement_messages = [
            "💡 Tip: {message}",
            "📝 Note: {message}",
            "💭 Remember: {message}"
        ]

    def get_daily_message(self, streak: int = 0, last_active: Optional[datetime] = None) -> str:
        """Generate a daily motivational message based on user's activity."""
        if streak > 0:
            return random.choice(self.streak_messages).format(streak=streak)
        elif last_active and (datetime.now() - last_active).days > 1:
            return random.choice(self.comeback_messages)
        return random.choice(self.general_messages)

    def get_weekly_achievement_message(self, completion_rate: float) -> str:
        """Generate a message based on weekly completion rate."""
        return random.choice(self.achievement_messages).format(
            completion_rate=round(completion_rate * 100)
        )

    def get_improvement_tip(self, missed_count: int) -> str:
        """Generate an improvement tip based on performance."""
        if missed_count > 0:
            message = f"You missed {missed_count} {'session' if missed_count == 1 else 'sessions'} - aim for consistency next week!"
            return random.choice(self.improvement_messages).format(message=message)
        return random.choice(self.improvement_messages).format(
            message="Keep up the great work! Consistency is key!"
        ) 