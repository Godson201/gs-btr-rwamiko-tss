export async function waitForAuthServer(): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const response = await fetch('/api/auth/ready', {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok && (await response.json()).ready === true) return;
      if (response.status === 500) {
        throw new Error('AUTH_NOT_CONFIGURED');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_NOT_CONFIGURED') {
        throw new Error('The login service is not configured. Please contact the school administrator.');
      }
    }
    if (attempt < 7) await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new Error('The school server is still unavailable. Please try again shortly. Your form has been kept.');
}
