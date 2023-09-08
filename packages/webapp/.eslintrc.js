/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "plugin:react/recommended",
    "@remix-run/eslint-config", 
    "@remix-run/eslint-config/node",
    "../../.eslintrc.js",
  ],
  ignorePatterns: ["node_modules/", "build/"],
};
