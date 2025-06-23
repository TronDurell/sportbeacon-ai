import pytest
import json
from datetime import datetime
from backend.api.player_preferences import app as prefs_app

@pytest.fixture
def client():
    prefs_app.config['TESTING'] = True
    with prefs_app.test_client() as client:
        yield client

@pytest.fixture
def mock_auth_data():
    return {
        'wallet_address': '0x1234567890abcdef',
        'signature': '0xsignature123',
        'message': 'test_message'
    }

@pytest.fixture
def valid_preferences():
    return {
        'skill_goals': {
            'shooting': {'target_score': 85, 'priority': 'high'},
            'dribbling': {'target_score': 80, 'priority': 'medium'}
        },
        'coach_tone': 'encouraging',
        'training_intensity': 'medium',
        'favorite_drills': ['drill_1', 'drill_2'],
        'injury_data': {
            'recent_injuries': ['ankle_sprain'],
            'restrictions': ['no_high_impact'],
            'recovery_date': '2024-01-15'
        },
        'preferred_duration': 45,
        'rest_days': ['sunday', 'wednesday'],
        'notification_preferences': {
            'voice_feedback': True,
            'streak_reminders': True,
            'milestone_alerts': True
        }
    }

def test_get_preferences_missing_auth(client):
    """Test GET preferences without authentication."""
    response = client.get('/api/player/preferences')
    assert response.status_code == 400

def test_get_preferences_invalid_signature(client, mock_auth_data):
    """Test GET preferences with invalid signature."""
    response = client.get('/api/player/preferences', query_string=mock_auth_data)
    assert response.status_code == 401

def test_post_preferences_missing_data(client):
    """Test POST preferences without data."""
    response = client.post('/api/player/preferences', json={})
    assert response.status_code == 400

def test_post_preferences_invalid_structure(client, mock_auth_data):
    """Test POST preferences with invalid structure."""
    invalid_prefs = {
        'skill_goals': {},
        'coach_tone': 'invalid_tone'
    }
    
    response = client.post('/api/player/preferences', json={
        **mock_auth_data,
        'preferences': invalid_prefs
    })
    assert response.status_code == 400

def test_post_preferences_valid_data(client, mock_auth_data, valid_preferences):
    """Test POST preferences with valid data."""
    response = client.post('/api/player/preferences', json={
        **mock_auth_data,
        'preferences': valid_preferences
    })
    assert response.status_code == 200
    assert response.json['success'] == True

def test_update_skill_goals(client, mock_auth_data):
    """Test updating specific skill goals."""
    skill_goals = {
        'shooting': {'target_score': 90, 'priority': 'high'},
        'passing': {'target_score': 85, 'priority': 'medium'}
    }
    
    response = client.post('/api/player/preferences/skill-goals', json={
        **mock_auth_data,
        'skill_goals': skill_goals
    })
    assert response.status_code == 200
    assert response.json['success'] == True

def test_update_injury_data(client, mock_auth_data):
    """Test updating injury data."""
    injury_data = {
        'recent_injuries': ['knee_strain'],
        'restrictions': ['limited_jumping'],
        'recovery_date': '2024-02-01'
    }
    
    response = client.post('/api/player/preferences/injury-data', json={
        **mock_auth_data,
        'injury_data': injury_data
    })
    assert response.status_code == 200
    assert response.json['success'] == True

def test_update_coach_tone(client, mock_auth_data):
    """Test updating coach tone."""
    response = client.post('/api/player/preferences/coach-tone', json={
        **mock_auth_data,
        'coach_tone': 'technical',
        'notification_preferences': {
            'voice_feedback': False,
            'streak_reminders': True,
            'milestone_alerts': False
        }
    })
    assert response.status_code == 200
    assert response.json['success'] == True

def test_invalid_coach_tone(client, mock_auth_data):
    """Test invalid coach tone."""
    response = client.post('/api/player/preferences/coach-tone', json={
        **mock_auth_data,
        'coach_tone': 'invalid_tone'
    })
    assert response.status_code == 400

def test_preferences_validation():
    """Test preferences validation logic."""
    from backend.api.player_preferences import _validate_preferences
    
    # Valid preferences
    valid_prefs = {
        'skill_goals': {'shooting': {'target_score': 80}},
        'coach_tone': 'encouraging',
        'training_intensity': 'medium'
    }
    assert _validate_preferences(valid_prefs) == True
    
    # Invalid preferences - missing required fields
    invalid_prefs = {
        'skill_goals': {'shooting': {'target_score': 80}}
    }
    assert _validate_preferences(invalid_prefs) == False
    
    # Invalid preferences - invalid coach tone
    invalid_tone_prefs = {
        'skill_goals': {'shooting': {'target_score': 80}},
        'coach_tone': 'invalid_tone',
        'training_intensity': 'medium'
    }
    assert _validate_preferences(invalid_tone_prefs) == False

def test_preferences_persistence(client, mock_auth_data, valid_preferences):
    """Test that preferences are properly persisted."""
    # Create preferences
    response = client.post('/api/player/preferences', json={
        **mock_auth_data,
        'preferences': valid_preferences
    })
    assert response.status_code == 200
    
    # Retrieve preferences
    response = client.get('/api/player/preferences', query_string=mock_auth_data)
    assert response.status_code == 200
    
    retrieved_prefs = response.json['preferences']
    assert retrieved_prefs['skill_goals']['shooting']['target_score'] == 85
    assert retrieved_prefs['coach_tone'] == 'encouraging'

def test_preferences_merge(client, mock_auth_data):
    """Test that preferences are merged properly."""
    # Create initial preferences
    initial_prefs = {
        'skill_goals': {'shooting': {'target_score': 80}},
        'coach_tone': 'encouraging',
        'training_intensity': 'medium'
    }
    
    response = client.post('/api/player/preferences', json={
        **mock_auth_data,
        'preferences': initial_prefs
    })
    assert response.status_code == 200
    
    # Update with new preferences
    updated_prefs = {
        'skill_goals': {'dribbling': {'target_score': 85}},
        'coach_tone': 'technical'
    }
    
    response = client.put('/api/player/preferences', json={
        **mock_auth_data,
        'preferences': updated_prefs
    })
    assert response.status_code == 200
    
    # Verify merge
    response = client.get('/api/player/preferences', query_string=mock_auth_data)
    retrieved_prefs = response.json['preferences']
    
    # Should have both old and new data
    assert 'shooting' in retrieved_prefs['skill_goals']
    assert 'dribbling' in retrieved_prefs['skill_goals']
    assert retrieved_prefs['coach_tone'] == 'technical' 