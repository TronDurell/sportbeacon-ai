#include "MediaPlayerWidget.h"
#include "MediaPlayerFacade.h"
#include "IMediaEventSink.h"

UMediaPlayerWidget::UMediaPlayerWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
    , bIsPlaying(false)
    , bIsMuted(false)
    , Duration(0.0f)
{
}

void UMediaPlayerWidget::NativeConstruct()
{
    Super::NativeConstruct();

    InitializeMediaPlayer();

    // Bind button events
    if (PlayPauseButton)
    {
        PlayPauseButton->OnClicked.AddDynamic(this, &UMediaPlayerWidget::OnPlayPauseClicked);
    }

    if (MuteButton)
    {
        MuteButton->OnClicked.AddDynamic(this, &UMediaPlayerWidget::OnMuteClicked);
    }

    if (ProgressSlider)
    {
        ProgressSlider->OnValueChanged.AddDynamic(this, &UMediaPlayerWidget::OnProgressSliderValueChanged);
    }
}

void UMediaPlayerWidget::InitializeMediaPlayer()
{
    // Create media player
    MediaPlayer = NewObject<UMediaPlayer>(this);
    MediaPlayer->OnMediaOpened.AddDynamic(this, &UMediaPlayerWidget::HandleMediaOpened);
    MediaPlayer->OnEndReached.AddDynamic(this, &UMediaPlayerWidget::HandleMediaEndReached);
    MediaPlayer->OnMediaOpenFailed.AddDynamic(this, &UMediaPlayerWidget::HandleMediaFailed);

    // Create media texture
    MediaTexture = NewObject<UMediaTexture>(this);
    MediaTexture->SetMediaPlayer(MediaPlayer);
    MediaTexture->UpdateResource();

    // Create sound component
    SoundComponent = NewObject<UMediaSoundComponent>(this);
    SoundComponent->SetMediaPlayer(MediaPlayer);

    // Set video display texture
    if (VideoDisplay)
    {
        VideoDisplay->SetBrushFromTexture(MediaTexture);
    }
}

void UMediaPlayerWidget::LoadMedia(
    const FString& URL,
    const FString& Title,
    const FString& Caption
)
{
    if (!MediaPlayer)
        return;

    // Update text displays
    if (TitleText)
        TitleText->SetText(FText::FromString(Title));
    
    if (CaptionText)
        CaptionText->SetText(FText::FromString(Caption));

    // Load and play media
    MediaPlayer->OpenUrl(URL);
}

void UMediaPlayerWidget::Play()
{
    if (MediaPlayer)
    {
        MediaPlayer->Play();
        bIsPlaying = true;
        UpdatePlayPauseButton();
    }
}

void UMediaPlayerWidget::Pause()
{
    if (MediaPlayer)
    {
        MediaPlayer->Pause();
        bIsPlaying = false;
        UpdatePlayPauseButton();
    }
}

void UMediaPlayerWidget::TogglePlayPause()
{
    if (bIsPlaying)
        Pause();
    else
        Play();
}

void UMediaPlayerWidget::ToggleMute()
{
    if (SoundComponent)
    {
        bIsMuted = !bIsMuted;
        SoundComponent->SetVolumeMultiplier(bIsMuted ? 0.0f : 1.0f);
        UpdateMuteButton();
    }
}

void UMediaPlayerWidget::SeekTo(float Time)
{
    if (MediaPlayer)
    {
        FTimespan Target = FTimespan::FromSeconds(Time * Duration);
        MediaPlayer->Seek(Target);
    }
}

void UMediaPlayerWidget::NativeTick(
    const FGeometry& MyGeometry,
    float InDeltaTime
)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    if (MediaPlayer && bIsPlaying)
    {
        UpdateTimeDisplay();

        // Update progress slider
        if (ProgressSlider && Duration > 0)
        {
            float CurrentTime = MediaPlayer->GetTime().GetTotalSeconds();
            ProgressSlider->SetValue(CurrentTime / Duration);
        }
    }
}

void UMediaPlayerWidget::HandleMediaOpened(FString OpenedUrl)
{
    Duration = MediaPlayer->GetDuration().GetTotalSeconds();
    
    if (ProgressSlider)
    {
        ProgressSlider->SetMinValue(0.0f);
        ProgressSlider->SetMaxValue(1.0f);
    }

    Play();
}

void UMediaPlayerWidget::HandleMediaEndReached()
{
    bIsPlaying = false;
    UpdatePlayPauseButton();
    OnMediaEnded.Broadcast();
}

void UMediaPlayerWidget::HandleMediaFailed(FString FailedUrl)
{
    OnMediaError.Broadcast(FString::Printf(TEXT("Failed to load media: %s"), *FailedUrl));
}

void UMediaPlayerWidget::UpdateTimeDisplay()
{
    if (TimeText && MediaPlayer)
    {
        float CurrentTime = MediaPlayer->GetTime().GetTotalSeconds();
        FString TimeString = FString::Printf(
            TEXT("%02d:%02d / %02d:%02d"),
            FMath::FloorToInt(CurrentTime / 60.0f),
            FMath::FloorToInt(FMath::Fmod(CurrentTime, 60.0f)),
            FMath::FloorToInt(Duration / 60.0f),
            FMath::FloorToInt(FMath::Fmod(Duration, 60.0f))
        );
        TimeText->SetText(FText::FromString(TimeString));
    }
}

void UMediaPlayerWidget::OnProgressSliderValueChanged(float Value)
{
    SeekTo(Value);
}

void UMediaPlayerWidget::OnPlayPauseClicked()
{
    TogglePlayPause();
}

void UMediaPlayerWidget::OnMuteClicked()
{
    ToggleMute();
}

void UMediaPlayerWidget::UpdatePlayPauseButton()
{
    // Update button icon/text based on state
    if (PlayPauseButton)
    {
        // Note: Update button appearance in Blueprint
        PlayPauseButton->SetIsEnabled(true);
    }
}

void UMediaPlayerWidget::UpdateMuteButton()
{
    // Update button icon/text based on state
    if (MuteButton)
    {
        // Note: Update button appearance in Blueprint
        MuteButton->SetIsEnabled(true);
    }
} 