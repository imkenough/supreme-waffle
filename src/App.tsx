import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <div>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Outlet />
      </ThemeProvider>
    </div>
  );
}

export default App;
