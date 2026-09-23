import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { makeShapes, morphInto } from './shapes.js';
import { distortPoint } from './vortex.js';

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
  const count = mobile ? 240 : 520;
  const shapes = makeShapes(count);
  const positions = shapes[0].slice();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const colors = new Float32Array(count * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const starCanvas = document.createElement('canvas');
  starCanvas.width = starCanvas.height = 64;
  const starContext = starCanvas.getContext('2d');
  const starGlow = starContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  starGlow.addColorStop(0, '#ffffff');
  starGlow.addColorStop(0.18, '#ffffff');
  starGlow.addColorStop(0.45, '#ffffff70');
  starGlow.addColorStop(1, '#ffffff00');
  starContext.fillStyle = starGlow; starContext.fillRect(0, 0, 64, 64);
  const starTexture = new THREE.CanvasTexture(starCanvas);
  const material = new THREE.PointsMaterial({ map: starTexture, vertexColors: true, size: mobile ? 0.1 : 0.085, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 256;
  const haloContext = haloCanvas.getContext('2d');
  const haloGradient = haloContext.createRadialGradient(128, 128, 0, 128, 128, 128);
  haloGradient.addColorStop(0, '#010107');
  haloGradient.addColorStop(0.25, '#010107');
  haloGradient.addColorStop(0.31, '#fff1d8');
  haloGradient.addColorStop(0.37, '#ffb45a');
  haloGradient.addColorStop(0.49, '#e66bcd99');
  haloGradient.addColorStop(0.7, '#8257ff45');
  haloGradient.addColorStop(1, '#8257ff00');
  haloContext.fillStyle = haloGradient; haloContext.fillRect(0, 0, 256, 256);
  haloContext.strokeStyle = '#fff2cc';
  haloContext.lineWidth = 3;
  haloContext.beginPath();
  haloContext.arc(128, 128, 43, 0.2, 1.6);
  haloContext.stroke();
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  const haloMaterial = new THREE.SpriteMaterial({ map: haloTexture, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.set(2.4, 1.8, 1);
  halo.renderOrder = 2;
  scene.add(halo);
  const cursor = document.createElement('div');
  cursor.className = 'gravity-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  const cold = new THREE.Color('#b9d4ff'), violet = new THREE.Color('#a16bff'), hot = new THREE.Color('#ffad59'), tint = new THREE.Color();
  const mouse = new THREE.Vector2(), ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), center = new THREE.Vector3();
  let hovering = false, gravity = 0;
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  // Fixed, sparse links: no all-pairs distance scan on every animation frame.
  const links = Array.from({ length: Math.floor(count / 3) }, (_, i) => [i * 3, (i * 3 + 2) % count]);
  const linePositions = new Float32Array(links.length * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#8bbcff', transparent: true, opacity: 0.24 });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.frustumCulled = false;
  group.add(lines);

  const state = { progress: 0 };
  let fieldWidth = 1, fieldHeight = 1;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetX = 0, targetY = 0, frame = 0, last = 0, elapsed = 0;
  const tween = gsap.to(state, {
    progress: shapes.length - 1, ease: 'none',
    scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true },
  });

  function updatePositions() {
    morphInto(positions, shapes, state.progress);
    group.updateMatrixWorld();
    ray.setFromCamera(mouse, camera);
    if (ray.ray.intersectPlane(plane, center)) {
      halo.position.copy(center);
      group.worldToLocal(center);
    }
    haloMaterial.opacity = gravity * 0.9;
    haloMaterial.rotation = elapsed * 0.45;
    const pulse = 1 + Math.sin(elapsed * 2) * 0.07;
    halo.scale.set(2.4 * pulse, 1.8 * pulse, 1);
    for (let i = 0; i < count; i++) {
      const offset = i * 3;
      positions[offset] *= fieldWidth;
      positions[offset + 1] *= fieldHeight;
      const [x, y, influence] = distortPoint(positions[offset], positions[offset + 1], center.x, center.y, gravity);
      positions[offset] = x; positions[offset + 1] = y;
      tint.copy(cold).lerp(violet, Math.min(1, influence * 2));
      if (influence > 0.4) tint.lerp(hot, (influence - 0.4) / 0.6);
      tint.toArray(colors, offset);
    }
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true;
    links.forEach(([a, b], index) => {
      linePositions.set(positions.subarray(a * 3, a * 3 + 3), index * 6);
      // Keep only local connections so the wider field doesn't become a web.
      const distance = Math.hypot(positions[a * 3] - positions[b * 3], positions[a * 3 + 1] - positions[b * 3 + 1]);
      const end = distance < 1.6 ? b : a;
      linePositions.set(positions.subarray(end * 3, end * 3 + 3), index * 6 + 3);
    });
    lineGeometry.attributes.position.needsUpdate = true;
  }
  function render(time) {
    frame = 0;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    elapsed += dt;
    const ease = 1 - Math.exp(-4 * dt);
    gravity += ((hovering ? 1 : 0) - gravity) * ease;
    group.rotation.y += (targetX * 0.12 - group.rotation.y) * ease;
    group.rotation.x += (targetY * 0.1 - group.rotation.x) * ease;
    group.rotation.z = Math.sin(elapsed * 0.12) * 0.06;
    updatePositions();
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
    fieldHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    fieldHeight *= 0.82;
    fieldWidth = fieldHeight * Math.min(camera.aspect, 1.3);
    group.position.x = innerWidth < 700 ? 0 : 0.65;
    camera.updateMatrixWorld();
    updatePositions();
    renderer.render(scene, camera);
  }
  function pointer(event) {
    if (event.pointerType === 'mouse' && !paused) {
      document.body.classList.add('gravity-active');
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      hovering = true;
      mouse.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
      targetX = event.clientX / innerWidth * 2 - 1;
      targetY = event.clientY / innerHeight * 2 - 1;
    }
  }
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume();
  }
  function leave() { hovering = false; targetX = 0; targetY = 0; document.body.classList.remove('gravity-active'); }
  updatePositions(); resize(); resume();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', pointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  document.addEventListener('visibilitychange', visibility);
  return {
    setTilt(x, y) { targetX = x; targetY = y; },
    setPaused(value) {
      paused = value;
      if (paused) { cancelAnimationFrame(frame); frame = 0; gravity = 0; leave(); updatePositions(); renderer.render(scene, camera); } else resume();
    },
    dispose() {
      leave(); cursor.remove();
      cancelAnimationFrame(frame);
      tween.scrollTrigger.kill(); tween.kill();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', visibility);
      geometry.dispose(); material.dispose(); starTexture.dispose(); haloTexture.dispose(); haloMaterial.dispose(); lineGeometry.dispose(); lineMaterial.dispose(); renderer.dispose();
    },
  };
}
