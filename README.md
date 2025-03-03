# Mythoclastia - Fantasy World Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/aigc3yehe/Mythoclastia/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)

<img src="src/imgs/icon.png" alt="Game Logo" width="150px" height="auto">

[English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

Mythoclastia is an interactive fantasy game world generator that allows users to create unique fantasy worlds, team members, and engage in tactical battles. The application uses AI-powered text and image generation to create immersive gaming experiences.

## 🌟 Features

- **World Generation**: Create richly detailed fantasy worlds with unique settings, geography, and conflicts
- **Team Members**: Generate and customize team members with different races, abilities, and backstories
- **Battle System**: Engage in tactical turn-based battles against procedurally generated enemies
- **Stunning Visuals**: AI-generated imagery for worlds, characters, and enemies
- **Persistent Game State**: Save your progress and continue your adventure

## 🚀 Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- An OpenAI API key (for text generation)
- Image generation token (optional, for image generation)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/aigc3yehe/Mythoclastia.git
   cd Mythoclastia
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🎮 How to Play

1. **Start Screen**: Enter a prompt to generate your fantasy world
2. **Loading Stage**: Wait while the AI generates your world and team members
   > **Note**: World generation can take some time. A processing time of up to 3 minutes is normal.
3. **Main Game**: Explore your world and view your team members
4. **Battle Mode**: Engage in tactical turn-based battles
   - Choose skills for each team member
   - Battle against different types of enemies
   - Progress through multiple rounds with increasing difficulty

## 🔑 API Keys

This application requires an OpenAI API key for text generation features and optionally an Image Generation token for visual elements.

### Setting Up API Keys

1. **OpenAI API Key** (Required):
   - You need to prepare your own OpenAI API key
   - Create an account at [OpenAI](https://platform.openai.com/)
   - Generate an API key from your dashboard
   - Enter this key in the Admin Terminal's Settings tab in the game

2. **Image Generation Token** (Optional):
   - Image generation functionality is powered by [misato.ai](https://misato.ai)'s technology and computing resources
   - Contact YeHe to obtain a token for using the image generation feature
   - If not provided, ASCII art will be displayed instead of generated images
   - Enter this token in the Admin Terminal's Settings tab

### API Key Security Notes

- API keys are stored locally in your browser's localStorage
- Keys are never sent to any server except the respective API providers
- Always keep your API keys private and secure

## 📚 Project Structure

```
src/
├── components/      # UI components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── services/        # External service integrations
├── utils/           # Utility functions
└── App.js           # Main application component
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [OpenAI](https://openai.com/) for the text generation API
- [misato.ai](https://misato.ai) for providing image generation technology and computing power
- Connect with [Misato Virtuals](https://twitter.com/Misato_Virtuals) on Twitter
- [React](https://reactjs.org/) for the UI framework
- All the amazing contributors who have helped improve this project
