#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "PlayerProfileWidget.h"
#include "ChallengeCardWidget.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnChallengeProgressedSignature, float, Progress);

UCLASS()
class SPORTBEACON_API UChallengeCardWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* TitleText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* DescriptionText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* ProgressText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UProgressBar* ProgressBar;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UTextBlock* XPRewardText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UImage* CategoryIcon;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    class UBorder* DifficultyBorder;

    UPROPERTY(BlueprintAssignable, Category = "Challenge")
    FOnChallengeProgressedSignature OnChallengeProgressed;

    UFUNCTION(BlueprintCallable, Category = "Challenge")
    void SetupChallenge(const FChallengeData& ChallengeData);

    UFUNCTION(BlueprintCallable, Category = "Challenge")
    void UpdateProgress(float NewProgress);

    UFUNCTION(BlueprintCallable, Category = "Challenge")
    const FString& GetChallengeId() const { return ChallengeId; }

protected:
    virtual void NativeConstruct() override;

private:
    FString ChallengeId;
    int32 TargetProgress;
    
    UPROPERTY()
    TMap<FString, UTexture2D*> CategoryIcons;
    
    UPROPERTY()
    TMap<FString, FLinearColor> DifficultyColors;

    void InitializeVisuals();
    void UpdateProgressDisplay(float CurrentProgress);
    void SetDifficultyColor(const FString& Difficulty);
    void SetCategoryIcon(const FString& Category);
}; 