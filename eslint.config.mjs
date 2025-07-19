import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts", "**/*.js"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        // Code quality rules
        curly: ["error", "all"],
        eqeqeq: ["error", "always"],
        "no-throw-literal": "error",
        semi: ["error", "always"],
        
        // TypeScript specific rules
        "@typescript-eslint/no-unused-vars": ["warn", { 
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_" 
        }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/prefer-const": "error",
        "@typescript-eslint/no-var-requires": "error",
        
        // Code style rules
        "prefer-const": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "prefer-template": "error",
        
        // Best practices
        "no-console": "warn",
        "no-debugger": "error",
        "no-duplicate-imports": "error",
        "no-unused-expressions": "error",
        
        // Security rules
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error"
    },
}];