import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <AnalyticsDashboard />
        </main>
      </div>
    </div>
  );
};

export default Analytics;