import { describe, expect, it } from 'vitest';
import { configFromPairingPayload, createPairingUrl } from './github.js';

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
