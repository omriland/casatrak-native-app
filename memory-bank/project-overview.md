# CasaTrack Mobile - Project Overview

## Project Summary
**CasaTrack Mobile** is the mobile companion to the CasaTrack home-purchasing management system. It provides a premium, "Light Minimalism" experience for tracking properties of interest, managing photos/videos on-site, and keeping detailed notes during property visits.

## Design Philosophy: Light Minimalism
- **Aesthetic**: Premium, Apple-esque design with high information density but zero clutter.
- **Typography**: "Varela Round" used globally for its friendly, modern, and Hebrew-compatible look.
- **Color Palette**: High-contrast black and white with subtle glassmorphism and soft shadows.
- **Micro-interactions**: Smooth transitions (Reanimated) and gesture-based navigation (Pinch-to-zoom, Swipe).

## Current Status: Feature-Rich Beta
- [x] **Authentication**: Password-protected login matching web version logic.
- [x] **Dashboard (Cards View)**: Status-sorted properties with key specs and rating stars.
- [x] **Property Details**: Full-screen modal with spec cards, description, and contact info.
- [x] **Notes System**: RTL-aligned notes with relative timestamping and inline double-tap editing.
- [x] **Attachments**: Advanced gallery supporting Images, Videos, and PDFs.
- [x] **Media Optimization**: Auto-compression for images and videos upon upload.
- [x] **Flagging**: Quick-access "Flagged" screen for priority properties.
- [wip] **Map View**: Native map integration (Parity with web version pending).
- [todo] **Kanban View**: Drag-and-drop status management.

## Tech Stack
- **Framework**: React Native (CLI).
- **Styling**: Vanilla StyleSheet with a centralized `theme.ts`.
- **Backend**: Supabase (shared with web version).
- **Animations**: React Native Reanimated.
- **Gestures**: React Native Gesture Handler + PagerView.
- **Media**: react-native-compressor, react-native-image-picker, react-native-document-picker.

## Shared Data Layer (with Web)
- Both apps connect to the same Supabase project.
- **Bucket**: `property-attachments` (Public).
- **Tables**: `properties`, `notes`, `attachments`.
- **Coordinates**: Shared lat/lng for map synchronization.
