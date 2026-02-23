# SecureScan AI

A modern cybersecurity-themed QR code malware detection system with AI-powered risk analysis.

## Features

- **AI-Powered Analysis**: Uses Gemini 3 Flash to analyze URLs for phishing, malware, and social engineering.
- **Real-time Scanning**: Scan QR codes directly using your camera.
- **Fallback Options**: Upload images or enter URLs manually if camera access is unavailable.
- **Automatic Blocking**: High-risk URLs are automatically flagged and blocked.
- **Scan History**: Keep track of previous scans and their risk levels.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Gemini API Key](https://aistudio.google.com/app/apikey)

## Getting Started

1. **Clone the repository** (or download the source code).

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to `http://localhost:3000` in your browser.

## Project Structure

- `src/components/`: Reusable UI components (Scanner, RiskGauge, etc.).
- `src/services/`: Logic for interacting with external APIs (Gemini).
- `src/utils/`: Helper functions for styling and risk calculation.
- `src/App.tsx`: Main application logic and routing.

## Built With

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- [Motion](https://motion.dev/)
- [Google Gemini API](https://ai.google.dev/)
