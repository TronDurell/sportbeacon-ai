#include "MapView.h"
#include "Engine/StaticMeshActor.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Components/WidgetComponent.h"
#include "Kismet/GameplayStatics.h"
#include "TimerManager.h"

AMapView::AMapView()
{
    PrimaryActorTick.bCanEverTick = true;

    // Create components
    MapRoot = CreateDefaultSubobject<USceneComponent>(TEXT("MapRoot"));
    RootComponent = MapRoot;

    MapCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("MapCamera"));
    MapCamera->SetupAttachment(MapRoot);
    MapCamera->SetRelativeLocation(FVector(0.0f, 0.0f, 1000.0f));
    MapCamera->SetRelativeRotation(FRotator(-90.0f, 0.0f, 0.0f));

    // Initialize default values
    MinZoom = 500.0f;
    MaxZoom = 5000.0f;
    ZoomSpeed = 100.0f;
    PanSpeed = 1.0f;
    RotationSpeed = 1.0f;
    CurrentZoom = 1000.0f;
    MapCenter = FVector2D::ZeroVector;
}

void AMapView::BeginPlay()
{
    Super::BeginPlay();
    
    // Set initial camera position
    MapCamera->SetRelativeLocation(FVector(0.0f, 0.0f, CurrentZoom));
    
    // Spawn initial markers if we have venue data
    SpawnVenueMarkers();
}

void AMapView::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void AMapView::ZoomIn(float Delta)
{
    float NewZoom = FMath::Clamp(CurrentZoom - Delta * ZoomSpeed, MinZoom, MaxZoom);
    float ZoomDelta = NewZoom - CurrentZoom;
    CurrentZoom = NewZoom;
    
    // Update camera position
    FVector CameraLocation = MapCamera->GetRelativeLocation();
    CameraLocation.Z = CurrentZoom;
    MapCamera->SetRelativeLocation(CameraLocation);
}

void AMapView::ZoomOut(float Delta)
{
    ZoomIn(-Delta);
}

void AMapView::PanCamera(const FVector2D& PanDelta)
{
    // Scale pan amount by current zoom level
    float PanScale = CurrentZoom / MaxZoom;
    FVector NewLocation = MapRoot->GetRelativeLocation();
    NewLocation.X += PanDelta.X * PanSpeed * PanScale;
    NewLocation.Y += PanDelta.Y * PanSpeed * PanScale;
    
    MapRoot->SetRelativeLocation(NewLocation);
    MapCenter += FVector2D(PanDelta.X, PanDelta.Y) * PanScale;
}

void AMapView::RotateCamera(float YawDelta)
{
    FRotator NewRotation = MapCamera->GetRelativeRotation();
    NewRotation.Yaw += YawDelta * RotationSpeed;
    MapCamera->SetRelativeRotation(NewRotation);
}

void AMapView::UpdateVenues(const TArray<FVenueData>& NewVenues)
{
    // Clear existing markers
    for (auto& Marker : VenueMarkers)
    {
        if (Marker.Value)
        {
            Marker.Value->Destroy();
        }
    }
    VenueMarkers.Empty();
    
    // Update venue data
    Venues = NewVenues;
    
    // Spawn new markers
    SpawnVenueMarkers();
}

void AMapView::SelectVenue(const FString& VenueId)
{
    for (const FVenueData& Venue : Venues)
    {
        if (Venue.Id == VenueId)
        {
            OnVenueSelected.Broadcast(Venue);
            
            // Highlight selected venue marker
            if (AActor* Marker = VenueMarkers.FindRef(VenueId))
            {
                // TODO: Implement marker highlight effect
            }
            break;
        }
    }
}

void AMapView::SpawnVenueMarkers()
{
    if (!DefaultVenueMarker)
    {
        UE_LOG(LogTemp, Warning, TEXT("DefaultVenueMarker not set in MapView"));
        return;
    }

    for (const FVenueData& Venue : Venues)
    {
        // Convert lat/long to world location
        FVector Location = LatLongToWorldLocation(Venue.Coordinates);
        
        // Spawn marker actor
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        
        AStaticMeshActor* MarkerActor = GetWorld()->SpawnActor<AStaticMeshActor>(
            AStaticMeshActor::StaticClass(),
            Location,
            FRotator::ZeroRotator,
            SpawnParams
        );
        
        if (MarkerActor)
        {
            // Setup marker
            MarkerActor->SetMobility(EComponentMobility::Movable);
            MarkerActor->GetStaticMeshComponent()->SetStaticMesh(DefaultVenueMarker);
            
            // Apply appropriate material
            UMaterialInterface* MaterialToUse = Venue.bIsIndoor ? IndoorVenueMaterial : OutdoorVenueMaterial;
            if (MaterialToUse)
            {
                UMaterialInstanceDynamic* DynamicMaterial = UMaterialInstanceDynamic::Create(MaterialToUse, this);
                MarkerActor->GetStaticMeshComponent()->SetMaterial(0, DynamicMaterial);
            }
            
            // Store reference
            VenueMarkers.Add(Venue.Id, MarkerActor);
            
            // Setup click handling
            MarkerActor->Tags.Add(FName(*Venue.Id));
        }
    }
}

void AMapView::UpdateMarkerVisuals()
{
    // Update marker scale based on zoom level
    float Scale = FMath::GetMappedRangeValueClamped(
        FVector2D(MinZoom, MaxZoom),
        FVector2D(0.5f, 2.0f),
        CurrentZoom
    );
    
    for (auto& Marker : VenueMarkers)
    {
        if (AStaticMeshActor* MarkerActor = Cast<AStaticMeshActor>(Marker.Value))
        {
            MarkerActor->SetActorScale3D(FVector(Scale));
        }
    }
}

FVector AMapView::LatLongToWorldLocation(const FVector2D& Coordinates) const
{
    // Simple Mercator projection
    // Note: For a real implementation, you'd want to use a proper map projection
    const float WorldScale = 100.0f; // Scale factor for world coordinates
    
    float X = Coordinates.X * WorldScale;
    float Y = FMath::Loge(FMath::Tan(FMath::DegreesToRadians(Coordinates.Y) / 2.0f + PI / 4.0f)) * WorldScale;
    
    return FVector(X, Y, 0.0f);
}

void AMapView::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    Super::EndPlay(EndPlayReason);
    
    // Clear all timers
    for (auto& Timer : AnimationTimers)
    {
        GetWorld()->GetTimerManager().ClearTimer(Timer.Value);
    }
}

void AMapView::UpdatePlayers(const TArray<FPlayerData>& NewPlayers)
{
    // Clear existing player markers
    for (auto& Marker : PlayerMarkers)
    {
        if (Marker.Value)
        {
            Marker.Value->Destroy();
        }
    }
    PlayerMarkers.Empty();
    
    // Update player data
    Players = NewPlayers;
    
    // Spawn new markers
    SpawnPlayerMarkers();
}

void AMapView::UpdatePlayerLocation(const FString& PlayerId, const FVector2D& NewLocation)
{
    // Find player data and update
    for (FPlayerData& Player : Players)
    {
        if (Player.Id == PlayerId)
        {
            Player.Coordinates = NewLocation;
            
            // Update marker position
            if (AActor* Marker = PlayerMarkers.FindRef(PlayerId))
            {
                FVector WorldLocation = LatLongToWorldLocation(NewLocation);
                Marker->SetActorLocation(WorldLocation);
            }
            break;
        }
    }
}

void AMapView::UpdatePlayerStatus(const FString& PlayerId, const FString& NewStatus)
{
    for (FPlayerData& Player : Players)
    {
        if (Player.Id == PlayerId)
        {
            Player.Status = NewStatus;
            
            // Update marker visuals
            if (AActor* Marker = PlayerMarkers.FindRef(PlayerId))
            {
                UMaterialInterface* MaterialToUse = 
                    NewStatus == "active" ? ActivePlayerMaterial : InactivePlayerMaterial;
                
                if (MaterialToUse)
                {
                    UMaterialInstanceDynamic* DynamicMaterial = 
                        UMaterialInstanceDynamic::Create(MaterialToUse, this);
                    Cast<AStaticMeshActor>(Marker)->GetStaticMeshComponent()->SetMaterial(0, DynamicMaterial);
                }
                
                // Start fade animation if player becomes inactive
                if (NewStatus != "active")
                {
                    StartFadeAnimation(PlayerId);
                }
            }
            break;
        }
    }
}

void AMapView::UpdateEvents(const TArray<FEventData>& NewEvents)
{
    // Clear existing event markers
    for (auto& Marker : EventMarkers)
    {
        if (Marker.Value)
        {
            Marker.Value->Destroy();
        }
    }
    EventMarkers.Empty();
    
    // Update event data
    Events = NewEvents;
    
    // Spawn new markers
    SpawnEventMarkers();
}

void AMapView::UpdateEventStatus(const FString& EventId, const FString& NewStatus)
{
    for (FEventData& Event : Events)
    {
        if (Event.Id == EventId)
        {
            Event.Status = NewStatus;
            
            // Update marker visuals
            if (AActor* Marker = EventMarkers.FindRef(EventId))
            {
                UMaterialInterface* MaterialToUse = 
                    NewStatus == "active" ? LiveEventMaterial : UpcomingEventMaterial;
                
                if (MaterialToUse)
                {
                    UMaterialInstanceDynamic* DynamicMaterial = 
                        UMaterialInstanceDynamic::Create(MaterialToUse, this);
                    Cast<AStaticMeshActor>(Marker)->GetStaticMeshComponent()->SetMaterial(0, DynamicMaterial);
                }
                
                // Start pulse animation for live events
                if (NewStatus == "active")
                {
                    StartPulseAnimation(EventId);
                }
            }
            break;
        }
    }
}

void AMapView::SpawnPlayerMarkers()
{
    if (!PlayerMarkerMesh)
    {
        UE_LOG(LogTemp, Warning, TEXT("PlayerMarkerMesh not set in MapView"));
        return;
    }

    for (const FPlayerData& Player : Players)
    {
        FVector Location = LatLongToWorldLocation(Player.Coordinates);
        
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        
        AStaticMeshActor* MarkerActor = GetWorld()->SpawnActor<AStaticMeshActor>(
            AStaticMeshActor::StaticClass(),
            Location,
            FRotator::ZeroRotator,
            SpawnParams
        );
        
        if (MarkerActor)
        {
            // Setup marker
            MarkerActor->SetMobility(EComponentMobility::Movable);
            MarkerActor->GetStaticMeshComponent()->SetStaticMesh(PlayerMarkerMesh);
            
            // Apply material based on status
            UMaterialInterface* MaterialToUse = 
                Player.Status == "active" ? ActivePlayerMaterial : InactivePlayerMaterial;
            
            if (MaterialToUse)
            {
                UMaterialInstanceDynamic* DynamicMaterial = 
                    UMaterialInstanceDynamic::Create(MaterialToUse, this);
                MarkerActor->GetStaticMeshComponent()->SetMaterial(0, DynamicMaterial);
            }
            
            // Add tooltip widget
            if (TooltipWidgetClass)
            {
                UWidgetComponent* TooltipWidget = NewObject<UWidgetComponent>(MarkerActor);
                TooltipWidget->SetWidgetClass(TooltipWidgetClass);
                TooltipWidget->AttachToComponent(
                    MarkerActor->GetRootComponent(),
                    FAttachmentTransformRules::KeepRelativeTransform
                );
                TooltipWidget->SetVisibility(false);
                MarkerTooltips.Add(Player.Id, TooltipWidget);
            }
            
            // Store reference
            PlayerMarkers.Add(Player.Id, MarkerActor);
            MarkerActor->Tags.Add(FName(*Player.Id));
            
            // Start animations if needed
            if (Player.Status != "active")
            {
                StartFadeAnimation(Player.Id);
            }
        }
    }
}

void AMapView::SpawnEventMarkers()
{
    if (!EventMarkerMesh)
    {
        UE_LOG(LogTemp, Warning, TEXT("EventMarkerMesh not set in MapView"));
        return;
    }

    for (const FEventData& Event : Events)
    {
        // Get venue location for the event
        FVector2D VenueCoords;
        for (const FVenueData& Venue : Venues)
        {
            if (Venue.Id == Event.VenueId)
            {
                VenueCoords = Venue.Coordinates;
                break;
            }
        }
        
        FVector Location = LatLongToWorldLocation(VenueCoords);
        Location.Z += 100.0f; // Offset above venue marker
        
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        
        AStaticMeshActor* MarkerActor = GetWorld()->SpawnActor<AStaticMeshActor>(
            AStaticMeshActor::StaticClass(),
            Location,
            FRotator::ZeroRotator,
            SpawnParams
        );
        
        if (MarkerActor)
        {
            // Setup marker
            MarkerActor->SetMobility(EComponentMobility::Movable);
            MarkerActor->GetStaticMeshComponent()->SetStaticMesh(EventMarkerMesh);
            
            // Apply material based on status
            UMaterialInterface* MaterialToUse = 
                Event.Status == "active" ? LiveEventMaterial : UpcomingEventMaterial;
            
            if (MaterialToUse)
            {
                UMaterialInstanceDynamic* DynamicMaterial = 
                    UMaterialInstanceDynamic::Create(MaterialToUse, this);
                MarkerActor->GetStaticMeshComponent()->SetMaterial(0, DynamicMaterial);
            }
            
            // Add tooltip widget
            if (TooltipWidgetClass)
            {
                UWidgetComponent* TooltipWidget = NewObject<UWidgetComponent>(MarkerActor);
                TooltipWidget->SetWidgetClass(TooltipWidgetClass);
                TooltipWidget->AttachToComponent(
                    MarkerActor->GetRootComponent(),
                    FAttachmentTransformRules::KeepRelativeTransform
                );
                TooltipWidget->SetVisibility(false);
                MarkerTooltips.Add(Event.Id, TooltipWidget);
            }
            
            // Store reference
            EventMarkers.Add(Event.Id, MarkerActor);
            MarkerActor->Tags.Add(FName(*Event.Id));
            
            // Start animations if needed
            if (Event.Status == "active")
            {
                StartPulseAnimation(Event.Id);
            }
        }
    }
}

void AMapView::HandleMarkerHover(AActor* HoveredActor)
{
    if (!HoveredActor || HoveredActor->Tags.Num() == 0)
    {
        HideTooltip();
        return;
    }
    
    ShowTooltip(HoveredActor);
}

void AMapView::ShowTooltip(AActor* MarkerActor)
{
    FString Id = MarkerActor->Tags[0].ToString();
    if (UWidgetComponent* TooltipWidget = MarkerTooltips.FindRef(Id))
    {
        TooltipWidget->SetVisibility(true);
        
        // Update tooltip content based on marker type
        if (PlayerMarkers.Contains(Id))
        {
            // Update player tooltip
            for (const FPlayerData& Player : Players)
            {
                if (Player.Id == Id)
                {
                    // TODO: Update tooltip widget with player data
                    break;
                }
            }
        }
        else if (EventMarkers.Contains(Id))
        {
            // Update event tooltip
            for (const FEventData& Event : Events)
            {
                if (Event.Id == Id)
                {
                    // TODO: Update tooltip widget with event data
                    break;
                }
            }
        }
    }
}

void AMapView::HideTooltip()
{
    for (auto& Tooltip : MarkerTooltips)
    {
        if (Tooltip.Value)
        {
            Tooltip.Value->SetVisibility(false);
        }
    }
}

void AMapView::StartPulseAnimation(const FString& MarkerId)
{
    if (!PulseCurve)
    {
        return;
    }
    
    // Clear existing timer if any
    FTimerHandle& Timer = AnimationTimers.FindOrAdd(MarkerId);
    GetWorld()->GetTimerManager().ClearTimer(Timer);
    
    // Setup pulse animation
    FTimerDelegate TimerDelegate;
    TimerDelegate.BindUFunction(this, "OnPulseTimelineUpdate", MarkerId);
    
    GetWorld()->GetTimerManager().SetTimer(
        Timer,
        TimerDelegate,
        0.016f, // 60 FPS
        true
    );
}

void AMapView::StartFadeAnimation(const FString& MarkerId)
{
    if (!FadeCurve)
    {
        return;
    }
    
    // Clear existing timer if any
    FTimerHandle& Timer = AnimationTimers.FindOrAdd(MarkerId);
    GetWorld()->GetTimerManager().ClearTimer(Timer);
    
    // Setup fade animation
    FTimerDelegate TimerDelegate;
    TimerDelegate.BindUFunction(this, "OnFadeTimelineUpdate", MarkerId);
    
    GetWorld()->GetTimerManager().SetTimer(
        Timer,
        TimerDelegate,
        0.016f, // 60 FPS
        true
    );
}

void AMapView::OnPulseTimelineUpdate(float Value)
{
    // Apply pulse effect to marker scale
    const float BaseScale = 1.0f;
    const float PulseAmount = 0.2f;
    float NewScale = BaseScale + (PulseAmount * Value);
    
    // Update all active event markers
    for (const auto& Event : Events)
    {
        if (Event.Status == "active")
        {
            if (AActor* Marker = EventMarkers.FindRef(Event.Id))
            {
                Marker->SetActorScale3D(FVector(NewScale));
            }
        }
    }
}

void AMapView::OnFadeTimelineUpdate(float Value)
{
    // Apply fade effect to marker opacity
    for (const auto& Player : Players)
    {
        if (Player.Status != "active")
        {
            if (AActor* Marker = PlayerMarkers.FindRef(Player.Id))
            {
                if (UMaterialInstanceDynamic* DynamicMaterial = 
                    Cast<UMaterialInstanceDynamic>(
                        Cast<AStaticMeshActor>(Marker)->GetStaticMeshComponent()->GetMaterial(0)
                    ))
                {
                    DynamicMaterial->SetScalarParameterValue("Opacity", Value);
                }
            }
        }
    }
}

void AMapView::UpdateHighlights(const TArray<FHighlightData>& Highlights)
{
    // Clear existing highlight markers
    for (auto& Pair : HighlightMarkers)
    {
        if (Pair.Value)
        {
            Pair.Value->DestroyComponent();
        }
    }
    HighlightMarkers.Empty();
    ActiveHighlights = Highlights;

    // Spawn new markers for each highlight
    for (const auto& Highlight : Highlights)
    {
        SpawnHighlightMarker(Highlight);
    }
}

void AMapView::SetHighlightFilters(const FString& PlayerFilter, const FString& TeamFilter, const FString& TypeFilter)
{
    CurrentPlayerFilter = PlayerFilter;
    CurrentTeamFilter = TeamFilter;
    CurrentTypeFilter = TypeFilter;

    // Update visibility of existing markers based on new filters
    for (const auto& Highlight : ActiveHighlights)
    {
        if (UStaticMeshComponent* Marker = HighlightMarkers.FindRef(Highlight.Id))
        {
            UpdateHighlightMarkerVisibility(Highlight, Marker);
        }
    }
}

void AMapView::ClearHighlightFilters()
{
    CurrentPlayerFilter.Empty();
    CurrentTeamFilter.Empty();
    CurrentTypeFilter.Empty();

    // Show all markers
    for (const auto& Pair : HighlightMarkers)
    {
        if (Pair.Value)
        {
            Pair.Value->SetVisibility(true);
        }
    }
}

void AMapView::SpawnHighlightMarker(const FHighlightData& HighlightData)
{
    if (!HighlightMarkerMesh)
    {
        UE_LOG(LogTemp, Warning, TEXT("Highlight marker mesh not set"));
        return;
    }

    FString MarkerName = FString::Printf(TEXT("HighlightMarker_%s"), *HighlightData.Id);
    UStaticMeshComponent* MarkerComponent = NewObject<UStaticMeshComponent>(this, *MarkerName);
    MarkerComponent->SetStaticMesh(HighlightMarkerMesh);
    MarkerComponent->SetMaterial(0, GetHighlightMaterial(HighlightData.HighlightType));
    MarkerComponent->RegisterComponent();

    // Set world location based on map coordinates
    FVector WorldLocation = ConvertMapCoordinatesToWorld(HighlightData.Coordinates);
    MarkerComponent->SetWorldLocation(WorldLocation);

    // Set up click handling
    MarkerComponent->OnClicked.AddDynamic(this, &AMapView::HandleHighlightMarkerClicked);

    // Store the marker
    HighlightMarkers.Add(HighlightData.Id, MarkerComponent);

    // Update visibility based on current filters
    UpdateHighlightMarkerVisibility(HighlightData, MarkerComponent);
}

void AMapView::UpdateHighlightMarkerVisibility(const FHighlightData& HighlightData, UStaticMeshComponent* Marker)
{
    bool bShouldBeVisible = true;

    // Apply filters
    if (!CurrentPlayerFilter.IsEmpty() && HighlightData.PlayerId != CurrentPlayerFilter)
    {
        bShouldBeVisible = false;
    }

    if (bShouldBeVisible && !CurrentTypeFilter.IsEmpty() && HighlightData.HighlightType != CurrentTypeFilter)
    {
        bShouldBeVisible = false;
    }

    Marker->SetVisibility(bShouldBeVisible);
}

UMaterialInterface* AMapView::GetHighlightMaterial(const FString& HighlightType)
{
    if (HighlightType == TEXT("ClutchPlay"))
    {
        return ClutchPlayMaterial;
    }
    else if (HighlightType == TEXT("HotStreak"))
    {
        return HotStreakMaterial;
    }
    else if (HighlightType == TEXT("MomentumShift"))
    {
        return MomentumShiftMaterial;
    }
    else if (HighlightType == TEXT("ImpactPlay"))
    {
        return ImpactPlayMaterial;
    }

    return ClutchPlayMaterial; // Default material
}

void AMapView::HandleHighlightMarkerClicked(UPrimitiveComponent* ClickedComponent)
{
    for (const auto& Highlight : ActiveHighlights)
    {
        if (UStaticMeshComponent* Marker = HighlightMarkers.FindRef(Highlight.Id))
        {
            if (Marker == ClickedComponent)
            {
                OnHighlightSelected.Broadcast(Highlight);
                break;
            }
        }
    }
} 