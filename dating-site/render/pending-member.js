// Signed password-authenticated accounts can use ordinary member features.
 // Email ownership is still required for privileged admin access and invited profile claims.
export function permitsPendingMember(path, method) {
  const normalized=String(path).toLowerCase().replace(/\/+$/,'');
  return !/^\/api\/(?:admin(?:\/|$)|claim(?:\/|$)|legacy\/claim(?:\/|$))/.test(normalized);
}
