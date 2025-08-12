#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ARBlueprintLibrary.h"
#include "ARPlaneGeometry.h"
#include "ARPin.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"
#include "ARManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnARPlaneAdded, UARPlaneGeometry*, Plane);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnARPlaneUpdated, UARPlaneGeometry*, Plane);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnARPlaneRemoved, UARPlaneGeometry*, Plane);

UCLASS(BlueprintType, Blueprintable)
class SPORTBEACON_API AARManager : public AActor
{
    GENERATED_BODY()

public:
    AARManager();

protected:
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

public:
    virtual void Tick(float DeltaTime) override;

    // AR Session Management
    UFUNCTION(BlueprintCallable, Category = "AR")
    void InitializeAR();

    UFUNCTION(BlueprintCallable, Category = "AR")
    void CleanupAR();

    // Plane Detection
    UFUNCTION(BlueprintCallable, Category = "AR")
    void DetectPlanes();

    // AR Anchor Placement
    UFUNCTION(BlueprintCallable, Category = "AR")
    void PlaceARAnchor(FVector Location);

    // AR Event Handlers
    UFUNCTION()
    void HandlePlaneAdded(UARPlaneGeometry* Plane);

    UFUNCTION()
    void HandlePlaneUpdated(UARPlaneGeometry* Plane);

    UFUNCTION()
    void HandlePlaneRemoved(UARPlaneGeometry* Plane);

    // AR Event Delegates
    UPROPERTY(BlueprintAssignable, Category = "AR")
    FOnARPlaneAdded OnARPlaneAdded;

    UPROPERTY(BlueprintAssignable, Category = "AR")
    FOnARPlaneUpdated OnARPlaneUpdated;

    UPROPERTY(BlueprintAssignable, Category = "AR")
    FOnARPlaneRemoved OnARPlaneRemoved;

    // AR State
    UPROPERTY(BlueprintReadOnly, Category = "AR")
    bool bARInitialized;

    // AR Assets
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AR Assets")
    UStaticMesh* PlaneMeshAsset;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AR Assets")
    UMaterialInterface* PlaneMaterial;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AR Assets")
    UStaticMesh* AnchorMeshAsset;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AR Assets")
    UMaterialInterface* AnchorMaterial;

private:
    // AR Visualizations
    TMap<UARPlaneGeometry*, UStaticMeshComponent*> PlaneMeshes;
    TMap<UARPin*, UStaticMeshComponent*> AnchorMeshes;

    // AR Anchors
    UPROPERTY()
    TArray<UARPin*> ARAnchors;

    // Helper functions
    void CreatePlaneVisualization(UARPlaneGeometry* Plane);
    void UpdatePlaneVisualization(UARPlaneGeometry* Plane);
    void RemovePlaneVisualization(UARPlaneGeometry* Plane);
    void CreateAnchorVisualization(UARPin* Pin);
}; 