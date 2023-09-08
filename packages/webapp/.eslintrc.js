/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "@remix-run/eslint-config", 
    "@remix-run/eslint-config/node",
    "../../.eslintrc.js",
    "plugin:react/jsx-runtime"
  ],
  ignorePatterns: ["node_modules/", "build/"],
};
