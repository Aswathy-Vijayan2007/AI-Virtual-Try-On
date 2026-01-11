# Wardrobe-Aware AI Virtual Try-On Web App

## 1. Project Title
**Wardrobe-Aware AI Virtual Try-On Web App**

## 2. Basic Details
*   **Team Name**: [Insert Team Name Here]
*   **Team Members**:
    *   [Member 1 Name]
    *   [Member 2 Name]
    *   [Member 3 Name]
*   **Track / Theme**: [Insert Track/Theme Here]

### Problem Statement
Many users struggle with "wardrobe paralysis"—having a closet full of clothes but nothing to wear. Additionally, online shopping often leads to returns because users cannot visualize how items fit or match their existing wardrobe. There is a need for a solution that digitizes personal wardrobes, offers intelligent outfit suggestions, and allows for virtual try-on experiences without the need each physical garment.

### Solution Overview
Our solution is a comprehensive web application that acts as a digital wardrobe assistant. It allows users to:
1.  **Digitize their closet**: Upload and categorize clothing items.
2.  **Virtual Try-On**: Use the webcam and AI-powered pose detection to overlay clothing items onto the user in real-time.
3.  **AI Stylist**: Chat with a Groq-powered AI assistant for personalized outfit advice and get automated daily recommendations based on weather and occasions.
4.  **Plan**: Schedule outfits for future events.

### Brief Project Description
This application uses computer vision (TensorFlow.js) for real-time body tracking and Large Language Models (Groq) for stylistic reasoning. It runs entirely in the browser for privacy, using IndexedDB for storage, ensuring that user data remains local and secure.

---

## 3. Technical Details

### Tech Stack
*   **Frontend Framework**: React 18 (with TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS, PostCSS
*   **State Management**: TanStack Query (React Query)

### Libraries & Tools
*   **Computer Vision**: `@tensorflow/tfjs`, `@tensorflow-models/pose-detection` (MoveNet) for real-time body landmark detection.
*   **Icons**: `lucide-react`
*   **Database**: `idb` (IndexedDB wrapper) for local, client-side data persistence.
*   **Validation**: `zod`, `react-hook-form`

### AI Models & APIs
*   **Stylist Intelligence**: Groq API (running Llama 3 or similar) for generating outfit reasonings and chat responses.
*   **Pose Detection**: MoveNet (Lightning) model running locally in the browser via TensorFlow.js.

### Implementation Overview
The application is a Single Page Application (SPA).
*   **Wardrobe**: Uses IndexedDB to store base64 image data and metadata for clothing items.
*   **Try-On**: The `WebcamPreview` component captures the video stream, runs the MoveNet model to find shoulder and hip keypoints, and dynamically scales/positions clothing images over the user's body.
*   **AI Recommendations**: We implemented a hybrid recommendation engine. It uses a heuristic algorithm for instant suggestions (graph-based color/style matching) and calls the Groq API for complex, context-aware advice (e.g., "What should I wear for a summer wedding?").

---

## 4. Installation & Execution

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### Installation Steps
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd wardrobe-ai-tryon
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Configuration**:
    Create a `.env` file in the root directory and add your Groq API key:
    ```env
    VITE_GROK_API_KEY=your_groq_api_key_here
    VITE_AI_BASE_URL=https://api.groq.com/openai/v1
    VITE_AI_MODEL=llama3-70b-8192
    ```

### Instructions to Run Locally
1.  Start the development server:
    ```bash
    npm run dev
    ```
    *(Note: If you face script restrictions on Windows PowerShell, use `cmd /c "npm run dev"`)*
2.  Open your browser and navigate to `http://localhost:5173`.

---

## 5. Deployment / Live Website
*   **Live URL**: [Insert Live Website URL Here]
    *(e.g., https://your-team-project.vercel.app)*

*If deployment is not possible, please see the demo video below.*

---

## 6. Screenshots
*(Replace these placeholders with actual screenshots of your application)*

### Dashboard & Wardrobe
![Wardrobe Interface](/screenshots/wardrobe.png)
*Managing the digital closet*

### Virtual Try-On
![Virtual Try-On](/screenshots/tryon.png)
*Real-time overlay of clothes using pose detection*

### AI Stylist Chat
![AI Stylist](/screenshots/chat.png)
*Chatting with the AI for outfit advice*

---

## 7. Demo Video
[Insert Link to Demo Video Here]
*(Recommended: YouTube link or Google Drive link)*