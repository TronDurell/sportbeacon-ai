import pytest
from backend.api.coach import app as coach_app

@pytest.fixture
def client():
    coach_app.config['TESTING'] = True
    with coach_app.test_client() as client:
        yield client

def test_recommendations_signature(client):
    # TODO: Mock signature and NFT check
    response = client.post('/api/coach/recommendations', json={
        'player_id': 'test',
        'sport': 'basketball',
        'wallet_address': '0x123',
        'signature': 'sig',
        'message': 'msg'
    })
    assert response.status_code in (200, 401, 429) 