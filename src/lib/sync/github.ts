import type { Note } from '$lib/types/index.js';

export interface GitHubSyncConfig {
	token: string;
	owner: string;
	repo: string;
	path: string;
	passphrase: string;
}

export interface GitHubNotesDocument {
	format: 'memento-notes-v1';
	updatedAt: string;
	notes: Note[];
}

const CONFIG_KEY = 'memento-github-sync';
const DEFAULT_PATH = 'keepy-notes.enc.json';

export function getGitHubSyncConfig(): GitHubSyncConfig | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const value = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? '') as Partial<GitHubSyncConfig>;
		if (!value.token || !value.owner || !value.repo || !value.passphrase) return null;
		return { token: value.token, owner: value.owner, repo: value.repo, path: value.path || DEFAULT_PATH, passphrase: value.passphrase };
	} catch {
		return null;
	}
}

type EncryptedDocument = { format: 'keepy-encrypted-v1'; salt: string; iv: string; data: string };
const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

async function getKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
	const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
	return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encrypt(document: GitHubNotesDocument, passphrase: string): Promise<EncryptedDocument> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await getKey(passphrase, salt);
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(JSON.stringify(document)));
	return { format: 'keepy-encrypted-v1', salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) };
}

async function decrypt(payload: EncryptedDocument, passphrase: string): Promise<GitHubNotesDocument> {
	const key = await getKey(passphrase, base64ToBytes(payload.salt));
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(payload.iv) as BufferSource }, key, base64ToBytes(payload.data) as BufferSource);
	return JSON.parse(new TextDecoder().decode(decrypted)) as GitHubNotesDocument;
}

export function saveGitHubSyncConfig(config: GitHubSyncConfig): void {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearGitHubSyncConfig(): void {
	localStorage.removeItem(CONFIG_KEY);
}

export function isGitHubSyncConfigured(): boolean {
	return getGitHubSyncConfig() !== null;
}

export const GITHUB_TOKEN_URL =
	'https://github.com/settings/tokens/new?description=Keepy&scopes=public_repo';

export const KEEPY_SYNC_OWNER = 'Alicetel-u';
export const KEEPY_SYNC_REPO = 'keepy';

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
	const encrypted = JSON.parse(new TextDecoder().decode(base64ToBytes(file.content.replace(/\n/g, '')))) as EncryptedDocument;
	const document = await decrypt(encrypted, config.passphrase);
	if (document.format !== 'memento-notes-v1' || !Array.isArray(document.notes)) throw new Error('メモデータの形式が正しくありません');
	return { notes: document.notes.map(note => ({ ...note, createdAt: new Date(note.createdAt), updatedAt: new Date(note.updatedAt), trashedAt: note.trashedAt ? new Date(note.trashedAt) : null })), sha: file.sha };
}

export async function pushToGitHub(config: GitHubSyncConfig, notes: Note[], sha: string | null): Promise<void> {
	const document: GitHubNotesDocument = { format: 'memento-notes-v1', updatedAt: new Date().toISOString(), notes };
	const encrypted = await encrypt(document, config.passphrase);
	const content = bytesToBase64(new TextEncoder().encode(JSON.stringify(encrypted)));
	const response = await request(config, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Sync Memento notes', content, ...(sha ? { sha } : {}) }) });
	if (response.status === 409) throw new Error('ほかの端末で更新されています。もう一度同期してください');
	if (!response.ok) throw new Error('GitHubへ保存できませんでした (' + response.status + ')');
}
