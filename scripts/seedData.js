import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Folder from '../src/models/Folder.js';
import Note from '../src/models/Note.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notes-app';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear existing data
  await User.deleteMany({});
  await Folder.deleteMany({});
  await Note.deleteMany({});

  // Create a demo user with hashed password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const user = new User({
    name: 'Demo User',
    email: 'demo@notes.com',
    password: hashedPassword,
    preferences: { theme: 'light', defaultView: 'grid', autoSave: true }
  });
  await user.save();

  // Create demo folders with slug
  const folder1 = new Folder({ name: 'Work', userId: user._id, color: '#6366f1', slug: 'work' });
  const folder2 = new Folder({ name: 'Personal', userId: user._id, color: '#f59e42', slug: 'personal' });
  await folder1.save();
  await folder2.save();

  // Create demo notes
  const note1 = new Note({
    title: 'Welcome to Notes Studio!',
    content: 'This is your first note. Edit or delete it as you wish.',
    folderId: folder1._id,
    userId: user._id,
    slug: 'welcome-to-notes-studio',
    tags: ['welcome', 'demo'],
    isPinned: true
  });
  const note2 = new Note({
    title: 'Personal Todo',
    content: 'Buy groceries, call mom, finish reading book.',
    folderId: folder2._id,
    userId: user._id,
    slug: 'personal-todo',
    tags: ['todo', 'personal']
  });
  await note1.save();
  await note2.save();

  console.log('Seed data created!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
