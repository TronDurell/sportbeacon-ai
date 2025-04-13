#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Components/WidgetComponent.h"
#include "TimerManager.h"
#include "MapView.generated.h"

UENUM(BlueprintType)
enum class EMarkerType : uint8
{
    Venue,
    Player,
    Event,
    Highlight
};

USTRUCT(BlueprintType)
struct FVenueData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Id;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> Sports;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector2D Coordinates;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> Images;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bIsIndoor;
};

USTRUCT(BlueprintType)
struct FPlayerData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Id;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Name;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector2D Coordinates;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AvatarUrl;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Sport;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Status;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString LastActive;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString VenueId;
};

USTRUCT(BlueprintType)
struct FEventData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Id;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString EventType;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString VenueId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Status;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FDateTime StartTime;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;
};

USTRUCT(BlueprintType)
struct FHighlightData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Id;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString PlayerId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString HighlightType;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ScoreImpact;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ConfidenceScore;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FDateTime Timestamp;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector2D Coordinates;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnVenueSelectedSignature, const FVenueData&, SelectedVenue);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPlayerSelectedSignature, const FPlayerData&, SelectedPlayer);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnEventSelectedSignature, const FEventData&, SelectedEvent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHighlightSelectedSignature, const FHighlightData&, SelectedHighlight);

UCLASS()
class SPORTBEACON_API AMapView : public AActor
{
    GENERATED_BODY()

public:
    AMapView();

    virtual void Tick(float DeltaTime) override;
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

    // Camera control functions
    UFUNCTION(BlueprintCallable, Category = "MapView|Camera")
    void ZoomIn(float Delta);

    UFUNCTION(BlueprintCallable, Category = "MapView|Camera")
    void ZoomOut(float Delta);

    UFUNCTION(BlueprintCallable, Category = "MapView|Camera")
    void PanCamera(const FVector2D& PanDelta);

    UFUNCTION(BlueprintCallable, Category = "MapView|Camera")
    void RotateCamera(float YawDelta);

    // Venue management
    UFUNCTION(BlueprintCallable, Category = "MapView|Venues")
    void UpdateVenues(const TArray<FVenueData>& NewVenues);

    UFUNCTION(BlueprintCallable, Category = "MapView|Venues")
    void SelectVenue(const FString& VenueId);

    // Player management
    UFUNCTION(BlueprintCallable, Category = "MapView|Players")
    void UpdatePlayers(const TArray<FPlayerData>& NewPlayers);

    UFUNCTION(BlueprintCallable, Category = "MapView|Players")
    void UpdatePlayerLocation(const FString& PlayerId, const FVector2D& NewLocation);

    UFUNCTION(BlueprintCallable, Category = "MapView|Players")
    void UpdatePlayerStatus(const FString& PlayerId, const FString& NewStatus);

    // Event management
    UFUNCTION(BlueprintCallable, Category = "MapView|Events")
    void UpdateEvents(const TArray<FEventData>& NewEvents);

    UFUNCTION(BlueprintCallable, Category = "MapView|Events")
    void UpdateEventStatus(const FString& EventId, const FString& NewStatus);

    // Selection events
    UPROPERTY(BlueprintAssignable, Category = "MapView|Events")
    FOnVenueSelectedSignature OnVenueSelected;

    UPROPERTY(BlueprintAssignable, Category = "MapView|Events")
    FOnPlayerSelectedSignature OnPlayerSelected;

    UPROPERTY(BlueprintAssignable, Category = "MapView|Events")
    FOnEventSelectedSignature OnEventSelected;

    // Highlight events
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHighlightSelectedSignature OnHighlightSelected;

    // Add new functions
    UFUNCTION(BlueprintCallable, Category = "Highlights")
    void UpdateHighlights(const TArray<FHighlightData>& Highlights);

    UFUNCTION(BlueprintCallable, Category = "Highlights")
    void SetHighlightFilters(const FString& PlayerFilter, const FString& TeamFilter, const FString& TypeFilter);

    UFUNCTION(BlueprintCallable, Category = "Highlights")
    void ClearHighlightFilters();

protected:
    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MapView")
    USceneComponent* MapRoot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MapView")
    UCameraComponent* MapCamera;

    // Map properties
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MapView|Settings")
    float MinZoom;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MapView|Settings")
    float MaxZoom;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MapView|Settings")
    float ZoomSpeed;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MapView|Settings")
    float PanSpeed;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MapView|Settings")
    float RotationSpeed;

    // Venue data
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "MapView|Data")
    TArray<FVenueData> Venues;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UStaticMesh* DefaultVenueMarker;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* IndoorVenueMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* OutdoorVenueMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UStaticMesh* PlayerMarkerMesh;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UStaticMesh* EventMarkerMesh;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* ActivePlayerMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* InactivePlayerMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* LiveEventMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    UMaterialInterface* UpcomingEventMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Visuals")
    TSubclassOf<UUserWidget> TooltipWidgetClass;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Animation")
    UCurveFloat* PulseCurve;

    UPROPERTY(EditDefaultsOnly, Category = "MapView|Animation")
    UCurveFloat* FadeCurve;

    // Add new member variables
    UPROPERTY(EditDefaultsOnly, Category = "Markers|Highlights")
    UStaticMesh* HighlightMarkerMesh;

    UPROPERTY(EditDefaultsOnly, Category = "Markers|Highlights")
    UMaterialInterface* ClutchPlayMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "Markers|Highlights")
    UMaterialInterface* HotStreakMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "Markers|Highlights")
    UMaterialInterface* MomentumShiftMaterial;

    UPROPERTY(EditDefaultsOnly, Category = "Markers|Highlights")
    UMaterialInterface* ImpactPlayMaterial;

    // Add new helper functions
    void SpawnHighlightMarker(const FHighlightData& HighlightData);
    void UpdateHighlightMarkerVisibility(const FHighlightData& HighlightData, UStaticMeshComponent* Marker);
    UMaterialInterface* GetHighlightMaterial(const FString& HighlightType);
    void HandleHighlightMarkerClicked(UPrimitiveComponent* ClickedComponent);

    // Cached components
    TMap<FString, AActor*> VenueMarkers;
    TMap<FString, AActor*> PlayerMarkers;
    TMap<FString, AActor*> EventMarkers;
    TMap<FString, UWidgetComponent*> MarkerTooltips;
    TMap<FString, FTimerHandle> AnimationTimers;

    // Data storage
    TArray<FPlayerData> Players;
    TArray<FEventData> Events;

    // Map properties
    FVector2D MapCenter;
    float CurrentZoom;

    // Add new member variables
    TMap<FString, UStaticMeshComponent*> HighlightMarkers;
    TArray<FHighlightData> ActiveHighlights;
    FString CurrentPlayerFilter;
    FString CurrentTeamFilter;
    FString CurrentTypeFilter;

private:
    // Internal methods
    void SpawnVenueMarkers();
    void UpdateMarkerVisuals();
    FVector LatLongToWorldLocation(const FVector2D& Coordinates) const;
    
    void SpawnPlayerMarkers();
    void SpawnEventMarkers();
    void UpdateMarkerAnimations();
    void HandleMarkerHover(AActor* HoveredActor);
    void ShowTooltip(AActor* MarkerActor);
    void HideTooltip();
    
    UFUNCTION()
    void OnPulseTimelineUpdate(float Value);
    
    UFUNCTION()
    void OnFadeTimelineUpdate(float Value);
}; 