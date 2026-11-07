import net from 'node:net';

/*
 * A "network" key for per-network limits. IPv4 addresses are used as they are; IPv6 addresses
 * are reduced to their /64 prefix, because one home or server usually controls a whole /64
 * and could otherwise rotate addresses to dodge limits.
 */
export function networkOf(ip = '') {
  const addr = String(ip).replace(/^::ffff:/i, '');
  if (net.isIPv4(addr)) return addr;
  if (!net.isIPv6(addr)) return addr;
  const [head, tail = ''] = addr.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return `${full.slice(0, 4).map((x) => x.toLowerCase().padStart(4, '0')).join(':')}::/64`;
}
