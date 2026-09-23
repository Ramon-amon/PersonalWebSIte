// Stylized attraction and swirl, not a physical black-hole simulation.
export function distortPoint(x, y, centerX, centerY, strength) {
  const dx = x - centerX, dy = y - centerY;
  const influence = Math.exp(-(dx * dx + dy * dy) / 4) * strength;
  const angle = influence * 2.8, shrink = 1 - influence * 0.72;
  return [centerX + (dx * Math.cos(angle) - dy * Math.sin(angle)) * shrink,
    centerY + (dx * Math.sin(angle) + dy * Math.cos(angle)) * shrink, influence];
}
