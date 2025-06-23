#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/ScrollBox.h"
#include "Components/VerticalBox.h"
#include "Components/Border.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "TimelineFeedWidget.h"
#include "BadgeRewardWidget.h"
#include "PlayerProfileWidget.generated.h"

USTRUCT(BlueprintType)
struct FPlayerStats
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float PointsPerGame;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float AssistsPerGame;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ReboundsPerGame;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float StealsPlusBlocks;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float WinRate;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float FieldGoalPercentage;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ThreePointPercentage;
};

USTRUCT(BlueprintType)
struct FStatTrend
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString StatName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float CurrentValue;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float PreviousValue;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float PercentageChange;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bIsPositiveTrend;
};

USTRUCT(BlueprintType)
struct FPlayerProgressionData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    int32 TotalXP;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    int32 Level;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    float LevelProgress;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    FString Tier;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    FNextTierRequirements NextTier;
};

USTRUCT(BlueprintType)
struct FNextTierRequirements
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    FString TierName;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    int32 RequiredLevel;

    UPROPERTY(BlueprintReadWrite, Category = "Progression")
    int32 RequiredBadges;
};

USTRUCT(BlueprintType)
struct FChallengeData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    FString Id;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    FString Title;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    FString Description;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    FString Difficulty;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    int32 Target;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    int32 CurrentProgress;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    int32 XPReward;

    UPROPERTY(BlueprintReadWrite, Category = "Challenge")
    FString Category;
};

UCLASS()
class SPORTBEACON_API UPlayerProfileWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UPlayerProfileWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;

    // Profile Data Update Functions
    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void UpdatePlayerProfile(const FString& PlayerId);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void UpdateStats(const FPlayerStats& Stats);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void UpdateTrends(const TArray<FStatTrend>& Trends);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void AddHighlight(const FFeedEntry& Highlight);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void AddBadge(const FBadgeData& Badge);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void UpdateProgressionDisplay(const FPlayerProgressionData& ProgressionData);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void UpdateChallenges(const TArray<FChallengeData>& Challenges);

    UFUNCTION(BlueprintCallable, Category = "Player Profile")
    void OnChallengeProgressed(const FString& ChallengeId, float Progress);

    // UI Event Handlers
    UFUNCTION(BlueprintImplementableEvent, Category = "Player Profile")
    void OnStatsUpdated();

    UFUNCTION(BlueprintImplementableEvent, Category = "Player Profile")
    void OnTrendsUpdated();

    UFUNCTION(BlueprintImplementableEvent, Category = "Player Profile")
    void OnAvatarClicked();

protected:
    // Main Layout Sections
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* MainContainer;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UBorder* HeaderSection;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UScrollBox* ContentScroll;

    // Profile Header Elements
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImage* PlayerAvatar;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* PlayerNameText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* PlayerRankText;

    // Stats Display
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* StatsContainer;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* TrendsContainer;

    // Timeline and Badges
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTimelineFeedWidget* TimelineFeed;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* BadgesContainer;

    // 3D Avatar Viewport
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UGameViewportClient* AvatarViewport;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UProgressBar* XPProgressBar;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* LevelText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* TierText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UVerticalBox* ChallengesBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* NextTierRequirementsText;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
    TSubclassOf<class UChallengeCardWidget> ChallengeCardClass;

private:
    FString CurrentPlayerId;
    FPlayerStats CurrentStats;
    TArray<FStatTrend> CurrentTrends;

    UPROPERTY()
    TMap<FString, class UChallengeCardWidget*> ActiveChallengeCards;

    void InitializeAvatarViewport();
    void UpdateStatDisplay();
    void UpdateTrendDisplay();
    void UpdateBadgeProgress();
    
    UFUNCTION()
    void HandleAvatarClicked();

    void UpdateXPBar(int32 CurrentXP, int32 NextLevelXP);
    void UpdateTierDisplay(const FString& CurrentTier, const FNextTierRequirements& NextTier);
    void ClearChallengeCards();
}; 