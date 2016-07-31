module.exports = {
  "extends": [
    "strict",
    "strict/es6",
    "strict/mocha"
  ],
  "rules": {
    // JUSTIFICATION: code cleanliness
    // separation of variable declarations and logic makes source code more readable
    "newline-after-var": [2, "always"]
  }
}
