# Architecture & Patterns

## Navigation
The app uses `@react-navigation/stack` and `@react-navigation/bottom-tabs`.

### Primary Routes
- **Dashboard**: The main listing screen (Cards view).
- **Flagged**: Filtered view of "marked" properties.
- **Add/Edit**: Forms for property data entry.
- **PropertyDetail**: A Modal-like stack screen providing a deep dive into a property.
- **Map/Kanban**: Placeholder views for future parity.

## UI Component Patterns

### Theme System
Defined in `src/theme/theme.ts`. Uses a structured object for colors, typography, and spacing.
- `theme.colors.primary`: Deep black/dark gray.
- `theme.colors.secondary`: Slate/Blue-gray.
- `theme.colors.accent`: Warm yellow (used for flags/stars).
- `theme.typography.fontFamily`: "VarelaRound-Regular".

### Property Cards
The `PropertyCard` component is highly optimized for density.
- Title & Stars at top.
- Status badge in top-right corner.
- Statistics (Price, Size, Rooms) in a single row at bottom with separator dots.

### Gesture-Driven UI
- **Gallery**: Uses `PagerView` for horizontal swiping between media items. 
- **Zooming**: Custom `ZoomableImage` component using `Gesture.Simultaneous` for Pinch, Pan, and Double-Tap.
- **Editing**: Double-tap gesture triggers inline text inputs for Description and Notes to avoid unnecessary screen transitions.

## Data & Storage Patterns

### Supabase Integration
- Located in `src/lib/`.
- `auth.ts`: Handle simple password-based session check.
- `properties.ts`: All CRUD operations for properties, notes, and attachments.

### Attachment Flow
1. **Picker**: User selects Image or Video.
2. **Compression**: `react-native-compressor` reduces file size (especially for videos).
3. **Storage**: Uploaded to `property-attachments` bucket in folders categorized by `property_id`.
4. **Metadata**: Database entry in `attachments` table stores path and type.

### Internationalization (Hebrew/RTL)
- RTL alignment is applied explicitly to text blocks (`textAlign: 'right'`) for Descriptions and Notes.
- Numbers are formatted using `he-IL` locale for currency (₪).
- Relative time helper (`formatDistanceToNow` equivalent) for human-readable timestamps.
