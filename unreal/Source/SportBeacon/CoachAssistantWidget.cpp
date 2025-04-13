#include "CoachAssistantWidget.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Components/EditableTextBox.h"
#include "Components/ScrollBox.h"
#include "Components/WidgetSwitcher.h"
#include "Components/CarouselNavigator.h"
#include "Animation/WidgetAnimation.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"

const float UCoachAssistantWidget::MESSAGE_ANIMATION_DURATION = 0.3f;

UCoachAssistantWidget::UCoachAssistantWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
    , bVoiceOutputEnabled(false)
    , VoiceVolume(1.0f)
{
}

void UCoachAssistantWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Bind UI events
    if (AskButton)
    {
        AskButton->OnClicked.AddDynamic(this, &UCoachAssistantWidget::HandleAskButtonClicked);
    }

    if (QuestionInputBox)
    {
        QuestionInputBox->OnTextCommitted.AddDynamic(this, &UCoachAssistantWidget::HandleQuestionSubmitted);
    }

    // Initialize voice component
    VoiceAudioComponent = UGameplayStatics::SpawnSound2D(this, MessageSound);
    if (VoiceAudioComponent)
    {
        VoiceAudioComponent->SetVolumeMultiplier(VoiceVolume);
        VoiceAudioComponent->Stop();
    }

    UpdateSuggestedQuestions();
}

void UCoachAssistantWidget::AskQuestion(const FString& Question)
{
    if (Question.IsEmpty())
    {
        return;
    }

    // Create and add user message
    FCoachMessage UserMessage;
    UserMessage.Message = Question;
    UserMessage.bIsUserMessage = true;
    UserMessage.Timestamp = FDateTime::Now();

    AddMessageToHistory(UserMessage);
    CreateMessageBubble(UserMessage);

    // Broadcast question event
    OnQuestionAsked.Broadcast(Question);

    // Clear input
    if (QuestionInputBox)
    {
        QuestionInputBox->SetText(FText::GetEmpty());
    }

    // Auto-scroll to bottom
    if (ChatScrollBox)
    {
        ChatScrollBox->ScrollToEnd();
    }
}

void UCoachAssistantWidget::DisplayCoachResponse(const FString& Response, const TArray<FString>& RelatedStats)
{
    // Create and add coach message
    FCoachMessage CoachMessage;
    CoachMessage.Message = Response;
    CoachMessage.bIsUserMessage = false;
    CoachMessage.Timestamp = FDateTime::Now();
    CoachMessage.RelatedStats = RelatedStats;

    AddMessageToHistory(CoachMessage);
    UWidget* MessageWidget = CreateMessageBubble(CoachMessage);

    // Animate the response
    if (MessageWidget)
    {
        AnimateResponse(MessageWidget);
    }

    // Play voice response if enabled
    if (bVoiceOutputEnabled)
    {
        PlayVoiceResponse(Response);
    }

    // Broadcast response event
    OnResponseReceived.Broadcast(Response);

    // Auto-scroll to bottom
    if (ChatScrollBox)
    {
        ChatScrollBox->ScrollToEnd();
    }

    // Update suggested questions based on context
    UpdateSuggestedQuestions();
}

void UCoachAssistantWidget::UpdateWeeklyFocus(const TArray<FWeeklyFocusItem>& FocusItems)
{
    if (!WeeklyFocusCarousel)
    {
        return;
    }

    // Clear existing focus cards
    WeeklyFocusCarousel->ClearChildren();

    // Create new focus cards
    for (const FWeeklyFocusItem& FocusItem : FocusItems)
    {
        CreateFocusCard(FocusItem);
    }

    UpdateFocusCarousel();
}

void UCoachAssistantWidget::HandleStatClicked(const FString& StatName, float Value)
{
    // Format question about the stat
    FString Question = FString::Printf(TEXT("How can I improve my %s? Current value: %.1f"), *StatName, Value);
    AskQuestion(Question);
}

void UCoachAssistantWidget::HandleBadgeClicked(const FString& BadgeName)
{
    // Format question about the badge
    FString Question = FString::Printf(TEXT("What do I need to do to earn the %s badge?"), *BadgeName);
    AskQuestion(Question);
}

void UCoachAssistantWidget::ToggleVoiceOutput(bool bEnable)
{
    bVoiceOutputEnabled = bEnable;
    if (!bEnable && VoiceAudioComponent)
    {
        StopCurrentVoiceResponse();
    }
}

void UCoachAssistantWidget::SetVoiceVolume(float Volume)
{
    VoiceVolume = FMath::Clamp(Volume, 0.0f, 1.0f);
    if (VoiceAudioComponent)
    {
        VoiceAudioComponent->SetVolumeMultiplier(VoiceVolume);
    }
}

void UCoachAssistantWidget::HandleAskButtonClicked()
{
    if (QuestionInputBox)
    {
        FString Question = QuestionInputBox->GetText().ToString();
        AskQuestion(Question);
    }
}

void UCoachAssistantWidget::HandleQuestionSubmitted(const FString& Text)
{
    if (!Text.IsEmpty())
    {
        AskQuestion(Text);
    }
}

void UCoachAssistantWidget::UpdateSuggestedQuestions()
{
    if (!SuggestedQuestionsBox)
    {
        return;
    }

    SuggestedQuestionsBox->ClearChildren();

    // Add suggested questions based on context
    TArray<FString> Suggestions = {
        TEXT("How can I improve my shooting?"),
        TEXT("What should I focus on this week?"),
        TEXT("Show me my progress"),
        TEXT("Give me some drills to try")
    };

    for (const FString& Suggestion : Suggestions)
    {
        UButton* SuggestionButton = NewObject<UButton>(SuggestedQuestionsBox);
        UTextBlock* TextBlock = NewObject<UTextBlock>(SuggestionButton);
        TextBlock->SetText(FText::FromString(Suggestion));
        
        SuggestionButton->AddChild(TextBlock);
        SuggestionButton->OnClicked.AddDynamic(this, &UCoachAssistantWidget::HandleSuggestionClicked);
        
        SuggestedQuestionsBox->AddChild(SuggestionButton);
    }
}

void UCoachAssistantWidget::AnimateResponse(UWidget* ResponseWidget)
{
    if (!ResponseWidget)
    {
        return;
    }

    // Set initial state
    ResponseWidget->SetRenderOpacity(0.0f);
    ResponseWidget->SetRenderScale(FVector2D(0.8f, 0.8f));

    // Create animation timeline
    FTimerHandle AnimationTimer;
    float StartTime = GetWorld()->GetTimeSeconds();

    GetWorld()->GetTimerManager().SetTimer(AnimationTimer, [this, ResponseWidget, StartTime]()
    {
        float CurrentTime = GetWorld()->GetTimeSeconds();
        float Alpha = FMath::Min((CurrentTime - StartTime) / MESSAGE_ANIMATION_DURATION, 1.0f);

        // Ease-out function
        Alpha = 1.0f - (1.0f - Alpha) * (1.0f - Alpha);

        ResponseWidget->SetRenderOpacity(Alpha);
        ResponseWidget->SetRenderScale(FVector2D(0.8f + (0.2f * Alpha)));

        if (Alpha >= 1.0f)
        {
            GetWorld()->GetTimerManager().ClearTimer(AnimationTimer);
        }
    }, 0.016f, true);
}

void UCoachAssistantWidget::AddMessageToHistory(const FCoachMessage& Message)
{
    MessageHistory.Add(Message);
    TrimMessageHistory();
}

void UCoachAssistantWidget::TrimMessageHistory()
{
    while (MessageHistory.Num() > MAX_MESSAGE_HISTORY)
    {
        MessageHistory.RemoveAt(0);
    }
}

UWidget* UCoachAssistantWidget::CreateMessageBubble(const FCoachMessage& Message)
{
    if (!ChatScrollBox)
    {
        return nullptr;
    }

    // Create message container
    UBorder* MessageBorder = NewObject<UBorder>(ChatScrollBox);
    MessageBorder->SetPadding(FMargin(10.0f));
    
    // Style based on message type
    if (Message.bIsUserMessage)
    {
        MessageBorder->SetBrushColor(FLinearColor(0.1f, 0.1f, 0.1f));
        MessageBorder->SetPadding(FMargin(50.0f, 5.0f, 10.0f, 5.0f));
    }
    else
    {
        MessageBorder->SetBrushColor(FLinearColor(0.2f, 0.2f, 0.3f));
        MessageBorder->SetPadding(FMargin(10.0f, 5.0f, 50.0f, 5.0f));
    }

    // Create message content
    UVerticalBox* ContentBox = NewObject<UVerticalBox>(MessageBorder);
    
    // Add message text
    UTextBlock* MessageText = NewObject<UTextBlock>(ContentBox);
    MessageText->SetText(FText::FromString(Message.Message));
    ContentBox->AddChild(MessageText);

    // Add related stats if any
    if (!Message.RelatedStats.IsEmpty())
    {
        UHorizontalBox* StatsBox = NewObject<UHorizontalBox>(ContentBox);
        for (const FString& Stat : Message.RelatedStats)
        {
            UTextBlock* StatText = NewObject<UTextBlock>(StatsBox);
            StatText->SetText(FText::FromString(Stat));
            StatsBox->AddChild(StatText);
        }
        ContentBox->AddChild(StatsBox);
    }

    MessageBorder->SetContent(ContentBox);
    ChatScrollBox->AddChild(MessageBorder);

    return MessageBorder;
}

void UCoachAssistantWidget::PlayVoiceResponse(const FString& Text)
{
    if (!bVoiceOutputEnabled || !VoiceAudioComponent || !MessageSound)
    {
        return;
    }

    StopCurrentVoiceResponse();
    
    // TODO: Integrate with text-to-speech system
    // For now, just play the message sound
    VoiceAudioComponent->Play();
}

void UCoachAssistantWidget::StopCurrentVoiceResponse()
{
    if (VoiceAudioComponent && VoiceAudioComponent->IsPlaying())
    {
        VoiceAudioComponent->Stop();
    }
}

void UCoachAssistantWidget::CreateFocusCard(const FWeeklyFocusItem& FocusItem)
{
    if (!WeeklyFocusCarousel)
    {
        return;
    }

    UBorder* CardBorder = NewObject<UBorder>(WeeklyFocusCarousel);
    CardBorder->SetPadding(FMargin(15.0f));

    UVerticalBox* CardContent = NewObject<UVerticalBox>(CardBorder);

    // Add title
    UTextBlock* TitleText = NewObject<UTextBlock>(CardContent);
    TitleText->SetText(FText::FromString(FocusItem.Title));
    CardContent->AddChild(TitleText);

    // Add description
    UTextBlock* DescText = NewObject<UTextBlock>(CardContent);
    DescText->SetText(FText::FromString(FocusItem.Description));
    CardContent->AddChild(DescText);

    // Add drill types
    if (!FocusItem.DrillTypes.IsEmpty())
    {
        UVerticalBox* DrillsBox = NewObject<UVerticalBox>(CardContent);
        for (const FString& DrillType : FocusItem.DrillTypes)
        {
            UTextBlock* DrillText = NewObject<UTextBlock>(DrillsBox);
            DrillText->SetText(FText::FromString(DrillType));
            DrillsBox->AddChild(DrillText);
        }
        CardContent->AddChild(DrillsBox);
    }

    CardBorder->SetContent(CardContent);
    WeeklyFocusCarousel->AddChild(CardBorder);
}

void UCoachAssistantWidget::UpdateFocusCarousel()
{
    if (WeeklyFocusCarousel)
    {
        WeeklyFocusCarousel->RefreshNavigator();
    }
} 