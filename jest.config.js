
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
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.e2e-spec.ts",
    "!src/main.ts"
  ],
  coverageDirectory: "./coverage",
  moduleNameMapper: {
    '^shared/(.*)$': '<rootDir>/shared/$1',
    '^identity/(.*)$': '<rootDir>/packages/identity/$1',
    '^notification/(.*)$': '<rootDir>/packages/notification/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1'
  },
  
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
      displayName: 'identity',
      testMatch: ['<rootDir>/**/*.e2e-spec.ts','<rootDir>/**/*.spec.ts'],
      // Herdar configurações do projeto pai
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleNameMapper: {
        '^shared/(.*)$': '<rootDir>/shared/$1',
        '^identity/(.*)$': '<rootDir>/packages/identity/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1'
      },
     // setupFiles: ['<rootDir>/jest.setup.ts'],
      testEnvironment: 'node'
    },
    // E2E tests configuration
    {
      displayName: 'notification',
      testMatch: ['<rootDir>/**/*.e2e-spec.ts','<rootDir>/**/*.spec.ts'],
      // Herdar configurações do projeto pai
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
      },
      moduleNameMapper: {
        '^shared/(.*)$': '<rootDir>/shared/$1',
        '^notification/(.*)$': '<rootDir>/packages/notification/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1'
      },
     // setupFiles: ['<rootDir>/jest.setup.ts'],
      testEnvironment: 'node'
    }
  ]
};

module.exports = config;