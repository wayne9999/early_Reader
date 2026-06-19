import type { Progress, SkillInsight, StudentSummary, TeacherAnalysis } from "../types";

type ReportMetric = {
  label: string;
  current: number;
  quarterGoal: number;
  annualGoal: number;
  detail: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function knownWordCount(progress: Progress) {
  return Object.keys(progress.knownWords).length;
}

function percentOfGoal(current: number, goal: number) {
  if (goal <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((current / goal) * 100));
}

function metricStatus(metric: ReportMetric) {
  const quarterProgress = percentOfGoal(metric.current, metric.quarterGoal);

  if (quarterProgress >= 100) {
    return "On goal";
  }

  if (quarterProgress >= 70) {
    return "Close";
  }

  return "Needs practice";
}

function buildMetrics(progress: Progress): ReportMetric[] {
  return [
    {
      label: "Sight words",
      current: knownWordCount(progress),
      quarterGoal: 8,
      annualGoal: 32,
      detail: "Recognize and read familiar high-use words with confidence."
    },
    {
      label: "Reading fluency",
      current: progress.readingSessions,
      quarterGoal: 18,
      annualGoal: 72,
      detail: "Read short sentences with less audio support over time."
    },
    {
      label: "Memory practice",
      current: progress.memoryWins,
      quarterGoal: 10,
      annualGoal: 40,
      detail: "Finish memory boards while naming cards and using focus routines."
    },
    {
      label: "Skill activities",
      current: progress.activityCompletions,
      quarterGoal: 15,
      annualGoal: 60,
      detail: "Complete targeted phonics, sentence, story, and vocabulary activities."
    }
  ];
}

function goalFromInsight(insight: SkillInsight | undefined) {
  if (!insight) {
    return "Keep a steady routine of three short learning activities on practice days.";
  }

  return insight.nextStep;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function reportFileName(student: StudentSummary, date = new Date()) {
  const safeName = student.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "student";
  return `${safeName}-readnest-report-${date.toISOString().slice(0, 10)}.html`;
}

export function buildStudentReportCardHtml(
  student: StudentSummary,
  analysis: TeacherAnalysis,
  teacherName = "ReadNest teacher",
  date = new Date()
) {
  const metrics = buildMetrics(student.progress);
  const primaryGoal = goalFromInsight(analysis.growthAreas[0] ?? analysis.strengths[0]);
  const secondaryGoal = goalFromInsight(analysis.growthAreas[1]);
  const strengths = analysis.strengths.slice(0, 2);
  const growthAreas = analysis.growthAreas.slice(0, 2);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(student.name)} ReadNest Progress Report</title>
    <style>
      body { margin: 0; padding: 32px; color: #202637; font-family: Arial, sans-serif; background: #f8f5ea; }
      main { max-width: 860px; margin: 0 auto; padding: 28px; border-radius: 14px; background: white; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: 32px; margin-bottom: 8px; }
      h2 { font-size: 18px; margin-bottom: 10px; color: #2f6f7e; text-transform: uppercase; letter-spacing: 0.04em; }
      .meta, .summary, .goals, .metrics, .notes { margin-top: 24px; }
      .meta { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 10px; color: #596174; }
      .card { padding: 16px; border: 2px solid #dfe8ef; border-radius: 10px; background: #fbfdff; }
      .metrics { display: grid; gap: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 11px 10px; border-bottom: 1px solid #dfe8ef; text-align: left; vertical-align: top; }
      th { color: #2f6f7e; font-size: 13px; text-transform: uppercase; }
      .status { font-weight: 700; }
      .goal-list, .note-list { margin: 0; padding-left: 20px; line-height: 1.55; }
      .split { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 14px; }
      footer { margin-top: 24px; color: #596174; font-size: 13px; }
      @media print { body { background: white; padding: 0; } main { box-shadow: none; } }
      @media (max-width: 640px) { body { padding: 14px; } main { padding: 18px; } .meta, .split { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <h1>ReadNest Progress Report</h1>
      <p>${escapeHtml(student.name)} · Grade ${escapeHtml(student.gradeBand)} · ${escapeHtml(formatDate(date))}</p>

      <section class="meta">
        <div class="card"><strong>Teacher</strong><br />${escapeHtml(teacherName)}</div>
        <div class="card"><strong>Practice status</strong><br />${student.progress.completedToday} of 3 activities completed today</div>
      </section>

      <section class="summary card">
        <h2>Simple Summary</h2>
        <p>${escapeHtml(analysis.summary)}</p>
      </section>

      <section class="metrics">
        <h2>Quarter And Annual Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Now</th>
              <th>Quarter Goal</th>
              <th>Annual Goal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${metrics
              .map(
                (metric) => `<tr>
                  <td><strong>${escapeHtml(metric.label)}</strong><br />${escapeHtml(metric.detail)}</td>
                  <td>${metric.current}</td>
                  <td>${metric.quarterGoal}</td>
                  <td>${metric.annualGoal}</td>
                  <td class="status">${escapeHtml(metricStatus(metric))}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section class="goals split">
        <div class="card">
          <h2>Current Goals</h2>
          <ul class="goal-list">
            <li>${escapeHtml(primaryGoal)}</li>
            <li>${escapeHtml(secondaryGoal)}</li>
          </ul>
        </div>
        <div class="card">
          <h2>Practice Focus</h2>
          <ul class="goal-list">
            ${growthAreas.length
              ? growthAreas.map((insight) => `<li>${escapeHtml(insight.label)}: ${escapeHtml(insight.nextStep)}</li>`).join("")
              : "<li>Keep strengthening current routines and introduce one new challenge at a time.</li>"}
          </ul>
        </div>
      </section>

      <section class="notes split">
        <div class="card">
          <h2>Strengths</h2>
          <ul class="note-list">
            ${strengths.length
              ? strengths.map((insight) => `<li>${escapeHtml(insight.label)}: ${escapeHtml(insight.evidence)}</li>`).join("")
              : "<li>More practice data is needed before a clear strength is marked.</li>"}
          </ul>
        </div>
        <div class="card">
          <h2>Parent Next Steps</h2>
          <ul class="note-list">
            <li>Practice for 3 to 5 minutes, then stop after a successful response.</li>
            <li>Ask the child to explain one word, sound, or story step after practice.</li>
            <li>Review this report with the teacher before changing goals.</li>
          </ul>
        </div>
      </section>

      <footer>
        This report is a teacher-facing progress summary, not a diagnosis. It uses ReadNest practice data available to the assigned teacher.
      </footer>
    </main>
  </body>
</html>`;
}

export function downloadStudentReportCard(
  student: StudentSummary,
  analysis: TeacherAnalysis,
  teacherName?: string
) {
  const reportHtml = buildStudentReportCardHtml(student, analysis, teacherName);
  const reportBlob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
  const reportUrl = URL.createObjectURL(reportBlob);
  const link = document.createElement("a");

  link.href = reportUrl;
  link.download = reportFileName(student);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(reportUrl);
}
