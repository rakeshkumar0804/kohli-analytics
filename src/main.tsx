import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./dashboard/dashboard.css";
import "./dashboard/v2.css";
import "./dashboard/story.css";
import "./dashboard/inningsCompare.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import "./dashboard/discovery.css";

import "./dashboard/cricketClub.css";
