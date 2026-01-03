# Porting Features from Web

The mobile app aims to eventually reach feature parity with the web version, while optimized for touch and on-the-go usage.

## Capabilities to Port

### 1. Map Intelligence
- **Custom Markers**: Show the price (₪) directly in the marker icon.
- **"New" Badges**: Properties added within the last 7 days should have a visual "New" indicator on the map.
- **Geocoding Support**: Integrate Google Places API for address autocomplete (currently the web app uses this for coordinate extraction).
- **Tooltips**: Marker clicks should show a mini-card preview with photo and key stats.
- **Layers**: Transit/Traffic layers (standard in `react-native-maps`).

### 2. Logic Parity
- **Price Calculation**: Sync the formula: `(Price) / (Size + 0.5 * BalconySize)`. Currently, mobile might only be using total size.
- **Yad2 URL Extraction**: The web app has a `/api/extract-property` endpoint that parses Yad2 listings. Bringing this to mobile will allow users to just paste a link and auto-fill the form.
- **Status Set**: Ensure the 7 statuses are identical across platforms to avoid Kanban syncing issues.
- **Irrelevant Filter**: Add a toggle to hide "Irrelevant" properties from the main Dashboard/Map (web uses a collapsible section).

### 3. UX Features
- **Price History**: Port the ability to track how the asked price changes over time (if implemented in web schema).
- **Search-First Interaction**: Improve the Dashboard with the web's powerful search/filter interactions.
- **Note Hover Previews**: On iPad/Tablet, implement hover-like previews for notes.

## Future Performance Roadmap
- **Offline Mode**: Since mobile users often visit properties in basements or areas with poor reception, implement `AsyncStorage` caching for property cards.
- **Push Notifications**: Notify the user if a property they "flagged" has its price updated via the web.
