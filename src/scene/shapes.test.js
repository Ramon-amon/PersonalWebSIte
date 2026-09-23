import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShapes, morphInto, SHAPE_COUNT } from './shapes.js';
import { distortPoint } from './vortex.js';

test('cursor attraction is finite, local and disappears at zero strength', () => {
  assert.deepEqual(distortPoint(1, 2, 0, 0, 0), [1, 2, 0]);
  assert.ok(distortPoint(0, 0, 0, 0, 1).every(Number.isFinite));
  const [x, y, influence] = distortPoint(0.5, 0, 0, 0, 1);
  assert.ok(Math.hypot(x, y) < 0.5);
  assert.ok(y > 0 && influence > 0);
  assert.ok(distortPoint(20, 20, 0, 0, 1)[2] < 1e-10);
});

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

test('loose constellations retain extent without filling the viewport', () => {
  const shapes = makeShapes(520);
  const output = new Float32Array(520 * 3);
  for (let progress = 0; progress <= 5; progress += 0.5) {
    morphInto(output, shapes, progress);
    for (const axis of [0, 1]) {
      const values = Array.from({ length: 520 }, (_, i) => output[i * 3 + axis]);
      assert.ok(Math.max(...values) - Math.min(...values) > 1.1);
      assert.ok(values.every(value => Math.abs(value) < 1.02));
    }
  }
});
