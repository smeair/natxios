/*
 * Social links come from environment variables (client/.env, see client/.env.example).
 * A platform with no URL set is simply not shown.
 */
const env = import.meta.env;

export const SOCIALS = [
  { name: 'Instagram', handle: env.VITE_INSTAGRAM_HANDLE, href: env.VITE_INSTAGRAM_URL, icon: 'instagram' },
  { name: 'Facebook', handle: env.VITE_FACEBOOK_HANDLE, href: env.VITE_FACEBOOK_URL, icon: 'facebook' },
  { name: 'YouTube', handle: env.VITE_YOUTUBE_HANDLE, href: env.VITE_YOUTUBE_URL, icon: 'youtube' },
].filter((s) => typeof s.href === 'string' && /^https:\/\//.test(s.href));
