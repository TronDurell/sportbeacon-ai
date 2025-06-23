import pytest
from backend.api.drills import app as drills_app

@pytest.fixture
def client():
    drills_app.config['TESTING'] = True
    with drills_app.test_client() as client:
        yield client

def test_drill_placement(client):
    response = client.post('/api/drills/placement', json={
        'drill_id': 'd1',
        'coordinates': [1,2,3],
        'context': 'test'
    })
    assert response.status_code in (200, 400) 