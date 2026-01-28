/**
 * Device Parser - User-Agent Analysis
 * 
 * Parses User-Agent strings to extract browser, OS, and device information.
 */

export interface DeviceInfo {
  deviceInfo: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

interface BrowserPattern {
  name: string;
  pattern: RegExp;
}

interface OSPattern {
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}

const BROWSER_PATTERNS: BrowserPattern[] = [
  { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+[\.\d]*)/ },
  { name: 'Chrome', pattern: /Chrome\/(\d+[\.\d]*)/ },
  { name: 'Firefox', pattern: /Firefox\/(\d+[\.\d]*)/ },
  { name: 'Safari', pattern: /Version\/(\d+[\.\d]*).*Safari/ },
  { name: 'Opera', pattern: /(?:Opera|OPR)\/(\d+[\.\d]*)/ },
  { name: 'IE', pattern: /(?:MSIE |Trident.*rv:)(\d+[\.\d]*)/ },
  { name: 'Samsung Browser', pattern: /SamsungBrowser\/(\d+[\.\d]*)/ },
];

const OS_PATTERNS: OSPattern[] = [
  { 
    name: 'Windows', 
    pattern: /Windows NT (\d+\.\d+)/, 
    versionPattern: /Windows NT (\d+\.\d+)/ 
  },
  { 
    name: 'macOS', 
    pattern: /Mac OS X (\d+[_\.]\d+[_\.\d]*)/, 
    versionPattern: /Mac OS X (\d+[_\.]\d+[_\.\d]*)/ 
  },
  { 
    name: 'iOS', 
    pattern: /iPhone|iPad|iPod/, 
    versionPattern: /OS (\d+[_\.]\d+[_\.\d]*)/ 
  },
  { 
    name: 'Android', 
    pattern: /Android/, 
    versionPattern: /Android (\d+[\.\d]*)/ 
  },
  { 
    name: 'Linux', 
    pattern: /Linux/ 
  },
  { 
    name: 'Chrome OS', 
    pattern: /CrOS/ 
  },
];

const WINDOWS_VERSIONS: Record<string, string> = {
  '10.0': '10/11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.1': 'XP',
};

function detectBrowser(userAgent: string): { name: string; version: string } {
  for (const { name, pattern } of BROWSER_PATTERNS) {
    const match = userAgent.match(pattern);
    if (match) {
      return { name, version: match[1] || '' };
    }
  }
  return { name: 'Unknown', version: '' };
}

function detectOS(userAgent: string): { name: string; version: string } {
  for (const { name, pattern, versionPattern } of OS_PATTERNS) {
    if (pattern.test(userAgent)) {
      let version = '';
      
      if (versionPattern) {
        const match = userAgent.match(versionPattern);
        if (match) {
          version = match[1].replace(/_/g, '.');
          
          // Convert Windows NT version to friendly name
          if (name === 'Windows' && WINDOWS_VERSIONS[version]) {
            version = WINDOWS_VERSIONS[version];
          }
        }
      }
      
      return { name, version };
    }
  }
  return { name: 'Unknown', version: '' };
}

function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  
  // Check for tablets first (before mobile)
  if (
    /ipad/.test(ua) ||
    (/android/.test(ua) && !/mobile/.test(ua)) ||
    /tablet/.test(ua)
  ) {
    return 'tablet';
  }
  
  // Check for mobile devices
  if (
    /iphone|ipod/.test(ua) ||
    (/android/.test(ua) && /mobile/.test(ua)) ||
    /windows phone/.test(ua) ||
    /blackberry/.test(ua) ||
    /mobile/.test(ua)
  ) {
    return 'mobile';
  }
  
  return 'desktop';
}

export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      deviceInfo: 'Unknown Device',
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'desktop',
    };
  }
  
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const deviceType = detectDeviceType(userAgent);
  
  // Build friendly device info string
  let deviceInfo = browser.name;
  if (os.name !== 'Unknown') {
    deviceInfo += ` no ${os.name}`;
    if (os.version) {
      deviceInfo += ` ${os.version}`;
    }
  }
  
  return {
    deviceInfo,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    deviceType,
  };
}

// Get device icon based on type
export function getDeviceIcon(deviceType: 'desktop' | 'mobile' | 'tablet'): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📟';
    default:
      return '💻';
  }
}
