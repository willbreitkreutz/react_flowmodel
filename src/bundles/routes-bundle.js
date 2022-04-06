import { createRouteBundle } from "redux-bundler";
import Home from "../components/home";
import Comparison from "../components/comparison";

export default createRouteBundle({
  "": Home,
  "/": Home,
  "/compare": Comparison,
  "*": Home,
});
