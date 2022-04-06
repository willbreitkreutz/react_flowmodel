import {
  composeBundles,
  createCacheBundle,
  createUrlBundle,
} from "redux-bundler";
import cache from "../utils/cache";
import routeBundle from "./routes-bundle";
import modelAnimationBundle from "./model-animation-bundle";

export default composeBundles(
  createCacheBundle({
    cacheFn: cache.set,
  }),
  createUrlBundle(),
  routeBundle,
  modelAnimationBundle
);
