<script lang="ts">
	import { onMount } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import { encode } from 'uqr';

	let { url, onclose }: { url: string; onclose: () => void } = $props();
	let copied = $state(false);
	const qr = $derived(encode(url, { ecc: 'M' }));

	onMount(() => {
		copied = false;
	});

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

<div class="fixed inset-0 z-30 bg-black/35 p-3 sm:p-8">
	<div class="mx-auto flex max-h-full max-w-xl flex-col overflow-auto rounded-3xl bg-[var(--bg-surface)] p-5 shadow-xl">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">スマホでこのQRを開く</h2>
				<p class="mt-1 text-sm text-[var(--text-muted)]">
					トークンの発行は1回だけです。もう一方の端末はQRをカメラで開くだけでつながります。
				</p>
			</div>
			<button type="button" onclick={onclose} aria-label="閉じる"><X class="h-5 w-5" /></button>
		</div>
		<div class="mx-auto mt-5 rounded-3xl bg-white p-4">
			<svg viewBox="0 0 {qr.size} {qr.size}" class="h-56 w-56" role="img" aria-label="ペアリング用QRコード">
				{#each qr.data as row, y}
					{#each row as cell, x}
						{#if cell}
							<rect {x} {y} width="1" height="1" fill="#111" />
						{/if}
					{/each}
				{/each}
			</svg>
		</div>
		<p class="mt-4 text-center text-xs text-[var(--text-muted)]">このQRは合鍵です。他人には見せないでください。</p>
		<button class="mt-4 rounded-2xl bg-[#feefc3] py-3 font-semibold text-[#5f4800]" type="button" onclick={copyLink}>
			{copied ? 'リンクをコピーしました' : 'リンクをコピー'}
		</button>
		<button class="mt-2 rounded-2xl py-3 font-semibold" type="button" onclick={onclose}>閉じる</button>
	</div>
</div>
