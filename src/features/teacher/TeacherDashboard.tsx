import { useMemo, useState } from "react";
import { getClassroomStudents } from "../../services/classroomRepository";
import { analyzeClassroom, analyzeStudent } from "../../services/learningAnalysisService";
import type { AppUser, Progress, SkillInsight } from "../../types";

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
  const students = useMemo(() => getClassroomStudents(progress, user), [progress, user]);
  const classroomAnalysis = useMemo(() => analyzeClassroom(students), [students]);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const selectedAnalysis = analyzeStudent(selectedStudent);

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
            <span>{classroomAnalysis.analyses.filter((analysis) => analysis.growthAreas.length > 0).length} need follow-up</span>
            <span>{classroomAnalysis.analyses.filter((analysis) => analysis.strengths.length > 0).length} showing strengths</span>
          </div>
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
          <div className="student-list">
            {students.map((student) => {
              const analysis = analyzeStudent(student);
              const supportCount = analysis.growthAreas.length;

              return (
                <button
                  className={`student-row${student.id === selectedStudent.id ? " is-active" : ""}`}
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <span>
                    <strong>{student.name}</strong>
                    <small>Grade {student.gradeBand} · {student.lastActive}</small>
                  </span>
                  <em>{supportCount} focus</em>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="student-insight-stack">
          <article className="practice-panel">
            <p className="eyebrow">Student analysis</p>
            <h3>{selectedStudent.name}</h3>
            <p className="helper-text">{selectedAnalysis.summary}</p>
          </article>

          <div className="insight-columns">
            <article className="practice-panel">
              <p className="eyebrow">Strengths</p>
              {selectedAnalysis.strengths.length ? (
                selectedAnalysis.strengths.map((insight) => <InsightCard insight={insight} key={insight.area} />)
              ) : (
                <p className="helper-text">No strong area yet. Keep collecting practice data.</p>
              )}
            </article>

            <article className="practice-panel">
              <p className="eyebrow">Growth areas</p>
              {selectedAnalysis.growthAreas.map((insight) => (
                <InsightCard insight={insight} key={insight.area} />
              ))}
            </article>
          </div>

          <article className="practice-panel">
            <p className="eyebrow">Intervention plan</p>
            <ol className="teacher-plan">
              {selectedAnalysis.recommendedPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="practice-panel ai-boundary">
            <p className="eyebrow">AI analysis boundary</p>
            <h3>Ready for backend AI, not browser-side secrets</h3>
            <p className="helper-text">{selectedAnalysis.aiReadinessNote}</p>
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
