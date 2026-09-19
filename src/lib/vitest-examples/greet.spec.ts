import { strict as assert } from 'node:assert';
import { greet } from './greet.ts';

Deno.test('greet returns a greeting', () => {
	assert.equal(greet('Svelte'), 'Hello, Svelte!');
});
