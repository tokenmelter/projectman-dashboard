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

type Tab = "tasks" | "done" | "people";

function formatDate(d: string | null): string {
  if (!d) return "\u2014";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ");
}

function timeLeft(d: string | null): { text: string; className: string } {
  if (!d) return { text: "—", className: "time-left-none" };
  const now = new Date();
  const due = new Date(d + "T23:59:59");
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return { text: `${Math.abs(diffDays)}d overdue`, className: "time-left-overdue" };
  if (diffHours <= 24) return { text: `${diffHours}h`, className: "time-left-urgent" };
  return { text: `${diffDays}d`, className: "time-left-ok" };
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    setAuthed(localStorage.getItem("pm_authed") === "1");
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/data")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setPeople(data.people || []);
        setStats(data.stats || null);
      });
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === "carparts") {
      localStorage.setItem("pm_authed", "1");
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("pm_authed");
    setAuthed(false);
    setPassword("");
  }

  if (!authChecked) return null;

  if (!authed) {
    return (
      <div className="gate-overlay">
        <form className="gate-form" onSubmit={handleLogin}>
          <h1>Projectman</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
            autoFocus
          />
          <button type="submit">Submit</button>
          {authError && <div className="gate-error">Wrong password</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Projectman</h1>
        <div className="deploy-time">
          Deployed: {process.env.NEXT_PUBLIC_BUILD_TIME}
          {" \u00b7 "}
          <a href="#" className="logout-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
        </div>
        <div className="subtitle">
          {stats
            ? `${stats.totalTasks} tasks \u00b7 ${stats.totalProjects} projects \u00b7 ${stats.totalPeople} people`
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
                      <span>{task.project_name} &middot; </span>
                    )}
                    {formatDate(task.due_date)}
                  </span>
                  <span className={`time-left ${timeLeft(task.due_date).className}`}>
                    {timeLeft(task.due_date).text}
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
                      .join(" ") || "\u2014"}
                  </td>
                  <td>{person.role || "\u2014"}</td>
                  <td>{person.department || "\u2014"}</td>
                  <td>{person.company || "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
