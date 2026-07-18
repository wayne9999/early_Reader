import { useEffect, useState } from "react";
import {
  availableTeacherSlots,
  loadStudentPlacement,
  loadStudentAssignments,
  requestTeacherAssignment,
  searchTeachers,
  teacherLoadStatus,
  upsertStudentPlacementQueue
} from "../../services/assignmentRepository";
import { acceptTeacherInviteCode } from "../../services/teacherInviteRepository";
import { trackProductEvent } from "../../services/productAnalytics";
import type { AppUser, Progress, StudentPlacementQueue, TeacherStudentLink, UserProfile } from "../../types";

type FindTeacherProps = {
  progress: Progress;
  user: AppUser | null;
  profile: UserProfile;
};

export function FindTeacher({ progress, user, profile }: FindTeacherProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<TeacherStudentLink[]>([]);
  const [placement, setPlacement] = useState<StudentPlacementQueue | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);

  useEffect(() => {
    void Promise.all([loadStudentAssignments(user), loadStudentPlacement(user)]).then(([loadedAssignments, loadedPlacement]) => {
      setAssignments(loadedAssignments);
      setPlacement(loadedPlacement);
    });
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    setIsSearching(true);
    searchTeachers("")
      .then((directoryTeachers) => {
        if (isMounted) {
          setTeachers(directoryTeachers);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSearching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSearch() {
    setIsSearching(true);
    setMessage("");
    setTeachers(await searchTeachers(searchTerm));
    setIsSearching(false);
  }

  async function requestAssignment(teacher: UserProfile) {
    if (!user) {
      return;
    }

    await requestTeacherAssignment(teacher, user, profile, progress);
    const [nextAssignments, nextPlacement] = await Promise.all([loadStudentAssignments(user), loadStudentPlacement(user)]);
    setAssignments(nextAssignments);
    setPlacement(nextPlacement);
    setMessage(`Request sent to ${teacher.displayName}.`);
  }

  async function joinHoldingSpace() {
    if (!user) {
      return;
    }

    setIsJoiningQueue(true);
    setMessage("");

    try {
      const nextPlacement = await upsertStudentPlacementQueue(user, profile, progress, {
        status: "unassigned"
      });
      setPlacement(nextPlacement);
      setMessage("You are in the ReadNest holding space. Teachers with open capacity can now offer support.");
    } finally {
      setIsJoiningQueue(false);
    }
  }

  async function redeemInviteCode() {
    if (!user) {
      return;
    }

    setIsAcceptingInvite(true);
    setInviteStatus("");

    try {
      const result = await acceptTeacherInviteCode(inviteCode);

      setInviteCode("");
      setInviteStatus(
        result.status === "active"
          ? `You are now connected to ${result.teacherName}.`
          : `Request sent to ${result.teacherName}. They will approve it from their dashboard.`
      );
      void trackProductEvent(user, "teacher_invite_accepted", { status: result.status });
      const [nextAssignments, nextPlacement] = await Promise.all([loadStudentAssignments(user), loadStudentPlacement(user)]);
      setAssignments(nextAssignments);
      setPlacement(nextPlacement);
    } catch (error) {
      setInviteStatus(error instanceof Error ? error.message : "That invite code could not be used right now.");
    } finally {
      setIsAcceptingInvite(false);
    }
  }

  function assignmentForTeacher(teacherId: string) {
    return assignments.find((assignment) => assignment.teacherId === teacherId);
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Student connection</p>
          <h2>Choose a teacher guide</h2>
        </div>
      </div>

      <section className="practice-panel teacher-choice-intro">
        <div>
          <p className="eyebrow">Human-in-the-loop support</p>
          <h3>Pick a teacher who fits your reading goals</h3>
          <p className="helper-text">
            Assigned teachers are verified ReadNest teacher accounts connected to this child. They can review this
            child's practice history, spot strong and weak areas, and suggest what to practice next. To keep support
            realistic, ReadNest shows teacher load before a request is sent.
          </p>
        </div>
        <div className="teacher-choice-actions">
          <div className="teacher-load-key" aria-label="Teacher load key">
            <span className="load-pill open">Open</span>
            <span className="load-pill nearlyFull">Nearly full</span>
            <span className="load-pill full">Full</span>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={isJoiningQueue || placement?.status === "unassigned"}
            onClick={() => void joinHoldingSpace()}
          >
            {placement?.status === "unassigned" ? "In holding space" : isJoiningQueue ? "Saving..." : "Skip for now"}
          </button>
        </div>
      </section>

      <section className="practice-panel teacher-search">
        <label>
          <span>Have an invite code from your teacher?</span>
          <input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="READ-AB12CD"
            autoCapitalize="characters"
          />
        </label>
        <button
          className="primary-button"
          type="button"
          disabled={isAcceptingInvite || !inviteCode.trim() || !user}
          onClick={() => void redeemInviteCode()}
        >
          {isAcceptingInvite ? "Checking..." : "Use invite code"}
        </button>
        {inviteStatus ? <p className="helper-text">{inviteStatus}</p> : null}
      </section>

      <section className="practice-panel teacher-search">
        <label>
          <span>Search teacher email or code</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="teacher@example.com or READ-12345"
          />
        </label>
        <button className="primary-button" type="button" disabled={isSearching} onClick={() => void handleSearch()}>
          {isSearching ? "Loading" : "Search"}
        </button>
      </section>

      {message ? <p className="success-message">{message}</p> : null}
      {placement?.status === "unassigned" ? (
        <article className="practice-panel holding-space-card">
          <p className="eyebrow">Holding space</p>
          <h3>Waiting for a teacher with open capacity</h3>
          <p className="helper-text">
            Your latest practice snapshot is available to teachers who can take a new student. You can still request a
            specific teacher from the list below.
          </p>
        </article>
      ) : null}

      <section className="teacher-results">
        {teachers.map((teacher) => {
          const currentAssignment = assignmentForTeacher(teacher.uid);
          const loadStatus = teacherLoadStatus(teacher);
          const isFull = loadStatus === "full";
          const requestLabel = currentAssignment
            ? `Request ${currentAssignment.status}`
            : isFull
              ? "Teacher is full"
              : "Request teacher";

          return (
            <article className="practice-panel teacher-result" key={teacher.uid}>
              <div className="teacher-result-main">
                <div>
                  <p className="eyebrow">Teacher profile</p>
                  <h3>{teacher.displayName}</h3>
                  <p className="helper-text">{teacher.bio ?? "Early reading teacher focused on calm, short practice."}</p>
                </div>
                <span className={`load-pill ${loadStatus}`}>
                  {availableTeacherSlots(teacher)} spots open
                </span>
              </div>

              <div className="teacher-profile-details">
                <span>Grades {(teacher.gradeBands ?? ["K", "1", "2"]).join(", ")}</span>
                <span>Code {teacher.teacherCode}</span>
                <span>{teacher.email}</span>
              </div>

              <div className="teacher-specialties" aria-label={`${teacher.displayName} specialties`}>
                {(teacher.specialties ?? ["phonics", "sight words", "reading confidence"]).map((specialty) => (
                  <span key={specialty}>{specialty}</span>
                ))}
              </div>

              <p className="helper-text">
                {teacher.payModelNote ?? "Teacher support is paid based on active assigned students."}
              </p>

              <button
                className="primary-button"
                type="button"
                disabled={Boolean(currentAssignment) || isFull}
                onClick={() => void requestAssignment(teacher)}
              >
                {requestLabel}
              </button>
            </article>
          );
        })}
        {!teachers.length && !isSearching ? (
          <article className="practice-panel teacher-result">
            <p className="eyebrow">No teachers found</p>
            <h3>Try a teacher code or email</h3>
            <p className="helper-text">As teachers create profiles, this page will show their bios and available load.</p>
          </article>
        ) : null}
      </section>

      <article className="practice-panel">
        <p className="eyebrow">Current requests</p>
        {assignments.length ? (
          <ul className="next-steps">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                {assignment.teacherName}: {assignment.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="helper-text">
            No assigned teacher yet. Choose one from the list, use an invite code, or skip into the holding space so an
            available teacher can pick up the student later.
          </p>
        )}
      </article>
    </>
  );
}
