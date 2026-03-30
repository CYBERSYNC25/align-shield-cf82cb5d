import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminUserDropdown from './AdminUserDropdown';

interface Props {
  children: ReactNode;
}

const AdminLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-foreground">Painel Multi-Tenant</h2>
          <AdminUserDropdown />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
