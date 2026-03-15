# AuraTrace - Social Fitness Visualization ✨

AuraTrace is a premium React Native application designed for athletes who want to transform their Strava activities into stunning, data-rich visual summaries. It blends high-resolution fitness data with professional design tools.

## 🚀 Core Features

### 1. Seamless Strava Integration
- **OAuth Authentication**: Secure login via Strava to pull real-time athlete data.
- **Activity Dashboard**: Automatically categorizes and displays Runs, Walks, and Rides with summarized stats.

### 2. Advanced Activity Insights
- **Dual-View Maps**: Toggle between standard GPS maps and stylized SVG "Traces" of your route.
- **High-Fidelity Analytics**: Real-time charts for **Heart Rate**, **Elevation**, and **Pace** (min/km), with smart smoothing technology to filter GPS noise.
- **Smart Metadata**: Accurate calculation of calories, moving time, and average pace.

### 3. Professional Creative Canvas
A powerful, interactive studio to create social-media-ready visuals:
- **Interactive Elements**: Drag, scale (multitouch), and rotate every element (Titles, Maps, Stats, Graphs) with sub-pixel precision.
- **Custom Backgrounds**: Overlay your stats on photos from your camera roll.
- **Composition Grids**: Professional alignment tools including **Rule of Thirds**, **Squares/Grids**, and the **Golden Ratio**.
- **Transparent Graphs**: Minimalist, card-free graphs that blend perfectly into your background images.

### 4. Precision Design Tools
- **Advanced Color Suite**: Professional HSL spectrum picker with precise hue/saturation/lightness controls.
- **Precision Eyedropper**: A crosshair tool with a **5x Magnifier** for sub-pixel color sampling from your photos or map lines.
- **Multi-Metric Overlays**: Layer multiple data streams (e.g., HR vs Elevation) on a single transparent graph for deep performance analysis.

### 5. Export & Sharing
- **Canvas Rendering**: High-quality exports using `react-native-view-shot` to capture your customized canvas for sharing on Instagram or Strava.

## 🛠️ Technical Stack
- **Frontend**: React Native, Expo 54, Reanimated (60fps interactions), Gesture Handler.
- **Backend**: Node.js/Express, JWT-based security, Strava API V3.
- **Graphics**: SVG, Canvas (Web), ViewShot for high-res imaging.
