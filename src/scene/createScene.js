import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { makeShapes, morphInto } from './shapes.js';

gsap.registerPlugin(ScrollTrigger);

export function createScene(canvas) {
  const mobile = matchMedia('(max-width: 700px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
  camera.position.z = 8;
  const group = new THREE.Group();
  scene.add(group);
  const count = mobile ? 180 : 360;
  const shapes = makeShapes(count);
  const positions = shapes[0].slice();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: '#b9d4ff', size: mobile ? 0.035 : 0.026, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  // Fixed, sparse links: no all-pairs distance scan on every animation frame.
  const links = Array.from({ length: Math.floor(count / 4) }, (_, i) => [i * 4, (i * 4 + 7) % count]);
  const linePositions = new Float32Array(links.length * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#6da9ff', transparent: true, opacity: 0.14 });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.frustumCulled = false;
  group.add(lines);

  const state = { progress: 0 };
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetX = 0, targetY = 0, frame = 0, last = 0, elapsed = 0;
  const tween = gsap.to(state, {
    progress: shapes.length - 1, ease: 'none',
    scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true },
  });

  function updatePositions() {
    morphInto(positions, shapes, state.progress);
    geometry.attributes.position.needsUpdate = true;
    links.forEach(([a, b], index) => {
      linePositions.set(positions.subarray(a * 3, a * 3 + 3), index * 6);
      linePositions.set(positions.subarray(b * 3, b * 3 + 3), index * 6 + 3);
    });
    lineGeometry.attributes.position.needsUpdate = true;
  }
  function render(time) {
    frame = 0;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    elapsed += dt;
    updatePositions();
    const ease = 1 - Math.exp(-4 * dt);
    group.rotation.y += (targetX * 0.12 - group.rotation.y) * ease;
    group.rotation.x += (targetY * 0.1 - group.rotation.x) * ease;
    group.rotation.z = Math.sin(elapsed * 0.12) * 0.06;
    renderer.render(scene, camera);
    if (!paused && !document.hidden) frame = requestAnimationFrame(render);
  }
  function resume() {
    if (!paused && !document.hidden && !frame) { last = 0; frame = requestAnimationFrame(render); }
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.position.z = innerWidth < 700 ? 10 : 8;
    camera.updateProjectionMatrix();
    group.position.x = innerWidth < 700 ? 0 : 1.5;
    renderer.render(scene, camera);
  }
  function pointer(event) {
    if (event.pointerType === 'mouse') {
      targetX = event.clientX / innerWidth * 2 - 1;
      targetY = event.clientY / innerHeight * 2 - 1;
    }
  }
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume();
  }
  updatePositions(); resize(); resume();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  return {
    setTilt(x, y) { targetX = x; targetY = y; },
    setPaused(value) {
      paused = value;
      if (paused) { cancelAnimationFrame(frame); frame = 0; } else resume();
    },
    dispose() {
      cancelAnimationFrame(frame);
      tween.scrollTrigger.kill(); tween.kill();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      document.removeEventListener('visibilitychange', visibility);
      geometry.dispose(); material.dispose(); lineGeometry.dispose(); lineMaterial.dispose(); renderer.dispose();
    },
  };
}
