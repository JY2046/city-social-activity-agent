import type { PropsWithChildren } from "react";
import { initCloudRuntime } from "./services/cloudRuntime";

import "./app.css";

initCloudRuntime();

function App({ children }: PropsWithChildren) {
  return children;
}

export default App;
