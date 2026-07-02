import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './WebLayout.css';

interface WebLayoutProps {
  children: React.ReactNode;
}

export function WebLayout({ children }: WebLayoutProps) {
  return (
    <div className="web-layout">
      <Sidebar />
      <div className="web-layout__main">
        <Topbar />
        <main className="web-layout__content">{children}</main>
      </div>
    </div>
  );
}