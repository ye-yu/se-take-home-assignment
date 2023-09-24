import type { Config } from "jest";

const jestConfig: Config = {
  testRegex: ["dist/.*\\.(test|spec)\\.js$"],
  transform: {},
};

export default jestConfig;
