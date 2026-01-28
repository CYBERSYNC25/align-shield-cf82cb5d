import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useMFA } from './useMFA';

interface MFAChallengeContextValue {
  isOpen: boolean;
  actionDescription: string;
  requireMfa: (action: () => void | Promise<void>, description?: string) => void;
  onVerified: () => void;
  onCancel: () => void;
}

const MFAChallengeContext = createContext<MFAChallengeContextValue | null>(null);

export const MFAChallengeProvider = ({ children }: { children: ReactNode }) => {
  const { mfaStatus } = useMFA();
  const [isOpen, setIsOpen] = useState(false);
  const [actionDescription, setActionDescription] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const requireMfa = useCallback((
    action: () => void | Promise<void>, 
    description: string = 'esta ação'
  ) => {
    // If MFA is not enabled, execute action immediately
    if (!mfaStatus?.enabled) {
      action();
      return;
    }

    // Otherwise, show challenge modal
    setActionDescription(description);
    setPendingAction(() => action);
    setIsOpen(true);
  }, [mfaStatus?.enabled]);

  const onVerified = useCallback(() => {
    setIsOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setActionDescription('');
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
    setActionDescription('');
  }, []);

  return (
    <MFAChallengeContext.Provider value={{ isOpen, actionDescription, requireMfa, onVerified, onCancel }}>
      {children}
    </MFAChallengeContext.Provider>
  );
};

export const useMFAChallenge = () => {
  const context = useContext(MFAChallengeContext);
  
  // Return a no-op version if context is not available
  if (!context) {
    return {
      isOpen: false,
      actionDescription: '',
      requireMfa: (action: () => void | Promise<void>) => action(),
      onVerified: () => {},
      onCancel: () => {}
    };
  }
  
  return context;
};
