# AI Companion Launchpad 🤖✨

An advanced platform for creating and interacting with 3D AI companions. Build personalized AI characters with unique personalities, voices, and appearances that can engage in natural conversations through text and voice.

![AI Companion Launchpad](https://img.shields.io/badge/AI-Companion-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### Core Features
- **🎭 3D Animated Characters** - Real-time 3D avatars with expressions and animations
- **💬 Natural Conversations** - AI-powered chat with personality-driven responses
- **🎤 Voice Interaction** - Speech recognition and synthesis for natural voice conversations
- **🎨 Customizable Companions** - Create unique AI companions with different personalities
- **🌐 Multi-Provider Support** - Works with OpenAI, Anthropic, or local models
- **💾 Persistent Memory** - Companions remember past conversations

### Technical Features
- Real-time WebSocket communication
- Browser-based 3D rendering with Three.js
- Web Speech API integration
- Responsive design for all devices
- Modular architecture for easy extension

## 🎮 3D Avatar System

The platform supports multiple 3D avatar systems for maximum flexibility:

### 1. **Ready Player Me** 🌐
- Web-based avatar creator with thousands of customization options
- No download required - use avatars directly via URL
- Professional-quality 3D models with animations
- **How to use:**
  1. Visit [readyplayer.me](https://readyplayer.me)
  2. Create and customize your avatar
  3. Copy the .glb URL
  4. Paste in companion creation form

### 2. **Custom GLTF/GLB Models** 📦
- Industry-standard 3D format supported by all major tools
- Works with models from Sketchfab, Mixamo, or your own creations
- **Supported features:**
  - Skeletal animations
  - Morph targets (blend shapes)
  - PBR materials
  - Embedded textures

### 3. **VRM/VRoid Models** 🎌
- Popular format for anime-style avatars and VTubers
- Built-in support for expressions and physics
- **Sources:**
  - [VRoid Hub](https://hub.vroid.com)
  - Create with VRoid Studio (free)
  - Import existing VRM models

### 4. **Procedural Avatars** 🎨
- Simple geometric avatars (no external files needed)
- Three built-in styles: Realistic, Anime, Cartoon
- Lightweight and fast loading

### Avatar Features
- **Facial Expressions**: Happy, sad, angry, surprised, thinking
- **Animations**: Idle, talking, thinking, happy, custom animations
- **Lip Sync**: Basic mouth movement during speech
- **Procedural Animations**: Breathing, blinking, head movement
- **Interactive Controls**: Rotate with mouse/touch

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key (or other AI provider credentials)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-companion-launchpad.git
cd ai-companion-launchpad
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎮 Usage

### Creating Your First Companion

1. Click the "Create New" button in the sidebar
2. Fill in the companion details:
   - **Name**: Choose a unique name
   - **Personality**: Select from friendly, professional, creative, wise, or energetic
   - **Voice**: Choose a voice type that matches your companion
   - **Avatar Style**: Pick from 6 different avatar systems
   - **Avatar URL/Path**: (For Ready Player Me, Custom, or VRM avatars)
   - **Description**: Add any special traits or background

3. Click "Create Companion" to bring your AI to life!

### Adding Custom 3D Models

1. **For local models:**
   - Place your .glb/.gltf/.vrm files in `public/assets/avatars/`
   - Use the path `/assets/avatars/your-model.glb` in the form

2. **For online models:**
   - Use the direct URL to the model file
   - Ensure CORS is enabled on the hosting server

3. **For animations:**
   - Place animation files in `public/assets/animations/`
   - Animations can be loaded separately from models

### Interacting with Companions

- **Text Chat**: Type messages in the chat input and press Enter
- **Voice Chat**: Click the microphone button to speak
- **3D Interaction**: Click and drag on the avatar to rotate
- **Voice Calls**: Click the phone icon for immersive voice conversations

### Customization Options

Access settings to:
- Change AI providers (OpenAI, Anthropic, local models)
- Configure API keys
- Adjust voice settings
- Toggle performance options

## 🏗️ Architecture

```
ai-companion-launchpad/
├── public/              # Frontend assets
│   ├── js/             # JavaScript modules
│   │   ├── app.js      # Main application controller
│   │   ├── companion.js # Companion management
│   │   ├── chat.js     # Chat interface
│   │   ├── avatar3d.js # 3D avatar rendering (ALL avatar systems)
│   │   └── voice.js    # Voice interaction
│   ├── css/            # Stylesheets
│   ├── assets/         # Static assets
│   │   ├── avatars/    # Local 3D model files
│   │   └── animations/ # Animation files
│   └── index.html      # Main HTML file
├── services/           # Backend services
│   ├── aiService.js    # AI provider integration
│   └── voiceService.js # Voice processing
├── routes/             # API routes
│   ├── companions.js   # Companion CRUD operations
│   ├── chat.js        # Chat endpoints
│   └── voice.js       # Voice endpoints
├── server.js           # Express server
└── package.json        # Project configuration
```

## 🔧 Configuration

### AI Providers

The platform supports multiple AI providers:

1. **OpenAI** (default)
   - Set `OPENAI_API_KEY` in your `.env` file
   - Uses GPT-3.5-turbo by default

2. **Anthropic** (coming soon)
   - Set `ANTHROPIC_API_KEY` in your `.env` file
   - Uses Claude models

3. **Local Models**
   - No API key required
   - Uses fallback responses (full implementation coming soon)

### Voice Configuration

Voice features use the Web Speech API for:
- **Speech Recognition**: Real-time transcription
- **Speech Synthesis**: Natural voice output

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Backend**: Node.js with Express
- **3D Graphics**: Three.js with GLTF/VRM support
- **Real-time**: WebSockets
- **AI**: OpenAI API (expandable to other providers)

### Adding New Features

1. **New Personality Types**: Edit `buildSystemPrompt()` in `aiService.js`
2. **New Avatar Systems**: Add loader in `avatar3d.js`
3. **New Voice Types**: Add mappings in `selectVoice()` in `voice.js`
4. **Custom Animations**: Add to `setupProceduralAnimations()` in `avatar3d.js`

## 📱 Mobile Support

The platform is fully responsive and supports:
- Touch gestures for 3D interaction
- Mobile-optimized chat interface
- Voice input on mobile devices

## 🔒 Security

- API keys are stored locally and never sent to our servers
- All communications use secure WebSocket connections
- No personal data is collected or stored

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js for 3D graphics
- OpenAI for AI capabilities
- Ready Player Me for avatar system
- The open-source community

## 🚧 Roadmap

- [ ] Integration with more AI providers
- [ ] Advanced 3D avatar customization
- [ ] Multi-language support
- [ ] Avatar marketplace
- [ ] Mobile apps (iOS/Android)
- [ ] VR/AR support
- [ ] Real-time collaboration features
- [ ] Advanced lip-sync with Rhubarb or similar
- [ ] Motion capture support
- [ ] Avatar emotion presets

---

Built with ❤️ for the future of AI companionship