// @ts-check

import { createFolderStructure } from 'eslint-plugin-project-structure';

const finalDirectoryWithUnitTestsBuilder = (fileType) => ({
  children: [
    {
      name: '__test__',
      children: [
        {
          name: 'unit',
          children: [{ name: `{kebab-case}.${fileType}.spec.ts` }],
        },
        
      ],
    },
    {
      name: `{kebab-case}.${fileType}.ts`,
    },
  ],
});

export const folderStructureConfig = createFolderStructure({
  structure: [
    {
      name: 'src',
      children: [
        {
          name: 'module',
          // ruleId: 'moduleFolder',
          children: [
            {
              name: '{kebab-case}', // TODO make it genereic
              children: [
                {
                  name: '__test__',
                  children: [
                    {
                      name: 'e2e',
                      ruleId: 'end2endTestFolder',
                    },
                  ],
                },
                { name: '{kebab-case}.module.ts' },
                {
                  name: 'core',
                  children: [
                    {
                      name: 'service',
                      ruleId: 'finalDirectoryWithUnitTests_service',
                    },
                    {
                      name: 'client',
                      children: [
                        {
                          name: '{kebab-case}.{kebab-case}.interface.ts',
                        },
                      ],
                    },
                    {
                      name: 'model',
                      ruleId: 'finalDirectoryWithUnitTests_model',
                    },
                    {
                      name: 'exception',
                      ruleId: 'finalDirectoryWithUnitTests_exception',
                    },
                    {
                      name: 'enum',
                      children: [{ name: '*.enum.ts' }],
                    },
                  ],
                },
                {
                  name: 'event',
                  children: [
                    {
                      name: 'handler',
                      ruleId: 'finalDirectoryWithUnitTests_eventHandler',
                    },
                  ],
                },
                {
                  name: 'public-api',
                  children: [
                    {
                      name: 'facade',
                      ruleId: 'finalDirectoryWithUnitTests_facade',
                    },
                    {
                      name: 'interface',
                      children: [{ name: '*.interface.ts' }],
                    },
                  ],
                },
                {
                  name: 'http',
                  children: [
                    {
                      name: 'client',
                      children: [
                        {
                          name: '{kebab-case}',
                          ruleId: 'finalDirectoryWithUnitTests_httpClient',
                        },
                      ],
                    },
                    {
                      name: 'graphql',
                      children: [
                        {
                          name: 'resolver',
                          ruleId: 'finalDirectoryWithUnitTests_resolver',
                        },
                        {
                          name: 'type',
                          children: [{ name: '*.type.ts' }],
                        },
                      ],
                    },
                    {
                      name: 'rest',
                      children: [
                        {
                          name: 'controller',
                          ruleId: 'finalDirectoryWithUnitTests_controller',
                        },
                        {
                          name: 'dto',
                          children: [
                            {
                              name: 'request',
                              children: [
                                {
                                  name: '*.dto.ts',
                                },
                              ],
                            },
                            {
                              name: 'response',
                              children: [
                                {
                                  name: '*.dto.ts',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'guard',
                      children: [{ name: '*.guard.ts' }],
                    },
                  ],
                },
                {
                  name: 'persistence',
                  children: [
                    { name: 'entity', ruleId: 'finalDirectoryWithUnitTests_entity' },
                    {
                      name: 'repository',
                      ruleId: 'finalDirectoryWithUnitTests_repository',
                    },
                    {
                      name: 'external',
                      children: [
                        {
                          name: 'repository',
                          ruleId: 'finalDirectoryWithUnitTests_repository',
                        },
                      ],
                    },
                    {
                      name: '{kebab-case}.*.ts', //persisnce may need some files like a module or a schema definition
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'shared',
          children: [
            {
              //libraries can have files on to root level or sub folders
              name: '{kebab-case}',
              children: [
                {
                  name: '{kebab-case}.*.ts',
                },
                {
                  name: '{kebab-case}',
                  children: [
                    {
                      name: '{kebab-case}.*.ts',
                    },
                  ],
                },
              ],
            },
            {
              //Shared modules can have up to 3 levels of nesting /shared/module/{folder}/{folder}/{folder}
              name: 'module',
              children: [
                {
                  name: '{kebab-case}',
                  children: [
                    {
                      name: '{kebab-case}',
                      children: [
                        {
                          name: '{kebab-case}',
                          children: [
                            {
                              name: '{kebab-case}.*.ts',
                            },
                            {
                              name: '{kebab-case}',
                              children: [
                                {
                                  name: '{kebab-case}.*.ts',
                                },
                              ],
                            },
                          ],
                        },
                        {
                          name: '{kebab-case}.*.ts',
                        },
                      ],
                    },
                    {
                      name: '{kebab-case}.*.ts',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'app.module.ts',
        },
        {
          name: 'main.ts',
        },
        {
          name: 'app.resolver.ts', //TODO review this
        },
      ],
    },
    {
      name: 'database',
      children: [
        {
          name: '{kebab-case}',
          children: [
            {
              name: '{kebab-case}',
              children: [
                {
                  name: '{kebab-case}.{kebab-case}.(ts|json|prisma)',
                },
                {
                  name: 'migration',
                  children: [
                    {
                      name: '{kebab-case}.ts',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'test',
      children: [
        {
          name: '{kebab-case}.{kebab-case}.ts',
        },
        {
          name: '{kebab-case}',
          children: [
            {
              name: '{kebab-case}',
              children: [
                {
                  name: '{kebab-case}.{kebab-case}.ts',
                },
              ],
            },
            {
              name: '{kebab-case}.{kebab-case}.ts',
            },
          ],
        },
      ],
    },
  ],
  rules: {
    finalDirectoryWithUnitTests_service: finalDirectoryWithUnitTestsBuilder('service'),
    finalDirectoryWithUnitTests_resolver: finalDirectoryWithUnitTestsBuilder('resolver'),
    finalDirectoryWithUnitTests_model: finalDirectoryWithUnitTestsBuilder('model'),
    finalDirectoryWithUnitTests_controller:
      finalDirectoryWithUnitTestsBuilder('controller'),
    finalDirectoryWithUnitTests_repository:
      finalDirectoryWithUnitTestsBuilder('repository'),
    finalDirectoryWithUnitTests_entity: finalDirectoryWithUnitTestsBuilder('entity'),
    finalDirectoryWithUnitTests_exception:
      finalDirectoryWithUnitTestsBuilder('exception'),
    finalDirectoryWithUnitTests_eventHandler:
      finalDirectoryWithUnitTestsBuilder('event-handler'),
    finalDirectoryWithUnitTests_httpClient: finalDirectoryWithUnitTestsBuilder('client'),
    finalDirectoryWithUnitTests_facade: finalDirectoryWithUnitTestsBuilder('facade'),
    tsOnlyFiles: {
      children: [{ name: '*.ts' }],
    },
    end2endTestFolder: {
      name: 'e2e',
      children: [
        {
          name: '{kebab-case}',
          children: [{ ruleId: 'end2endTestFile' }],
        },
        {
          name: 'fixtures',
          children: [
            {
              name: '{kebab-case}.(jpg|mp3|mp4|json|ts  )',
            },
          ],
        },
        {
          name: '{kebab-case}.ts',
        },
      ],
    },
    end2endTestFile: {
      name: '{kebab-case}.spec.ts',
    },
  },
});
