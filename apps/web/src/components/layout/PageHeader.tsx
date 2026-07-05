import { memo } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const PageHeader = memo(function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {action && (
        <button className="page-header__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
});