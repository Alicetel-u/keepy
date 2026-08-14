<script lang="ts">
	import { onMount } from 'svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Cloud from 'lucide-svelte/icons/cloud';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import Check from 'lucide-svelte/icons/check';
	import type { Note } from '$lib/types/index.js';
	import SyncSetup from '$lib/components/SyncSetup.svelte';
	import {
		clearGitHubSyncConfig,
		getGitHubSyncConfig,
		isGitHubSyncConfigured,
		KEEPY_SYNC_OWNER,
		KEEPY_SYNC_REPO,
		mergeNotes,
		pullFromGitHub,
		pushToGitHub,
		saveGitHubSyncConfig
	} from '$lib/sync/github.js';

	const KEY = 'memento-local-notes';
	let notes = $state<Note[]>([]);
	let title = $state('');
	let content = $state('');
	let editing = $state<Note | null>(null);
	let syncing = $state(false);
	let setupOpen = $state(false);
	let setupToken = $state('');
	let setupPassphrase = $state('');
	let setupError = $state('');
	let connected = $state(false);
	let message = $state('この端末に保存されています');

	function persist() { localStorage.setItem(KEY, JSON.stringify(notes)); }
	function newNote() { title = ''; content = ''; editing = { id: crypto.randomUUID(), title: '', content: '', color: 'default', pinned: false, archived: false, trashed: false, trashedAt: null, checklistMode: false, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), version: 1 }; }
	function save() {
		if (!editing || (!title.trim() && !content.trim())) return close();
		const updated = { ...editing, title: title.trim(), content: content.trim(), updatedAt: new Date(), version: editing.version + 1 };
		notes = notes.some(n => n.id === updated.id) ? notes.map(n => n.id === updated.id ? updated : n) : [updated, ...notes];
		persist(); close(); message = '保存しました';
	}
	function close() { editing = null; title = ''; content = ''; }
	function open(note: Note) { editing = note; title = note.title; content = note.content; }
	function remove(id: string) { notes = notes.filter(n => n.id !== id); persist(); message = '削除しました'; }
	async function runSync() {
		const config = getGitHubSyncConfig();
		if (!config) {
			setupOpen = true;
			setupError = '';
			return;
		}
		syncing = true;
		message = 'GitHubと同期中…';
		try {
			const remote = await pullFromGitHub(config);
			notes = mergeNotes(notes, remote.notes);
			await pushToGitHub(config, notes, remote.sha);
			persist();
			connected = true;
			message = 'GitHubと同期しました';
		} catch (error) {
			const text = error instanceof Error ? error.message : '同期に失敗しました';
			if (text.includes('(401)') || text.includes('(403)')) {
				clearGitHubSyncConfig();
				connected = false;
				setupOpen = true;
				setupError = 'GitHubの許可が無効です。もう一度「GitHubで許可する」からやり直してください。';
				message = 'この端末に保存されています';
			} else {
				message = text;
			}
		} finally {
			syncing = false;
		}
	}

	function confirmSetup() {
		const token = setupToken.trim();
		const passphrase = setupPassphrase.trim();
		if (!token || !passphrase) {
			setupError = '許可コードとパスワードの両方を入力してください';
			return;
		}
		saveGitHubSyncConfig({
			token,
			owner: KEEPY_SYNC_OWNER,
			repo: KEEPY_SYNC_REPO,
			path: 'keepy-notes.enc.json',
			passphrase
		});
		setupOpen = false;
		setupToken = '';
		setupError = '';
		void runSync();
	}

	onMount(() => {
		connected = isGitHubSyncConfigured();
		if (connected) message = 'GitHub同期の準備ができています';
		try {
			notes = (JSON.parse(localStorage.getItem(KEY) ?? '[]') as Note[]).map((n) => ({
				...n,
				createdAt: new Date(n.createdAt),
				updatedAt: new Date(n.updatedAt),
				trashedAt: n.trashedAt ? new Date(n.trashedAt) : null
			}));
		} catch {
			notes = [];
		}
	});
</script>

<svelte:head><title>Keepy</title></svelte:head>

<main class="mx-auto min-h-screen max-w-xl bg-[var(--bg-base)] pb-28 text-[var(--text)]">
	<header class="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
		<div><h1 class="text-xl font-bold">Keepy</h1><p class="text-xs text-[var(--text-muted)]">{message}</p></div>
		<button class="rounded-full bg-[#feefc3] p-3 text-[#5f4800]" onclick={runSync} disabled={syncing} aria-label={connected ? 'GitHubと同期' : '別の端末と同期'}><Cloud class="h-5 w-5" /></button>
	</header>
	<section class="p-4">
		{#if notes.length === 0}<div class="py-24 text-center text-[var(--text-muted)]">メモはまだありません<br><span class="text-sm">右下の＋から追加できます</span></div>{/if}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each notes as note (note.id)}
				<div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--card-shadow)]">
					<div class="flex items-start justify-between gap-2"><button class="text-left" onclick={() => open(note)}><h2 class="font-semibold">{note.title || '無題'}</h2></button><button onclick={() => remove(note.id)} aria-label="削除"><Trash2 class="h-4 w-4 text-[var(--text-muted)]" /></button></div>
					<button class="mt-2 w-full text-left" onclick={() => open(note)}><p class="whitespace-pre-wrap text-sm text-[var(--text-muted)]">{note.content}</p></button>
				</div>
			{/each}
		</div>
	</section>
	<button class="fixed bottom-7 right-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#ffe8a3] text-[#5f4800] shadow-lg" onclick={newNote} aria-label="メモを追加"><Plus class="h-6 w-6" /></button>
</main>

{#if setupOpen}
	<SyncSetup
		bind:token={setupToken}
		bind:passphrase={setupPassphrase}
		error={setupError}
		oncancel={() => { setupOpen = false; setupError = ''; }}
		onconfirm={confirmSetup}
	/>
{/if}

{#if editing}
	<div class="fixed inset-0 z-20 bg-black/35 p-3 sm:p-8">
		<form class="mx-auto flex h-full max-w-xl flex-col rounded-3xl bg-[var(--bg-surface)] p-5 shadow-xl" onsubmit={(e) => { e.preventDefault(); save(); }}>
			<div class="flex justify-end"><button type="button" onclick={close} aria-label="閉じる"><X /></button></div>
			<input class="mt-2 bg-transparent text-xl font-semibold outline-none" bind:value={title} placeholder="タイトル" />
			<textarea class="mt-4 flex-1 resize-none bg-transparent text-base outline-none" bind:value={content} placeholder="メモを書く…"></textarea>
			<button class="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#feefc3] py-3 font-semibold text-[#5f4800]" type="submit"><Check class="h-5 w-5" />保存</button>
		</form>
	</div>
{/if}
