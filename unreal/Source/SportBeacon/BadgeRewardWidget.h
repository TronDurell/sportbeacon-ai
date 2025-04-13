#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/Image.h"
#include "Components/TextBlock.h"
#include "Components/Border.h"
#include "Components/WidgetAnimation.h"
#include "BadgeRewardWidget.generated.h"

USTRUCT(BlueprintType)
struct FBadgeData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString BadgeID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    UTexture2D* Icon;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString EarnedDate;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FLinearColor BadgeColor;
};

UCLASS()
class SPORTBEACON_API UBadgeRewardWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UBadgeRewardWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;

    UFUNCTION(BlueprintCallable, Category = "Badge")
    void DisplayEarnedBadge(const FBadgeData& BadgeData);

    UFUNCTION(BlueprintCallable, Category = "Badge")
    void SetBadgeIcon(UTexture2D* Icon);

    UFUNCTION(BlueprintCallable, Category = "Badge")
    void SetBadgeName(const FString& Name);

    UFUNCTION(BlueprintCallable, Category = "Badge")
    void SetBadgeDescription(const FString& Description);

    UFUNCTION(BlueprintCallable, Category = "Badge")
    void SetEarnedDate(const FString& Date);

    UFUNCTION(BlueprintImplementableEvent, Category = "Badge")
    void PlayBadgeAnimation();

    UFUNCTION(BlueprintImplementableEvent, Category = "Badge")
    void OnBadgeDisplayed();

protected:
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImage* BadgeIcon;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* BadgeNameText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* BadgeDescriptionText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* EarnedDateText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UBorder* BadgeBackground;

    UPROPERTY(Transient, meta = (BindWidgetAnim))
    UWidgetAnimation* FadeInAnimation;

    UPROPERTY(Transient, meta = (BindWidgetAnim))
    UWidgetAnimation* PulseAnimation;

    UPROPERTY(Transient, meta = (BindWidgetAnim))
    UWidgetAnimation* SparkleAnimation;

private:
    void InitializeAnimations();
    void PlayAnimationSequence();
}; 