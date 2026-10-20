//src/App.jsx

import { useContext, useEffect, useState } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "./context/user-context.js";
import "./App.css";

function Login() {
  const { login, user } = useContext(UserContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/courses" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(identifier, password); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="login-shell">
    <div className="login-intro"><div className="brand-mark">C</div><p className="eyebrow">ONLINE COURSE SERVICE</p><h1>Learn something<br /><em>worth sharing.</em></h1><p>Explore new subjects, reserve a seat, and keep your learning in one place.</p><div className="intro-orbit">✦</div></div>
    <section className="login-card"><p className="eyebrow">WELCOME BACK</p><h2>Sign in</h2><p className="muted">Use your student or teacher account to continue.</p><form onSubmit={submit}>
      <label>Username or email<input autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required placeholder="Enter username or email" /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Enter password" /></label>
      {error && <p className="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form></section>
  </main>;
}

function Layout({ children }) {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  return <div className="app-shell"><header className="topbar"><Link className="brand" to="/courses"><span className="brand-mark">C</span><span>Course<span className="brand-accent">craft</span></span></Link><nav><Link to="/courses">{user.role === "Teacher" ? "My courses" : "Explore"}</Link>{user.role === "Student" && <Link to="/mine">My learning</Link>}</nav><div className="account"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><span className="account-name">{user.username}<small>{user.role}</small></span><button className="text-button" onClick={() => { logout(); navigate("/login"); }}>Log out</button></div></header><div className="page-wrap">{children}</div></div>;
}

function Protected({ children }) {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="center-message">Loading your account…</div>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function Status({ value }) { return <span className={`status status-${value.toLowerCase()}`}>{value}</span>; }
function Empty({ title, detail }) { return <div className="empty"><span>✦</span><h3>{title}</h3><p>{detail}</p></div>; }

function CourseCard({ course }) {
  return <Link className="course-card" to={`/courses/${course.id}`}><div className="card-top"><Status value={course.status} /><span className="seats">{course.enrolledCount}/{course.maxStudents} seats</span></div><div className="card-icon">✳</div><h3>{course.name}</h3><p className="teacher-line">By {course.teacherName}</p><p className="topics">{course.topics.join(" · ")}</p><div className="card-bottom"><span>{course.durationDays} day{course.durationDays === 1 ? "" : "s"}</span><strong>฿{course.price.toLocaleString()}</strong></div></Link>;
}

function CourseList({ enrolled = false }) {
  const { user, api } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const query = enrolled ? "?enrolled=true" : user.role === "Student" && search ? `?search=${encodeURIComponent(search)}` : "";
    api(`/course${query}`).then((data) => { if (active) setCourses(data.courses); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, enrolled, search, user.role]);
  const teacher = user.role === "Teacher";
  return <><div className="page-heading"><div><p className="eyebrow">{teacher ? "TEACHER STUDIO" : enrolled ? "YOUR JOURNEY" : "COURSE CATALOG"}</p><h1>{teacher ? "My courses" : enrolled ? "My learning" : "Find your next course"}</h1><p className="muted">{teacher ? "Create and manage the courses you teach." : enrolled ? "All the courses you have joined." : "Browse courses made for curious minds."}</p></div>{teacher && <Link className="button primary" to="/courses/new">+ Create course</Link>}</div>
    {!teacher && !enrolled && <div className="search-wrap"><span>⌕</span><input aria-label="Search courses or teachers" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by course or teacher name" /></div>}
    {error && <p className="alert">{error}</p>}{loading ? <p className="muted">Loading courses…</p> : courses.length ? <div className="course-grid">{courses.map((course) => <CourseCard course={course} key={course.id} />)}</div> : <Empty title={teacher ? "No courses yet" : enrolled ? "Your learning starts here" : "No courses found"} detail={teacher ? "Create your first course to get started." : enrolled ? "Explore the catalog and enroll in a course." : "Try another search or check back soon."} />}
  </>;
}

function CourseForm() {
  const { id } = useParams();
  const editing = !!id;
  const { user, api } = useContext(UserContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", durationDays: 1, topics: "", price: 0, maxStudents: 1, status: "Open" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (editing && user.role === "Teacher") api(`/course/${id}`).then(({ course }) => setForm({ ...course, topics: course.topics.join(", ") })).catch((err) => setError(err.message)); }, [api, editing, id, user.role]);
  if (user.role !== "Teacher") return <Navigate to="/courses" replace />;
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...form, topics: form.topics.split(",").map((topic) => topic.trim()).filter(Boolean) };
      const data = await api(editing ? `/course/${id}` : "/course", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      navigate(`/courses/${data.course.id}`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <><Link className="back-link" to={editing ? `/courses/${id}` : "/courses"}>← Back to courses</Link><div className="page-heading"><div><p className="eyebrow">TEACHER STUDIO</p><h1>{editing ? "Edit course" : "Create a course"}</h1><p className="muted">Give students a clear picture of what they will learn.</p></div></div><form className="course-form" onSubmit={submit}>
    <label className="wide">Course name<input name="name" required value={form.name} onChange={change} placeholder="e.g. Introduction to Web Design" /></label>
    <label className="wide">Topics <small>Separate topics with commas</small><input name="topics" required value={form.topics} onChange={change} placeholder="HTML, CSS, JavaScript" /></label>
    <label>Duration (days)<input name="durationDays" type="number" min="1" required value={form.durationDays} onChange={change} /></label>
    <label>Price (THB)<input name="price" type="number" min="0" step="100" required value={form.price} onChange={change} /></label>
    <label>Maximum students<input name="maxStudents" type="number" min="1" required value={form.maxStudents} onChange={change} /></label>
    <label>Status<select name="status" value={form.status} onChange={change}><option>Open</option><option>Close</option><option>Cancel</option></select></label>
    {error && <p className="alert wide">{error}</p>}<div className="form-actions wide"><Link className="button secondary" to={editing ? `/courses/${id}` : "/courses"}>Cancel</Link><button className="button primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create course"}</button></div>
  </form></>;
}

function CourseDetails() {
  const { id } = useParams();
  const { user, api } = useContext(UserContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api(`/course/${id}`).then(({ course }) => { if (active) setCourse(course); }).catch((err) => { if (active) setError(err.message); });
    if (user.role === "Student") api("/course?enrolled=true").then(({ courses }) => { if (active) setEnrolled(courses.some((item) => item.id === id)); }).catch(() => {});
    return () => { active = false; };
  }, [api, id, user.role]);
  async function enroll() {
    setBusy(true); setError("");
    try { const data = await api(`/course/${id}/enroll`, { method: "POST" }); setMessage(data.message); setEnrolled(true); setCourse((current) => ({ ...current, enrolledCount: current.enrolledCount + 1 })); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    setBusy(true); setError("");
    try { await api(`/course/${id}`, { method: "DELETE" }); navigate("/courses"); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return <><Link className="back-link" to="/courses">← Back to courses</Link>{error && <p className="alert">{error}</p>}{!course ? <p className="muted">Loading course…</p> : <><div className="detail-hero"><div><div className="detail-meta"><Status value={course.status} /><span>{course.durationDays} day{course.durationDays === 1 ? "" : "s"}</span></div><h1>{course.name}</h1><p>Created by <strong>{course.teacherName}</strong></p></div><div className="detail-symbol">✳</div></div><div className="detail-layout"><section className="detail-main"><h2>What you’ll learn</h2><div className="topic-list">{course.topics.map((topic) => <div key={topic}><span>✓</span>{topic}</div>)}</div>{user.role === "Teacher" && <><h2>Enrolled students <span className="count-pill">{course.enrolledCount}</span></h2>{course.students?.length ? <div className="student-list">{course.students.map((student) => <div key={student.id}><span className="avatar">{student.username.slice(0, 1).toUpperCase()}</span><div><strong>{student.username}</strong><small>{student.email}</small></div></div>)}</div> : <p className="muted">No students enrolled yet.</p>}</>}</section><aside className="enroll-panel"><p className="eyebrow">COURSE DETAILS</p><strong className="price">฿{course.price.toLocaleString()}</strong><div className="panel-row"><span>Duration</span><strong>{course.durationDays} days</strong></div><div className="panel-row"><span>Seats filled</span><strong>{course.enrolledCount} / {course.maxStudents}</strong></div>{message && <p className="success">{message}</p>}{user.role === "Teacher" ? <><Link className="button primary full" to={`/courses/${id}/edit`}>Edit course</Link><button className="button secondary full" onClick={remove} disabled={busy || course.enrolledCount > 0}>Delete course</button>{course.enrolledCount > 0 && <p className="hint">Courses with enrolled students cannot be deleted.</p>}</> : <><button className="button primary full" onClick={enroll} disabled={busy || enrolled || course.status !== "Open" || course.enrolledCount >= course.maxStudents}>{enrolled ? "Already enrolled" : course.status !== "Open" ? "Enrollment closed" : course.enrolledCount >= course.maxStudents ? "Course full" : busy ? "Enrolling…" : "Enroll now"}</button><p className="hint">{enrolled ? "This course is in My learning." : "Reserve your place while seats are available."}</p></>}</aside></div></>}</>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/courses" element={<Protected><CourseList /></Protected>} />
        <Route path="/mine" element={<Protected><CourseList enrolled /></Protected>} />
        <Route path="/courses/new" element={<Protected><CourseForm /></Protected>} />
        <Route path="/courses/:id/edit" element={<Protected><CourseForm /></Protected>} />
        <Route path="/courses/:id" element={<Protected><CourseDetails /></Protected>} />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </HashRouter>
  );
}
