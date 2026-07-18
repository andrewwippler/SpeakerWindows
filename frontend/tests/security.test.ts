import nextConfig from '../next.config';

describe('Security Headers', () => {
  it('defines security headers in next.config.js', () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('includes X-Frame-Options DENY header', async () => {
    const headers = await nextConfig.headers!();
    const securityHeaders = headers.find((h: any) => h.source === '/(.*)');
    expect(securityHeaders).toBeDefined();

    const xFrame = securityHeaders!.headers.find(
      (h: any) => h.key === 'X-Frame-Options'
    );
    expect(xFrame).toBeDefined();
    expect(xFrame!.value).toBe('DENY');
  });

  it('includes X-Content-Type-Options nosniff header', async () => {
    const headers = await nextConfig.headers!();
    const securityHeaders = headers.find((h: any) => h.source === '/(.*)');
    const xContentType = securityHeaders!.headers.find(
      (h: any) => h.key === 'X-Content-Type-Options'
    );
    expect(xContentType).toBeDefined();
    expect(xContentType!.value).toBe('nosniff');
  });

  it('includes Referrer-Policy header', async () => {
    const headers = await nextConfig.headers!();
    const securityHeaders = headers.find((h: any) => h.source === '/(.*)');
    const referrer = securityHeaders!.headers.find(
      (h: any) => h.key === 'Referrer-Policy'
    );
    expect(referrer).toBeDefined();
    expect(referrer!.value).toBe('strict-origin-when-cross-origin');
  });

  it('includes Permissions-Policy header restricting camera, microphone, geolocation', async () => {
    const headers = await nextConfig.headers!();
    const securityHeaders = headers.find((h: any) => h.source === '/(.*)');
    const permissions = securityHeaders!.headers.find(
      (h: any) => h.key === 'Permissions-Policy'
    );
    expect(permissions).toBeDefined();
    expect(permissions!.value).toContain('camera=()');
    expect(permissions!.value).toContain('microphone=()');
    expect(permissions!.value).toContain('geolocation=()');
  });

  it('derives image hostname from NEXT_PUBLIC_HOST_URL (no separate env var needed)', () => {
    const imagePatterns = nextConfig.images?.remotePatterns || [];
    const productionPattern = imagePatterns.find(
      (p: any) => p.protocol === 'https' && p.hostname !== 'avatars.githubusercontent.com'
    );
    expect(productionPattern).toBeDefined();
    expect(productionPattern!.hostname).not.toBe('*');
  });
});
