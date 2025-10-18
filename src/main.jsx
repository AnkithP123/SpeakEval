import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import * as Sentry from "@sentry/react";

// A utility function to safely get all localStorage items
function getLocalStorageData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      data[key] = localStorage.getItem(key);
    } catch (e) {
      console.error("Failed to read local storage key", key, e);
    }
  }
  return data;
}


Sentry.init({
  // WARNING: Use the DSN for your FRONTEND project here!
  dsn: "https://1de7869188b45dbd704581d31a1e7821@o4510194898829312.ingest.us.sentry.io/4510198357426176",

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production based on traffic.
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // ADDED: This tells Sentry to automatically attach tracing headers to requests
  // made to these URLs, linking the frontend event to the backend trace.
  // *** REPLACE 'https://yourdomain.com/api' with your actual backend URL ***
  tracePropagationTargets: ["localhost", "https://server.speakeval.org", "https://www.server.speakeval.org", /^\//],

  // Sentry can track user navigation and clicks as 'breadcrumbs' leading up to an error.
  integrations: [
    Sentry.browserTracingIntegration(), // Performance monitoring for browsers
    Sentry.reactRouterV6BrowserTracingIntegration({
      /* ... */
    }), // If you use React Router v6
    Sentry.replayIntegration({
      // Session Replay records user interaction up to the point of an error.
      // Adjust this sample rate down to 0.05 or 0.01 in production for cost control.
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Optional: Automatically set the current environment
  environment: process.env.NODE_ENV || "development",

  beforeSend(event) {
    try {
      const snapshot = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // You can filter keys here if needed:
        if (!key.toLowerCase().includes("token") && !key.toLowerCase().includes("auth")) {
          snapshot[key] = localStorage.getItem(key);
        }
      }

      event.extra = {
        ...event.extra,
        localStorage: snapshot,
      };
    } catch (err) {
      console.warn("Failed to capture localStorage:", err);
    }

    return event;
  },

});

Sentry.setContext("storage", getLocalStorageData());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
