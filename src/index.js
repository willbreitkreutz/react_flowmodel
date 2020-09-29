import React from "react";
import ReactDOM from "react-dom";
import getStore from "./bundles";
import cache from "./utils/cache";

import App from "./App";

import "./css/bootstrap/css/bootstrap.min.css";
import "./css/mdi/css/materialdesignicons.min.css";
import "./css/index.css";

window.localStorage.removeItem("debug");

cache.getAll().then((initialData) => {
  const store = getStore(initialData);
  window.store = store;
  ReactDOM.render(<App store={store} />, document.getElementById("root"));
});
