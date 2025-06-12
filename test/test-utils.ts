import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { USERS_REPOSITORY_TOKEN, UsersRepository } from 'src/modules/users/domain/repositories/users.repository.interface';

// Store app instance for cleanup
let appInstance: INestApplication | null = null;

export async function setupTestApp(): Promise<{
  app: INestApplication;
  usersRepository: UsersRepository;
}> {
  // Close previous app instance if exists
  if (appInstance) {
    await teardownTestApp(appInstance);
  }

  // Clear environment variables that might affect tests
  process.env = { ...process.env };

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  
  // Store the app instance for cleanup
  appInstance = app;

  const usersRepository = app.get<UsersRepository>(USERS_REPOSITORY_TOKEN);

  try {
    // Clear all data before each test
    await usersRepository.clear();
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }

  return { app, usersRepository };
}

export async function teardownTestApp(app: INestApplication): Promise<void> {
  if (!app) return;

  try {
    // Clear all data after each test
    const usersRepository = app.get<UsersRepository>(USERS_REPOSITORY_TOKEN);
    await usersRepository.clear();

    // Close the app
    await app.close();
    
    // Clear the app instance
    if (appInstance === app) {
      appInstance = null;
    }

    // Add a small delay to allow for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error('Error during test teardown:', error);
    // Don't throw to ensure cleanup continues
  }
}

// Handle process exit
process.on('exit', async () => {
  if (appInstance) {
    await teardownTestApp(appInstance);
  }
});




