<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import { GITHUB_TOKEN_URL } from '$lib/sync/github.js';

	let {
		token = $bindable(''),
		passphrase = $bindable(''),
		error = '',
		oncancel,
		onconfirm
	}: {
		token?: string;
		passphrase?: string;
		error?: string;
		oncancel: () => void;
		onconfirm: () => void;
	} = $props();

	function openTokenPage() {
		window.open(GITHUB_TOKEN_URL, '_blank', 'noopener,noreferrer');
	}

	function submit(event: Event) {
		event.preventDefault();
		onconfirm();
	}
</script>

<div class="fixed inset-0 z-30 bg-black/35 p-3 sm:p-8">
	<form
		class="mx-auto flex max-h-full max-w-xl flex-col overflow-auto rounded-3xl bg-[var(--bg-surface)] p-5 shadow-xl"
		onsubmit={submit}
	>
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">別の端末と同期</h2>
				<p class="mt-1 text-sm text-[var(--text-muted)]">
					トークンの発行は1回だけです。もう一方の端末は、設定済みの端末のQRを開いてください。
				</p>
			</div>
			<button type="button" onclick={oncancel} aria-label="閉じる">
				<X class="h-5 w-5" />
			</button>
		</div>

		<ol class="mt-5 space-y-4 text-sm">
			<li class="rounded-2xl border border-[var(--border-subtle)] p-4">
				<p class="font-medium">1. GitHubで許可する</p>
				<p class="mt-1 text-[var(--text-muted)]">
					下のボタンで GitHub が開きます。「Generate token」を押して表示された文字列をコピーしてください。
				</p>
				<button
					type="button"
					class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#24292f] py-3 font-semibold text-white"
					onclick={openTokenPage}
				>
					<ExternalLink class="h-4 w-4" />
					GitHubで許可する
				</button>
			</li>
			<li class="rounded-2xl border border-[var(--border-subtle)] p-4">
				<label class="font-medium" for="keepy-token">2. コピーした文字列を貼る</label>
				<input
					id="keepy-token"
					class="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-3 outline-none"
					type="password"
					autocomplete="off"
					bind:value={token}
					placeholder="ghp_ で始まる文字列"
				/>
			</li>
			<li class="rounded-2xl border border-[var(--border-subtle)] p-4">
				<label class="font-medium" for="keepy-pass">3. 暗号化パスワード</label>
				<p class="mt-1 text-[var(--text-muted)]">スマホとPCで同じパスワードを使います。</p>
				<input
					id="keepy-pass"
					class="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-3 outline-none"
					type="password"
					autocomplete="new-password"
					bind:value={passphrase}
					placeholder="同期用パスワード"
				/>
			</li>
		</ol>

		{#if error}
			<p class="mt-4 text-sm text-[var(--destructive)]">{error}</p>
		{/if}

		<div class="mt-5 grid grid-cols-2 gap-3">
			<button
				type="button"
				class="rounded-2xl border border-[var(--border-subtle)] py-3 font-semibold"
				onclick={oncancel}
			>
				今はしない
			</button>
			<button
				class="rounded-2xl bg-[#feefc3] py-3 font-semibold text-[#5f4800]"
				type="submit"
				disabled={!token.trim() || !passphrase.trim()}
			>
				同期する
			</button>
		</div>
	</form>
</div>
