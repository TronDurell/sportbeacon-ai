#include "ChatBubbleWidget.h"
#include "Styling/SlateColor.h"
#include "Styling/SlateBrush.h"

void UChatBubbleWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Set default styles
    if (MessageBorder)
    {
        MessageBorder->SetPadding(FMargin(12.0f, 8.0f));
        MessageBorder->SetBrushColor(FLinearColor(0.1f, 0.1f, 0.1f, 0.95f));
    }

    if (MessageText)
    {
        MessageText->SetColorAndOpacity(FSlateColor(FLinearColor::White));
    }

    if (MetadataBox)
    {
        MetadataBox->SetVisibility(ESlateVisibility::Collapsed);
    }
}

void UChatBubbleWidget::SetupBubble(const FString& Message, EChatBubbleStyle Style, const FChatMetadata& Metadata)
{
    SetMessage(Message);
    SetStyle(Style);
    SetMetadata(Metadata);
}

void UChatBubbleWidget::SetMessage(const FString& Message)
{
    if (MessageText)
    {
        MessageText->SetText(FText::FromString(Message));
    }
}

void UChatBubbleWidget::SetStyle(EChatBubbleStyle Style)
{
    UpdateBubbleStyle(Style);
}

void UChatBubbleWidget::SetMetadata(const FChatMetadata& Metadata)
{
    if (TagText && !Metadata.Tag.IsEmpty())
    {
        TagText->SetText(FText::FromString(Metadata.Tag));
    }

    if (FocusText && !Metadata.Focus.IsEmpty())
    {
        FocusText->SetText(FText::FromString(Metadata.Focus));
    }

    if (SourceText && !Metadata.Source.IsEmpty())
    {
        SourceText->SetText(FText::FromString(Metadata.Source));
    }

    if (TimestampText)
    {
        TimestampText->SetText(FText::FromString(FormatTimestamp(Metadata.Timestamp)));
    }

    UpdateMetadataVisibility();
}

void UChatBubbleWidget::UpdateBubbleStyle(EChatBubbleStyle Style)
{
    if (!MessageBorder)
        return;

    FLinearColor BorderColor;
    FLinearColor TextColor = FLinearColor::White;
    float CornerRadius = 16.0f;

    switch (Style)
    {
        case EChatBubbleStyle::Player:
            BorderColor = FLinearColor(0.2f, 0.6f, 1.0f, 0.95f); // Blue
            MessageBorder->SetPadding(FMargin(12.0f, 8.0f, 16.0f, 8.0f));
            break;

        case EChatBubbleStyle::Coach:
            BorderColor = FLinearColor(0.2f, 0.8f, 0.2f, 0.95f); // Green
            MessageBorder->SetPadding(FMargin(16.0f, 8.0f, 12.0f, 8.0f));
            break;

        case EChatBubbleStyle::System:
            BorderColor = FLinearColor(0.5f, 0.5f, 0.5f, 0.95f); // Gray
            TextColor = FLinearColor(0.8f, 0.8f, 0.8f, 1.0f);
            CornerRadius = 8.0f;
            MessageBorder->SetPadding(FMargin(12.0f, 4.0f));
            break;
    }

    // Apply styles
    MessageBorder->SetBrushColor(BorderColor);
    
    if (MessageText)
    {
        MessageText->SetColorAndOpacity(FSlateColor(TextColor));
    }

    // Update corner radius
    FSlateBrush NewBrush;
    NewBrush.DrawAs = ESlateBrushDrawType::Box;
    NewBrush.OutlineSettings.Width = 1.0f;
    NewBrush.Margin = FMargin(CornerRadius);
    MessageBorder->SetBrush(NewBrush);
}

void UChatBubbleWidget::UpdateMetadataVisibility()
{
    if (!MetadataBox)
        return;

    bool bHasMetadata = false;

    if (TagText && !TagText->GetText().IsEmpty())
        bHasMetadata = true;
    
    if (FocusText && !FocusText->GetText().IsEmpty())
        bHasMetadata = true;
    
    if (SourceText && !SourceText->GetText().IsEmpty())
        bHasMetadata = true;

    MetadataBox->SetVisibility(bHasMetadata ? ESlateVisibility::Visible : ESlateVisibility::Collapsed);
}

FString UChatBubbleWidget::FormatTimestamp(const FDateTime& Timestamp)
{
    if (Timestamp.GetTicks() == 0)
        return FString();

    return Timestamp.ToString(TEXT("%H:%M"));
} 