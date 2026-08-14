import { describe, expect, it } from 'vitest';
import { activeNotes, configFromPairingPayload, createPairingUrl, mergeNotes, trashNote } from './github.js';
import type { Note } from '$lib/types/index.js';

function note(partial: Partial<Note> & Pick<Note, 'id'>): Note {
	return {
		title: 't',
		content: 'c',
		color: 'default',
		pinned: false,
		archived: false,
		trashed: false,
		trashedAt: null,
		checklistMode: false,
		sortOrder: 0,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		version: 1,
		...partial
	};
}

describe('Keepy device pairing', () => {
	it('round-trips a sync config through a pairing URL', () => {
		const config = {
			token: 'ghp_exampletoken',
			passphrase: 'shared-pass',
			owner: 'Alicetel-u',
			repo: 'keepy',
			path: 'keepy-notes.enc.json'
		};
		const url = createPairingUrl(config, 'https://alicetel-u.github.io/keepy/');
		const raw = new URL(url).hash.replace('#pair=', '');
		expect(configFromPairingPayload(raw)).toEqual(config);
	});
});

describe('Keepy delete sync', () => {
	it('keeps a newer local trash marker instead of restoring the remote note', () => {
		const local = trashNote([note({ id: 'a', updatedAt: new Date('2026-01-01') })], 'a');
		const remote = [note({ id: 'a', title: 'まだある', updatedAt: new Date('2026-01-01') })];
		const merged = mergeNotes(local, remote);
		expect(merged[0]?.trashed).toBe(true);
		expect(activeNotes(merged)).toEqual([]);
	});

	it('does not show trashed notes', () => {
		expect(activeNotes([note({ id: 'a', trashed: true })])).toEqual([]);
	});

	it('round-trips a Japanese passphrase in the pairing URL', () => {
		const config = {
			token: 'ghp_exampletoken',
			passphrase: '秘密の合言葉',
			owner: 'Alicetel-u',
			repo: 'keepy',
			path: 'keepy-notes.enc.json'
		};
		const url = createPairingUrl(config, 'https://alicetel-u.github.io/keepy/');
		const raw = new URL(url).hash.replace('#pair=', '');
		expect(configFromPairingPayload(raw)).toEqual(config);
	});
});
