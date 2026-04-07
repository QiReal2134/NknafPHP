import { memo } from 'react';
import { svgPaths } from './symbols';

interface StatusProps {
  type?: 'loading' | 'empty' | 'skeleton';
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const Status = ({ type = 'loading', description = '暂无数据', actionLabel, onAction }: StatusProps) => {
  if (type === 'loading') {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner-enhanced">
          <div className="spinner-ring" />
          <div className="spinner-ring spinner-ring-delay" />
          <div className="spinner-dot" />
        </div>
      </div>
    );
  }
  if (type === 'skeleton') {
    return (
      <div className="skeleton-list">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-cover" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-text" />
              <div className="skeleton-line skeleton-text short" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" width="80" height="66" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d={svgPaths.file} />
      </svg>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="empty-action-btn">{actionLabel}</button>
      )}
    </div>
  );
};

export default memo(Status);
