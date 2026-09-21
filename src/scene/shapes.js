export const SHAPE_COUNT = 6;

// Same particle index in every figure gives continuous, reversible morphs.
export function makeShapes(count) {
  if (!Number.isInteger(count) || count < 2) throw new RangeError('At least two particles are required.');
  return Array.from({ length: SHAPE_COUNT }, (_, shape) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = i * 2.399963229728653;
      const radius = Math.sqrt(t) * 2.7;
      let x, y, z;
      if (shape === 0) {
        x = Math.cos(angle) * radius; y = Math.sin(angle) * radius; z = Math.sin(i * 7.13) * 1.4;
      } else if (shape === 1) {
        y = (t - 0.5) * 4.5; x = Math.cos(t * Math.PI * 8) * 1.5; z = Math.sin(t * Math.PI * 8) * 1.5;
      } else if (shape === 2) {
        const group = i % 3 * Math.PI * 2 / 3;
        x = Math.cos(group) * 1.65 + Math.cos(angle) * 0.75;
        y = Math.sin(group) * 1.65 + Math.sin(angle) * 0.75; z = Math.sin(i * 3.7) * 0.7;
      } else if (shape === 3) {
        const side = Math.ceil(Math.sqrt(count));
        x = (i % side / (side - 1) - 0.5) * 4;
        y = (Math.floor(i / side) / (side - 1) - 0.5) * 4; z = Math.sin(x + y) * 0.5;
      } else if (shape === 4) {
        const ring = 1.8 + (i % 3) * 0.3;
        x = Math.cos(angle) * ring; y = Math.sin(angle) * ring * 0.65; z = Math.sin(angle) * ring * 0.65;
      } else {
        const vertical = 1 - 2 * t;
        const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical));
        x = Math.cos(angle) * horizontal * 1.6; y = vertical * 1.6; z = Math.sin(angle) * horizontal * 1.6;
      }
      positions.set([x, y, z], i * 3);
    }
    return positions;
  });
}

export function morphInto(output, shapes, progress) {
  const value = Math.max(0, Math.min(shapes.length - 1, progress));
  const index = Math.floor(value);
  const a = shapes[index], b = shapes[Math.min(index + 1, shapes.length - 1)];
  const fraction = value - index;
  if (fraction === 0) { output.set(a); return; }
  const blend = fraction * fraction * (3 - 2 * fraction);
  for (let i = 0; i < output.length; i++) output[i] = a[i] + (b[i] - a[i]) * blend;
}
