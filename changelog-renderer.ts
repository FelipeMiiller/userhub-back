import { execSync } from 'child_process';
import * as fs from 'fs';
import DefaultChangelogRenderer from 'nx/release/changelog-renderer';
import { ChangelogChange } from 'nx/src/command-line/release/changelog';

export default class CustomChangelogRenderer extends DefaultChangelogRenderer {
  protected filterChanges(
    changes: ChangelogChange[],
    project: string | null
  ): ChangelogChange[] {
    const graphCacheFileName = `.nx-cache.graph.${project}.output.json`;
    /**
     * Gets the full graph of the project and its dependencies
     */
    const output = execSync(
      `nx graph --focus ${project} --open=false --file=${graphCacheFileName}`,
      {
        encoding: 'utf-8',
      }
    );
    console.log('NX Graph temp file created:', output);
    const graph = fs.readFileSync(graphCacheFileName, 'utf-8');
    const packageJson = fs.readFileSync('package.json', 'utf-8');
    const packageJsonParsed = JSON.parse(packageJson);
    const parsedGraph = JSON.parse(graph);
    const relevantProjects = Object.keys(parsedGraph.graph.dependencies);
    relevantProjects.push(packageJsonParsed.name);
    console.log('Related projects:', relevantProjects);

    const affectedProjects = new Set<string>();
    for (const change of changes) {
      if (change.scope === 'release') {
        continue;
      }

      if (change.affectedProjects === '*') {
        relevantProjects.forEach((project) => affectedProjects.add(project));
        continue;
      }
      const afftectedProject = change.affectedProjects.find((project) =>
        relevantProjects.includes(project)
      );
      if (afftectedProject) {
        affectedProjects.add(afftectedProject);
      }
    }
    console.log('Affected projects:', Array.from(affectedProjects));

    const filteredChanges = changes.filter((change) => {
      if (change.scope === 'release') return false;

      if (change.affectedProjects === '*') return true;
      return change.affectedProjects.some((project) =>
        relevantProjects.includes(project)
      );
    });
    fs.unlinkSync(graphCacheFileName);
    return filteredChanges;
  }
}
