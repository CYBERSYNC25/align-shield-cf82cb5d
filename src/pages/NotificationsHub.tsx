/**
 * NotificationsHub Page
 * 
 * Central hub for managing all notification-related features:
 * - View and manage notifications
 * - Configure automated alerts
 * - Manage notification rules
 * - View notification statistics and history
 */

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Settings, Activity, TrendingUp } from 'lucide-react';
import AutomatedAlertsPanel from '@/components/notifications/AutomatedAlertsPanel';
import NotificationRulesManager from '@/components/notifications/NotificationRulesManager';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';

const NotificationsHub = () => {
  const { unreadCount, notifications } = useNotifications();

  // Calculate statistics
  const todayNotifications = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    const today = new Date();
    return notifDate.toDateString() === today.toDateString();
  }).length;

  const criticalNotifications = notifications.filter(n => 
    n.priority === 'high' || n.type === 'danger'
  ).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Page Header */}
              <div className="col-span-full">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3 truncate">
                    <Bell className="h-8 w-8 text-primary flex-shrink-0" />
                    <span>Central de Notificações</span>
                  </h1>
                  <p className="text-muted-foreground line-clamp-2">
                    Gerencie alertas, configure automações e acompanhe todas as notificações do sistema
                  </p>
                </div>
              </div>

              {/* Statistics Overview */}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-surface-elevated border-card-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Não Lidas</p>
                        <p className="text-3xl font-bold text-foreground">{unreadCount}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Bell className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-elevated border-card-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Hoje</p>
                        <p className="text-3xl font-bold text-foreground">{todayNotifications}</p>
                      </div>
                      <div className="p-3 bg-info/10 rounded-lg">
                        <Activity className="h-6 w-6 text-info" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-elevated border-card-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Críticas</p>
                        <p className="text-3xl font-bold text-danger">{criticalNotifications}</p>
                      </div>
                      <div className="p-3 bg-danger/10 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-danger" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-elevated border-card-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-3xl font-bold text-foreground">{notifications.length}</p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg">
                        <Settings className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs */}
              <div className="col-span-full">
                <Tabs defaultValue="alerts" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                    <TabsTrigger value="alerts" className="space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Alertas Automatizados</span>
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Regras de Notificação</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="alerts" className="space-y-6">
                    <AutomatedAlertsPanel />
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-6">
                    <NotificationRulesManager />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default NotificationsHub;
