#include "TimelineFeedWidget.h"
#include "Blueprint/WidgetTree.h"

UTimelineFeedWidget::UTimelineFeedWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    MaxEntries = 50; // Default max entries
}

void UTimelineFeedWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Ensure we have required widget classes set
    if (!DefaultFeedEntryClass)
    {
        UE_LOG(LogTemp, Warning, TEXT("TimelineFeedWidget: DefaultFeedEntryClass not set!"));
    }

    if (!BadgeEntryClass)
    {
        UE_LOG(LogTemp, Warning, TEXT("TimelineFeedWidget: BadgeEntryClass not set!"));
    }
}

void UTimelineFeedWidget::AddFeedEntry(const FFeedEntry& Entry)
{
    if (!FeedScrollBox)
    {
        UE_LOG(LogTemp, Warning, TEXT("TimelineFeedWidget: FeedScrollBox not found!"));
        return;
    }

    // Create and add the entry widget
    UUserWidget* EntryWidget = CreateFeedEntryWidget(Entry);
    if (EntryWidget)
    {
        FeedScrollBox->AddChild(EntryWidget);
        FeedEntries.Add(EntryWidget);

        // Trim old entries if needed
        TrimOldEntries();

        // Scroll to the new entry
        ScrollToLatest();

        // Notify blueprints
        OnNewEntryAdded(Entry);
    }
}

void UTimelineFeedWidget::AddBadgeEntry(const FBadgeData& BadgeData)
{
    if (!BadgeEntryClass)
    {
        UE_LOG(LogTemp, Warning, TEXT("TimelineFeedWidget: BadgeEntryClass not set!"));
        return;
    }

    // Create feed entry for badge
    FFeedEntry Entry;
    Entry.Title = BadgeData.Name;
    Entry.Subtitle = BadgeData.Description;
    Entry.Icon = BadgeData.Icon;
    Entry.Timestamp = FDateTime::Now();
    Entry.EntryType = TEXT("badge");
    Entry.BadgeData = BadgeData;

    AddFeedEntry(Entry);
}

void UTimelineFeedWidget::ClearFeed()
{
    if (FeedScrollBox)
    {
        FeedScrollBox->ClearChildren();
        FeedEntries.Empty();
    }
}

UUserWidget* UTimelineFeedWidget::CreateFeedEntryWidget(const FFeedEntry& Entry)
{
    // Choose widget class based on entry type
    TSubclassOf<UUserWidget> WidgetClass = Entry.EntryType == TEXT("badge") ? 
        BadgeEntryClass : DefaultFeedEntryClass;

    if (!WidgetClass)
    {
        UE_LOG(LogTemp, Warning, TEXT("TimelineFeedWidget: No widget class for type %s"), *Entry.EntryType);
        return nullptr;
    }

    // Create the widget
    UUserWidget* EntryWidget = CreateWidget<UUserWidget>(this, WidgetClass);
    
    if (Entry.EntryType == TEXT("badge"))
    {
        // Set up badge widget
        UBadgeRewardWidget* BadgeWidget = Cast<UBadgeRewardWidget>(EntryWidget);
        if (BadgeWidget)
        {
            BadgeWidget->DisplayEarnedBadge(Entry.BadgeData);
        }
    }
    else
    {
        // Set up default feed entry (implement in BP)
        if (UFunction* SetupFunc = EntryWidget->FindFunction(TEXT("SetupEntry")))
        {
            struct
            {
                FString Title;
                FString Subtitle;
                UTexture2D* Icon;
                FDateTime Timestamp;
            } Params;

            Params.Title = Entry.Title;
            Params.Subtitle = Entry.Subtitle;
            Params.Icon = Entry.Icon;
            Params.Timestamp = Entry.Timestamp;

            EntryWidget->ProcessEvent(SetupFunc, &Params);
        }
    }

    return EntryWidget;
}

void UTimelineFeedWidget::TrimOldEntries()
{
    if (FeedEntries.Num() > MaxEntries)
    {
        int32 NumToRemove = FeedEntries.Num() - MaxEntries;
        for (int32 i = 0; i < NumToRemove; ++i)
        {
            if (FeedEntries[i])
            {
                FeedEntries[i]->RemoveFromParent();
            }
        }
        FeedEntries.RemoveAt(0, NumToRemove);
    }
}

void UTimelineFeedWidget::ScrollToLatest()
{
    if (FeedScrollBox)
    {
        // Use a timer to ensure the scroll happens after layout
        GetWorld()->GetTimerManager().SetTimerForNextTick([this]()
        {
            FeedScrollBox->ScrollToEnd();
        });
    }
} 