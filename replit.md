# AddSub Virtual Try-On System

## Project Overview
A web-based virtual try-on application for AddSub eyewear that uses real-time face tracking and 3D rendering to overlay glasses models on users' faces through their webcam feed.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Rendering**: Three.js for WebGL-based glasses rendering
- **Face Tracking**: MediaPipe FaceMesh for real-time facial landmark detection
- **Backend**: Flask (Python) for serving static files and API endpoints
- **Styling**: Custom CSS with AddSub brand colors

## Brand Colors
- Sky Blue: #3DB2FF
- Navy Blue: #1B3B5F  
- White: #FFFFFF
- Light Gray: #F5F5F5

## Features
- Real-time webcam access and face detection
- 3D glasses overlay with realistic positioning and scaling
- Head movement tracking (rotation and position)
- Multiple frame styles (Classic, Modern, Vintage)
- Adjustable sizing and positioning controls
- Photo capture and download functionality
- Responsive design for desktop and mobile
- Clean, minimal UI aligned with AddSub branding

## File Structure
```
/
├── index.html          # Main HTML page
├── styles.css          # CSS styling and responsive design
├── app.js             # Main application logic and initialization
├── face-tracking.js   # MediaPipe face detection integration
├── glasses-models.js  # Three.js 3D glasses rendering
├── app.py            # Flask server for serving files
└── replit.md         # Project documentation
```

## Key Components

### Face Tracking (face-tracking.js)
- Uses MediaPipe FaceMesh for 468 facial landmarks
- Processes key landmarks for glasses positioning
- Calculates head pose (pitch, yaw, roll)
- Implements landmark smoothing for stability

### 3D Rendering (glasses-models.js)
- Three.js scene with proper lighting setup
- Procedural glasses geometry generation
- Frame-specific materials and styling
- Real-time position/rotation updates based on face landmarks

### Main App (app.js)
- Coordinates face tracking and 3D rendering
- Handles UI interactions and controls
- Manages photo capture functionality
- Responsive canvas resizing

## User Controls
- **Frame Selection**: Switch between Classic, Modern, and Vintage styles
- **Size Adjustment**: Scale glasses from 0.8x to 1.3x
- **Width Adjustment**: Adjust horizontal scaling (0.8x to 1.2x)  
- **Height Position**: Vertical offset adjustment (-10 to +10)
- **Capture Photo**: Take screenshot with glasses overlay
- **Reset**: Return all settings to defaults

## Browser Compatibility
- Modern browsers with WebGL support
- Camera access permissions required
- Optimized for both desktop and mobile devices

## Development Notes
- Uses CDN links for Three.js and MediaPipe libraries
- Implements proper error handling for camera access
- Responsive design adapts to different screen sizes
- Performance optimized with ~30 FPS face detection

## Recent Changes
- Created complete virtual try-on system with HTML/CSS/JS
- Implemented MediaPipe face tracking integration
- Built Three.js 3D glasses rendering system
- Added Flask server for file serving
- Designed responsive UI with AddSub branding

## User Preferences
- Preference for vanilla HTML/CSS/JavaScript implementation
- Focus on modern web technologies (WebGL, MediaPipe)
- Clean, minimal design aesthetic
- Mobile-friendly responsive design