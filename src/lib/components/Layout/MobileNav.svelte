<script lang="ts">
	import { page } from '$app/stores';
	import StickyNote from 'lucide-svelte/icons/sticky-note';
	import Archive from 'lucide-svelte/icons/archive';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Settings from 'lucide-svelte/icons/settings';

	const items = [
		{ href: '/', label: 'メモ', icon: StickyNote, match: (path: string) => path === '/' },
		{ href: '/archive', label: '保管済み', icon: Archive, match: (path: string) => path === '/archive' },
		{ href: '/trash', label: 'ゴミ箱', icon: Trash2, match: (path: string) => path === '/trash' },
		{ href: '/settings', label: '設定', icon: Settings, match: (path: string) => path.startsWith('/settings') }
	] as const;
</script>

<nav class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur lg:hidden" aria-label="メインナビゲーション">
	<div class="mx-auto flex max-w-md justify-around">
		{#each items as item}
			<a
				href={item.href}
				class="flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors {item.match($page.url.pathname) ? 'bg-[#feefc3] text-[#5f4800]' : 'text-[var(--text-muted)]'}"
				aria-current={item.match($page.url.pathname) ? 'page' : undefined}
			>
				<item.icon class="h-5 w-5" />
				{item.label}
			</a>
		{/each}
	</div>
</nav>
