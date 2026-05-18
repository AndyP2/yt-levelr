import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Date: "readonly",
        Math: "readonly",
        parseInt: "readonly",
        parseFloat: "readonly",
        AudioContext: "readonly",
        location: "readonly",
        Float32Array: "readonly",
        Promise: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
    },
  },
];
