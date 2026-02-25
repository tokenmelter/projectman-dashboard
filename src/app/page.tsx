"use client";

import { useState, useEffect } from "react";

interface Task {
  id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  task_type: string | null;
  blocked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_name: string | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  requested_by: string | null;
  owner: string | null;
  deadline: string | null;
  start_date: string | null;
  completion_date: string | null;
  category: string | null;
  origin: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Person {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  totalProjects: number;
  totalTasks: number;
  totalPeople: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  projectsByStatus: Record<string, number>;
  exportedAt: string;
}

type Tab = "tasks" | "done" | "projects" | "people";

function formatDate(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ");
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  useEffect(() => {
    Promise.all([
      fetch("/data/tasks.json").then((r) => r.json()),
      fetch("/data/projects.json").then((r) => r.json()),
      fetch("/data/people.json").then((r) => r.json()),
      fetch("/data/stats.json").then((r) => r.json()),
    ]).then(([t, p, pe, s]) => {
      setTasks(t);
      setProjects(p);
      setPeople(pe);
      setStats(s);
    });
  }, []);

  const taskCountByProject = tasks.reduce<Record<number, number>>((acc, t) => {
    if (t.project_id) acc[t.project_id] = (acc[t.project_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <header>
        <h1>Projectman</h1>
        <div className="deploy-time">
          Deployed: {process.env.NEXT_PUBLIC_BUILD_TIME}
        </div>
        <div className="subtitle">
          {stats
            ? `${stats.totalTasks} tasks · ${stats.totalProjects} projects · ${stats.totalPeople} people`
            : "Loading..."}
        </div>
      </header>

      {stats && (
        <div className="stats-bar">
          <div className="stat-card">
            <div className="label">To Do</div>
            <div className="value">{stats.tasksByStatus["todo"] || 0}</div>
          </div>
          <div className="stat-card">
            <div className="label">In Progress</div>
            <div className="value">
              {stats.tasksByStatus["in_progress"] || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Blocked</div>
            <div className="value">{stats.tasksByStatus["blocked"] || 0}</div>
          </div>
          <div className="stat-card">
            <div className="label">Done</div>
            <div className="value">{stats.tasksByStatus["done"] || 0}</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={`tab ${activeTab === "done" ? "active" : ""}`}
          onClick={() => setActiveTab("done")}
        >
          Done
        </button>
        <button
          className={`tab ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          className={`tab ${activeTab === "people" ? "active" : ""}`}
          onClick={() => setActiveTab("people")}
        >
          People
        </button>
      </div>

      {(activeTab === "tasks" || activeTab === "done") && (
        <section>
          <h2>
            {activeTab === "tasks" ? "Current Tasks" : "Completed"}{" "}
            <span className="count">
              ({tasks.filter((t) => activeTab === "tasks" ? t.status !== "done" && t.status !== "cancelled" : t.status === "done").length})
            </span>
          </h2>
          <div className="task-list">
            {tasks.filter((t) => activeTab === "tasks" ? t.status !== "done" && t.status !== "cancelled" : t.status === "done").map((task) => (
              <div key={task.id} className="task-item">
                <div
                  className="task-row"
                  onClick={() =>
                    setExpandedTask(expandedTask === task.id ? null : task.id)
                  }
                >
                  <span className={`badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                  <span className="task-title">{task.title}</span>
                  <span className={`badge status-${task.status}`}>
                    {formatLabel(task.status)}
                  </span>
                  <span className="task-type">
                    {task.task_type ? formatLabel(task.task_type) : ""}
                  </span>
                  <span className="task-meta">
                    {task.project_name && (
                      <span>{task.project_name} · </span>
                    )}
                    {formatDate(task.due_date)}
                  </span>
                </div>
                {expandedTask === task.id && (
                  <div className="task-expanded">
                    {task.description && (
                      <>
                        <div className="field-label">Description</div>
                        <div>{task.description}</div>
                      </>
                    )}
                    {task.notes && (
                      <>
                        <div className="field-label">Notes</div>
                        <div>{task.notes}</div>
                      </>
                    )}
                    {task.assigned_to && (
                      <>
                        <div className="field-label">Assigned to</div>
                        <div>{task.assigned_to}</div>
                      </>
                    )}
                    {task.blocked_by && (
                      <>
                        <div className="field-label">Blocked by</div>
                        <div>{task.blocked_by}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "projects" && (
        <section>
          <h2>
            Projects <span className="count">({projects.length})</span>
          </h2>
          <div className="project-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <h3>{project.name}</h3>
                {project.description && (
                  <div className="desc">{project.description}</div>
                )}
                <div className="meta-row">
                  <span className={`badge status-${project.status}`}>
                    {formatLabel(project.status)}
                  </span>
                  <span className={`badge priority-${project.priority}`}>
                    {project.priority}
                  </span>
                  <span className="task-count">
                    {taskCountByProject[project.id] || 0} tasks
                  </span>
                  {project.owner && (
                    <span className="task-count">owner: {project.owner}</span>
                  )}
                  {project.deadline && (
                    <span className="task-count">
                      due {formatDate(project.deadline)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "people" && (
        <section>
          <h2>
            People <span className="count">({people.length})</span>
          </h2>
          <table className="people-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Company</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>
                    {[person.first_name, person.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </td>
                  <td>{person.role || "—"}</td>
                  <td>{person.department || "—"}</td>
                  <td>{person.company || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
