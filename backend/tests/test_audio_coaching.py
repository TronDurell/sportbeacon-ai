import pytest
from backend.services.audio_coaching import generateCoachingAudio

@pytest.mark.asyncio
def test_generate_coaching_audio():
    url = await generateCoachingAudio({'text': 'Test coaching feedback'})
    assert url.endswith('.mp3') 