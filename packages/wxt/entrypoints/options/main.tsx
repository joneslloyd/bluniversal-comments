import React from "react";
import ReactDOM from "react-dom/client";
import Options from "./Options.tsx";
import "./style.css";

import "../../i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
