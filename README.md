# 🔥 VibeVerse — Where Every Vibe Finds Its Tribe 🌌

> A fun, vibrant social media app powered by a **Python FastAPI** backend and **React Native (Expo)** mobile frontend, designed to connect like-minded people through shared passions, photo posts, 24-hour ephemeral stories, short-form reels with camera filter effects, and real-time texting with microphone voice messages.

![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)
![Backend](https://img.shields.io/badge/Backend-Python%20FastAPI-blue?style=for-the-badge&logo=fastapi)
![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20SQLAlchemy-orange?style=for-the-badge&logo=mysql)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20Expo-purple?style=for-the-badge&logo=react)
![Deployment](https://img.shields.io/badge/Deploy-Render%20Cloud-black?style=for-the-badge&logo=render)
![CI/CD](https://img.shields.io/badge/APK%20Build-GitHub%20Actions-brightgreen?style=for-the-badge&logo=githubactions)

---

## ✨ Core Features

### 🤝 1. Connect with Like-Minded People
- **Interest Selection Onboarding** — Pick 3+ vibes during sign-up (e.g. Gaming, Coding, Anime, Music, Art, Memes, Photography, Fitness, Travel, etc.).
- **Smart Vibe Matching** — Algorithmic user discovery that computes real-time match percentages (e.g. `92% Match • Shared: #gaming, #anime`).
- **Follow & Connection System** — Connect with creators and populate your customized personal feed.

### 📸 2. Photo Posts & Feed
- **Photo Feed** — Share your best moments with captions and searchable vibe tags.
- **Engage** — Double-tap heart likes, threaded comments, and post sharing.
- **Tag Filtering** — Filter community posts by vibe tags.

### ⏳ 3. 24-Hour Ephemeral Stories (Instagram Style)
- **Status / Story Tray** — Dynamic top carousel with colorful unread rings.
- **Auto-Expiration** — Stories disappear automatically after 24 hours.
- **Story Viewer** — Tap-to-advance progress bars with active view counters.

### 🎬 4. Vibe Reels (Short-Form Videos)
- **Full-Screen Vertical Video Feed** — Smooth swipe-up/down reels feed.
- **Audio Track Tagging** — Display song or original audio credit ticker.
- **Engagement Bar** — Side action buttons for likes, comments, sharing, and sound mute/unmute.

### 🎨 5. Built-in Camera & Live Filter Effects
- **Native Camera Access** — Asks permission for camera and microphone.
- **Live Visual Filters** — Switch between 8 filter presets:
  - 🌅 *Warm Sunset*
  - 🏙️ *Cool Cyberpunk*
  - 🎞️ *Vintage Film*
  - 🖤 *B&W Glam*
  - 🌺 *Vivid Pop*
  - 🔮 *Dreamy Bloom*
  - ⚡ *Neon Glow*
  - ✨ *Normal (Natural)*
- **Mode Toggle** — Seamlessly record for a Post, 24h Story, or Video Reel.

### 💬 6. Chat with Microphone Voice Messages
- **Microphone Access** — Hold or tap the glowing microphone button to record high-fidelity voice notes.
- **Visual Waveform Player** — Listen to voice messages with playback progress and sound wave bars.
- **Real-Time Texting** — Fast instant messaging backed by WebSockets and live conversation tracking.

---

## 🏗️ Project Architecture

```
vibeverse/
├── .github/
│   └── workflows/
│       └── build-apk.yml       # Automated GitHub Actions workflow to build permanent APKs
├── backend/                    # Python FastAPI Backend
│   ├── app/
│   │   ├── middleware/         # JWT Authentication middleware
│   │   ├── models/             # SQLAlchemy MySQL Models (User, Post, Story, Reel, Message, Like, etc.)
│   │   ├── routes/             # REST & WebSocket API Endpoints
│   │   │   ├── auth.py         # Sign-up, Sign-in, JWT tokens
│   │   │   ├── users.py        # Like-minded user matching & discovery
│   │   │   ├── posts.py        # Photo posts, feeds, likes, comments
│   │   │   ├── stories.py      # 24h ephemeral stories & view tracking
│   │   │   ├── reels.py        # Short-form video reels feed & likes
│   │   │   ├── messages.py     # Real-time chat & microphone voice notes
│   │   │   ├── connections.py  # Follow & follower graph
│   │   │   └── notifications.py# Activity notifications
│   │   ├── schemas/            # Pydantic data schemas
│   │   ├── services/           # Media upload & auth hashing services
│   │   ├── config.py           # Environment settings
│   │   ├── database.py         # SQLAlchemy MySQL connection pool
│   │   └── main.py             # FastAPI App, CORS, WebSockets, Health Check
│   ├── Dockerfile              # Docker container setup
│   ├── render.yaml             # Render deployment configuration
│   └── requirements.txt        # Python dependencies
├── mobile/                     # React Native Expo Mobile App
│   ├── assets/                 # App icons and splash screen
│   ├── src/
│   │   ├── components/         # StoryBar, StoryViewer, PostCard, VoiceNotePlayer, VoiceRecorder
│   │   ├── context/            # AuthContext (JWT session persistence)
│   │   ├── hooks/              # useAudio (Microphone recording) & useCamera (Live filters)
│   │   ├── navigation/         # AppNavigator & Bottom TabNavigator
│   │   ├── screens/            # Auth, Feed, Discover, Camera, Reels, Chat, Profile
│   │   ├── services/           # Axios API services
│   │   └── utils/              # Color matrix filter definitions & native permissions
│   ├── app.json                # Expo Android camera & microphone permissions
│   ├── eas.json                # EAS APK Build configuration
│   └── package.json            # React Native dependencies
├── render.yaml                 # Root Render Blueprint specification
├── push_to_github.bat          # 1-Click push script for Windows Command Prompt
├── push_to_github.ps1          # 1-Click push script for PowerShell
└── README.md
```

---

## 🚀 Step 1: Deploy to GitHub (`FlameKaiser2201`)

To push this entire codebase to your GitHub account:

### Option A: Using the Automated Script (Easiest)
1. Double-click `push_to_github.bat` or run:
   ```powershell
   .\push_to_github.ps1
   ```

### Option B: Manual Git Commands
1. Create a repository on GitHub named `vibeverse` at: **[https://github.com/new](https://github.com/new)**
2. In your terminal inside the `vibeverse` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: VibeVerse social media app"
   git branch -M main
   git remote add origin https://github.com/FlameKaiser2201/vibeverse.git
   git push -u origin main
   ```

---

## 🌐 Step 2: Deploy Backend to Render

Since your Render account is connected to GitHub:
1. Open the **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** > **Blueprint**.
3. Select your repository: `FlameKaiser2201/vibeverse`.
4. Render will automatically read `render.yaml` and configure:
   - **Web Service**: `vibeverse-api` (Python FastAPI)
   - **Health Check**: `/health`
   - **Environment Variables**: `SECRET_KEY`, `UPLOAD_DIR`, etc.
5. Under `DATABASE_URL`, plug in your MySQL connection URL:
   `mysql+pymysql://<user>:<password>@<host>:<port>/<dbname>`
   *(You can use a free MySQL database from PlanetScale, Railway, or Aiven).*
6. Click **Apply**! Your backend is live with automatic SSL at:
   `https://vibeverse-api.onrender.com`

---

## 📱 Step 3: Get Your Permanent APK & Future Updates

The app includes **two automated ways** to generate your permanent `.apk`:

### 1. Permanent GitHub Actions Pipeline (Recommended)
Every time code is pushed to your GitHub repo, the `.github/workflows/build-apk.yml` workflow automatically:
1. Provisions an Ubuntu runner with Android SDK and Java 17.
2. Installs dependencies and runs native Android compilation.
3. Outputs `VibeVerse-Universal.apk`.
4. **Direct Download**: 
   - Visit `https://github.com/FlameKaiser2201/vibeverse/actions`
   - Click the latest run and download **`VibeVerse-Permanent-APK`**!
   - It also automatically generates a **GitHub Release v1.0.0** with the `.apk` attached as a permanent direct download link!

### 2. Expo EAS Cloud Build
You can also generate an APK with 1 command using EAS CLI:
```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
This gives you a permanent Expo cloud download link and QR code for your Android device.

---

## 🔐 Android Permissions Configured
In `mobile/app.json`:
- `android.permission.CAMERA` — For snapping photos and recording reels with filters
- `android.permission.RECORD_AUDIO` — For voice messages during chat and reel sound
- `android.permission.READ_MEDIA_IMAGES` — For picking pictures from device gallery
- `android.permission.READ_MEDIA_VIDEO` — For selecting video files from device gallery
- `android.permission.INTERNET` — For connecting to the Render cloud backend

---

## 👨‍💻 Author
Built with ❤️ for **[FlameKaiser2201](https://github.com/FlameKaiser2201)**
