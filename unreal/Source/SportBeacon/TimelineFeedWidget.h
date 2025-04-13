#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/VerticalBox.h"
#include "Components/ScrollBox.h"
#include "BadgeRewardWidget.h"
#include "TimelineFeedWidget.generated.h"

USTRUCT(BlueprintType)
struct FFeedEntry
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Subtitle;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    UTexture2D* Icon;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FDateTime Timestamp;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString EntryType;  // "badge", "highlight", "stat", etc.

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FBadgeData BadgeData;  // Optional, only for badge entries
};

UCLASS()
class SPORTBEACON_API UTimelineFeedWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UTimelineFeedWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;

    UFUNCTION(BlueprintCallable, Category = "Timeline")
    void AddFeedEntry(const FFeedEntry& Entry);

    UFUNCTION(BlueprintCallable, Category = "Timeline")
    void AddBadgeEntry(const FBadgeData& BadgeData);

    UFUNCTION(BlueprintCallable, Category = "Timeline")
    void ClearFeed();

    UFUNCTION(BlueprintImplementableEvent, Category = "Timeline")
    void OnNewEntryAdded(const FFeedEntry& Entry);

protected:
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UScrollBox* FeedScrollBox;

    UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Timeline")
    TSubclassOf<UUserWidget> DefaultFeedEntryClass;

    UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Timeline")
    TSubclassOf<UBadgeRewardWidget> BadgeEntryClass;

    UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Timeline")
    int32 MaxEntries;

private:
    UPROPERTY()
    TArray<UUserWidget*> FeedEntries;

    void TrimOldEntries();
    void ScrollToLatest();
    UUserWidget* CreateFeedEntryWidget(const FFeedEntry& Entry);
}; 