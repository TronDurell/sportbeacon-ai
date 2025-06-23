from typing import List, Dict, Any
from statistics import mean, stdev
from backend.models import DrillLog


def analyze_trend(drill_logs: List[DrillLog]) -> Dict[str, Any]:
    """
    Analyze a list of DrillLog entries to extract player performance trends.
    Returns:
        - performance_deltas: Change in score over time
        - consistency: Standard deviation of scores
        - average_score: Mean score
        - most_recent_score: Last score
        - common_errors: List of feedback strings (if present)
    """
    if not drill_logs:
        return {
            "performance_deltas": None,
            "consistency": None,
            "average_score": None,
            "most_recent_score": None,
            "common_errors": [],
        }

    # Sort logs by timestamp (assume ISO format)
    sorted_logs = sorted(drill_logs, key=lambda x: x.timestamp)
    scores = [log.score for log in sorted_logs]
    feedbacks = [log.feedback for log in sorted_logs if log.feedback]

    # Calculate deltas (difference between first and last)
    performance_deltas = scores[-1] - scores[0] if len(scores) > 1 else 0
    consistency = stdev(scores) if len(scores) > 1 else 0
    average_score = mean(scores)
    most_recent_score = scores[-1]

    # Extract common errors (simple frequency count)
    error_counts = {}
    for fb in feedbacks:
        for err in fb.split(';'):
            err = err.strip().lower()
            if err:
                error_counts[err] = error_counts.get(err, 0) + 1
    common_errors = sorted(error_counts, key=error_counts.get, reverse=True)[:3]

    return {
        "performance_deltas": performance_deltas,
        "consistency": consistency,
        "average_score": average_score,
        "most_recent_score": most_recent_score,
        "common_errors": common_errors,
    } 