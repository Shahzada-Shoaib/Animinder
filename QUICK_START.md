# Animinder - Quick Start Guide 🚀

## Setup (Pehli Dafa)

### 1. Dependencies Install Karein
```bash
npm install
```

### 2. iOS ke liye Pods Install (Mac only)
```bash
cd ios
pod install
cd ..
```

## Run Karna

### Android
```bash
npx react-native run-android
```

### iOS (Mac only)
```bash
npx react-native run-ios
```

## Kya Kya Bana Hai? ✅

### ✅ Components (Chotay aur Simple)
- `AnimalCard` - Animal ki info dikhata hai
- `SwipeCard` - Swipe functionality
- `Button` - Reusable button
- `AddAnimalModal` - Pet add karne ka form

### ✅ Screens
- **Home** - Animals ko swipe karo (Tinder jaisa)
- **Profile** - Apne pets manage karo
- **Matches** - Jo match huay unko dekho

### ✅ State Management
- Context API use kia hai (Simple!)
- No Redux, no complex setup
- `useApp()` hook se sab kuch access karo

### ✅ Navigation
- Bottom tabs (3 tabs)
- Simple aur clean

## Kaise Use Karein? 📱

1. **App kholo** → Home screen pe animals dikhengi
2. **Swipe karein**:
   - **Right swipe** = Like ❤️
   - **Left swipe** = Pass ❌
3. **Profile tab** pe jao → "Add Pet" button se apna pet add karo
4. **Matches tab** pe → Jo match huay unko dekho

## Code Structure (Bahut Simple!) 📂

```
src/
├── components/     ← Chotay components
├── screens/       ← 3 screens (Home, Profile, Matches)
├── context/       ← State management
├── navigation/    ← Bottom tabs setup
└── types/         ← TypeScript types
```

## State Kaise Access Karein? 🎯

Kisi bhi component mein:
```typescript
import { useApp } from '../context/AppContext';

function MyComponent() {
  const { animals, currentUser, likeAnimal, addAnimal } = useApp();
  
  // Ab use karo!
  return <View>...</View>;
}
```

## Important Files 📝

1. **App.tsx** - Main entry point
2. **src/context/AppContext.tsx** - Sara state yahan hai
3. **src/navigation/AppNavigator.tsx** - Navigation setup
4. **src/screens/** - Sare screens yahan hain

## Common Issues & Solutions 🔧

### Metro bundler error?
```bash
npx react-native start --reset-cache
```

### Android build fail?
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### iOS pods error?
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

## Features Jo Abhi Nahi Hain (Future mein add karein) 🚧

- Real authentication
- Backend API integration
- Real image upload
- Chat feature
- Advanced filters
- Push notifications

## Tips for Junior Developers 💡

1. **Pehle `AppContext.tsx` padhein** - Sari state management yahan hai
2. **Ek screen pehle samajhein** - Phir doosri screens easy ho jayeingi
3. **Components simple hain** - Har component ek hi kaam karta hai
4. **Console.log use karein** - State changes dekhne ke liye

## Need Help? 🤝

- Project structure simple hai
- Har file mein clear comments hain
- Junior dev easily samajh sakta hai

---

Happy Coding! 🎉

