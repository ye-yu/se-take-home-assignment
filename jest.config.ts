import type { Config } from "jest";

const jestConfig: Config = {
  testRegex: ["dist/.*\\.(test|spec)\\.mjs$"],
  transform: {},
};

export default jestConfig;
