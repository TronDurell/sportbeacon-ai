#include "PlayerProfileWidget.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "Components/Border.h"
#include "Components/VerticalBox.h"
#include "Components/ScrollBox.h"
#include "Kismet/GameplayStatics.h"

UPlayerProfileWidget::UPlayerProfileWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
}

void UPlayerProfileWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Initialize UI elements
    if (PlayerAvatar)
    {
        PlayerAvatar->OnMouseButtonDownEvent.BindUFunction(this, "HandleAvatarClicked");
    }

    InitializeAvatarViewport();
}

void UPlayerProfileWidget::UpdatePlayerProfile(const FString& PlayerId)
{
    if (CurrentPlayerId == PlayerId)
    {
        return;
    }

    CurrentPlayerId = PlayerId;

    // Clear existing data
    if (TimelineFeed)
    {
        TimelineFeed->ClearFeed();
    }

    if (BadgesContainer)
    {
        BadgesContainer->ClearChildren();
    }

    // TODO: Load player data from backend
    // For now, we'll update with mock data
    FPlayerStats MockStats;
    MockStats.PointsPerGame = 15.5f;
    MockStats.AssistsPerGame = 4.2f;
    MockStats.ReboundsPerGame = 6.8f;
    MockStats.StealsPlusBlocks = 2.5f;
    MockStats.WinRate = 0.65f;
    MockStats.FieldGoalPercentage = 48.5f;
    MockStats.ThreePointPercentage = 36.8f;

    UpdateStats(MockStats);

    // Create mock trends
    TArray<FStatTrend> MockTrends;
    
    FStatTrend PointsTrend;
    PointsTrend.StatName = TEXT("Points");
    PointsTrend.CurrentValue = 15.5f;
    PointsTrend.PreviousValue = 14.2f;
    PointsTrend.PercentageChange = 9.15f;
    PointsTrend.bIsPositiveTrend = true;
    MockTrends.Add(PointsTrend);

    UpdateTrends(MockTrends);
}

void UPlayerProfileWidget::UpdateStats(const FPlayerStats& Stats)
{
    CurrentStats = Stats;

    if (StatsContainer)
    {
        UpdateStatDisplay();
    }

    OnStatsUpdated();
}

void UPlayerProfileWidget::UpdateTrends(const TArray<FStatTrend>& Trends)
{
    CurrentTrends = Trends;

    if (TrendsContainer)
    {
        UpdateTrendDisplay();
    }

    OnTrendsUpdated();
}

void UPlayerProfileWidget::AddHighlight(const FFeedEntry& Highlight)
{
    if (TimelineFeed)
    {
        TimelineFeed->AddFeedEntry(Highlight);
    }
}

void UPlayerProfileWidget::AddBadge(const FBadgeData& Badge)
{
    if (TimelineFeed)
    {
        TimelineFeed->AddBadgeEntry(Badge);
    }

    UpdateBadgeProgress();
}

void UPlayerProfileWidget::InitializeAvatarViewport()
{
    if (AvatarViewport)
    {
        // TODO: Set up 3D avatar viewport
        // This will be implemented when the avatar system is ready
    }
}

void UPlayerProfileWidget::UpdateStatDisplay()
{
    if (!StatsContainer)
    {
        return;
    }

    StatsContainer->ClearChildren();

    // Create stat entries
    auto AddStatRow = [this](const FString& Label, float Value, const FString& Suffix = TEXT(""))
    {
        UHorizontalBox* Row = NewObject<UHorizontalBox>(StatsContainer);
        
        UTextBlock* LabelText = NewObject<UTextBlock>(Row);
        LabelText->SetText(FText::FromString(Label));
        
        UTextBlock* ValueText = NewObject<UTextBlock>(Row);
        FString ValueString = FString::Printf(TEXT("%.1f%s"), Value, *Suffix);
        ValueText->SetText(FText::FromString(ValueString));
        
        Row->AddChild(LabelText);
        Row->AddChild(ValueText);
        
        StatsContainer->AddChild(Row);
    };

    AddStatRow(TEXT("Points Per Game"), CurrentStats.PointsPerGame);
    AddStatRow(TEXT("Assists"), CurrentStats.AssistsPerGame);
    AddStatRow(TEXT("Rebounds"), CurrentStats.ReboundsPerGame);
    AddStatRow(TEXT("Steals + Blocks"), CurrentStats.StealsPlusBlocks);
    AddStatRow(TEXT("Win Rate"), CurrentStats.WinRate, TEXT("%"));
    AddStatRow(TEXT("FG%"), CurrentStats.FieldGoalPercentage, TEXT("%"));
    AddStatRow(TEXT("3P%"), CurrentStats.ThreePointPercentage, TEXT("%"));
}

void UPlayerProfileWidget::UpdateTrendDisplay()
{
    if (!TrendsContainer)
    {
        return;
    }

    TrendsContainer->ClearChildren();

    for (const FStatTrend& Trend : CurrentTrends)
    {
        UHorizontalBox* Row = NewObject<UHorizontalBox>(TrendsContainer);
        
        // Stat name
        UTextBlock* NameText = NewObject<UTextBlock>(Row);
        NameText->SetText(FText::FromString(Trend.StatName));
        
        // Change indicator
        UTextBlock* ChangeText = NewObject<UTextBlock>(Row);
        FString ChangeString = FString::Printf(
            TEXT("%s%.1f%%"),
            Trend.bIsPositiveTrend ? TEXT("+") : TEXT(""),
            Trend.PercentageChange
        );
        ChangeText->SetText(FText::FromString(ChangeString));
        
        // Set color based on trend
        FSlateColor Color = Trend.bIsPositiveTrend ? 
            FSlateColor(FLinearColor::Green) : 
            FSlateColor(FLinearColor::Red);
        ChangeText->SetColorAndOpacity(Color);
        
        Row->AddChild(NameText);
        Row->AddChild(ChangeText);
        
        TrendsContainer->AddChild(Row);
    }
}

void UPlayerProfileWidget::UpdateBadgeProgress()
{
    if (!BadgesContainer)
    {
        return;
    }

    // TODO: Update badge progress indicators
    // This will be implemented when the badge system is fully integrated
}

void UPlayerProfileWidget::HandleAvatarClicked()
{
    OnAvatarClicked();
}

void UPlayerProfileWidget::UpdateProgressionDisplay(const FPlayerProgressionData& ProgressionData)
{
    // Update level and XP display
    if (LevelText)
    {
        FString LevelString = FString::Printf(TEXT("Level %d"), ProgressionData.Level);
        LevelText->SetText(FText::FromString(LevelString));
    }

    if (TierText)
    {
        TierText->SetText(FText::FromString(ProgressionData.Tier));
    }

    // Update XP progress bar
    if (XPProgressBar)
    {
        XPProgressBar->SetPercent(ProgressionData.LevelProgress);
    }

    // Update next tier requirements
    if (NextTierRequirementsText && ProgressionData.NextTier.TierName.Len() > 0)
    {
        FString RequirementsText = FString::Printf(
            TEXT("Next Tier - %s\nRequired: Level %d and %d Badges"),
            *ProgressionData.NextTier.TierName,
            ProgressionData.NextTier.RequiredLevel,
            ProgressionData.NextTier.RequiredBadges
        );
        NextTierRequirementsText->SetText(FText::FromString(RequirementsText));
    }
}

void UPlayerProfileWidget::UpdateChallenges(const TArray<FChallengeData>& Challenges)
{
    // Clear existing challenge cards
    ClearChallengeCards();

    if (!ChallengesBox || !ChallengeCardClass)
        return;

    // Create new challenge cards
    for (const FChallengeData& Challenge : Challenges)
    {
        UChallengeCardWidget* ChallengeCard = CreateWidget<UChallengeCardWidget>(this, ChallengeCardClass);
        if (ChallengeCard)
        {
            ChallengeCard->SetupChallenge(Challenge);
            ChallengeCard->OnChallengeProgressed.AddDynamic(
                this,
                &UPlayerProfileWidget::OnChallengeProgressed
            );
            
            ChallengesBox->AddChild(ChallengeCard);
            ActiveChallengeCards.Add(Challenge.Id, ChallengeCard);
        }
    }
}

void UPlayerProfileWidget::OnChallengeProgressed(const FString& ChallengeId, float Progress)
{
    UChallengeCardWidget** CardWidget = ActiveChallengeCards.Find(ChallengeId);
    if (CardWidget)
    {
        (*CardWidget)->UpdateProgress(Progress);
    }
}

void UPlayerProfileWidget::ClearChallengeCards()
{
    if (ChallengesBox)
    {
        ChallengesBox->ClearChildren();
    }
    ActiveChallengeCards.Empty();
} 