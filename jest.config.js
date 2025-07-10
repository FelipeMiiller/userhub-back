
/** @type {import('jest').Config} */
const config = {
  // Shared configuration for all projects
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1'
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.e2e-spec.ts",
    "!src/main.ts"
  ],
  coverageDirectory: "./coverage",
  setupFiles: ['<rootDir>/jest.setup.ts'],
  
  // Configuração do ts-jest
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 'es2020',
        module: 'commonjs'
      }
    }
  },

  projects: [
    // Unit tests configuration
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      // Herdar configurações do projeto pai
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1'
      },
     // setupFiles: ['<rootDir>/jest.setup.ts'],
      testEnvironment: 'node'
    },
    // E2E tests configuration
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/**/*.e2e-spec.ts'],
      // Herdar configurações do projeto pai
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1'
      },
     // setupFiles: ['<rootDir>/jest.setup.ts'],
      testEnvironment: 'node'
    }
  ]
};

module.exports = config;