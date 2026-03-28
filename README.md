# AwareTab - Emotion-Aware Browser Homepage

AwareTab is an intelligent, emotion-aware browser extension that replaces your default new tab page with a dynamic, responsive environment. By analyzing your passive interaction signals (mouse movement, keyboard activity, tab switching, and scroll speed), AwareTab infers your current mood (Relaxed, Focused, Stressed, or Tired) and seamlessly adapts its UI, colors, and features to support your mental state.

## 🌟 Key Features

- **🧠 Emotion Engine:** A lightweight, browser-safe inference engine that tracks interaction signals continuously without compromising performance or privacy.
- **🎨 Mood-Responsive Themes:** The entire interface, including background colors, text styling, and ambient elements, shifts gracefully based on your inferred mood.
- **🎵 Ambient Soundscapes:** Features a built-in sound player that provides audio suited to your current state (e.g., calming sounds when stressed, focus beats when working).
- **🧩 Smart Clutter Control:** Depending on your mood, AwareTab adjusts the level of UI clutter. For instance, it hides shortcuts and distractions when you need to focus, but keeps them accessible when you're relaxed.
- **✨ Essential Widgets:** Includes a dynamic greeting, real-time clock, local weather, and quick shortcuts.

## 🛠️ Tech Stack

- **Frontend Framework:** [React](https://reactjs.org/) (v18)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)

## ⚙️ How It Works

The **Emotion Engine** analyzes the following interaction signals to infer your mood:
- **Mouse Movement (25%):** Fast, erratic movements may indicate stress, while slow, steady movements suggest relaxation.
- **Keyboard Activity (20%):** High typing speed maps to focus or stress.
- **Tab Switching (20%):** Frequent tab toggling corresponds to distraction or stress.
- **Idle Time (20%):** Extended idle periods lean towards a tired or relaxed state.
- **Scroll Speed (15%):** Frantic scrolling indicates stress, while moderate scrolling shows engagement.

## 🚀 Installation & Setup

To run this extension locally or load it into your browser:

### 1. Clone & Install Dependencies
```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd AwareTab

# Install dependencies
npm install
```

### 2. Build for Production
To load this as a Chrome extension, you need to build the project first.
```bash
npm run build
```
This will generate a `dist` folder containing the compiled assets and the `manifest.json`.

### 3. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `dist` folder generated inside the `AwareTab` directory.
5. Open a new tab, and you should now see AwareTab!

## 💻 Development Workflow

- `npm run dev` - Starts a local Vite development server for rapidly testing the UI components in a regular browser window, outside of the extension environment. 
- `npm run build` - Compiles the React application into static files within the `dist/` directory. This is the directory you must load as an unpacked extension into Chrome. It also pulls in your `manifest.json`.
- `npm run preview` - Previews the production build locally.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
