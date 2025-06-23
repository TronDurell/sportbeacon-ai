#include "ChallengeCardWidget.h"
#include "Components/TextBlock.h"
#include "Components/ProgressBar.h"
#include "Components/Image.h"
#include "Components/Border.h"
#include "Engine/Texture2D.h"

void UChallengeCardWidget::NativeConstruct()
{
    Super::NativeConstruct();
    InitializeVisuals();
}

void UChallengeCardWidget::InitializeVisuals()
{
    // Initialize difficulty colors
    DifficultyColors.Add("easy", FLinearColor(0.2f, 0.8f, 0.2f));     // Green
    DifficultyColors.Add("medium", FLinearColor(1.0f, 0.7f, 0.0f));   // Yellow
    DifficultyColors.Add("hard", FLinearColor(1.0f, 0.2f, 0.2f));     // Red
    DifficultyColors.Add("elite", FLinearColor(0.5f, 0.0f, 1.0f));    // Purple

    // Load category icons
    // Note: These should be loaded from your game's content directory
    static ConstructorHelpers::FObjectFinder<UTexture2D> ShootingIcon(TEXT("/Game/UI/Icons/shooting_icon"));
    static ConstructorHelpers::FObjectFinder<UTexture2D> ConditioningIcon(TEXT("/Game/UI/Icons/conditioning_icon"));
    static ConstructorHelpers::FObjectFinder<UTexture2D> StrengthIcon(TEXT("/Game/UI/Icons/strength_icon"));
    static ConstructorHelpers::FObjectFinder<UTexture2D> SkillsIcon(TEXT("/Game/UI/Icons/skills_icon"));
    static ConstructorHelpers::FObjectFinder<UTexture2D> TeamworkIcon(TEXT("/Game/UI/Icons/teamwork_icon"));
    static ConstructorHelpers::FObjectFinder<UTexture2D> ConsistencyIcon(TEXT("/Game/UI/Icons/consistency_icon"));

    if (ShootingIcon.Succeeded()) CategoryIcons.Add("shooting", ShootingIcon.Object);
    if (ConditioningIcon.Succeeded()) CategoryIcons.Add("conditioning", ConditioningIcon.Object);
    if (StrengthIcon.Succeeded()) CategoryIcons.Add("strength", StrengthIcon.Object);
    if (SkillsIcon.Succeeded()) CategoryIcons.Add("skills", SkillsIcon.Object);
    if (TeamworkIcon.Succeeded()) CategoryIcons.Add("teamwork", TeamworkIcon.Object);
    if (ConsistencyIcon.Succeeded()) CategoryIcons.Add("consistency", ConsistencyIcon.Object);
}

void UChallengeCardWidget::SetupChallenge(const FChallengeData& ChallengeData)
{
    ChallengeId = ChallengeData.Id;
    TargetProgress = ChallengeData.Target;

    if (TitleText)
        TitleText->SetText(FText::FromString(ChallengeData.Title));
    
    if (DescriptionText)
        DescriptionText->SetText(FText::FromString(ChallengeData.Description));
    
    if (XPRewardText)
        XPRewardText->SetText(FText::FromString(FString::Printf(TEXT("+%d XP"), ChallengeData.XPReward)));

    SetDifficultyColor(ChallengeData.Difficulty);
    SetCategoryIcon(ChallengeData.Category);
    UpdateProgress(ChallengeData.CurrentProgress);
}

void UChallengeCardWidget::UpdateProgress(float NewProgress)
{
    UpdateProgressDisplay(NewProgress);
    OnChallengeProgressed.Broadcast(NewProgress);
}

void UChallengeCardWidget::UpdateProgressDisplay(float CurrentProgress)
{
    if (ProgressBar)
    {
        float ProgressRatio = FMath::Clamp(CurrentProgress / TargetProgress, 0.0f, 1.0f);
        ProgressBar->SetPercent(ProgressRatio);
    }

    if (ProgressText)
    {
        FString ProgressString = FString::Printf(TEXT("%d/%d"), 
            FMath::RoundToInt(CurrentProgress), 
            TargetProgress);
        ProgressText->SetText(FText::FromString(ProgressString));
    }
}

void UChallengeCardWidget::SetDifficultyColor(const FString& Difficulty)
{
    if (DifficultyBorder)
    {
        FLinearColor* Color = DifficultyColors.Find(Difficulty.ToLower());
        if (Color)
        {
            FLinearColor BorderColor = *Color;
            BorderColor.A = 0.3f; // Set transparency for better visual appeal
            DifficultyBorder->SetBrushColor(BorderColor);
        }
    }
}

void UChallengeCardWidget::SetCategoryIcon(const FString& Category)
{
    if (CategoryIcon)
    {
        UTexture2D** Icon = CategoryIcons.Find(Category.ToLower());
        if (Icon)
        {
            CategoryIcon->SetBrushFromTexture(*Icon);
        }
    }
} 