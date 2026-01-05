import Page from "./app/dashboard/page";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <div>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Page />
      </ThemeProvider>
    </div>
  );
}

export default App;
