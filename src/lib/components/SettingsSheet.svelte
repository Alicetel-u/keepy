<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Cloud from 'lucide-svelte/icons/cloud';
	import Unplug from 'lucide-svelte/icons/unplug';

	let {
		connected,
		onclose,
		onpair,
		onconnect,
		ondisconnect
	}: {
		connected: boolean;
		onclose: () => void;
		onpair: () => void;
		onconnect: () => void;
		ondisconnect: () => void;
	} = $props();
</script>

<div class="fixed inset-0 z-30 bg-black/35 p-3 sm:p-8">
	<div class="mx-auto flex max-h-full max-w-xl flex-col overflow-auto rounded-3xl bg-[var(--bg-surface)] p-5 shadow-xl">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">設定</h2>
				<p class="mt-1 text-sm text-[var(--text-muted)]">
					{connected ? 'この端末は GitHub と連携済みです。' : 'メモはこの端末に保存されています。'}
				</p>
			</div>
			<button type="button" onclick={onclose} aria-label="閉じる"><X class="h-5 w-5" /></button>
		</div>

		<div class="mt-5 space-y-3">
			{#if connected}
				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-4 py-4 text-left"
					onclick={onpair}
				>
					<QrCode class="h-5 w-5 shrink-0 text-[#5f4800]" />
					<span>
						<span class="block font-semibold">ほかの端末を連携</span>
						<span class="mt-0.5 block text-sm text-[var(--text-muted)]">QRを出してスマホや別のPCをつなぎます</span>
					</span>
				</button>
				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-4 py-4 text-left"
					onclick={ondisconnect}
				>
					<Unplug class="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
					<span>
						<span class="block font-semibold">この端末の連携を解除</span>
						<span class="mt-0.5 block text-sm text-[var(--text-muted)]">メモは端末に残ります。トークンはこの端末から消えます</span>
					</span>
				</button>
			{:else}
				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] px-4 py-4 text-left"
					onclick={onconnect}
				>
					<Cloud class="h-5 w-5 shrink-0 text-[#5f4800]" />
					<span>
						<span class="block font-semibold">GitHubと同期する</span>
						<span class="mt-0.5 block text-sm text-[var(--text-muted)]">トークンの発行は1回だけです</span>
					</span>
				</button>
			{/if}
		</div>
	</div>
</div>
