export const SHAPE_COUNT = 6;

// Same particle index in every figure gives continuous, reversible morphs.
export function makeShapes(count) {
  if (!Number.isInteger(count) || count < 2) throw new RangeError('At least two particles are required.');
  return Array.from({ length: SHAPE_COUNT }, (_, shape) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Stable scatter keeps the field open even halfway between sections.
      const noise = seed => {
        const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return (value - Math.floor(value)) * 2 - 1;
      };
      const t = i / (count - 1);
      const angle = t * Math.PI * 3.2;
      const phase = shape * 0.9;
      // Loose spiral arms: recognizable structure with irregular edges.
      const radius = 0.2 + Math.sqrt(t) * 0.58;
      const x = Math.cos(angle + phase) * radius + noise(i * 3 + 1) * 0.23;
      const y = Math.sin(angle + phase) * radius + noise(i * 3 + 2) * 0.23;
      const z = noise(i * 3 + 3) * 1.2 + Math.sin(i + phase) * 0.2;
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

