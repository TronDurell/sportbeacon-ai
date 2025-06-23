#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/Border.h"
#include "Components/TextBlock.h"
#include "Components/RichTextBlock.h"
#include "Components/Image.h"
#include "Components/VerticalBox.h"
#include "Components/HorizontalBox.h"
#include "ChatBubbleWidget.generated.h"

UENUM(BlueprintType)
enum class EChatBubbleStyle : uint8
{
    Player,
    Coach,
    System
};

USTRUCT(BlueprintType)
struct FChatMetadata
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Tag;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Focus;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Source;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FDateTime Timestamp;
};

UCLASS()
class SPORTBEACON_API UChatBubbleWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UBorder* MessageBorder;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UVerticalBox* ContentBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    URichTextBlock* MessageText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UHorizontalBox* MetadataBox;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* TagText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* FocusText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* SourceText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UTextBlock* TimestampText;

    UPROPERTY(BlueprintReadWrite, meta = (BindWidget))
    UImage* SenderIcon;

    // Setup methods
    UFUNCTION(BlueprintCallable, Category = "Chat Bubble")
    void SetupBubble(const FString& Message, EChatBubbleStyle Style, const FChatMetadata& Metadata);

    UFUNCTION(BlueprintCallable, Category = "Chat Bubble")
    void SetMessage(const FString& Message);

    UFUNCTION(BlueprintCallable, Category = "Chat Bubble")
    void SetStyle(EChatBubbleStyle Style);

    UFUNCTION(BlueprintCallable, Category = "Chat Bubble")
    void SetMetadata(const FChatMetadata& Metadata);

protected:
    virtual void NativeConstruct() override;

private:
    void UpdateBubbleStyle(EChatBubbleStyle Style);
    void UpdateMetadataVisibility();
    FString FormatTimestamp(const FDateTime& Timestamp);
}; 