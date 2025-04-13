#include "CoachingFlowWidget.h"
#include "JsonObjectConverter.h"
#include "Kismet/GameplayStatics.h"
#include "Serialization/JsonSerializer.h"
#include "Misc/FileHelper.h"
#include "HAL/PlatformFilemanager.h"

UCoachingFlowWidget::UCoachingFlowWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
    , CurrentState(ECoachingFlowState::Initial)
    , bIsVoiceInputActive(false)
{
}

void UCoachingFlowWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Bind UI events
    if (SendMessageButton)
    {
        SendMessageButton->OnClicked.AddDynamic(this, &UCoachingFlowWidget::OnSendMessageClicked);
    }

    if (VoiceInputButton)
    {
        VoiceInputButton->OnClicked.AddDynamic(this, &UCoachingFlowWidget::OnVoiceInputButtonClicked);
    }

    if (MessageInputBox)
    {
        MessageInputBox->OnTextCommitted.AddDynamic(this, &UCoachingFlowWidget::OnMessageInputCommitted);
    }

    // Load previous conversation state if available
    LoadConversationState();
}

void UCoachingFlowWidget::StartCoachingFlow()
{
    // Clear previous state
    MessageHistory.Empty();
    CurrentState = ECoachingFlowState::Initial;

    // Send welcome message
    FCoachingMessage WelcomeMessage;
    WelcomeMessage.SenderName = TEXT("Coach AI");
    WelcomeMessage.MessageText = TEXT("Welcome to your personalized coaching session! Let's start by reviewing your recent performance. How have your last few games been?");
    WelcomeMessage.bIsCoach = true;

    AddMessageToUI(WelcomeMessage);
    UpdateFlowState(ECoachingFlowState::PerformanceReview);
}

void UCoachingFlowWidget::SendMessage(const FString& Message)
{
    if (Message.IsEmpty())
        return;

    // Add user message to UI
    FCoachingMessage UserMessage;
    UserMessage.SenderName = TEXT("Player");
    UserMessage.MessageText = Message;
    UserMessage.bIsCoach = false;

    AddMessageToUI(UserMessage);
    ProcessUserInput(Message);

    // Clear input box
    if (MessageInputBox)
    {
        MessageInputBox->SetText(FText::GetEmpty());
    }
}

void UCoachingFlowWidget::ProcessUserInput(const FString& Input)
{
    // Process input based on current state
    FCoachingMessage Response;
    Response.SenderName = TEXT("Coach AI");
    Response.bIsCoach = true;

    switch (CurrentState)
    {
        case ECoachingFlowState::PerformanceReview:
            Response.MessageText = TEXT("I understand. Based on your performance data and what you've shared, let's identify areas where we can improve. What specific aspects of your game do you feel need work?");
            UpdateFlowState(ECoachingFlowState::WeaknessIdentification);
            break;

        case ECoachingFlowState::WeaknessIdentification:
            Response.MessageText = TEXT("Thank you for sharing. I'll recommend some specific drills tailored to address these areas. Would you like to see them now?");
            Response.MediaURL = TEXT("https://sportbeacon.cdn/drills/overview.mp4");
            UpdateFlowState(ECoachingFlowState::DrillRecommendation);
            break;

        case ECoachingFlowState::DrillRecommendation:
            Response.MessageText = TEXT("Great! Now let's create a comprehensive workout plan to incorporate these drills. How many days per week can you commit to training?");
            UpdateFlowState(ECoachingFlowState::WorkoutPlan);
            break;

        case ECoachingFlowState::WorkoutPlan:
            Response.MessageText = TEXT("Perfect. To support your training, let's discuss nutrition. Would you like to see a customized meal plan?");
            UpdateFlowState(ECoachingFlowState::MealPlan);
            break;

        case ECoachingFlowState::MealPlan:
            Response.MessageText = TEXT("I've found some nearby facilities where you can practice these drills. Would you like to see the locations?");
            UpdateFlowState(ECoachingFlowState::LocationSuggestion);
            break;

        case ECoachingFlowState::LocationSuggestion:
            Response.MessageText = TEXT("Excellent! Here's a summary of your progress and the next steps. Keep up the great work!");
            UpdateFlowState(ECoachingFlowState::ProgressSummary);
            break;

        default:
            Response.MessageText = TEXT("Is there anything specific you'd like to focus on in your training?");
            break;
    }

    AddMessageToUI(Response);
    SaveConversationState();
}

void UCoachingFlowWidget::AddMessageToUI(const FCoachingMessage& Message)
{
    MessageHistory.Add(Message);
    OnMessageReceived.Broadcast(Message);

    // Display media if present
    if (!Message.MediaURL.IsEmpty())
    {
        DisplayMedia(Message.MediaURL, Message.MediaURL.EndsWith(TEXT(".mp4")));
    }

    // Auto-scroll to bottom
    if (MessageScrollBox)
    {
        MessageScrollBox->ScrollToEnd();
    }
}

void UCoachingFlowWidget::DisplayMedia(const FString& URL, bool bIsVideo)
{
    if (bIsVideo && MediaPlayer)
    {
        ImageDisplay->SetVisibility(ESlateVisibility::Collapsed);
        MediaPlayer->SetVisibility(ESlateVisibility::Visible);
        MediaPlayer->LoadMedia(URL, TEXT(""), TEXT(""));
    }
    else if (!bIsVideo && ImageDisplay)
    {
        MediaPlayer->SetVisibility(ESlateVisibility::Collapsed);
        ImageDisplay->SetVisibility(ESlateVisibility::Visible);
        ImageDisplay->LoadImage(URL, FGuid::NewGuid().ToString());
    }
}

void UCoachingFlowWidget::ClearMedia()
{
    if (MediaPlayer)
    {
        MediaPlayer->SetVisibility(ESlateVisibility::Collapsed);
    }
    if (ImageDisplay)
    {
        ImageDisplay->SetVisibility(ESlateVisibility::Collapsed);
    }
}

void UCoachingFlowWidget::UpdateFlowState(ECoachingFlowState NewState)
{
    CurrentState = NewState;
    OnFlowStateChanged.Broadcast(NewState);
}

void UCoachingFlowWidget::SaveConversationState()
{
    // Convert message history to JSON
    TArray<TSharedPtr<FJsonValue>> MessageArray;
    for (const FCoachingMessage& Message : MessageHistory)
    {
        TSharedPtr<FJsonObject> MessageObj = MakeShared<FJsonObject>();
        MessageObj->SetStringField(TEXT("SenderName"), Message.SenderName);
        MessageObj->SetStringField(TEXT("MessageText"), Message.MessageText);
        MessageObj->SetStringField(TEXT("MediaURL"), Message.MediaURL);
        MessageObj->SetBoolField(TEXT("bIsCoach"), Message.bIsCoach);
        MessageObj->SetStringField(TEXT("Timestamp"), Message.Timestamp.ToString());

        MessageArray.Add(MakeShared<FJsonValueObject>(MessageObj));
    }

    TSharedPtr<FJsonObject> SaveData = MakeShared<FJsonObject>();
    SaveData->SetArrayField(TEXT("Messages"), MessageArray);
    SaveData->SetNumberField(TEXT("CurrentState"), static_cast<int32>(CurrentState));

    FString SaveString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&SaveString);
    FJsonSerializer::Serialize(SaveData.ToSharedRef(), Writer);

    // Save to file
    FString SavePath = FPaths::ProjectSavedDir() / TEXT("CoachingFlow.json");
    FFileHelper::SaveStringToFile(SaveString, *SavePath);
}

void UCoachingFlowWidget::LoadConversationState()
{
    FString LoadPath = FPaths::ProjectSavedDir() / TEXT("CoachingFlow.json");
    FString JsonString;
    
    if (FFileHelper::LoadFileToString(JsonString, *LoadPath))
    {
        TSharedPtr<FJsonObject> SaveData;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
        
        if (FJsonSerializer::Deserialize(Reader, SaveData))
        {
            // Load messages
            const TArray<TSharedPtr<FJsonValue>>& MessageArray = SaveData->GetArrayField(TEXT("Messages"));
            for (const auto& MessageValue : MessageArray)
            {
                const TSharedPtr<FJsonObject>& MessageObj = MessageValue->AsObject();
                
                FCoachingMessage Message;
                Message.SenderName = MessageObj->GetStringField(TEXT("SenderName"));
                Message.MessageText = MessageObj->GetStringField(TEXT("MessageText"));
                Message.MediaURL = MessageObj->GetStringField(TEXT("MediaURL"));
                Message.bIsCoach = MessageObj->GetBoolField(TEXT("bIsCoach"));
                FDateTime::Parse(MessageObj->GetStringField(TEXT("Timestamp")), Message.Timestamp);

                AddMessageToUI(Message);
            }

            // Load state
            CurrentState = static_cast<ECoachingFlowState>(SaveData->GetIntegerField(TEXT("CurrentState")));
            OnFlowStateChanged.Broadcast(CurrentState);
        }
    }
}

void UCoachingFlowWidget::StartVoiceInput()
{
    if (!bIsVoiceInputActive)
    {
        bIsVoiceInputActive = true;
        // TODO: Initialize voice input system
    }
}

void UCoachingFlowWidget::StopVoiceInput()
{
    if (bIsVoiceInputActive)
    {
        bIsVoiceInputActive = false;
        // TODO: Stop voice input system and process results
    }
}

void UCoachingFlowWidget::OnSendMessageClicked()
{
    if (MessageInputBox)
    {
        SendMessage(MessageInputBox->GetText().ToString());
    }
}

void UCoachingFlowWidget::OnVoiceInputButtonClicked()
{
    if (bIsVoiceInputActive)
    {
        StopVoiceInput();
    }
    else
    {
        StartVoiceInput();
    }
}

void UCoachingFlowWidget::OnMessageInputCommitted(const FText& Text, ETextCommit::Type CommitMethod)
{
    if (CommitMethod == ETextCommit::OnEnter)
    {
        SendMessage(Text.ToString());
    }
}

void UCoachingFlowWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    // Update voice input visualization if active
    if (bIsVoiceInputActive)
    {
        // TODO: Update voice input visualization
    }
} 