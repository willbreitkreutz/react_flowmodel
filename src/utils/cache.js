import { getConfiguredCache } from 'money-clip'
import pkg from "../../package.json";

export default getConfiguredCache({
  maxAge: 1000 * 60 * 60 * 24,
  version: `${pkg.name}-${pkg.version}`
});