#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "MediaPlayer.h"
#include "MediaTexture.h"
#include "MediaSoundComponent.h"
#include "Components/Image.h"
#include "Components/Slider.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "MediaPlayerWidget.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnMediaEndedSignature);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMediaErrorSignature, const FString&, ErrorMessage);

UCLASS()
class SPORTBEACON_API UMediaPlayerWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UMediaPlayerWidget(const FObjectInitializer& ObjectInitializer);

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImage* VideoDisplay;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    USlider* ProgressSlider;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* PlayPauseButton;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* MuteButton;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* TimeText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* TitleText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* CaptionText;

    UPROPERTY(BlueprintAssignable, Category = "Media")
    FOnMediaEndedSignature OnMediaEnded;

    UPROPERTY(BlueprintAssignable, Category = "Media")
    FOnMediaErrorSignature OnMediaError;

    UFUNCTION(BlueprintCallable, Category = "Media")
    void LoadMedia(const FString& URL, const FString& Title, const FString& Caption);

    UFUNCTION(BlueprintCallable, Category = "Media")
    void Play();

    UFUNCTION(BlueprintCallable, Category = "Media")
    void Pause();

    UFUNCTION(BlueprintCallable, Category = "Media")
    void TogglePlayPause();

    UFUNCTION(BlueprintCallable, Category = "Media")
    void ToggleMute();

    UFUNCTION(BlueprintCallable, Category = "Media")
    void SeekTo(float Time);

protected:
    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

private:
    UPROPERTY()
    UMediaPlayer* MediaPlayer;

    UPROPERTY()
    UMediaTexture* MediaTexture;

    UPROPERTY()
    UMediaSoundComponent* SoundComponent;

    bool bIsPlaying;
    bool bIsMuted;
    float Duration;

    UFUNCTION()
    void HandleMediaOpened(FString OpenedUrl);

    UFUNCTION()
    void HandleMediaEndReached();

    UFUNCTION()
    void HandleMediaFailed(FString FailedUrl);

    UFUNCTION()
    void UpdateTimeDisplay();

    UFUNCTION()
    void OnProgressSliderValueChanged(float Value);

    UFUNCTION()
    void OnPlayPauseClicked();

    UFUNCTION()
    void OnMuteClicked();

    void InitializeMediaPlayer();
    void UpdatePlayPauseButton();
    void UpdateMuteButton();
}; 