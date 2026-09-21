import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShapes, morphInto, SHAPE_COUNT } from './shapes.js';

test('figures remain finite and morphing is reversible with exact endpoints', () => {
  assert.throws(() => makeShapes(1), RangeError);
  for (const count of [2, 180, 360]) {
    const shapes = makeShapes(count);
    assert.equal(shapes.length, SHAPE_COUNT);
    assert.ok(shapes.every(shape => shape.length === count * 3 && shape.every(Number.isFinite)));
    const output = new Float32Array(count * 3);
    for (let i = 0; i < SHAPE_COUNT; i++) {
      morphInto(output, shapes, i);
      assert.deepEqual(output, shapes[i]);
    }
    morphInto(output, shapes, 2.5);
    const halfway = output.slice();
    morphInto(output, shapes, 4.9);
    morphInto(output, shapes, 2.5);
    assert.deepEqual(output, halfway);
    assert.ok(Math.abs(output[0] - (shapes[2][0] + shapes[3][0]) / 2) < 1e-6);
    morphInto(output, shapes, -1); assert.deepEqual(output, shapes[0]);
    morphInto(output, shapes, 99); assert.deepEqual(output, shapes.at(-1));
  }
});
