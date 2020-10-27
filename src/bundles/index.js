import {
  composeBundles,
  createCacheBundle,
  createUrlBundle,
} from "redux-bundler";
import cache from "../utils/cache";
import modelBundle from "./model-bundle";
import modelAnimationBundle from "./model-animation-bundle";

export default composeBundles(
  createCacheBundle({
    cacheFn: cache.set,
  }),
  createUrlBundle(),
  modelBundle,
  modelAnimationBundle
);
