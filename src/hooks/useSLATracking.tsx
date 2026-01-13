import { useMemo, useState, useEffect } from 'react';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyLevel = 'normal' | 'warning' | 'critical' | 'overdue';

export const SLA_HOURS: Record<SeverityLevel, number> = {
  critical: 24,      // 24 hours
  high: 168,         // 7 days
  medium: 720,       // 30 days
  low: 2160,         // 90 days
};

export const SLA_LABELS: Record<SeverityLevel, string> = {
  critical: '24 horas',
  high: '7 dias',
  medium: '30 dias',
  low: '90 dias',
};

export interface SLAInfo {
  deadline: Date | null;
  slaHours: number;
  timeRemainingMs: number;
  timeRemainingFormatted: string;
  isOverdue: boolean;
  urgencyLevel: UrgencyLevel;
  percentageUsed: number;
}

export function useSLATracking() {
  const [now, setNow] = useState(Date.now());

  // Update "now" every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate SLA deadline from severity and start time
  const calculateSLADeadline = (severity: SeverityLevel, startTime: Date | string): Date => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const slaHours = SLA_HOURS[severity] || SLA_HOURS.medium;
    return new Date(start.getTime() + slaHours * 60 * 60 * 1000);
  };

  // Format time remaining into human-readable string
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Expirado';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Determine urgency level based on time remaining and severity
  const getUrgencyLevel = (deadline: Date | string | null, slaHours: number): UrgencyLevel => {
    if (!deadline) return 'normal';

    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const timeRemainingMs = deadlineDate.getTime() - now;

    if (timeRemainingMs <= 0) return 'overdue';

    const percentageUsed = 1 - (timeRemainingMs / (slaHours * 60 * 60 * 1000));

    // Critical when 90% of SLA used, Warning when 75% used
    if (percentageUsed >= 0.9) return 'critical';
    if (percentageUsed >= 0.75) return 'warning';
    return 'normal';
  };

  // Get complete SLA info for an alert
  const getSLAInfo = (
    deadline: Date | string | null,
    slaHours: number | null,
    triggeredAt?: Date | string | null,
    severity?: SeverityLevel
  ): SLAInfo => {
    // If no deadline, calculate from triggered_at and severity
    let actualDeadline = deadline ? (typeof deadline === 'string' ? new Date(deadline) : deadline) : null;
    let actualSlaHours = slaHours || 720;

    if (!actualDeadline && triggeredAt && severity) {
      actualSlaHours = SLA_HOURS[severity] || SLA_HOURS.medium;
      actualDeadline = calculateSLADeadline(severity, triggeredAt);
    }

    if (!actualDeadline) {
      return {
        deadline: null,
        slaHours: actualSlaHours,
        timeRemainingMs: 0,
        timeRemainingFormatted: 'N/A',
        isOverdue: false,
        urgencyLevel: 'normal',
        percentageUsed: 0,
      };
    }

    const timeRemainingMs = actualDeadline.getTime() - now;
    const isOverdue = timeRemainingMs <= 0;
    const urgencyLevel = getUrgencyLevel(actualDeadline, actualSlaHours);
    const percentageUsed = Math.min(1, 1 - (timeRemainingMs / (actualSlaHours * 60 * 60 * 1000)));

    return {
      deadline: actualDeadline,
      slaHours: actualSlaHours,
      timeRemainingMs: Math.max(0, timeRemainingMs),
      timeRemainingFormatted: formatTimeRemaining(timeRemainingMs),
      isOverdue,
      urgencyLevel,
      percentageUsed: Math.max(0, percentageUsed),
    };
  };

  return {
    calculateSLADeadline,
    formatTimeRemaining,
    getUrgencyLevel,
    getSLAInfo,
    SLA_HOURS,
    SLA_LABELS,
  };
}

// Hook for real-time countdown
export function useSLACountdown(deadline: Date | string | null) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining('N/A');
      return;
    }

    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

    const updateCountdown = () => {
      const now = Date.now();
      const ms = deadlineDate.getTime() - now;

      if (ms <= 0) {
        setIsOverdue(true);
        const overdueMs = Math.abs(ms);
        const hours = Math.floor(overdueMs / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
          setTimeRemaining(`${days}d atrasado`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h atrasado`);
        } else {
          const minutes = Math.floor(overdueMs / (1000 * 60));
          setTimeRemaining(`${minutes}m atrasado`);
        }
        return;
      }

      setIsOverdue(false);
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      if (days > 0) {
        setTimeRemaining(`${days}d ${remainingHours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  return { timeRemaining, isOverdue };
}
