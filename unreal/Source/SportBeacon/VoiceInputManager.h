#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Sound/SoundWave.h"
#include "VoiceInputManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSpeechRecognizedSignature, const FString&, RecognizedText);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnVoiceInputErrorSignature, const FString&, ErrorMessage);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnVoiceInputLevelSignature, float, InputLevel);

UCLASS(Blueprintable, BlueprintType)
class SPORTBEACON_API UVoiceInputManager : public UObject
{
    GENERATED_BODY()

public:
    UVoiceInputManager();

    UFUNCTION(BlueprintCallable, Category = "Voice Input")
    void StartRecording();

    UFUNCTION(BlueprintCallable, Category = "Voice Input")
    void StopRecording();

    UFUNCTION(BlueprintCallable, Category = "Voice Input")
    bool IsRecording() const { return bIsRecording; }

    UFUNCTION(BlueprintCallable, Category = "Voice Input")
    void SetLanguage(const FString& LanguageCode);

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Voice Input|Events")
    FOnSpeechRecognizedSignature OnSpeechRecognized;

    UPROPERTY(BlueprintAssignable, Category = "Voice Input|Events")
    FOnVoiceInputErrorSignature OnVoiceInputError;

    UPROPERTY(BlueprintAssignable, Category = "Voice Input|Events")
    FOnVoiceInputLevelSignature OnVoiceInputLevel;

protected:
    virtual void BeginDestroy() override;

private:
    bool bIsRecording;
    FString CurrentLanguage;
    TArray<uint8> AudioBuffer;
    
    // Audio capture components
    class UAudioComponent* AudioComponent;
    class UAudioCaptureComponent* CaptureComponent;

    // Audio processing
    void ProcessAudioData(const float* AudioData, int32 NumSamples);
    void SendAudioForRecognition();
    void CalculateAudioLevel(const float* AudioData, int32 NumSamples);

    // WebSocket connection for real-time transcription
    class FWebSocket* WebSocket;
    void InitializeWebSocket();
    void CleanupWebSocket();
    void OnWebSocketMessage(const FString& Message);
    void OnWebSocketConnected();
    void OnWebSocketError(const FString& Error);

    // Audio format settings
    static const int32 SampleRate = 16000;
    static const int32 NumChannels = 1;
    static const int32 BitsPerSample = 16;

    // Helpers
    void InitializeAudioCapture();
    void CleanupAudioCapture();
    bool ValidateAudioSetup() const;
}; 