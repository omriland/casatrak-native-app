# Active Context

## Current Focus
The app has just completed its core "Property Detail" overhaul. The latest focus was on rich media and inline editing to make the app feel tactile and fast for on-site use.

## Latest Changes (Jan 3, 2026)
- **Media Compression**: Added `react-native-compressor`. Videos/Photos are optimized before upload.
- **Note Editing**: Implemented double-tap to edit on existing notes.
- **Attachment Consolidation**: Replaced split buttons with a single "Add" button that triggers a type selection menu.
- **PDF Infrastructure**: Added support for viewing PDFs in the gallery list using native Linking.
- **Gallery Refinement**: 
    - Full-screen zoomable view.
    - Swiping enabled/disabled based on zoom level.
    - Header cleanup to reduce dead space.

## Known Challenges
- **Native Rebuilds**: Several new native libraries (`document-picker`, `compressor`, `pager-view`) require fresh builds.
- **Map View Sync**: Currently, the mobile map view is a placeholder. It needs to reflect the web version's rich marker logic (showing prices, "New" badges, etc.).

## Next Steps
1. **Map View Development**: Transition from placeholder to a functional `react-native-maps` implementation.
2. **Kanban View**: Implement a native-optimized drag-and-drop board for status tracking.
3. **Price Calculation Sync**: Ensure the "price per meter" calculation matches the web's 50% balcony rule.
