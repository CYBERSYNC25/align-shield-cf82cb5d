export const isDevEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovable.dev') ||
    hostname.endsWith('.lovableproject.com')
  );
};
