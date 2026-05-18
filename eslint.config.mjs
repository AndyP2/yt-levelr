import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Date: "readonly",
        Math: "readonly",
        parseInt: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
    },
  },
];
