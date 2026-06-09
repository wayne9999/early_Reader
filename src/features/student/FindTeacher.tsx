import { useEffect, useState } from "react";
import {
  loadStudentAssignments,
  requestTeacherAssignment,
  searchTeachers
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

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Student connection</p>
          <h2>Find and request your teacher</h2>
        </div>
      </div>

      <section className="practice-panel teacher-search">
        <label>
          <span>Teacher email or code</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="teacher@example.com or READ-12345"
          />
        </label>
        <button className="primary-button" type="button" disabled={isSearching} onClick={() => void handleSearch()}>
          Search
        </button>
      </section>

      {message ? <p className="success-message">{message}</p> : null}

      <section className="teacher-results">
        {teachers.map((teacher) => (
          <article className="practice-panel teacher-result" key={teacher.uid}>
            <div>
              <p className="eyebrow">Teacher</p>
              <h3>{teacher.displayName}</h3>
              <p className="helper-text">{teacher.email}</p>
              <p className="helper-text">Code: {teacher.teacherCode}</p>
            </div>
            <button className="primary-button" type="button" onClick={() => void requestAssignment(teacher)}>
              Request teacher
            </button>
          </article>
        ))}
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
