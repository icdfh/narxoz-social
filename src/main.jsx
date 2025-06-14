import React            from "react";
import ReactDOM         from "react-dom/client";
import App              from "./App";
import { Provider }     from "react-redux";
import { store, persistor } from "./store/store";
import { PersistGate }  from "redux-persist/integration/react";

import "./assets/css/_root.css";
import "./assets/css/_helpers.css";
import "./assets/css/_responsive.css";   // ← последним!

import "./index.css";           // стили приложения

/* ───────── PersistGate-обёртка ───────── */
const SafePersistGate = ({ children }) => (
  <PersistGate
    loading={<p style={{ padding: 20 }}>⏳ Загрузка состояния…</p>}
    persistor={persistor}
  >
    {children}
  </PersistGate>
);

/* ───────── Рендер ───────── */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <SafePersistGate>
      <App />
    </SafePersistGate>
  </Provider>
);
