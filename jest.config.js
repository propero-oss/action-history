/* eslint-disable */
const tsconfig = require("./tsconfig.json");
const { paths } = tsconfig.compilerOptions;
const { entries, fromEntries } = Object;

const escapeRegExp = (str) => str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
const keyToRegexp = (key) => `^${escapeRegExp(key).replace(/(\\*)+/g, "(.*)")}$`;
const valueToPathMatcher = ([value]) => value.replace("*", "$1").replace("./", "<rootDir>/");
const entryMapper = ([key, value]) => [keyToRegexp(key), valueToPathMatcher(value)];
const moduleNameMapper = fromEntries(entries(paths).map(entryMapper));

module.exports = {
  preset: "jest-preset-typescript",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!**/node_modules/**"],
  coverageReporters: ["lcovonly"],
  moduleNameMapper,
};
