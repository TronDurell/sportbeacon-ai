#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/ScrollBox.h"
#include "Components/VerticalBox.h"
#include "Components/EditableTextBox.h"
#include "Components/Button.h"
#include "MediaPlayerWidget.h"
#include "ImageDisplayWidget.h"
#include "CoachingFlowWidget.generated.h"

UENUM(BlueprintType)
enum class ECoachingFlowState : uint8
{
    Initial,
    PerformanceReview,
    WeaknessIdentification,
    DrillRecommendation,
    WorkoutPlan,
    MealPlan,
    LocationSuggestion,
    ProgressSummary
};

USTRUCT(BlueprintType)
struct FCoachingMessage
{
    GENERATED_BODY()

    UPROPERTY()
    FString SenderName;

    UPROPERTY()
    FString MessageText;

    UPROPERTY()
    FString MediaURL;

    UPROPERTY()
    bool bIsCoach;

    UPROPERTY()
    FDateTime Timestamp;

    FCoachingMessage()
        : bIsCoach(false)
        , Timestamp(FDateTime::Now())
    {}
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnFlowStateChangedSignature, ECoachingFlowState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMessageReceivedSignature, const FCoachingMessage&, Message);

UCLASS()
class SPORTBEACON_API UCoachingFlowWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UCoachingFlowWidget(const FObjectInitializer& ObjectInitializer);

    // UI Components
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UScrollBox* MessageScrollBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* MessageContainer;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UEditableTextBox* MessageInputBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* SendMessageButton;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* VoiceInputButton;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UMediaPlayerWidget* MediaPlayer;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImageDisplayWidget* ImageDisplay;

    // Flow Control
    UFUNCTION(BlueprintCallable, Category = "Coaching Flow")
    void StartCoachingFlow();

    UFUNCTION(BlueprintCallable, Category = "Coaching Flow")
    void SendMessage(const FString& Message);

    UFUNCTION(BlueprintCallable, Category = "Coaching Flow")
    void StartVoiceInput();

    UFUNCTION(BlueprintCallable, Category = "Coaching Flow")
    void StopVoiceInput();

    // State Management
    UPROPERTY(BlueprintAssignable, Category = "Coaching Flow|Events")
    FOnFlowStateChangedSignature OnFlowStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "Coaching Flow|Events")
    FOnMessageReceivedSignature OnMessageReceived;

protected:
    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

private:
    // Internal state
    ECoachingFlowState CurrentState;
    TArray<FCoachingMessage> MessageHistory;
    bool bIsVoiceInputActive;

    // UI Event handlers
    UFUNCTION()
    void OnSendMessageClicked();

    UFUNCTION()
    void OnVoiceInputButtonClicked();

    UFUNCTION()
    void OnMessageInputCommitted(const FText& Text, ETextCommit::Type CommitMethod);

    // Helper functions
    void AddMessageToUI(const FCoachingMessage& Message);
    void UpdateFlowState(ECoachingFlowState NewState);
    void ProcessUserInput(const FString& Input);
    void SaveConversationState();
    void LoadConversationState();
    
    // Media handling
    void DisplayMedia(const FString& URL, bool bIsVideo);
    void ClearMedia();
}; 