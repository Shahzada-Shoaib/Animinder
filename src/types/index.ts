// Types for the app

export interface Animal {
  id: string;
  name: string;
  type: string; // dog, cat, bird, etc.
  age: number;
  breed: string;
  image: string;
  bio: string;
  ownerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  phone?: string;
  createdAt?: Date;
}

export interface Like {
  id: string;
  likerUserId: string;
  likedAnimalId: string;
  ownerId: string;
  createdAt: Date;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  animal1Id: string;
  animal1: Animal;
  animal2Id: string;
  animal2: Animal;
  timestamp: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  userId1: string;
  userId2: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount1: number;
  unreadCount2: number;
  user1Data?: User;
  user2Data?: User;
}

