// All other endpoints retain their verified-member or public-guest behavior.
export function permitsPendingMember(path, method) {
  return (path === '/api/session' && method === 'GET') ||
    (path === '/api/favorites' && ['GET', 'POST'].includes(method));
}
