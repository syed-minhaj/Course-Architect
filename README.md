# Course Architect

"Course Architect" is an innovative, AI-driven personalized learning platform designed to generate custom curricula tailored to individual user goals and existing skill sets. Leveraging the power of artificial intelligence, it creates a unique learning path for every user, adapting and evolving with their progress.

## Features

*   **AI-Driven Personalization:** Generates bespoke learning paths based on your specific learning objectives and current knowledge.
*   **Skill Baseline Audit:** Assesses your current skills to avoid redundant content and focus on knowledge gaps.
*   **AI Course Generation:** Compiles videos, articles, and interactive labs into a cohesive, comprehensive course.
*   **Continuous Tuning:** Adjusts course difficulty and content in real-time based on your performance and comprehension.
*   **Interactive UI:** Built with React and Tailwind CSS for a responsive and engaging user experience.
*   **Robust Routing:** Utilizes Tanstack Router for efficient and intuitive navigation.
*   **Server-Side Rendering (SSR):** Powered by Nitro for enhanced performance and SEO.
*   **PostgreSQL Database:** Managed with Drizzle ORM for reliable and scalable data storage.
*   **Authentication:** Integrated with `better-auth` for secure user management.
*   **Gemini API Integration:** Harnesses `@google/genai` for advanced AI capabilities.

## Technologies Used

*   **Frontend:**
    *   React
    *   Tanstack Router
    *   Tailwind CSS
    *   Vite (Build Tool)
*   **Backend/Database:**
    *   Drizzle ORM
    *   PostgreSQL (via Neon Database Serverless)
    *   Nitro (SSR/API Layer)
*   **AI:**
    *   Google Gemini API (`@google/genai`)
*   **Authentication:**
    *   Better-Auth
*   **Code Quality:**
    *   TypeScript
    *   ESLint
    *   Prettier

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or Yarn
*   A PostgreSQL database (e.g., a local instance or a Neon serverless instance)
*   Google Gemini API Key (if you wish to use the AI features)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/everything-course.git
    cd everything-course
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root of the project .
    ```code
    BETTER_AUTH_SECRET=
    BETTER_AUTH_URL="http://localhost:3000" # Base URL of your app
    DATABASE_URL=
    GOOGLE_CLIENT_SECRET=
    GEMINI_API_KEY=
    ```

4.  **Run Drizzle migrations:**
    ```bash
    npm run drizzle
    # This will generate migration files and push the schema to your database.
    ```

### Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be accessible at `http://localhost:3000`. The landing page is served from `src/routes/index.tsx`.

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

To preview the production build:

```bash
npm run preview
# or
yarn preview
```


## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

