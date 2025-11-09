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
  animals: Animal[];
}

export interface Match {
  id: string;
  animal1: Animal;
  animal2: Animal;
  timestamp: Date;
}

