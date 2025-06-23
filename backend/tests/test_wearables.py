import pytest
import json
from datetime import datetime, timedelta
from backend.api.wearables import app as wearables_app

@pytest.fixture
def client():
    wearables_app.config['TESTING'] = True
    with wearables_app.test_client() as client:
        yield client

@pytest.fixture
def mock_auth_data():
    return {
        'wallet_address': '0x1234567890abcdef',
        'signature': '0xsignature123',
        'message': 'test_message'
    }

@pytest.fixture
def valid_sensor_data():
    return {
        'heart_rate': {
            'current': 145,
            'average': 140,
            'max': 180,
            'resting': 65
        },
        'jump_count': 25,
        'jump_height': {
            'average': 0.8,
            'max': 1.2,
            'units': 'meters'
        },
        'movement_data': {
            'steps': 1250,
            'distance': 2.5,
            'calories': 450,
            'active_time': 45
        },
        'fatigue_metrics': {
            'muscle_fatigue': 0.7,
            'cardio_fatigue': 0.6,
            'overall_fatigue': 0.65
        },
        'form_metrics': {
            'shooting_form': 0.85,
            'dribbling_form': 0.78,
            'passing_form': 0.82
        },
        'device_info': {
            'device_type': 'smart_watch',
            'model': 'Apple Watch Series 8',
            'battery_level': 0.75
        },
        'timestamp': datetime.now().isoformat()
    }

def test_sync_wearable_data_missing_auth(client):
    """Test sync without authentication."""
    response = client.post('/api/wearables/sync', json={})
    assert response.status_code == 400

def test_sync_wearable_data_invalid_signature(client, mock_auth_data):
    """Test sync with invalid signature."""
    response = client.post('/api/wearables/sync', json=mock_auth_data)
    assert response.status_code == 401

def test_sync_wearable_data_invalid_structure(client, mock_auth_data):
    """Test sync with invalid sensor data structure."""
    invalid_data = {
        'heart_rate': {'current': 145},
        'jump_count': 25
        # Missing required fields
    }
    
    response = client.post('/api/wearables/sync', json={
        **mock_auth_data,
        'sensor_data': invalid_data
    })
    assert response.status_code == 400

def test_sync_wearable_data_valid(client, mock_auth_data, valid_sensor_data):
    """Test sync with valid sensor data."""
    response = client.post('/api/wearables/sync', json={
        **mock_auth_data,
        'sensor_data': valid_sensor_data
    })
    assert response.status_code == 200
    assert response.json['success'] == True
    assert 'data_id' in response.json

def test_get_wearable_status_missing_auth(client):
    """Test get status without authentication."""
    response = client.get('/api/wearables/status')
    assert response.status_code == 400

def test_get_wearable_status_invalid_signature(client, mock_auth_data):
    """Test get status with invalid signature."""
    response = client.get('/api/wearables/status', query_string=mock_auth_data)
    assert response.status_code == 401

def test_get_wearable_status_no_data(client, mock_auth_data):
    """Test get status when no wearable data exists."""
    response = client.get('/api/wearables/status', query_string=mock_auth_data)
    assert response.status_code == 200
    assert response.json['connected'] == False

def test_get_wearable_history_missing_auth(client):
    """Test get history without authentication."""
    response = client.get('/api/wearables/history')
    assert response.status_code == 400

def test_get_wearable_history_invalid_signature(client, mock_auth_data):
    """Test get history with invalid signature."""
    response = client.get('/api/wearables/history', query_string=mock_auth_data)
    assert response.status_code == 401

def test_get_wearable_history_with_days_param(client, mock_auth_data):
    """Test get history with days parameter."""
    response = client.get('/api/wearables/history', query_string={
        **mock_auth_data,
        'days': 14
    })
    assert response.status_code == 200
    assert 'history' in response.json
    assert 'summary' in response.json

def test_sensor_data_validation():
    """Test sensor data validation logic."""
    from backend.api.wearables import _validate_sensor_data
    
    # Valid sensor data
    valid_data = {
        'heart_rate': {'current': 145, 'average': 140, 'max': 180},
        'jump_count': 25,
        'fatigue_metrics': {
            'muscle_fatigue': 0.7,
            'cardio_fatigue': 0.6,
            'overall_fatigue': 0.65
        }
    }
    assert _validate_sensor_data(valid_data) == True
    
    # Invalid sensor data - missing required fields
    invalid_data = {
        'heart_rate': {'current': 145}
    }
    assert _validate_sensor_data(invalid_data) == False
    
    # Invalid sensor data - missing fatigue metrics
    invalid_fatigue_data = {
        'heart_rate': {'current': 145, 'average': 140, 'max': 180},
        'jump_count': 25
    }
    assert _validate_sensor_data(invalid_fatigue_data) == False

def test_fatigue_level_calculation():
    """Test fatigue level calculation logic."""
    from backend.api.wearables import _calculate_fatigue_level
    
    # Low fatigue
    low_fatigue_data = {
        'fatigue_metrics': {'overall_fatigue': 0.2}
    }
    assert _calculate_fatigue_level(low_fatigue_data) == 'low'
    
    # Medium fatigue
    medium_fatigue_data = {
        'fatigue_metrics': {'overall_fatigue': 0.6}
    }
    assert _calculate_fatigue_level(medium_fatigue_data) == 'medium'
    
    # High fatigue
    high_fatigue_data = {
        'fatigue_metrics': {'overall_fatigue': 0.8}
    }
    assert _calculate_fatigue_level(high_fatigue_data) == 'high'

def test_drill_adjustment_generation():
    """Test drill adjustment generation logic."""
    from backend.api.wearables import _generate_drill_adjustment
    
    # High fatigue adjustment
    high_fatigue_adjustment = _generate_drill_adjustment('high', {})
    assert high_fatigue_adjustment['intensity_reduction'] == 0.3
    assert high_fatigue_adjustment['focus_areas'] == ['recovery', 'form_practice']
    
    # Medium fatigue adjustment
    medium_fatigue_adjustment = _generate_drill_adjustment('medium', {})
    assert medium_fatigue_adjustment['intensity_reduction'] == 0.1
    assert medium_fatigue_adjustment['focus_areas'] == ['skill_development', 'moderate_intensity']
    
    # Low fatigue adjustment
    low_fatigue_adjustment = _generate_drill_adjustment('low', {})
    assert low_fatigue_adjustment['intensity_reduction'] == 0.0
    assert low_fatigue_adjustment['focus_areas'] == ['performance', 'high_intensity']

def test_history_summary_calculation():
    """Test history summary calculation logic."""
    from backend.api.wearables import _calculate_history_summary
    
    # Empty history
    empty_summary = _calculate_history_summary([])
    assert empty_summary == {}
    
    # Sample history data
    history_data = [
        {
            'heart_rate': {'current': 140},
            'jump_count': 20,
            'fatigue_metrics': {'overall_fatigue': 0.5}
        },
        {
            'heart_rate': {'current': 150},
            'jump_count': 25,
            'fatigue_metrics': {'overall_fatigue': 0.6}
        }
    ]
    
    summary = _calculate_history_summary(history_data)
    assert summary['total_sessions'] == 2
    assert summary['total_jumps'] == 45
    assert summary['avg_fatigue'] == 0.55

def test_trend_calculation():
    """Test trend calculation logic."""
    from backend.api.wearables import _calculate_trend
    
    # Insufficient data
    insufficient_data = [{'fatigue_metrics': {'overall_fatigue': 0.5}}]
    assert _calculate_trend(insufficient_data) == 'insufficient_data'
    
    # Improving trend
    improving_data = [
        {'fatigue_metrics': {'overall_fatigue': 0.8}},
        {'fatigue_metrics': {'overall_fatigue': 0.6}}
    ]
    assert _calculate_trend(improving_data) == 'improving'
    
    # Declining trend
    declining_data = [
        {'fatigue_metrics': {'overall_fatigue': 0.4}},
        {'fatigue_metrics': {'overall_fatigue': 0.6}}
    ]
    assert _calculate_trend(declining_data) == 'declining'
    
    # Stable trend
    stable_data = [
        {'fatigue_metrics': {'overall_fatigue': 0.5}},
        {'fatigue_metrics': {'overall_fatigue': 0.52}}
    ]
    assert _calculate_trend(stable_data) == 'stable'

def test_wearable_data_persistence(client, mock_auth_data, valid_sensor_data):
    """Test that wearable data is properly persisted."""
    # Sync data
    response = client.post('/api/wearables/sync', json={
        **mock_auth_data,
        'sensor_data': valid_sensor_data
    })
    assert response.status_code == 200
    
    # Check status
    response = client.get('/api/wearables/status', query_string=mock_auth_data)
    assert response.status_code == 200
    assert response.json['connected'] == True
    
    # Check history
    response = client.get('/api/wearables/history', query_string=mock_auth_data)
    assert response.status_code == 200
    assert len(response.json['history']) > 0

def test_fatigue_analysis_integration(client, mock_auth_data, valid_sensor_data):
    """Test integration of fatigue analysis with drill adjustments."""
    # Sync data with high fatigue
    high_fatigue_data = valid_sensor_data.copy()
    high_fatigue_data['fatigue_metrics']['overall_fatigue'] = 0.8
    
    response = client.post('/api/wearables/sync', json={
        **mock_auth_data,
        'sensor_data': high_fatigue_data
    })
    assert response.status_code == 200
    assert response.json['fatigue_level'] == 'high' 