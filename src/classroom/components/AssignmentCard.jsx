import React from 'react';
import { Link } from 'react-router-dom';

const AssignmentCard = ({ assignment, classId, isTeacher, isStudent }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilDue = () => {
    if (!assignment.dueDate) return null;
    
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const diffInDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Due today';
    if (diffInDays === 1) return 'Due tomorrow';
    return `Due in ${diffInDays} days`;
  };

  const getSubmissionStatus = () => {
    if (!assignment.submissions) return null;
    
    if (isTeacher) {
      const totalSubmissions = assignment.submissions.length;
      const gradedSubmissions = assignment.submissions.filter(sub => sub.status === 'graded').length;
      return {
        submissions: totalSubmissions,
        graded: gradedSubmissions,
        pending: totalSubmissions - gradedSubmissions
      };
    } else if (isStudent) {
      const userSubmission = assignment.submissions.find(sub => sub.studentEmail === user?.email);
      return userSubmission ? userSubmission.status : 'not_submitted';
    }
    
    return null;
  };

  const getDueStatus = () => {
    if (!assignment.dueDate) return 'no-due-date';
    
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 'overdue';
    if (hoursUntilDue < 24) return 'due-soon';
    if (hoursUntilDue < 72) return 'due-this-week';
    return 'upcoming';
  };

  const submissionStatus = getSubmissionStatus();
  const daysUntilDue = getDaysUntilDue();
  const dueStatus = getDueStatus();

  return (
    <div className={`assignment-card ${dueStatus}`}>
      <div className="assignment-header">
        <div className="assignment-info">
          <h3 className="assignment-title">{assignment.title}</h3>
          <p className="assignment-description">{assignment.description}</p>
          
          <div className="assignment-details">
            <span className="assignment-points">
              <i className="detail-icon">🏆</i>
              {assignment.points} points
            </span>
            <span className="assignment-questions">
              <i className="detail-icon">❓</i>
              {assignment.configName}
            </span>
            {assignment.attempts > 1 && (
              <span className="assignment-attempts">
                <i className="detail-icon">🔄</i>
                {assignment.attempts} attempts
              </span>
            )}
          </div>
        </div>

        {assignment.dueDate && (
          <div className={`due-badge ${dueStatus}`}>
            <div className="due-date">{daysUntilDue}</div>
            <div className="due-time">{formatDate(assignment.dueDate)}</div>
          </div>
        )}
      </div>

      <div className="assignment-status">
        {isTeacher && submissionStatus && (
          <div className="teacher-status">
            <div className="status-item">
              <span className="status-number">{submissionStatus.submissions}</span>
              <span className="status-label">Submitted</span>
            </div>
            <div className="status-item">
              <span className="status-number">{submissionStatus.graded}</span>
              <span className="status-label">Graded</span>
            </div>
            {submissionStatus.pending > 0 && (
              <div className="status-item pending">
                <span className="status-number">{submissionStatus.pending}</span>
                <span className="status-label">To Grade</span>
              </div>
            )}
          </div>
        )}

        {isStudent && submissionStatus && (
          <div className="student-status">
            <span className={`status-badge ${submissionStatus}`}>
              {submissionStatus === 'not_submitted' && '⏳ Not Submitted'}
              {submissionStatus === 'submitted' && '✅ Submitted'}
              {submissionStatus === 'graded' && '🎯 Graded'}
            </span>
          </div>
        )}
      </div>

      <div className="assignment-actions">
        {isTeacher ? (
          <div className="teacher-actions">
            <Link 
              to={`/classes/${classId}/assignments/${assignment.id}`}
              className="btn btn-secondary btn-sm"
            >
              <i className="btn-icon">👁️</i>
              View Details
            </Link>
            {submissionStatus && submissionStatus.pending > 0 && (
              <Link 
                to={`/classes/${classId}/assignments/${assignment.id}/grade`}
                className="btn btn-primary btn-sm"
              >
                <i className="btn-icon">✏️</i>
                Grade ({submissionStatus.pending})
              </Link>
            )}
          </div>
        ) : (
          <div className="student-actions">
            {submissionStatus === 'not_submitted' ? (
              <Link 
                to={`/classes/${classId}/assignments/${assignment.id}/take`}
                className="btn btn-primary btn-sm"
              >
                <i className="btn-icon">🎯</i>
                Start Assignment
              </Link>
            ) : (
              <Link 
                to={`/classes/${classId}/assignments/${assignment.id}`}
                className="btn btn-secondary btn-sm"
              >
                <i className="btn-icon">👁️</i>
                View Submission
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;