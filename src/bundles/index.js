import {
  composeBundles,
  createCacheBundle,
  createUrlBundle,
} from "redux-bundler";
import cache from "../utils/cache";
import modelBundle from "./new-model-bundle";

export default composeBundles(
  createCacheBundle({
    cacheFn: cache.set,
  }),
  createUrlBundle(),
  modelBundle
);
