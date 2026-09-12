export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  // The URL parser normalizes IPv4 (octal/hex/decimal literals included), so a
  // "127." prefix check covers the whole 127.0.0.0/8 loopback block.
  if (host.startsWith("127.")) return true;
  // Hostname for IPv6 includes brackets under the WHATWG URL spec.
  return host === "[::1]";
}
