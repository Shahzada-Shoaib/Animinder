# Animinder 🐾

Ek Tinder-style pet matching app jahan log apne pets ko list kar sakte hain aur doosre pets ke saath match kar sakte hain!

## 📱 Features (MVP)

1. **Home Screen** - Animals ko swipe karein (left = pass, right = like)
2. **Profile Screen** - Apne pets add/remove karein
3. **Matches Screen** - Aapke matched pets dekhein

## 🏗️ Project Structure

```
src/
├── components/          # Chotay reusable components
│   ├── AnimalCard.tsx      # Animal ki info dikhata hai
│   ├── SwipeCard.tsx       # Swipe functionality handle karta hai
│   ├── Button.tsx          # Reusable button component
│   └── AddAnimalModal.tsx  # Pet add karne ka modal
│
├── screens/            # Main screens
│   ├── HomeScreen.tsx      # Swipe screen
│   ├── ProfileScreen.tsx   # User profile aur pets
│   └── MatchesScreen.tsx   # Matched animals
│
├── context/            # State management
│   └── AppContext.tsx      # Global state (Context API)
│
├── navigation/         # Navigation setup
│   └── AppNavigator.tsx    # Bottom tab navigation
│
└── types/             # TypeScript types
    └── index.ts           # Animal, User, Match types
```

## 🎨 Design Choices (Simple for Junior Devs)

### 1. **State Management - Context API**
Redux ya complex state management use nahi kia. Simple Context API use kia hai:

```typescript
// State access karna bahut simple hai
const { currentUser, animals, matches, likeAnimal } = useApp();
```

### 2. **Navigation - React Navigation Bottom Tabs**
3 simple tabs:
- Home (swipe screen)
- Matches (matched pets)
- Profile (user's pets)

### 3. **Components - Chotay aur Focused**
Har component ek cheez karta hai:
- `AnimalCard` - Sirf display karta hai
- `SwipeCard` - Sirf swipe handle karta hai
- `Button` - Sirf button render karta hai

### 4. **No Backend (MVP)**
- Dummy data use kia hai
- Local state mein sab kuch hai
- Baad mein easily API integrate kar sakte ho

## 🚀 How to Run

### Android
```bash
npm install
npx react-native run-android
```

### iOS
```bash
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

## 📝 How State Works

### AppContext mein ye sab hai:
1. **currentUser** - Logged in user aur uske pets
2. **animals** - Sare available animals (swipe karne ke liye)
3. **matches** - Matched animals ka list
4. **likedAnimals** - Liked animal IDs

### Functions:
- `addAnimal(animal)` - Naya pet add karta hai
- `removeAnimal(id)` - Pet delete karta hai
- `likeAnimal(id)` - Animal ko like karta hai (swipe right)
- `passAnimal(id)` - Animal ko pass karta hai (swipe left)

## 🎯 How Swipe Works

1. User card ko swipe karta hai
2. `SwipeCard` component gesture detect karta hai
3. Agar right swipe → `likeAnimal()` call hota hai
4. Agar left swipe → `passAnimal()` call hota hai
5. Random 50% chance pe match ban jata hai (MVP ke liye)

## 🔄 Next Steps (Future Features)

1. **Authentication** - Real login/signup
2. **Backend Integration** - API se data fetch karo
3. **Chat Feature** - Matches ke saath chat karo
4. **Filters** - Animal type, age se filter karo
5. **Image Upload** - Real images upload karo
6. **Real Matching Logic** - Proper algorithm implement karo

## 💡 Code Examples

### Adding a new animal:
```typescript
const addNewPet = () => {
  const newAnimal: Animal = {
    id: 'unique-id',
    name: 'Max',
    type: 'Dog',
    age: 3,
    breed: 'Golden Retriever',
    image: 'url-here',
    bio: 'Friendly dog',
    ownerId: currentUser.id
  };
  
  addAnimal(newAnimal);
};
```

### Accessing state in any component:
```typescript
import { useApp } from '../context/AppContext';

function MyComponent() {
  const { animals, likeAnimal } = useApp();
  
  return (
    // Your component
  );
}
```

## 🎨 Colors Used

- Primary: `#FF6B6B` (Pink/Red)
- Background: `#f5f5f5` (Light Gray)
- Text: `#333` (Dark Gray)
- Secondary Text: `#666`, `#999` (Lighter Grays)

## 📦 Dependencies

- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `react-native-gesture-handler` - Swipe gestures
- `react-native-screens` - Native screens
- `react-native-safe-area-context` - Safe area handling

## 🤝 Contributing

Code simple hai, koi bhi junior developer easily samajh sakta hai aur contribute kar sakta hai!

---

Made with ❤️ for pets and their owners!

