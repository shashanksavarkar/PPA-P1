import CreatorPage from "./pages/CreatorPage";
import PlaygroundPage from "./pages/PlaygroundPage";

const App = () => {
  const isCreatorMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "creator";

  if (isCreatorMode) {
    return <CreatorPage />;
  }

  return <PlaygroundPage />;
};

export default App;