import type { Note } from '$lib/types/index.js';

export interface GitHubSyncConfig {
	token: string;
	owner: string;
	repo: string;
	path: string;
}

export interface GitHubNotesDocument {
	format: 'memento-notes-v1';
	updatedAt: string;
	notes: Note[];
}

const CONFIG_KEY = 'memento-github-sync';
const DEFAULT_PATH = 'memento-notes.json';

export function getGitHubSyncConfig(): GitHubSyncConfig | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const value = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? '') as Partial<GitHubSyncConfig>;
		if (!value.token || !value.owner || !value.repo) return null;
		return { token: value.token, owner: value.owner, repo: value.repo, path: value.path || DEFAULT_PATH };
	} catch {
		return null;
	}
}

export function saveGitHubSyncConfig(config: GitHubSyncConfig): void {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function mergeNotes(local: Note[], remote: Note[]): Note[] {
	const merged = new Map(local.map((note) => [note.id, note]));
	for (const note of remote) {
		const current = merged.get(note.id);
		if (!current || new Date(note.updatedAt).getTime() >= new Date(current.updatedAt).getTime()) merged.set(note.id, note);
	}
	return [...merged.values()];
}

async function request(config: GitHubSyncConfig, init?: RequestInit): Promise<Response> {
	const url = 'https://api.github.com/repos/' + config.owner + '/' + config.repo + '/contents/' + config.path;
	return fetch(url, {
		...init,
		headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + config.token, ...init?.headers }
	});
}

export async function pullFromGitHub(config: GitHubSyncConfig): Promise<{ notes: Note[]; sha: string | null }> {
	const response = await request(config);
	if (response.status === 404) return { notes: [], sha: null };
	if (!response.ok) throw new Error('GitHubから読み込めませんでした (' + response.status + ')');
	const file = await response.json() as { content: string; sha: string };
	const document = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))))) as GitHubNotesDocument;
	if (document.format !== 'memento-notes-v1' || !Array.isArray(document.notes)) throw new Error('メモデータの形式が正しくありません');
	return { notes: document.notes.map(note => ({ ...note, createdAt: new Date(note.createdAt), updatedAt: new Date(note.updatedAt), trashedAt: note.trashedAt ? new Date(note.trashedAt) : null })), sha: file.sha };
}

export async function pushToGitHub(config: GitHubSyncConfig, notes: Note[], sha: string | null): Promise<void> {
	const document: GitHubNotesDocument = { format: 'memento-notes-v1', updatedAt: new Date().toISOString(), notes };
	const content = btoa(unescape(encodeURIComponent(JSON.stringify(document))));
	const response = await request(config, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync Memento notes', content, ...(sha ? { sha } : {}) }) });
	if (response.status === 409) throw new Error('ほかの端末で更新されています。もう一度同期してください');
	if (!response.ok) throw new Error('GitHubへ保存できませんでした (' + response.status + ')');
}
