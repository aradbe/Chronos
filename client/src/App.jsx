import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { StoreProvider } from "./stores/StoreProvider";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="app">
          <AppRouter />
        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
