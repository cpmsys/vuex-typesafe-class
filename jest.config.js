module.exports = {
  moduleFileExtensions: [
    "js",
    "json",
    "ts",
    // tell Jest to handle *.vue files
    "vue"
  ],
  transform: {
    // process TypeScript files
    "^.+\\.ts$": "ts-jest",
    // process *.vue files with vue-jest
    ".*\\.(vue)$": "vue-jest"
  },
  // support the same @ -> src alias mapping in source code
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  // serializer for snapshots
  snapshotSerializers: ["jest-serializer-vue"],

  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",

  globals: {
    "vue-jest": {
      babelConfig: false
    }
  }
};
