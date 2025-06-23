#include "ImageDisplayWidget.h"
#include "Engine/Texture2D.h"
#include "IImageWrapper.h"
#include "IImageWrapperModule.h"
#include "Modules/ModuleManager.h"
#include "Engine/TextureRenderTarget2D.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"

UImageDisplayWidget::UImageDisplayWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
    , bIsLoading(false)
    , bHoverEffectsEnabled(true)
{
}

void UImageDisplayWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Bind button events
    if (ImageButton)
    {
        ImageButton->OnClicked.AddDynamic(this, &UImageDisplayWidget::OnImageButtonClicked);
        ImageButton->OnHovered.AddDynamic(this, &UImageDisplayWidget::OnHovered);
        ImageButton->OnUnhovered.AddDynamic(this, &UImageDisplayWidget::OnUnhovered);
    }

    // Initialize UI state
    UpdateLoadingState(false);
}

void UImageDisplayWidget::LoadImage(const FString& URL, const FString& ImageId, const FString& Title, const FString& Caption)
{
    if (URL.IsEmpty())
    {
        HandleImageLoadError(TEXT("Invalid URL provided"));
        return;
    }

    CurrentImageId = ImageId;
    CurrentImageURL = URL;

    // Update UI elements
    if (TitleText)
    {
        TitleText->SetText(FText::FromString(Title));
    }

    if (CaptionText)
    {
        CaptionText->SetText(FText::FromString(Caption));
    }

    UpdateLoadingState(true);
    LoadImageTexture();
}

void UImageDisplayWidget::LoadImageTexture()
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();
    HttpRequest->SetVerb(TEXT("GET"));
    HttpRequest->SetURL(CurrentImageURL);
    
    HttpRequest->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
    {
        if (!bSuccess || !Response.IsValid())
        {
            AsyncTask(ENamedThreads::GameThread, [this]()
            {
                HandleImageLoadError(TEXT("Failed to download image"));
            });
            return;
        }

        // Load image data
        TArray<uint8> ImageData = Response->GetContent();
        IImageWrapperModule& ImageWrapperModule = FModuleManager::LoadModuleChecked<IImageWrapperModule>(FName("ImageWrapper"));
        
        // Detect image format
        EImageFormat ImageFormat = ImageWrapperModule.DetectImageFormat(ImageData.GetData(), ImageData.Num());
        if (ImageFormat == EImageFormat::Invalid)
        {
            AsyncTask(ENamedThreads::GameThread, [this]()
            {
                HandleImageLoadError(TEXT("Invalid image format"));
            });
            return;
        }

        // Create image wrapper
        TSharedPtr<IImageWrapper> ImageWrapper = ImageWrapperModule.CreateImageWrapper(ImageFormat);
        if (!ImageWrapper.IsValid() || !ImageWrapper->SetCompressed(ImageData.GetData(), ImageData.Num()))
        {
            AsyncTask(ENamedThreads::GameThread, [this]()
            {
                HandleImageLoadError(TEXT("Failed to process image data"));
            });
            return;
        }

        // Create texture
        const TArray<uint8>* RawData = nullptr;
        if (!ImageWrapper->GetRaw(ERGBFormat::BGRA, 8, RawData))
        {
            AsyncTask(ENamedThreads::GameThread, [this]()
            {
                HandleImageLoadError(TEXT("Failed to decode image"));
            });
            return;
        }

        // Create texture on game thread
        AsyncTask(ENamedThreads::GameThread, [this, RawData, ImageWrapper]()
        {
            UTexture2D* NewTexture = UTexture2D::CreateTransient(
                ImageWrapper->GetWidth(),
                ImageWrapper->GetHeight(),
                PF_B8G8R8A8
            );

            if (NewTexture)
            {
                void* TextureData = NewTexture->PlatformData->Mips[0].BulkData.Lock(LOCK_READ_WRITE);
                FMemory::Memcpy(TextureData, RawData->GetData(), RawData->Num());
                NewTexture->PlatformData->Mips[0].BulkData.Unlock();
                NewTexture->UpdateResource();

                HandleImageLoaded(NewTexture);
            }
            else
            {
                HandleImageLoadError(TEXT("Failed to create texture"));
            }
        });
    });

    HttpRequest->ProcessRequest();
}

void UImageDisplayWidget::HandleImageLoaded(UTexture2D* LoadedTexture)
{
    if (ImageDisplay && LoadedTexture)
    {
        ImageDisplay->SetBrushFromTexture(LoadedTexture);
        UpdateLoadingState(false);
        OnImageLoaded.Broadcast(CurrentImageId);
    }
}

void UImageDisplayWidget::HandleImageLoadError(const FString& ErrorMessage)
{
    UpdateLoadingState(false);
    OnImageError.Broadcast(CurrentImageId, ErrorMessage);
}

void UImageDisplayWidget::SetImageDisplayMode(TEnumAsByte<EImageDisplayMode> Mode)
{
    if (ImageDisplay)
    {
        switch (Mode)
        {
            case EImageDisplayMode::Fit:
                ImageDisplay->SetStretch(EStretch::ScaleToFit);
                break;
            case EImageDisplayMode::Fill:
                ImageDisplay->SetStretch(EStretch::ScaleToFill);
                break;
            default:
                ImageDisplay->SetStretch(EStretch::None);
                break;
        }
    }
}

void UImageDisplayWidget::SetHoverEffectsEnabled(bool bEnabled)
{
    bHoverEffectsEnabled = bEnabled;
    if (!bEnabled)
    {
        ApplyHoverEffect(false);
    }
}

void UImageDisplayWidget::OnImageButtonClicked()
{
    OnImageClicked.Broadcast(CurrentImageId);
}

void UImageDisplayWidget::OnHovered()
{
    if (bHoverEffectsEnabled)
    {
        ApplyHoverEffect(true);
    }
}

void UImageDisplayWidget::OnUnhovered()
{
    if (bHoverEffectsEnabled)
    {
        ApplyHoverEffect(false);
    }
}

void UImageDisplayWidget::UpdateLoadingState(bool bLoading)
{
    bIsLoading = bLoading;
    
    // Update UI elements to reflect loading state
    if (ImageDisplay)
    {
        ImageDisplay->SetVisibility(bLoading ? ESlateVisibility::Hidden : ESlateVisibility::Visible);
    }
}

void UImageDisplayWidget::ApplyHoverEffect(bool bHovered)
{
    if (ImageBorder)
    {
        // Apply hover effect (e.g., change border color, scale, etc.)
        FLinearColor BorderColor = bHovered ? FLinearColor(1.0f, 1.0f, 1.0f, 1.0f) : FLinearColor(0.5f, 0.5f, 0.5f, 1.0f);
        ImageBorder->SetBrushColor(BorderColor);
    }
}

void UImageDisplayWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);
    
    // Add any per-frame updates here if needed
} 