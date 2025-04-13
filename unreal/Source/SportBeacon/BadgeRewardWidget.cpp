#include "BadgeRewardWidget.h"
#include "Animation/UMGSequencePlayer.h"

UBadgeRewardWidget::UBadgeRewardWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
}

void UBadgeRewardWidget::NativeConstruct()
{
    Super::NativeConstruct();
    InitializeAnimations();
}

void UBadgeRewardWidget::DisplayEarnedBadge(const FBadgeData& BadgeData)
{
    // Set badge data
    SetBadgeIcon(BadgeData.Icon);
    SetBadgeName(BadgeData.Name);
    SetBadgeDescription(BadgeData.Description);
    SetEarnedDate(BadgeData.EarnedDate);

    // Set background color if provided
    if (BadgeBackground)
    {
        FLinearColor Color = BadgeData.BadgeColor;
        BadgeBackground->SetBrushColor(Color);
    }

    // Play animations
    PlayAnimationSequence();

    // Notify blueprint
    OnBadgeDisplayed();
}

void UBadgeRewardWidget::SetBadgeIcon(UTexture2D* Icon)
{
    if (BadgeIcon && Icon)
    {
        BadgeIcon->SetBrushFromTexture(Icon);
    }
}

void UBadgeRewardWidget::SetBadgeName(const FString& Name)
{
    if (BadgeNameText)
    {
        BadgeNameText->SetText(FText::FromString(Name));
    }
}

void UBadgeRewardWidget::SetBadgeDescription(const FString& Description)
{
    if (BadgeDescriptionText)
    {
        BadgeDescriptionText->SetText(FText::FromString(Description));
    }
}

void UBadgeRewardWidget::SetEarnedDate(const FString& Date)
{
    if (EarnedDateText)
    {
        EarnedDateText->SetText(FText::FromString(Date));
    }
}

void UBadgeRewardWidget::InitializeAnimations()
{
    // Set default animation properties if animations are bound
    if (FadeInAnimation)
    {
        FadeInAnimation->SetPlaybackSpeed(1.0f);
    }

    if (PulseAnimation)
    {
        PulseAnimation->SetPlaybackSpeed(1.0f);
    }

    if (SparkleAnimation)
    {
        SparkleAnimation->SetPlaybackSpeed(1.0f);
    }
}

void UBadgeRewardWidget::PlayAnimationSequence()
{
    // Play animations in sequence
    if (FadeInAnimation)
    {
        PlayAnimation(FadeInAnimation, 0.0f, 1, EUMGSequencePlayMode::Forward, 1.0f);
        
        // Chain animations using lambda
        FadeInAnimation->OnAnimationFinished_Add(
            FSimpleDelegate::CreateLambda([this]()
            {
                if (PulseAnimation)
                {
                    PlayAnimation(PulseAnimation, 0.0f, 1, EUMGSequencePlayMode::Forward, 1.0f);
                    
                    PulseAnimation->OnAnimationFinished_Add(
                        FSimpleDelegate::CreateLambda([this]()
                        {
                            if (SparkleAnimation)
                            {
                                PlayAnimation(SparkleAnimation, 0.0f, 1, EUMGSequencePlayMode::Forward, 1.0f);
                            }
                        })
                    );
                }
            })
        );
    }
} 