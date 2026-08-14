import type { Handle } from '@sveltejs/kit';

// GitHub Pages版はブラウザだけで動作するため、サーバー認証は行わない。
export const handle: Handle = async ({ event, resolve }) => resolve(event);
