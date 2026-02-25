import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outDir = join(projectRoot, 'public', 'data');

// Always read from the live database
const dbPath = join(process.env.HOME, '.openclaw', 'workspace-projectman', 'projectman.db');

if (!existsSync(dbPath)) {
  console.error('Could not find projectman.db at', dbPath);
  process.exit(1);
}

console.log(`Reading database from: ${dbPath}`);

mkdirSync(outDir, { recursive: true });

const db = new Database(dbPath, { readonly: true });

// Export projects
const projects = db.prepare('SELECT * FROM projects ORDER BY priority, name').all();
writeFileSync(join(outDir, 'projects.json'), JSON.stringify(projects, null, 2));
console.log(`Exported ${projects.length} projects`);

// Export tasks with project name joined
const tasks = db.prepare(`
  SELECT t.*, p.name as project_name
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  ORDER BY
    CASE t.priority
      WHEN 'critical' THEN 0
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    t.due_date ASC NULLS LAST
`).all();
writeFileSync(join(outDir, 'tasks.json'), JSON.stringify(tasks, null, 2));
console.log(`Exported ${tasks.length} tasks`);

// Export people
const people = db.prepare('SELECT * FROM people ORDER BY last_name, first_name').all();
writeFileSync(join(outDir, 'people.json'), JSON.stringify(people, null, 2));
console.log(`Exported ${people.length} people`);

// Export project_people with joined names
const projectPeople = db.prepare(`
  SELECT pp.*, p.name as project_name, pe.first_name, pe.last_name
  FROM project_people pp
  JOIN projects p ON pp.project_id = p.id
  JOIN people pe ON pp.person_id = pe.id
`).all();
writeFileSync(join(outDir, 'project_people.json'), JSON.stringify(projectPeople, null, 2));
console.log(`Exported ${projectPeople.length} project_people links`);

// Export decisions with project name
const decisions = db.prepare(`
  SELECT d.*, p.name as project_name
  FROM decisions d
  LEFT JOIN projects p ON d.project_id = p.id
  ORDER BY d.decided_at DESC
`).all();
writeFileSync(join(outDir, 'decisions.json'), JSON.stringify(decisions, null, 2));
console.log(`Exported ${decisions.length} decisions`);

// Export summary stats
const stats = {
  totalProjects: projects.length,
  totalTasks: tasks.length,
  totalPeople: people.length,
  tasksByStatus: {},
  tasksByPriority: {},
  projectsByStatus: {},
  exportedAt: new Date().toISOString(),
};

for (const t of tasks) {
  stats.tasksByStatus[t.status] = (stats.tasksByStatus[t.status] || 0) + 1;
  stats.tasksByPriority[t.priority] = (stats.tasksByPriority[t.priority] || 0) + 1;
}
for (const p of projects) {
  stats.projectsByStatus[p.status] = (stats.projectsByStatus[p.status] || 0) + 1;
}

writeFileSync(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2));
console.log('Exported stats');

db.close();
console.log('Data export complete!');
