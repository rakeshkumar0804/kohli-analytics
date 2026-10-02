import Dashboard from "./dashboard/Dashboard";
import ErrorBoundary from "./components/Common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Unable to display this view">
      <Dashboard />
    </ErrorBoundary>
  );
}
