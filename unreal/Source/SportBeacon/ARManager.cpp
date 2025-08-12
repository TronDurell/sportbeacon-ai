#include "ARManager.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "ARBlueprintLibrary.h"
#include "ARSessionConfig.h"
#include "ARPlaneActor.h"
#include "ARPin.h"

// AR Session Management
void AARManager::InitializeAR()
{
    UE_LOG(LogTemp, Log, TEXT("Initializing AR Session"));
    
    // Configure AR session
    UARSessionConfig* SessionConfig = NewObject<UARSessionConfig>();
    SessionConfig->bUseDefaultCamera = true;
    SessionConfig->bUseDefaultLighting = true;
    
    // Enable plane detection
    SessionConfig->bEnablePlaneDetection = true;
    SessionConfig->bEnableAutoFocus = true;
    
    // Start AR session
    UARBlueprintLibrary::StartARSession(SessionConfig);
    
    // Set up AR event handlers
    OnARPlaneAdded.AddDynamic(this, &AARManager::HandlePlaneAdded);
    OnARPlaneUpdated.AddDynamic(this, &AARManager::HandlePlaneUpdated);
    OnARPlaneRemoved.AddDynamic(this, &AARManager::HandlePlaneRemoved);
    
    bARInitialized = true;
    UE_LOG(LogTemp, Log, TEXT("AR Session initialized successfully"));
}

// Plane Detection
void AARManager::DetectPlanes()
{
    if (!bARInitialized)
    {
        UE_LOG(LogTemp, Warning, TEXT("AR not initialized. Call InitializeAR() first."));
        return;
    }
    
    UE_LOG(LogTemp, Log, TEXT("Starting plane detection"));
    
    // Get all detected planes
    TArray<UARPlaneGeometry*> DetectedPlanes = UARBlueprintLibrary::GetAllGeometries<UARPlaneGeometry>();
    
    for (UARPlaneGeometry* Plane : DetectedPlanes)
    {
        if (Plane && Plane->GetTrackingState() == EARTrackingState::Tracking)
        {
            FVector PlaneCenter = Plane->GetCenter();
            FVector PlaneExtent = Plane->GetExtent();
            
            UE_LOG(LogTemp, Log, TEXT("Detected plane at: %s, size: %s"), 
                   *PlaneCenter.ToString(), *PlaneExtent.ToString());
            
            // Create visual representation of the plane
            CreatePlaneVisualization(Plane);
        }
    }
}

// AR Anchor Placement
void AARManager::PlaceARAnchor(FVector Location)
{
    if (!bARInitialized)
    {
        UE_LOG(LogTemp, Warning, TEXT("AR not initialized. Call InitializeAR() first."));
        return;
    }
    
    UE_LOG(LogTemp, Log, TEXT("Placing AR anchor at: %s"), *Location.ToString());
    
    // Create AR pin at the specified location
    UARPin* NewPin = UARBlueprintLibrary::PinComponent(nullptr, Location, FRotator::ZeroRotator);
    
    if (NewPin)
    {
        // Store the pin for later reference
        ARAnchors.Add(NewPin);
        
        // Create visual representation of the anchor
        CreateAnchorVisualization(NewPin);
        
        UE_LOG(LogTemp, Log, TEXT("AR anchor placed successfully"));
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to place AR anchor"));
    }
}

// Handle AR plane events
void AARManager::HandlePlaneAdded(UARPlaneGeometry* Plane)
{
    if (Plane)
    {
        UE_LOG(LogTemp, Log, TEXT("New AR plane detected"));
        CreatePlaneVisualization(Plane);
    }
}

void AARManager::HandlePlaneUpdated(UARPlaneGeometry* Plane)
{
    if (Plane)
    {
        UE_LOG(LogTemp, Log, TEXT("AR plane updated"));
        UpdatePlaneVisualization(Plane);
    }
}

void AARManager::HandlePlaneRemoved(UARPlaneGeometry* Plane)
{
    if (Plane)
    {
        UE_LOG(LogTemp, Log, TEXT("AR plane removed"));
        RemovePlaneVisualization(Plane);
    }
}

// Create visual representation of AR planes
void AARManager::CreatePlaneVisualization(UARPlaneGeometry* Plane)
{
    if (!Plane) return;
    
    // Create a simple plane mesh to represent the detected plane
    UStaticMeshComponent* PlaneMesh = NewObject<UStaticMeshComponent>(this);
    if (PlaneMesh)
    {
        PlaneMesh->SetStaticMesh(PlaneMeshAsset);
        PlaneMesh->SetMaterial(0, PlaneMaterial);
        PlaneMesh->SetWorldLocation(Plane->GetCenter());
        PlaneMesh->SetWorldScale3D(Plane->GetExtent() / 100.0f); // Scale to reasonable size
        
        // Store reference to the plane mesh
        PlaneMeshes.Add(Plane, PlaneMesh);
    }
}

// Update plane visualization
void AARManager::UpdatePlaneVisualization(UARPlaneGeometry* Plane)
{
    if (!Plane) return;
    
    UStaticMeshComponent** PlaneMeshPtr = PlaneMeshes.Find(Plane);
    if (PlaneMeshPtr && *PlaneMeshPtr)
    {
        UStaticMeshComponent* PlaneMesh = *PlaneMeshPtr;
        PlaneMesh->SetWorldLocation(Plane->GetCenter());
        PlaneMesh->SetWorldScale3D(Plane->GetExtent() / 100.0f);
    }
}

// Remove plane visualization
void AARManager::RemovePlaneVisualization(UARPlaneGeometry* Plane)
{
    if (!Plane) return;
    
    UStaticMeshComponent** PlaneMeshPtr = PlaneMeshes.Find(Plane);
    if (PlaneMeshPtr && *PlaneMeshPtr)
    {
        (*PlaneMeshPtr)->DestroyComponent();
        PlaneMeshes.Remove(Plane);
    }
}

// Create anchor visualization
void AARManager::CreateAnchorVisualization(UARPin* Pin)
{
    if (!Pin) return;
    
    // Create a simple sphere to represent the anchor
    UStaticMeshComponent* AnchorMesh = NewObject<UStaticMeshComponent>(this);
    if (AnchorMesh)
    {
        AnchorMesh->SetStaticMesh(AnchorMeshAsset);
        AnchorMesh->SetMaterial(0, AnchorMaterial);
        AnchorMesh->SetWorldLocation(Pin->GetLocalToWorldTransform().GetLocation());
        
        // Store reference to the anchor mesh
        AnchorMeshes.Add(Pin, AnchorMesh);
    }
}

// Clean up AR session
void AARManager::CleanupAR()
{
    UE_LOG(LogTemp, Log, TEXT("Cleaning up AR session"));
    
    // Stop AR session
    UARBlueprintLibrary::StopARSession();
    
    // Clear all visualizations
    for (auto& Pair : PlaneMeshes)
    {
        if (Pair.Value)
        {
            Pair.Value->DestroyComponent();
        }
    }
    PlaneMeshes.Empty();
    
    for (auto& Pair : AnchorMeshes)
    {
        if (Pair.Value)
        {
            Pair.Value->DestroyComponent();
        }
    }
    AnchorMeshes.Empty();
    
    // Clear AR anchors
    ARAnchors.Empty();
    
    bARInitialized = false;
    UE_LOG(LogTemp, Log, TEXT("AR session cleaned up"));
} 