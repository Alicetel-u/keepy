<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getSyncStatus, onSyncStatusChange, sync, type SyncStatus } from '$lib/sync/client.js';
	import CloudCheck from 'lucide-svelte/icons/cloud-check';
	import CloudSync from 'lucide-svelte/icons/cloud-sync';
	import CloudOff from 'lucide-svelte/icons/cloud-off';
	import CloudAlert from 'lucide-svelte/icons/cloud-alert';
	import { getGitHubSyncConfig, saveGitHubSyncConfig } from '$lib/sync/github.js';

	let status: SyncStatus = $state(getSyncStatus());
	let displayStatus: SyncStatus = $state(getSyncStatus());
	let minDisplayTimeout: ReturnType<typeof setTimeout> | undefined;
	let pendingStatus: SyncStatus | undefined;

	function applyStatus(s: SyncStatus) {
		if (displayStatus === s) return;

		if (minDisplayTimeout) {
			pendingStatus = s;
			return;
		}

		displayStatus = s;
		minDisplayTimeout = setTimeout(() => {
			minDisplayTimeout = undefined;
			if (pendingStatus !== undefined && pendingStatus !== displayStatus) {
				applyStatus(pendingStatus);
				pendingStatus = undefined;
			}
		}, 300);
	}

	let unsubscribe: (() => void) | undefined;

	onMount(() => {
		unsubscribe = onSyncStatusChange((s) => {
			status = s;
			applyStatus(s);
		});
	});

	onDestroy(() => {
		unsubscribe?.();
		if (minDisplayTimeout) clearTimeout(minDisplayTimeout);
	});

	async function syncWithSetup() {
		if (!getGitHubSyncConfig()) {
			const token = window.prompt('GitHubのFine-grainedトークンを入力してください');
			const repo = window.prompt('メモ保存用リポジトリ名を入力してください（例: keepy-data）');
			if (!token || !repo) return;
			saveGitHubSyncConfig({ token, owner: 'Alicetel-u', repo, path: 'memento-notes.json' });
		}
		await sync();
	}
</script>

<button
	class="flex cursor-pointer items-center rounded-sm p-1 transition-colors hover:bg-[var(--border-subtle)]/50"
	title="Sync status: {status} — click to sync"
	onclick={syncWithSetup}
	data-testid="sync-indicator"
>
	{#if displayStatus === 'synced'}
		<CloudCheck class="h-5 w-5 text-[var(--primary)]" />
	{:else if displayStatus === 'syncing'}
		<CloudSync class="h-5 w-5 text-[var(--primary)] opacity-60" />
	{:else if displayStatus === 'offline'}
		<CloudOff class="h-5 w-5 text-[var(--text-muted)]" />
	{:else}
		<CloudAlert class="h-5 w-5 text-[var(--destructive)]" />
	{/if}
</button>
