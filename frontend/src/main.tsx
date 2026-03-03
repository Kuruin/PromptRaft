import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { Provider } from "@/components/ui/provider"
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(

  <Provider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
    </ThemeProvider>
  </Provider>
);
