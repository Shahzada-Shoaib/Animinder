# App Icon Setup Instructions

## Overview
To update the app icons (Android and iOS) to use the paw icon matching the LoginScreen, you need to generate icon images in various sizes.

## Current Icon
The app currently uses the **paw icon** (`paw` from `react-native-vector-icons/Ionicons`) on the LoginScreen. The app icons should match this design.

## Required Icon Sizes

### Android Icons
Icons need to be generated for the following densities in `android/app/src/main/res/`:

- **mipmap-mdpi**: 48x48px (ic_launcher.png, ic_launcher_round.png)
- **mipmap-hdpi**: 72x72px (ic_launcher.png, ic_launcher_round.png)
- **mipmap-xhdpi**: 96x96px (ic_launcher.png, ic_launcher_round.png)
- **mipmap-xxhdpi**: 144x144px (ic_launcher.png, ic_launcher_round.png)
- **mipmap-xxxhdpi**: 192x192px (ic_launcher.png, ic_launcher_round.png)

### iOS Icons
Icons need to be generated for the following sizes in `ios/Pet Mates/Images.xcassets/AppIcon.appiconset/`:

- 20x20@2x (40x40px)
- 20x20@3x (60x60px)
- 29x29@2x (58x58px)
- 29x29@3x (87x87px)
- 40x40@2x (80x80px)
- 40x40@3x (120x120px)
- 60x60@2x (120x120px)
- 60x60@3x (180x180px)
- 1024x1024@1x (1024x1024px) - App Store icon

## Recommended Tools

### Option 1: Using react-native-make
```bash
npm install -g react-native-make
# Create a 1024x1024px paw icon image first, then:
react-native-make set-icon --path path/to/your/icon.png
```

### Option 2: Using Online Tools
1. Use tools like [AppIcon.co](https://www.appicon.co/) or [IconKitchen](https://icon.kitchen/)
2. Upload a 1024x1024px paw icon image
3. Download the generated icon sets
4. Place them in the appropriate folders

### Option 3: Manual Generation
1. Create a 1024x1024px paw icon image (PNG format, transparent background recommended)
2. Use image editing software or online tools to resize to all required sizes
3. Place files in the correct folders as listed above

## Design Guidelines
- Use the same paw icon design as shown on LoginScreen
- Color: Primary color (#FF6B9D) or a suitable app icon color
- Background: Transparent or solid color that works well on both light and dark backgrounds
- Ensure icons are clear and recognizable at small sizes

## After Generating Icons
1. Replace the existing icon files in the respective folders
2. For Android: Rebuild the app (`npm run android`)
3. For iOS: Clean build folder in Xcode and rebuild (`npm run ios`)

## Note
The LoadingScreen component has been created and integrated. It uses the same paw icon with animations during the initial authentication check.

