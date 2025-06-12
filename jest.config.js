/** @type {import('jest').Config} */
const config = {
  // Shared configuration for all projects
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Projects configuration to include both unit and e2e tests
  projects: [
    // Unit tests configuration
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^emails/(.*)$': '<rootDir>/__mocks__/emails/$1'
      },

      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleDirectories: ['node_modules', '<rootDir>']
    },
    // E2E tests configuration
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^emails/(.*)$': '<rootDir>/__mocks__/emails/$1'
      },
      testEnvironment: 'node',
 
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleDirectories: ['node_modules', '<rootDir>/..']
    }
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/migrations/**',
    '!**/interfaces/**',
    '!**/dto/**',
    '!**/entities/**',
    '!**/constants/**',
    '!**/decorators/**',
    '!**/guards/**',
    '!**/interceptors/**',
    '!**/middlewares/**',
    '!**/mocks/**',
    '!**/modules/**/index.ts',
    '!**/types/**',
    '!**/utils/**',
    '!**/validators/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
module.exports = config;