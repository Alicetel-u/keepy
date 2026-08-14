import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { notes } from '$lib/stores/notes.js';
import { getGitHubSyncConfig, mergeNotes, pullFromGitHub, pushToGitHub } from './github.js';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let syncStatus: SyncStatus = 'synced';
let syncInterval: ReturnType<typeof setInterval> | null = null;
let remoteSha: string | null = null;
const statusListeners = new Set<(status: SyncStatus) => void>();

export function onSyncStatusChange(listener: (status: SyncStatus) => void) {
	statusListeners.add(listener);
	return () => statusListeners.delete(listener);
}

function setStatus(status: SyncStatus) {
	syncStatus = status;
	statusListeners.forEach(listener => listener(status));
}

export function getSyncStatus(): SyncStatus {
	return syncStatus;
}

export async function sync(): Promise<void> {
	if (!browser || !navigator.onLine) return setStatus('offline');
	const config = getGitHubSyncConfig();
	if (!config) return setStatus('error');
	setStatus('syncing');
	try {
		const remote = await pullFromGitHub(config);
		remoteSha = remote.sha;
		const merged = mergeNotes(get(notes), remote.notes);
		notes.set(merged);
		await pushToGitHub(config, merged, remoteSha);
		setStatus('synced');
	} catch {
		setStatus('error');
	}
}

export function startSync() {
	if (!browser) return;
	sync();
	syncInterval = setInterval(sync, 60_000);
	window.addEventListener('online', sync);
	window.addEventListener('offline', () => setStatus('offline'));
}

export function stopSync() {
	if (syncInterval) clearInterval(syncInterval);
	syncInterval = null;
}
