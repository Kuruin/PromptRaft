import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { Provider } from "@/components/ui/provider"
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(

  <Provider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
    </ThemeProvider>
  </Provider>
);
