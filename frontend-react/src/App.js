import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { GlobalUIProvider } from "./context/GlobalUIContext";

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <GlobalUIProvider>
            <AppRouter />
          </GlobalUIProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

