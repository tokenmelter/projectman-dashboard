import Database from 'better-sqlite3';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.env.HOME, '.openclaw', 'workspace-projectman', 'projectman.db');

if (!existsSync(dbPath)) {
  console.error('Could not find projectman.db at', dbPath);
  process.exit(1);
}

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

const outDir = join(import.meta.dirname, '..', 'public', 'data');
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'tasks.json'), JSON.stringify(tasks));
writeFileSync(join(outDir, 'people.json'), JSON.stringify(people));
writeFileSync(join(outDir, 'stats.json'), JSON.stringify(stats));
writeFileSync(join(outDir, 'projects.json'), JSON.stringify(projects));
writeFileSync(join(outDir, 'project_people.json'), JSON.stringify(project_people));
writeFileSync(join(outDir, 'decisions.json'), JSON.stringify(decisions));

console.log(`Exported ${tasks.length} tasks, ${projects.length} projects, ${people.length} people to ${outDir}`);
