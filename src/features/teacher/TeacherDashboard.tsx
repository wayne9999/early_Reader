import { useEffect, useMemo, useState } from "react";
import { getClassroomStudents } from "../../services/classroomRepository";
import { analyzeClassroom, analyzeStudent } from "../../services/learningAnalysisService";
import { loadTeacherAssignments, updateTeacherAssignmentStatus } from "../../services/assignmentRepository";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { downloadStudentReportCard } from "../../services/reportCardService";
import type { AppUser, LearningEvent, Progress, SkillInsight, StudentSummary, TeacherStudentLink } from "../../types";

type TeacherDashboardProps = {
  progress: Progress;
  user: AppUser | null;
};

function scoreLabel(insight: SkillInsight) {
  if (insight.status === "strong") {
    return "Strong";
  }

  if (insight.status === "watch") {
    return "Watch";
  }

  return "Needs support";
}

export function TeacherDashboard({ progress, user }: TeacherDashboardProps) {
  const [assignments, setAssignments] = useState<TeacherStudentLink[]>([]);
  const [studentHistories, setStudentHistories] = useState<Record<string, LearningEvent[]>>({});
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const demoStudents = useMemo(() => getClassroomStudents(progress, user), [progress, user]);
  const assignedStudents = useMemo<StudentSummary[]>(
    () =>
      assignments
        .filter((assignment) => assignment.status === "active")
        .map((assignment) => ({
          id: assignment.studentId,
          name: assignment.studentName,
          email: assignment.studentEmail,
          gradeBand: "1",
          lastActive: "Assigned",
          progress: assignment.latestProgressSnapshot,
          assignmentStatus: assignment.status,
          history: studentHistories[assignment.studentId] ?? []
        })),
    [assignments, studentHistories]
  );
  const students = assignedStudents.length ? assignedStudents : demoStudents;
  const classroomAnalysis = useMemo(() => analyzeClassroom(students), [students]);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const selectedAnalysis = selectedStudent ? analyzeStudent(selectedStudent) : null;
  const selectedActivityEvents = selectedStudent?.history?.filter((event) => event.type === "activity_completed") ?? [];
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const requestedAssignments = assignments.filter((assignment) => assignment.status === "requested");

  useEffect(() => {
    let isMounted = true;

    setIsLoadingRoster(true);
    loadTeacherAssignments(user)
      .then(async (loadedAssignments) => {
        if (!isMounted) {
          return;
        }

        setAssignments(loadedAssignments);
        const activeAssignments = loadedAssignments.filter((assignment) => assignment.status === "active");
        const historyEntries = await Promise.all(
          activeAssignments.map(async (assignment) => [
            assignment.studentId,
            await loadLearningEvents(user, assignment.studentId)
          ] as const)
        );

        if (isMounted) {
          setStudentHistories(Object.fromEntries(historyEntries));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRoster(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (students.length && !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  async function changeAssignmentStatus(linkId: string, status: TeacherStudentLink["status"]) {
    await updateTeacherAssignmentStatus(linkId, status);
    setAssignments(await loadTeacherAssignments(user));
  }

  function downloadSelectedReport() {
    if (!selectedStudent || !selectedAnalysis) {
      return;
    }

    downloadStudentReportCard(selectedStudent, selectedAnalysis, user?.name);
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h2>Classroom insight center</h2>
        </div>
      </div>

      <section className="teacher-summary">
        <article className="practice-panel teacher-hero-card">
          <p className="eyebrow">Class snapshot</p>
          <h3>{classroomAnalysis.headline}</h3>
          <div className="teacher-metrics">
            <span>{students.length} students</span>
            <span>{activeAssignments.length} active assignments</span>
            <span>{requestedAssignments.length} pending requests</span>
            <span>{classroomAnalysis.analyses.filter((analysis) => analysis.growthAreas.length > 0).length} need follow-up</span>
            <span>{classroomAnalysis.analyses.filter((analysis) => analysis.strengths.length > 0).length} showing strengths</span>
          </div>
          {!assignments.length && !isLoadingRoster ? (
            <p className="helper-text">Showing demo data until students request this teacher account.</p>
          ) : null}
        </article>

        <article className="practice-panel">
          <p className="eyebrow">Teacher actions</p>
          <ul className="next-steps">
            {classroomAnalysis.recommendedTeacherActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="teacher-grid">
        <aside className="practice-panel roster-panel" aria-label="Student roster">
          <p className="eyebrow">Roster</p>
          {requestedAssignments.length ? (
            <div className="request-list">
              {requestedAssignments.map((assignment) => (
                <div className="request-row" key={assignment.id}>
                  <span>{assignment.studentName} requested access</span>
                  <div className="request-actions">
                    <button type="button" onClick={() => void changeAssignmentStatus(assignment.id, "active")}>
                      Approve
                    </button>
                    <button type="button" onClick={() => void changeAssignmentStatus(assignment.id, "declined")}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="student-list">
            {students.map((student) => {
              const analysis = analyzeStudent(student);
              const supportCount = analysis.growthAreas.length;

              return (
                <button
                  className={`student-row${student.id === selectedStudent?.id ? " is-active" : ""}`}
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <span>
                    <strong>{student.name}</strong>
                    <small>Grade {student.gradeBand} - {student.lastActive}</small>
                  </span>
                  <em>{supportCount} focus</em>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="student-insight-stack">
          <article className="practice-panel">
            <div className="student-analysis-header">
              <div>
                <p className="eyebrow">Student analysis</p>
                <h3>{selectedStudent?.name ?? "No students yet"}</h3>
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={!selectedStudent || !selectedAnalysis}
                onClick={downloadSelectedReport}
              >
                Download report card
              </button>
            </div>
            <p className="helper-text">
              {selectedAnalysis?.summary ?? "Students will appear here after they request this teacher account."}
            </p>
            {selectedStudent?.email ? <p className="helper-text">{selectedStudent.email}</p> : null}
          </article>

          <div className="insight-columns">
            <article className="practice-panel">
              <p className="eyebrow">Strengths</p>
              {selectedAnalysis?.strengths.length ? (
                selectedAnalysis.strengths.map((insight) => <InsightCard insight={insight} key={insight.area} />)
              ) : (
                <p className="helper-text">No strong area yet. Keep collecting practice data.</p>
              )}
            </article>

            <article className="practice-panel">
              <p className="eyebrow">Growth areas</p>
              {selectedAnalysis?.growthAreas.map((insight) => (
                <InsightCard insight={insight} key={insight.area} />
              ))}
            </article>
          </div>

          <article className="practice-panel">
            <p className="eyebrow">Intervention plan</p>
            <ol className="teacher-plan">
              {selectedAnalysis?.recommendedPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="practice-panel">
            <p className="eyebrow">Skill activity review</p>
            <div className="activity-review-grid">
              <span>
                <strong>{selectedStudent?.progress.activityCompletions ?? 0}</strong>
                <small>Total skill activities</small>
              </span>
              <span>
                <strong>{selectedActivityEvents.length}</strong>
                <small>Recent logged activity events</small>
              </span>
              <span>
                <strong>{selectedStudent?.progress.completedToday ?? 0}/3</strong>
                <small>Daily practice progress</small>
              </span>
            </div>
            {selectedActivityEvents.length ? (
              <ul className="history-list">
                {selectedActivityEvents.slice(0, 5).map((event) => (
                  <li key={event.id ?? `${event.type}-${event.label}-${event.createdAt}`}>
                    <strong>{event.label}</strong>
                    <span>{event.area} practice - completed</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="helper-text">Logged-in activities will appear here after this student completes them.</p>
            )}
          </article>

          <article className="practice-panel">
            <p className="eyebrow">Recent learning history</p>
            {selectedStudent?.history?.length ? (
              <ul className="history-list">
                {selectedStudent.history.slice(0, 10).map((event) => (
                  <li key={event.id ?? `${event.type}-${event.label}`}>
                    <strong>{event.label}</strong>
                    <span>{event.type.replace("_", " ")} - {event.area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="helper-text">No recent event history is available yet.</p>
            )}
          </article>

          <article className="practice-panel ai-boundary">
            <p className="eyebrow">AI analysis boundary</p>
            <h3>Ready for backend AI, not browser-side secrets</h3>
            <p className="helper-text">
              {selectedAnalysis?.aiReadinessNote ?? "Collect assigned-student activity before generating AI summaries."}
            </p>
            <ul className="next-steps">
              <li>Send de-identified progress events to a secure backend.</li>
              <li>Ask AI for evidence-based instructional summaries, not diagnoses.</li>
              <li>Store generated recommendations with source data timestamps for auditability.</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}

function InsightCard({ insight }: { insight: SkillInsight }) {
  return (
    <div className={`insight-card ${insight.status}`}>
      <div>
        <strong>{insight.label}</strong>
        <span>{scoreLabel(insight)} · {insight.score}/100</span>
      </div>
      <p>{insight.evidence}</p>
      <small>{insight.nextStep}</small>
    </div>
  );
}
