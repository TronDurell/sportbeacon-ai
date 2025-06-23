#include "VoiceInputManager.h"
#include "WebSocketsModule.h"
#include "IWebSocket.h"
#include "AudioDevice.h"
#include "Components/AudioComponent.h"
#include "Sound/AudioCaptureComponent.h"
#include "JsonObjectConverter.h"
#include "Misc/Base64.h"
#include "Misc/ConfigCacheIni.h"

UVoiceInputManager::UVoiceInputManager()
    : bIsRecording(false)
    , CurrentLanguage(TEXT("en-US"))
    , AudioComponent(nullptr)
    , CaptureComponent(nullptr)
    , WebSocket(nullptr)
    , MaxRecordingDuration(30.0f)
    , SilenceThreshold(0.1f)
    , SampleRate(16000)
    , NumChannels(1)
{
    LoadConfiguration();
}

void UVoiceInputManager::LoadConfiguration()
{
    // Load configuration from config file
    if (GConfig)
    {
        GConfig->GetString(
            TEXT("VoiceInput"),
            TEXT("ApiKey"),
            ApiKey,
            GEngineIni
        );

        GConfig->GetString(
            TEXT("VoiceInput"),
            TEXT("ApiEndpoint"),
            ApiEndpoint,
            GEngineIni
        );

        GConfig->GetFloat(
            TEXT("VoiceInput"),
            TEXT("MaxRecordingDuration"),
            MaxRecordingDuration,
            GEngineIni
        );

        GConfig->GetFloat(
            TEXT("VoiceInput"),
            TEXT("SilenceThreshold"),
            SilenceThreshold,
            GEngineIni
        );

        GConfig->GetInt(
            TEXT("VoiceInput"),
            TEXT("SampleRate"),
            SampleRate,
            GEngineIni
        );

        GConfig->GetInt(
            TEXT("VoiceInput"),
            TEXT("NumChannels"),
            NumChannels,
            GEngineIni
        );
    }
}

void UVoiceInputManager::BeginDestroy()
{
    Super::BeginDestroy();
    
    CleanupWebSocket();
    CleanupAudioCapture();
}

void UVoiceInputManager::StartRecording()
{
    if (bIsRecording)
        return;

    if (!ValidateAudioSetup())
    {
        OnVoiceInputError.Broadcast(TEXT("Failed to initialize audio capture"));
        return;
    }

    InitializeWebSocket();
    
    if (CaptureComponent)
    {
        bIsRecording = true;
        AudioBuffer.Empty();
        CaptureComponent->Start();
    }
}

void UVoiceInputManager::StopRecording()
{
    if (!bIsRecording)
        return;

    if (CaptureComponent)
    {
        CaptureComponent->Stop();
    }

    bIsRecording = false;

    if (WebSocket && WebSocket->IsConnected())
    {
        // Send end-of-stream message
        TSharedPtr<FJsonObject> EndMsg = MakeShared<FJsonObject>();
        EndMsg->SetStringField(TEXT("type"), TEXT("end"));

        FString EndString;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&EndString);
        FJsonSerializer::Serialize(EndMsg.ToSharedRef(), Writer);

        WebSocket->Send(EndString);
    }
}

void UVoiceInputManager::SetLanguage(const FString& LanguageCode)
{
    CurrentLanguage = LanguageCode;

    if (WebSocket && WebSocket->IsConnected())
    {
        // Send language update message
        TSharedPtr<FJsonObject> LangMsg = MakeShared<FJsonObject>();
        LangMsg->SetStringField(TEXT("type"), TEXT("set_language"));
        LangMsg->SetStringField(TEXT("language"), LanguageCode);

        FString LangString;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&LangString);
        FJsonSerializer::Serialize(LangMsg.ToSharedRef(), Writer);

        WebSocket->Send(LangString);
    }
}

void UVoiceInputManager::InitializeAudioCapture()
{
    if (!AudioComponent)
    {
        AudioComponent = NewObject<UAudioComponent>(this);
        AudioComponent->bAutoDestroy = false;
        AudioComponent->bAutoActivate = true;
    }

    if (!CaptureComponent)
    {
        CaptureComponent = NewObject<UAudioCaptureComponent>(this);
        CaptureComponent->bAutoDestroy = false;
        
        // Configure audio capture
        CaptureComponent->SampleRate = SampleRate;
        CaptureComponent->NumChannels = NumChannels;
        CaptureComponent->OnAudioCapture.AddDynamic(this, &UVoiceInputManager::ProcessAudioData);
    }
}

void UVoiceInputManager::CleanupAudioCapture()
{
    if (CaptureComponent)
    {
        CaptureComponent->OnAudioCapture.RemoveAll(this);
        if (CaptureComponent->IsCapturing())
        {
            CaptureComponent->Stop();
        }
        CaptureComponent->ConditionalBeginDestroy();
        CaptureComponent = nullptr;
    }

    if (AudioComponent)
    {
        AudioComponent->ConditionalBeginDestroy();
        AudioComponent = nullptr;
    }
}

bool UVoiceInputManager::ValidateAudioSetup() const
{
    if (!CaptureComponent || !AudioComponent)
    {
        return false;
    }

    return true;
}

void UVoiceInputManager::ProcessAudioData(const float* AudioData, int32 NumSamples)
{
    if (!bIsRecording || !WebSocket || !WebSocket->IsConnected())
        return;

    // Calculate audio level for visualization
    CalculateAudioLevel(AudioData, NumSamples);

    // Convert float samples to int16 samples
    const int32 BytesPerSample = sizeof(int16);
    const int32 BufferSize = NumSamples * BytesPerSample;
    TArray<uint8> AudioBuffer;
    AudioBuffer.SetNum(BufferSize);

    int16* Int16Buffer = reinterpret_cast<int16*>(AudioBuffer.GetData());
    for (int32 i = 0; i < NumSamples; ++i)
    {
        Int16Buffer[i] = static_cast<int16>(AudioData[i] * 32767.0f);
    }

    // Create audio chunk message
    TSharedPtr<FJsonObject> AudioMsg = MakeShared<FJsonObject>();
    AudioMsg->SetStringField(TEXT("type"), TEXT("audio"));
    
    // Convert audio buffer to base64
    FString Base64Audio = FBase64::Encode(AudioBuffer.GetData(), AudioBuffer.Num());
    AudioMsg->SetStringField(TEXT("data"), Base64Audio);

    FString AudioString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&AudioString);
    FJsonSerializer::Serialize(AudioMsg.ToSharedRef(), Writer);

    WebSocket->Send(AudioString);
}

void UVoiceInputManager::CalculateAudioLevel(const float* AudioData, int32 NumSamples)
{
    float SumSquares = 0.0f;
    for (int32 i = 0; i < NumSamples; ++i)
    {
        SumSquares += AudioData[i] * AudioData[i];
    }

    float RMS = FMath::Sqrt(SumSquares / NumSamples);
    float DB = 20.0f * FMath::LogX(10.0f, RMS);
    
    // Normalize to 0-1 range
    float NormalizedLevel = FMath::GetMappedRangeValueClamped(
        FVector2D(-60.0f, 0.0f),
        FVector2D(0.0f, 1.0f),
        DB
    );

    OnVoiceInputLevel.Broadcast(NormalizedLevel);
}

void UVoiceInputManager::InitializeWebSocket()
{
    if (WebSocket)
    {
        CleanupWebSocket();
    }

    // Get the WebSocket URL from config
    FString WSUrl;
    if (!GConfig->GetString(
        TEXT("VoiceInput"),
        TEXT("WebSocketURL"),
        WSUrl,
        GEngineIni))
    {
        WSUrl = TEXT("ws://localhost:3001/speech-to-text");
    }

    WebSocket = FWebSocketsModule::Get().CreateWebSocket(WSUrl);

    // Set up event handlers
    WebSocket->OnConnected().AddLambda([this]() {
        // Send initialization message with player ID and language
        TSharedPtr<FJsonObject> InitMsg = MakeShared<FJsonObject>();
        InitMsg->SetStringField(TEXT("type"), TEXT("init"));
        InitMsg->SetStringField(TEXT("player_id"), GetWorld()->GetFirstPlayerController()->PlayerState->GetPlayerName());
        InitMsg->SetStringField(TEXT("language"), CurrentLanguage);

        FString InitString;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&InitString);
        FJsonSerializer::Serialize(InitMsg.ToSharedRef(), Writer);

        WebSocket->Send(InitString);
    });

    WebSocket->OnMessage().AddLambda([this](const FString& Message) {
        TSharedPtr<FJsonObject> JsonMessage;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);

        if (FJsonSerializer::Deserialize(Reader, JsonMessage))
        {
            FString MessageType = JsonMessage->GetStringField(TEXT("type"));
            
            if (MessageType == TEXT("recognition_result"))
            {
                FString RecognizedText = JsonMessage->GetStringField(TEXT("text"));
                bool bIsFinal = JsonMessage->GetBoolField(TEXT("isFinal"));
                
                if (bIsFinal)
                {
                    OnSpeechRecognized.Broadcast(RecognizedText);
                }
            }
            else if (MessageType == TEXT("error"))
            {
                FString ErrorMessage = JsonMessage->GetStringField(TEXT("message"));
                OnVoiceInputError.Broadcast(ErrorMessage);
            }
        }
    });

    WebSocket->OnConnectionError().AddLambda([this](const FString& Error) {
        OnVoiceInputError.Broadcast(Error);
        bIsRecording = false;
    });

    WebSocket->Connect();
}

void UVoiceInputManager::CleanupWebSocket()
{
    if (WebSocket)
    {
        if (WebSocket->IsConnected())
        {
            WebSocket->Close();
        }
        delete WebSocket;
        WebSocket = nullptr;
    }
}

bool UVoiceInputManager::ValidateApiKey() const
{
    return !ApiKey.IsEmpty() && !ApiEndpoint.IsEmpty();
} 