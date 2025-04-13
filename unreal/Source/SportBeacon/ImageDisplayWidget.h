#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/Image.h"
#include "Components/TextBlock.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "ImageDisplayWidget.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnImageClickedSignature, const FString&, ImageId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnImageLoadedSignature, const FString&, ImageId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnImageErrorSignature, const FString&, ImageId, const FString&, ErrorMessage);

/**
 * Widget for displaying images with title, caption, and interactive features
 */
UCLASS()
class SPORTBEACON_API UImageDisplayWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UImageDisplayWidget(const FObjectInitializer& ObjectInitializer);

    // Load and display an image from URL
    UFUNCTION(BlueprintCallable, Category = "Image Display")
    void LoadImage(const FString& URL, const FString& ImageId, const FString& Title = TEXT(""), const FString& Caption = TEXT(""));

    // Set image display mode (fit, fill, etc.)
    UFUNCTION(BlueprintCallable, Category = "Image Display")
    void SetImageDisplayMode(TEnumAsByte<EImageDisplayMode> Mode);

    // Enable/disable hover effects
    UFUNCTION(BlueprintCallable, Category = "Image Display")
    void SetHoverEffectsEnabled(bool bEnabled);

protected:
    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    // UI Components
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImage* ImageDisplay;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* TitleText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* CaptionText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UBorder* ImageBorder;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UButton* ImageButton;

    // Delegates
    UPROPERTY(BlueprintAssignable, Category = "Image Display|Events")
    FOnImageClickedSignature OnImageClicked;

    UPROPERTY(BlueprintAssignable, Category = "Image Display|Events")
    FOnImageLoadedSignature OnImageLoaded;

    UPROPERTY(BlueprintAssignable, Category = "Image Display|Events")
    FOnImageErrorSignature OnImageError;

private:
    // Internal state
    FString CurrentImageId;
    FString CurrentImageURL;
    bool bIsLoading;
    bool bHoverEffectsEnabled;

    // Async texture loading
    void LoadImageTexture();
    void HandleImageLoaded(UTexture2D* LoadedTexture);
    void HandleImageLoadError(const FString& ErrorMessage);

    // UI Event handlers
    UFUNCTION()
    void OnImageButtonClicked();

    UFUNCTION()
    void OnHovered();

    UFUNCTION()
    void OnUnhovered();

    // Helper functions
    void UpdateLoadingState(bool bLoading);
    void ApplyHoverEffect(bool bHovered);
}; 