# Unreal Asset Structure & Optimization Notes

## Current Assets (Blueprints)
- BP_NavigationMesh.uasset
- BP_Venue3DModel.uasset
- BP_SportBeaconMap.uasset
- BP_MapViewHandler.cpp

## Missing/Planned Assets
- Venue interiors (stadium, gym, fieldhouse)
- Courts (basketball, tennis, volleyball)
- Field markers (soccer, football, baseball)
- League logos (vector/texture)
- Stands/bleachers
- Terrain (grass, dirt, synthetic)
- Scoreboards
- Locker rooms
- AR markers
- Mobile-optimized meshes (low poly)
- LOD variants for all major assets
- Asset streaming support

## Optimization Notes
- All new assets should include LODs (Level of Detail) for mobile performance.
- Textures should be compressed (DXT1/5, ASTC for mobile).
- Use asset streaming for large environments.
- Test ARKit (iOS) and ARCore (Android) compatibility for all interactive assets.
- Add fallback static meshes for low-power devices.

## AR Testing
- Scaffold ARKit/ARCore test scenes for device compatibility.
- Log frame rate, device model, and interaction results.
- Add fallback UX for unsupported devices. 