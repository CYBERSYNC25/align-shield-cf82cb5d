// Fuzzy search implementation for marketplace
export const fuzzyMatch = (str: string, pattern: string): boolean => {
  if (!pattern) return true;
  
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Exact substring match
  if (strLower.includes(patternLower)) return true;
  
  // Fuzzy: each character of pattern must appear in order in str
  let patternIndex = 0;
  for (let i = 0; i < strLower.length && patternIndex < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIndex]) {
      patternIndex++;
    }
  }
  return patternIndex === patternLower.length;
};

// Search score for ranking results
export const getSearchScore = (str: string, pattern: string): number => {
  if (!pattern) return 0;
  
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Exact match gets highest score
  if (strLower === patternLower) return 100;
  
  // Starts with pattern
  if (strLower.startsWith(patternLower)) return 80;
  
  // Contains pattern
  if (strLower.includes(patternLower)) return 60;
  
  // Fuzzy match
  if (fuzzyMatch(str, pattern)) return 30;
  
  return 0;
};

// Popular integrations (hardcoded for now, could be dynamic based on usage)
export const POPULAR_INTEGRATION_IDS = [
  'aws',
  'azure-ad',
  'google-workspace',
  'github',
  'okta',
  'datadog',
];

// Coming soon integrations
export const COMING_SOON_INTEGRATIONS = [
  {
    id: 'terraform',
    name: 'Terraform',
    description: 'Infrastructure as Code para gerenciamento de recursos cloud',
    category: 'cloud',
    logo: 'https://www.datocms-assets.com/2885/1620155116-brandhcterraformverticalcolor.svg',
  },
  {
    id: 'snyk',
    name: 'Snyk',
    description: 'Segurança de código e dependências para DevSecOps',
    category: 'security',
    logo: 'https://res.cloudinary.com/snyk/image/upload/v1537345894/press-kit/brand/logo-black.png',
  },
  {
    id: 'prisma-cloud',
    name: 'Prisma Cloud',
    description: 'Plataforma de segurança cloud-native da Palo Alto',
    category: 'security',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    description: 'Análise de dados e SIEM para monitoramento de segurança',
    category: 'observability',
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    description: 'Proteção de endpoints e threat intelligence',
    category: 'security',
  },
];
