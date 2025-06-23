#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/ScrollBox.h"
#include "Components/VerticalBox.h"
#include "Components/Button.h"
#include "Components/EditableTextBox.h"
#include "Components/TextBlock.h"
#include "Components/Border.h"
#include "Components/Image.h"
#include "Components/Overlay.h"
#include "Components/WidgetSwitcher.h"
#include "Components/CarouselNavigator.h"
#include "Sound/SoundBase.h"
#include "CoachAssistantWidget.generated.h"

USTRUCT(BlueprintType)
struct FCoachMessage
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Message;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bIsUserMessage;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FDateTime Timestamp;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> RelatedStats;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> SuggestedDrills;
};

USTRUCT(BlueprintType)
struct FWeeklyFocusItem
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> DrillTypes;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Priority;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCoachQuestionAsked, const FString&, Question);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCoachResponseReceived, const FString&, Response);

UCLASS()
class SPORTBEACON_API UCoachAssistantWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UCoachAssistantWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;

    // Main Interface Functions
    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void AskQuestion(const FString& Question);

    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void DisplayCoachResponse(const FString& Response, const TArray<FString>& RelatedStats = TArray<FString>());

    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void UpdateWeeklyFocus(const TArray<FWeeklyFocusItem>& FocusItems);

    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void HandleStatClicked(const FString& StatName, float Value);

    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void HandleBadgeClicked(const FString& BadgeName);

    // Voice Output Control
    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void ToggleVoiceOutput(bool bEnable);

    UFUNCTION(BlueprintCallable, Category = "Coach Assistant")
    void SetVoiceVolume(float Volume);

protected:
    // UI Components
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UScrollBox* ChatScrollBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UEditableTextBox* QuestionInputBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* AskButton;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UWidgetSwitcher* ContentSwitcher;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UCarouselNavigator* WeeklyFocusCarousel;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* SuggestedQuestionsBox;

    // Voice Components
    UPROPERTY(EditDefaultsOnly, Category = "Voice")
    USoundBase* MessageSound;

    UPROPERTY(EditDefaultsOnly, Category = "Voice")
    class UAudioComponent* VoiceAudioComponent;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Coach Assistant")
    FOnCoachQuestionAsked OnQuestionAsked;

    UPROPERTY(BlueprintAssignable, Category = "Coach Assistant")
    FOnCoachResponseReceived OnResponseReceived;

private:
    // Chat Management
    TArray<FCoachMessage> MessageHistory;
    bool bVoiceOutputEnabled;
    float VoiceVolume;

    // UI Helper Functions
    UFUNCTION()
    void HandleAskButtonClicked();

    UFUNCTION()
    void HandleQuestionSubmitted(const FString& Text);

    UFUNCTION()
    void UpdateSuggestedQuestions();

    UFUNCTION()
    void AnimateResponse(UWidget* ResponseWidget);

    // Message History Management
    void AddMessageToHistory(const FCoachMessage& Message);
    void TrimMessageHistory();
    void CreateMessageBubble(const FCoachMessage& Message);

    // Voice Output
    void PlayVoiceResponse(const FString& Text);
    void StopCurrentVoiceResponse();

    // Weekly Focus Management
    void CreateFocusCard(const FWeeklyFocusItem& FocusItem);
    void UpdateFocusCarousel();

    // Constants
    static const int32 MAX_MESSAGE_HISTORY = 10;
    static const float MESSAGE_ANIMATION_DURATION;
}; 