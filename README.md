# 🔥 Habitat Pro

**Habitat Pro** is a premium, full-stack personal habit tracker designed to help you stay consistent, gamify your productivity, and visualize your progress with beautiful insights.

![Habitat Pro Icon](public/pwa-512x512.png)

## ✨ Features

### 🎮 Gamification Engine
- **XP & Leveling System**: Earn 10 XP for every habit you complete. Watch your level grow in the header!
- **Interactive Feedback**: Vibrant confetti celebrations every time you check off a habit.

### 📈 Advanced Analytics
- **Yearly Heatmap**: A GitHub-style 365-day activity density map to visualize your long-term consistency.
- **Weekly Overview**: A 7-day grid view to quickly toggle completions for the current week.
- **Detailed Reports**: Completion rates per habit and bar charts showing your weekly progress.

### 🏷️ Smart Organization
- **Custom Categories**: Group habits into Health, Work, Mindset, Growth, and more.
- **Color Coding**: Assign unique colors to each habit for a personalized dashboard.
- **Category Filtering**: Focus on specific areas of your life with quick filters.

### 📱 Premium Experience
- **PWA Support**: Installable on iOS and Android for a native app feel.
- **Dark Mode**: Full support for dark and light modes, defaulting to your system preference.
- **Streak Tracking**: 🔥 Streak badges that update automatically.
- **Smart Alerts**: Warning banners if you're about to break a streak after 8 PM.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Animations**: Framer Motion
- **Database & Auth**: Supabase
- **Deployment**: Vercel
- **PWA**: vite-plugin-pwa

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed
- A Supabase account

### 2. Installation
```bash
git clone https://github.com/Shadow-Protectors/Habitat_Tracker.git
cd Habitat_Tracker
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)
Run the following SQL in your **Supabase SQL Editor** to create the necessary tables and enable RLS:

```sql
-- Create habits table
CREATE TABLE habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '✅',
  category TEXT DEFAULT 'General',
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completions table
CREATE TABLE completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can manage their own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own completions" ON completions FOR ALL USING (auth.uid() = user_id);
```

### 5. Running Locally
```bash
npm run dev
```

---

## 📦 Deployment

This project is optimized for deployment on **Vercel**. Simply connect your GitHub repository to Vercel and it will automatically build and deploy your app. Remember to add your environment variables to the Vercel project settings.

## 📄 License
MIT License. Free to use and modify!
