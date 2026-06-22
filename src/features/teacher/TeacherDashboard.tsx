import { useEffect, useMemo, useState } from "react";
import { getClassroomStudents } from "../../services/classroomRepository";
import { analyzeClassroom, analyzeStudent } from "../../services/learningAnalysisService";
import { loadTeacherAssignments, updateTeacherAssignmentStatus } from "../../services/assignmentRepository";
import { loadLatestStudentInsight, requestStudentInsight } from "../../services/aiInsightRepository";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { recentNeeds, summarizeByArea, summarizeEvents } from "../../services/learningEventSummary";
import { trackProductEvent } from "../../services/productAnalytics";
import { downloadStudentReportCard } from "../../services/reportCardService";
import { createTeacherInvite, loadTeacherInvites } from "../../services/teacherInviteRepository";
import type { AppUser, LearningEvent, Progress, SkillInsight, StudentAiInsight, StudentSummary, TeacherInvite, TeacherStudentLink, UserProfile } from "../../types";

type TeacherDashboardProps = {
  progress: Progress;
  user: AppUser | null;
  profile: UserProfile | null;
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

export function TeacherDashboard({ progress, user, profile }: TeacherDashboardProps) {
  const [assignments, setAssignments] = useState<TeacherStudentLink[]>([]);
  const [invites, setInvites] = useState<TeacherInvite[]>([]);
  const [studentHistories, setStudentHistories] = useState<Record<string, LearningEvent[]>>({});
  const [studentInsights, setStudentInsights] = useState<Record<string, StudentAiInsight | null>>({});
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isRequestingInsight, setIsRequestingInsight] = useState(false);
  const [insightStatus, setInsightStatus] = useState<string>("");
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
  const selectedEvents = selectedStudent?.history ?? [];
  const selectedEventSummary = useMemo(() => summarizeEvents(selectedEvents), [selectedEvents]);
  const selectedAreaSummaries = useMemo(() => summarizeByArea(selectedEvents), [selectedEvents]);
  const selectedNeeds = useMemo(() => recentNeeds(selectedEvents), [selectedEvents]);
  const selectedActivityEvents = selectedStudent?.history?.filter((event) => event.type === "activity_completed") ?? [];
  const selectedAiInsight = selectedStudent ? studentInsights[selectedStudent.id] ?? null : null;
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
          const insightEntries = await Promise.all(
            activeAssignments.map(async (assignment) => [
              assignment.studentId,
              await loadLatestStudentInsight(assignment.studentId)
            ] as const)
          );

          if (isMounted) {
            setStudentInsights(Object.fromEntries(insightEntries));
          }
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
    let isMounted = true;

    loadTeacherInvites(user).then((loadedInvites) => {
      if (isMounted) {
        setInvites(loadedInvites);
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
    void trackProductEvent(user, "report_downloaded", { studentId: selectedStudent.id });
  }

  async function createInvite() {
    if (!user || !profile) {
      return;
    }

    setIsCreatingInvite(true);
    const invite = await createTeacherInvite(user, profile);
    setInvites((current) => [invite, ...current].slice(0, 10));
    void trackProductEvent(user, "teacher_invite_sent", { autoApprove: invite.autoApprove });
    setIsCreatingInvite(false);
  }

  async function requestSelectedInsight() {
    if (!user || !selectedStudent) {
      return;
    }

    setIsRequestingInsight(true);
    setInsightStatus("Insight queued. Refresh this panel in a few moments after the backend worker finishes.");

    try {
      await requestStudentInsight(user, selectedStudent.id);
      void trackProductEvent(user, "ai_insight_requested", { studentId: selectedStudent.id });
      window.setTimeout(() => {
        void loadLatestStudentInsight(selectedStudent.id).then((insight) => {
          setStudentInsights((current) => ({ ...current, [selectedStudent.id]: insight }));
        });
      }, 3500);
    } catch (error) {
      setInsightStatus(error instanceof Error ? error.message : "Unable to queue insight right now.");
    } finally {
      setIsRequestingInsight(false);
    }
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
          <p className="eyebrow">Invite families</p>
          <h3>Create a student invite code</h3>
          <p className="helper-text">
            Share a code with a parent. Invites expire after 30 days and can be revoked from the backend/admin workflow.
          </p>
          <button className="primary-button" type="button" disabled={isCreatingInvite || !user || !profile} onClick={() => void createInvite()}>
            Create invite
          </button>
          {invites.length ? (
            <ul className="history-list">
              {invites.slice(0, 3).map((invite) => (
                <li key={invite.id}>
                  <strong>{invite.code}</strong>
                  <span>{invite.status} - expires {typeof invite.expiresAt === "string" ? invite.expiresAt.slice(0, 10) : "soon"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No invite codes yet.</p>
          )}
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
                <strong>{selectedEventSummary.totalInteractions}</strong>
                <small>Recent interactions</small>
              </span>
              <span>
                <strong>{selectedStudent?.progress.completedToday ?? 0}/3</strong>
                <small>Daily practice progress</small>
              </span>
              <span>
                <strong>{selectedEventSummary.accuracy === null ? "New" : `${selectedEventSummary.accuracy}%`}</strong>
                <small>Attempt accuracy</small>
              </span>
              <span>
                <strong>{selectedEventSummary.incorrectAnswers}</strong>
                <small>Needs review</small>
              </span>
              <span>
                <strong>{selectedEventSummary.areasPracticed}</strong>
                <small>Skill areas practiced</small>
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
            <p className="eyebrow">Teacher assessment details</p>
            <div className="area-summary-list">
              {selectedAreaSummaries.map((area) => (
                <div className="area-summary-row" key={area.area}>
                  <span>
                    <strong>{area.label}</strong>
                    <small>{area.interactions} interactions - {area.incorrect} review moments</small>
                  </span>
                  <em>{area.accuracy === null ? "No attempts" : `${area.accuracy}%`}</em>
                </div>
              ))}
            </div>
            {selectedNeeds.length ? (
              <>
                <p className="helper-text">Most recent items to review with this learner:</p>
                <ul className="history-list">
                  {selectedNeeds.map((need) => (
                    <li key={need.id}>
                      <strong>{need.label}</strong>
                      <span>
                        {need.area}
                        {need.selectedChoice && need.correctChoice
                          ? ` - chose ${need.selectedChoice}, target ${need.correctChoice}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="helper-text">No incorrect activity attempts are logged for this student yet.</p>
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
            <div className="student-analysis-header">
              <div>
                <p className="eyebrow">AI-assisted teacher insight</p>
                <h3>{selectedAiInsight ? "Latest backend insight" : "Queue a secure insight"}</h3>
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={!selectedStudent || isRequestingInsight}
                onClick={() => void requestSelectedInsight()}
              >
                {isRequestingInsight ? "Queueing..." : "Generate insight"}
              </button>
            </div>
            <p className="helper-text">
              {selectedAiInsight?.summary ?? selectedAnalysis?.aiReadinessNote ?? "Collect assigned-student activity before generating AI summaries."}
            </p>
            {insightStatus ? <p className="helper-text">{insightStatus}</p> : null}
            {selectedAiInsight ? (
              <>
                <div className="activity-review-grid">
                  <span>
                    <strong>{selectedAiInsight.evidence.sourceEventCount}</strong>
                    <small>Events analyzed</small>
                  </span>
                  <span>
                    <strong>{selectedAiInsight.evidence.topMissedItems.length || "New"}</strong>
                    <small>Review targets</small>
                  </span>
                  <span>
                    <strong>{selectedAiInsight.model}</strong>
                    <small>Analysis engine</small>
                  </span>
                </div>
                <div className="insight-columns">
                  <div>
                    <p className="eyebrow">Needs practice</p>
                    <ul className="next-steps">
                      {selectedAiInsight.needsPractice.length ? selectedAiInsight.needsPractice.map((need) => (
                        <li key={`${need.area}-${need.label}`}>{need.label}: {need.nextStep}</li>
                      )) : <li>Keep collecting practice events before making a targeted recommendation.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="eyebrow">Teacher actions</p>
                    <ul className="next-steps">
                      {selectedAiInsight.recommendedTeacherActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="helper-text">{selectedAiInsight.aiDisclosure}</p>
              </>
            ) : (
              <ul className="next-steps">
                <li>Backend job uses assigned-student event history, not browser-side AI secrets.</li>
                <li>Only compact learning summaries are prepared for future AI providers.</li>
                <li>Teacher-facing recommendations are evidence-labeled and non-diagnostic.</li>
              </ul>
            )}
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
