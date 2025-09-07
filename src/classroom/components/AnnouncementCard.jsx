import React from 'react';

const AnnouncementCard = ({ announcement, isTeacher }) => {
  const formatDate = (timestamp) => {
    const now = new Date();
    const announcementDate = new Date(timestamp);
    const diffInDays = Math.floor((now - announcementDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return announcementDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  return (
    <div className={`announcement-card ${announcement.pinned ? 'pinned' : ''}`}>
      <div className="announcement-header">
        <div className="announcement-info">
          <h3 className="announcement-title">
            {announcement.pinned && <span className="pin-icon">📌</span>}
            {announcement.title}
          </h3>
          <div className="announcement-meta">
            <span className="announcement-date">
              {formatDate(announcement.created)}
            </span>
            {isTeacher && (
              <span className="announcement-author">
                Posted by you
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="announcement-content">
        <p>{announcement.content}</p>
      </div>
    </div>
  );
};

export default AnnouncementCard;