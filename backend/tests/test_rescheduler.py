import unittest
from backend.ai.sports_director import SportsDirectorAI

class TestRescheduler(unittest.TestCase):
    def setUp(self):
        self.agent = SportsDirectorAI()

    def test_handle_scheduling(self):
        event = {'type': 'conflict', 'team': 'A', 'requested_time': '2024-07-01T17:00'}
        result = self.agent.handle_scheduling(event)
        self.assertEqual(result['status'], 'scheduled')
        self.assertIn('details', result)

if __name__ == '__main__':
    unittest.main() 