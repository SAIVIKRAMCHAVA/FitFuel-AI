/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.jest.json",
      isolatedModules: true,
    },
  },
  // NEW: load our mocks (e.g., next/cache) for every test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
