/**
 * IP Geolocation Service
 * 
 * Uses free IP geolocation APIs to determine location from IP address.
 * Primary: ip-api.com (45 req/min, no key required)
 * Fallback: ipapi.co (1000 req/day, no key required)
 */

export interface GeoLocation {
  ip: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  timezone: string | null;
}

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  timezone: string;
  query: string;
}

interface IpApiCoResponse {
  ip: string;
  city: string;
  country_name: string;
  country_code: string;
  region: string;
  timezone: string;
}

// Extract client IP from request headers
export function getClientIp(request: Request): string {
  // Check various headers for the real client IP
  const headers = [
    'cf-connecting-ip',     // Cloudflare
    'x-real-ip',            // Nginx
    'x-forwarded-for',      // Standard proxy header
    'x-client-ip',          // Apache
    'true-client-ip',       // Akamai
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      const ip = value.split(',')[0].trim();
      if (ip && isValidIp(ip)) {
        return ip;
      }
    }
  }
  
  return 'unknown';
}

function isValidIp(ip: string): boolean {
  // Simple IPv4 and IPv6 validation
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

function isPrivateIp(ip: string): boolean {
  // Check if IP is private/local
  const privatePatterns = [
    /^10\./,                 // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,           // 192.168.0.0/16
    /^127\./,                // localhost
    /^0\./,                  // 0.0.0.0/8
    /^169\.254\./,           // link-local
    /^::1$/,                 // IPv6 localhost
    /^fc00:/,                // IPv6 unique local
    /^fe80:/,                // IPv6 link-local
  ];
  
  return privatePatterns.some(pattern => pattern.test(ip));
}

async function fetchFromIpApi(ip: string): Promise<GeoLocation | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,timezone,query`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data: IpApiResponse = await response.json();
    
    if (data.status !== 'success') {
      return null;
    }
    
    return {
      ip: data.query,
      city: data.city || null,
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.regionName || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error('ip-api.com error:', error);
    return null;
  }
}

async function fetchFromIpApiCo(ip: string): Promise<GeoLocation | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data: IpApiCoResponse = await response.json();
    
    return {
      ip: data.ip,
      city: data.city || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error('ipapi.co error:', error);
    return null;
  }
}

export async function getGeoLocation(ip: string): Promise<GeoLocation> {
  // Return empty for invalid or private IPs
  if (!ip || ip === 'unknown' || isPrivateIp(ip)) {
    return {
      ip: ip || 'unknown',
      city: null,
      country: null,
      countryCode: null,
      region: null,
      timezone: null,
    };
  }
  
  // Try primary provider first
  let location = await fetchFromIpApi(ip);
  
  // Fallback to secondary provider
  if (!location) {
    location = await fetchFromIpApiCo(ip);
  }
  
  // Return result or empty location
  return location || {
    ip,
    city: null,
    country: null,
    countryCode: null,
    region: null,
    timezone: null,
  };
}

// Format location for display
export function formatLocation(city: string | null, country: string | null): string {
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (country) {
    return country;
  }
  if (city) {
    return city;
  }
  return 'Localização desconhecida';
}
