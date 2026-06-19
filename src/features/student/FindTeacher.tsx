import { useEffect, useState } from "react";
import {
  availableTeacherSlots,
  loadStudentAssignments,
  requestTeacherAssignment,
  searchTeachers,
  teacherLoadStatus
} from "../../services/assignmentRepository";
import type { AppUser, Progress, TeacherStudentLink, UserProfile } from "../../types";

type FindTeacherProps = {
  progress: Progress;
  user: AppUser | null;
  profile: UserProfile;
};

export function FindTeacher({ progress, user, profile }: FindTeacherProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<TeacherStudentLink[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    void loadStudentAssignments(user).then(setAssignments);
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
    setAssignments(await loadStudentAssignments(user));
    setMessage(`Request sent to ${teacher.displayName}.`);
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
            Teachers review student activity history, spot strong and weak areas, and help keep each child on the
            right path. To keep support realistic, ReadNest shows teacher load before a request is sent.
          </p>
        </div>
        <div className="teacher-load-key" aria-label="Teacher load key">
          <span className="load-pill open">Open</span>
          <span className="load-pill nearlyFull">Nearly full</span>
          <span className="load-pill full">Full</span>
        </div>
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
          <p className="helper-text">No teacher requests yet.</p>
        )}
      </article>
    </>
  );
}
