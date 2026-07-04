import { PlaygroundLayout } from "./layouts/PlaygroundLayout";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <PlaygroundLayout>
      <AppRoutes />
    </PlaygroundLayout>
  );
}
