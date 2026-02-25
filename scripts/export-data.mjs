import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.env.HOME, '.openclaw', 'workspace-projectman', 'projectman.db');

if (!existsSync(dbPath)) {
  console.error('Could not find projectman.db at', dbPath);
  process.exit(1);
}

const { default: Database } = await import('better-sqlite3');

const db = new Database(dbPath, { readonly: true });

const projects = db.prepare('SELECT * FROM projects ORDER BY priority, name').all();

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

const people = db.prepare('SELECT * FROM people ORDER BY last_name, first_name').all();

const project_people = db.prepare(`
  SELECT pp.*, p.name as project_name, pe.first_name, pe.last_name
  FROM project_people pp
  JOIN projects p ON pp.project_id = p.id
  JOIN people pe ON pp.person_id = pe.id
`).all();

const decisions = db.prepare(`
  SELECT d.*, p.name as project_name
  FROM decisions d
  LEFT JOIN projects p ON d.project_id = p.id
  ORDER BY d.decided_at DESC
`).all();

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

db.close();

const output = { tasks, projects, people, project_people, decisions, stats };
const outPath = '/tmp/projectman-export.json';
writeFileSync(outPath, JSON.stringify(output));
console.log(`Exported to ${outPath}`);
