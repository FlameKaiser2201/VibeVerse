# 🔥 VibeVerse — Where Every Vibe Finds Its Tribe 🌌

> A fun, vibrant social media app powered by a **Python FastAPI** backend and **React Native (Expo)** mobile frontend, designed to connect like-minded people through shared passions, photo posts, 24-hour ephemeral stories, short-form reels with camera filter effects, and real-time texting with microphone voice messages.

[![Download Android APK](https://img.shields.io/badge/Download%20APK-v1.0.0-success?style=for-the-badge&logo=android)](https://github.com/FlameKaiser2201/VibeVerse/releases/download/v1.0.0/VibeVerse-Universal.apk)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/FlameKaiser2201/VibeVerse)
![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)
![Backend](https://img.shields.io/badge/Backend-Python%20FastAPI-blue?style=for-the-badge&logo=fastapi)
![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20SQLAlchemy-orange?style=for-the-badge&logo=mysql)

---

## 📱 Permanent Android App Download

Your permanent native Android APK is compiled and ready to install:

👉 **[Download VibeVerse-Universal.apk (Direct Download)](https://github.com/FlameKaiser2201/VibeVerse/releases/download/v1.0.0/VibeVerse-Universal.apk)**

- **Version**: `v1.0.0`
- **Package**: `com.vibeverse.app`
- **Compatibility**: Android 7.0+ (ARM64, ARMv7, x86, x86_64 universal)
- **Permissions Configured**: Native Camera (Filters), Microphone (Voice Notes), Photo Library.

### How to Install:
1. Tap the download link above on your Android phone.
2. Once downloaded, tap the `.apk` file to install.
3. If prompted with *"Install unknown apps"*, tap **Settings** and toggle **Allow from this source**.
4. Open **VibeVerse** and start connecting!

---

## ☁️ 1-Click Render Cloud Deployment

Deploy the Python backend directly to Render with 1 click:

👉 **[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/FlameKaiser2201/VibeVerse)**

- **Service Name**: `vibeverse-api`
- **Runtime**: Python 3.11 with FastAPI + Uvicorn
- **Live Cloud Endpoint**: `https://vibeverse-api.onrender.com`
- **Interactive Swagger Docs**: `https://vibeverse-api.onrender.com/docs`
- **Health Check**: `/health`

---

## ✨ Features Included

### 🤝 1. Connect with Like-Minded People
- **Interest Onboarding**: Pick 3+ vibes during sign-up (Gaming, Tech, Anime, Music, Art, Memes, Photography, Fitness, Travel, etc.).
- **Smart Matching Algorithm**: Calculates mutual vibe percentages (e.g. `96% Match • Shared: #gaming, #anime`).
- **Follow Graph**: Follow creators and build a personalized community feed.

### 📸 2. Photo Posts & ⏳ 24h Instagram-Style Stories
- **Photo Feed**: Share photos with custom captions, vibe hashtags, double-tap heart likes, and comments.
- **Top Stories Tray**: Colorful unread rings around user avatars; stories automatically expire after 24 hours.
- **Story Viewer**: Fullscreen story viewer with animated progress bars.

### 🎬 3. Vibe Reels (Short-Form Videos)
- **Vertical Swipe Feed**: Fullscreen reels player with sound mute/unmute, audio track credit ticker, like counter, and comment drawer.

### 🎨 4. Built-in Camera with 8 Live Filter Effects
- **Native Permissions**: Built-in camera and microphone permissions.
- **8 Filter Presets**:
  - 🌅 Warm Sunset
  - 🏙️ Cool Cyberpunk
  - 🎞️ Vintage Film
  - 🖤 B&W Glam
  - 🌺 Vivid Pop
  - 🔮 Dreamy Bloom
  - ⚡ Neon Glow
  - ✨ Normal (Natural)
- **Mode Switcher**: Easily switch between capturing a Post, 24h Story, or Video Reel.

### 🎤 5. Chat with Microphone Voice Notes
- **Microphone Access**: Dedicated voice recording modal with pulsing audio visualizer, live elapsed timer, and cancel/send controls.
- **Waveform Player**: Plays voice messages in chat bubbles with sound wave bars and progress tracking.
- **Real-Time Texting**: Instant messaging backed by FastAPI WebSockets.

---

## 🔄 Future Updates
Whenever you push any updates or code changes to this repository, GitHub Actions will automatically compile a new Android APK and Render will automatically redeploy the live backend!
