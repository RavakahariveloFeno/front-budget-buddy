import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initFetchTracking } from "./lib/fetch-tracker";
import "./index.css";

initFetchTracking();


createRoot(document.getElementById("root")!).render(<App />);
