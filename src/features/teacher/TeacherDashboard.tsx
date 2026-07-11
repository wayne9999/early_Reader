import { useEffect, useMemo, useState } from "react";
import { analyzeClassroom, analyzeStudent } from "../../services/learningAnalysisService";
import {
  DEFAULT_TEACHER_CAPACITY,
  claimPlacementStudent,
  loadOpenStudentPlacementQueue,
  loadTeacherAssignments,
  updateTeacherAssignmentStatus
} from "../../services/assignmentRepository";
import { loadLatestStudentInsight, loadLatestStudentInsightJob, requestStudentInsight } from "../../services/aiInsightRepository";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { recentNeeds, summarizeByArea, summarizeEvents } from "../../services/learningEventSummary";
import { trackProductEvent } from "../../services/productAnalytics";
import { downloadStudentReportCard } from "../../services/reportCardService";
import { createTeacherInvite, loadTeacherInvites, revokeTeacherInvite } from "../../services/teacherInviteRepository";
import type { AiAnalysisJob, AppUser, LearningEvent, Progress, SkillInsight, StudentAiInsight, StudentPlacementQueue, StudentSummary, TeacherInvite, TeacherStudentLink, UserProfile } from "../../types";

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

function formatInsightDate(value: unknown) {
  if (!value) {
    return "Not generated yet";
  }

  const date =
    typeof value === "string"
      ? new Date(value)
      : value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
        ? value.toDate()
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function aiJobLabel(job: AiAnalysisJob | null, insight: StudentAiInsight | null) {
  if (!job) {
    return insight ? "ready" : "not requested";
  }

  return job.status;
}

function aiJobHelp(job: AiAnalysisJob | null, insight: StudentAiInsight | null) {
  if (job?.status === "queued") {
    return "Queued for backend processing.";
  }

  if (job?.status === "running") {
    return "Analyzing recent practice now.";
  }

  if (job?.status === "failed") {
    return job.error ?? "The backend could not generate this insight. Try again after more practice is logged.";
  }

  if (insight) {
    return "Ready for teacher review.";
  }

  return "Generate the first insight after this student has learning history.";
}

function aiProviderHelp(job: AiAnalysisJob | null, insight: StudentAiInsight | null) {
  if (job?.provider === "budget-fallback") {
    return "Monthly AI budget reached. ReadNest used the rule-based insight engine so teachers still get guidance without extra model spend.";
  }

  if (job?.provider === "openai-warning") {
    const budget = job.budget;
    const budgetText = budget ? ` Estimated month spend is $${budget.estimatedMonthlySpendUsd} of the $${budget.hardLimitUsd} cap.` : "";
    return `OpenAI generated this insight, but the monthly budget is near the warning level.${budgetText}`;
  }

  if (job?.provider === "openai") {
    return "OpenAI generated this from a compact learning summary. No payment data, child email, or raw all-time history is sent.";
  }

  if (job?.provider === "rule-based" || insight?.model === "rule-based-v1") {
    return "Using the deterministic rule-based engine. This remains available when AI keys, provider calls, or budget are unavailable.";
  }

  return "Insight source is recorded on the backend job for audit and cost control.";
}

export function TeacherDashboard({ progress, user, profile }: TeacherDashboardProps) {
  const [assignments, setAssignments] = useState<TeacherStudentLink[]>([]);
  const [invites, setInvites] = useState<TeacherInvite[]>([]);
  const [studentHistories, setStudentHistories] = useState<Record<string, LearningEvent[]>>({});
  const [studentInsights, setStudentInsights] = useState<Record<string, StudentAiInsight | null>>({});
  const [studentInsightJobs, setStudentInsightJobs] = useState<Record<string, AiAnalysisJob | null>>({});
  const [placementQueue, setPlacementQueue] = useState<StudentPlacementQueue[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [rosterError, setRosterError] = useState("");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isClaimingStudent, setIsClaimingStudent] = useState(false);
  const [isRequestingInsight, setIsRequestingInsight] = useState(false);
  const [insightStatus, setInsightStatus] = useState<string>("");
  const [placementStatus, setPlacementStatus] = useState<string>("");
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
  const students = assignedStudents;
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
  const selectedAiJob = selectedStudent ? studentInsightJobs[selectedStudent.id] ?? null : null;
  const selectedAiStatus = aiJobLabel(selectedAiJob, selectedAiInsight);
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const requestedAssignments = assignments.filter((assignment) => assignment.status === "requested");
  const teacherCapacity = profile?.maxStudentLoad ?? DEFAULT_TEACHER_CAPACITY;
  const availableTeacherSeats = Math.max(teacherCapacity - activeAssignments.length, 0);
  const isTeacherAtCapacity = availableTeacherSeats <= 0;
  const attentionCount = classroomAnalysis.analyses.filter((analysis) => analysis.growthAreas.length > 0).length;
  const strengthCount = classroomAnalysis.analyses.filter((analysis) => analysis.strengths.length > 0).length;
  const teacherStats = [
    { label: "Students", value: students.length, tone: "blue" },
    { label: "Active", value: activeAssignments.length, tone: "green" },
    { label: "Requests", value: requestedAssignments.length, tone: "gold" },
    { label: "Need focus", value: attentionCount, tone: "coral" }
  ];

  useEffect(() => {
    let isMounted = true;

    setIsLoadingRoster(true);
    setRosterError("");
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

          const jobEntries = await Promise.all(
            activeAssignments.map(async (assignment) => [
              assignment.studentId,
              await loadLatestStudentInsightJob(assignment.studentId)
            ] as const)
          );

          if (isMounted) {
            setStudentInsightJobs(Object.fromEntries(jobEntries));
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          setRosterError(error instanceof Error ? error.message : "The student roster could not be loaded.");
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

    loadOpenStudentPlacementQueue(user).then((loadedQueue) => {
      if (isMounted) {
        setPlacementQueue(loadedQueue);
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

  useEffect(() => {
    if (!selectedStudent || !["queued", "running"].includes(selectedAiJob?.status ?? "")) {
      return;
    }

    const pollId = window.setInterval(() => {
      void refreshSelectedInsight();
    }, 5000);

    return () => window.clearInterval(pollId);
  }, [selectedAiJob?.status, selectedStudent?.id]);

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

  async function revokeInvite(invite: TeacherInvite) {
    if (!user) {
      return;
    }

    const revokedInvite = await revokeTeacherInvite(user, invite);
    setInvites((current) => current.map((existing) => (existing.id === invite.id ? revokedInvite : existing)));
  }

  async function claimStudentFromHoldingSpace(placement: StudentPlacementQueue) {
    if (!user) {
      return;
    }

    setIsClaimingStudent(true);
    setPlacementStatus("");

    try {
      await claimPlacementStudent(placement.studentId);
      const [nextAssignments, nextQueue] = await Promise.all([
        loadTeacherAssignments(user),
        loadOpenStudentPlacementQueue(user)
      ]);
      setAssignments(nextAssignments);
      setPlacementQueue(nextQueue);
      setPlacementStatus(`${placement.studentName} was added to your active roster.`);
    } catch (error) {
      setPlacementStatus(error instanceof Error ? error.message : "Unable to claim this student right now.");
    } finally {
      setIsClaimingStudent(false);
    }
  }

  async function refreshSelectedInsight() {
    if (!selectedStudent) {
      return;
    }

    const [insight, job] = await Promise.all([
      loadLatestStudentInsight(selectedStudent.id),
      loadLatestStudentInsightJob(selectedStudent.id)
    ]);
    setStudentInsights((current) => ({ ...current, [selectedStudent.id]: insight }));
    setStudentInsightJobs((current) => ({ ...current, [selectedStudent.id]: job }));
  }

  async function requestSelectedInsight() {
    if (!user || !selectedStudent) {
      return;
    }

    setIsRequestingInsight(true);
    setInsightStatus("Insight queued. This panel will refresh while the backend worker finishes.");

    try {
      const queuedJob = await requestStudentInsight(user, selectedStudent.id);
      setStudentInsightJobs((current) => ({
        ...current,
        [selectedStudent.id]: {
          id: queuedJob.id,
          studentId: selectedStudent.id,
          requestedBy: user.id,
          requestKind: "teacherRequested",
          status: queuedJob.status,
          consentAccepted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      void trackProductEvent(user, "ai_insight_requested", { studentId: selectedStudent.id });
      window.setTimeout(() => {
        void refreshSelectedInsight();
      }, 3500);
    } catch (error) {
      setInsightStatus(error instanceof Error ? error.message : "Unable to queue insight right now.");
    } finally {
      setIsRequestingInsight(false);
    }
  }

  return (
    <>
      <div className="section-heading dashboard-heading teacher-dashboard-heading">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h2>Classroom insight center</h2>
          <p className="helper-text">Live learning signals, assignment requests, reports, and next steps in one calm workspace.</p>
        </div>
        <span className="live-pill" aria-label="Live classroom tracking active">● Live tracking</span>
      </div>

      <section className="teacher-summary">
        <article className="practice-panel teacher-hero-card teacher-command-card">
          <p className="eyebrow">Class snapshot</p>
          <h3>{classroomAnalysis.headline}</h3>
          <div className="teacher-command-grid">
            {teacherStats.map((stat) => (
              <span className={`teacher-command-stat is-${stat.tone}`} key={stat.label}>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </span>
            ))}
          </div>
          <p className="helper-text">{strengthCount} learners are showing clear strengths. {attentionCount} need a follow-up plan.</p>
          {isLoadingRoster ? <p className="helper-text">Loading assigned students...</p> : null}
          {!assignments.length && !isLoadingRoster ? (
            <p className="helper-text">No students are assigned yet. Share an invite or review the holding space.</p>
          ) : null}
          {rosterError ? <p className="form-error">{rosterError}</p> : null}
        </article>

        <article className="practice-panel">
          <p className="eyebrow">Invite families</p>
          <h3>Create a student invite code</h3>
          <p className="helper-text">
            Share a code with a parent. The family enters it on Find Teacher to connect with you. Invites are
            single-use, expire after 30 days, and can be revoked here before they are used.
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
                  {invite.status === "active" ? (
                    <button className="secondary-button" type="button" onClick={() => void revokeInvite(invite)}>
                      Revoke
                    </button>
                  ) : null}
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

        <article className="practice-panel placement-queue-card">
          <div className="placement-queue-heading">
            <div>
              <p className="eyebrow">Holding space</p>
              <h3>Unassigned learners</h3>
            </div>
            <span className={`load-pill ${isTeacherAtCapacity ? "full" : availableTeacherSeats <= 3 ? "nearlyFull" : "open"}`}>
              {availableTeacherSeats} seats open
            </span>
          </div>
          <p className="helper-text">
            Students who skipped teacher selection appear here until a teacher with capacity claims them.
          </p>
          {placementQueue.length ? (
            <div className="placement-queue-list">
              {placementQueue.slice(0, 5).map((placement) => (
                <div className="placement-queue-row" key={placement.studentId}>
                  <span>
                    <strong>{placement.studentName}</strong>
                    <small>
                      {placement.latestProgressSnapshot.activityCompletions} activities - {placement.latestProgressSnapshot.readingSessions} reading sessions
                    </small>
                  </span>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={isTeacherAtCapacity || isClaimingStudent}
                    onClick={() => void claimStudentFromHoldingSpace(placement)}
                  >
                    {isTeacherAtCapacity ? "At capacity" : "Claim"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper-text">No unassigned students are waiting right now.</p>
          )}
          {placementStatus ? <p className="helper-text">{placementStatus}</p> : null}
        </article>
      </section>

      <section className="teacher-grid">
        <aside className="practice-panel roster-panel teacher-roster-panel" aria-label="Student roster">
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
            {!students.length && !isLoadingRoster ? (
              <p className="helper-text">Assigned students will appear here after approval or a holding-space claim.</p>
            ) : null}
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
                  <em className={supportCount ? "needs-focus" : "on-track"}>{supportCount ? `${supportCount} focus` : "On track"}</em>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="student-insight-stack">
          <article className="practice-panel selected-student-card">
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

          <article className="practice-panel teacher-signal-panel">
            <p className="eyebrow">Intervention plan</p>
            <ol className="teacher-plan">
              {selectedAnalysis?.recommendedPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="practice-panel heatmap-panel">
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

          <article className="practice-panel live-activity-panel">
            <p className="eyebrow">Recent learning history</p>
            {selectedStudent?.history?.length ? (
              <ul className="history-list live-history">
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
                <p className="eyebrow">Learning Coach</p>
                <h3>{selectedAiInsight ? "Latest backend insight" : "Queue a secure insight"}</h3>
              </div>
              <div className="insight-actions">
                <span className={`ai-status-pill ${selectedAiStatus.replace(" ", "-")}`}>{selectedAiStatus}</span>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!selectedStudent || isRequestingInsight || ["queued", "running"].includes(selectedAiJob?.status ?? "")}
                  onClick={() => void requestSelectedInsight()}
                >
                  {isRequestingInsight ? "Queueing..." : "Generate insight"}
                </button>
                <button className="secondary-button subtle-button" type="button" disabled={!selectedStudent} onClick={() => void refreshSelectedInsight()}>
                  Refresh
                </button>
              </div>
            </div>
            <p className="helper-text">
              {selectedAiInsight?.teacherSummary ?? selectedAiInsight?.summary ?? selectedAnalysis?.aiReadinessNote ?? "Collect assigned-student activity before generating AI summaries."}
            </p>
            <p className="helper-text">
              {aiJobHelp(selectedAiJob, selectedAiInsight)} Last generated: {formatInsightDate(selectedAiInsight?.createdAt)}.
            </p>
            <p className={`helper-text${selectedAiJob?.provider === "budget-fallback" ? " ai-budget-alert" : ""}`}>
              {aiProviderHelp(selectedAiJob, selectedAiInsight)}
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
                  <span>
                    <strong>{selectedAiInsight.confidence ?? "low"}</strong>
                    <small>Confidence</small>
                  </span>
                  <span>
                    <strong>{selectedAiJob?.provider ?? "recorded"}</strong>
                    <small>Provider mode</small>
                  </span>
                  <span>
                    <strong>
                      {selectedAiJob?.budget
                        ? `$${selectedAiJob.budget.estimatedMonthlySpendUsd}/$${selectedAiJob.budget.hardLimitUsd}`
                        : "Guarded"}
                    </strong>
                    <small>Monthly AI budget</small>
                  </span>
                </div>
                <div className="insight-columns">
                  <div>
                    <p className="eyebrow">What I noticed</p>
                    <ul className="next-steps">
                      {selectedAiInsight.needsPractice.length ? selectedAiInsight.needsPractice.map((need) => (
                        <li key={`${need.area}-${need.label}`}>{need.label}: {need.nextStep}</li>
                      )) : <li>Keep collecting practice events before making a targeted recommendation.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="eyebrow">What to try next</p>
                    <ul className="next-steps">
                      {selectedAiInsight.recommendedTeacherActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="insight-columns">
                  <div>
                    <p className="eyebrow">Parent-friendly summary</p>
                    <p className="helper-text">
                      {selectedAiInsight.parentSummary ?? "A parent summary will appear after the next Learning Coach refresh."}
                    </p>
                    <ul className="next-steps">
                      {selectedAiInsight.suggestedHomePractice.map((practice) => (
                        <li key={practice}>{practice}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="eyebrow">Next best activity</p>
                    <h4>{selectedAiInsight.nextBestActivity?.title ?? "Keep practicing"}</h4>
                    <p className="helper-text">
                      {selectedAiInsight.nextBestActivity?.reason ?? "The next activity will update after more student practice is logged."}
                    </p>
                    {selectedAiInsight.skillFocusAreas?.length ? (
                      <p className="helper-text">Focus: {selectedAiInsight.skillFocusAreas.join(", ")}</p>
                    ) : null}
                  </div>
                </div>
                <p className="helper-text">
                  Guardrail: {selectedAiInsight.guardrail?.status ?? "recorded"}. {(selectedAiInsight.guardrail?.notes ?? []).join(" ")}
                </p>
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
