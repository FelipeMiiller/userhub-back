import getDataSource from './typeorm-datasource';
import { seedSystemModulesResourcesPermissions } from './seed-system-modules';

(async () => {
  const dataSource = await getDataSource;
  await dataSource.initialize();
  await seedSystemModulesResourcesPermissions(dataSource);
  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed completed');
})();
