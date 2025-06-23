import React from "react";
import { AppProvider } from "./contexts/AppContext";
import { Layout } from "./components/layout";
import { HomePage } from "./components/pages";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <div data-testid="app-root">
      <ErrorBoundary>
        <AppProvider>
          <div data-testid="app-context-provider">
            <Layout>
              <HomePage />
            </Layout>
          </div>
        </AppProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
