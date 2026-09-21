import React, { useEffect, useRef, useState } from 'react';
import { sections } from './content.js';
import { createScene } from './scene/createScene.js';
import { requestTilt } from './scene/tilt.js';

export default function App() {
  const canvas = useRef(null);
  const scene = useRef(null);
  const stopTilt = useRef(null);
  const mounted = useRef(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [tiltState, setTiltState] = useState('off');
  const [message, setMessage] = useState('');

  useEffect(() => {
    mounted.current = true;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener('change', update);
    try {
      scene.current = createScene(canvas.current);
      setReady(true);
    } catch {
      setMessage('La versión estática está activa en este dispositivo.');
    }
    return () => {
      mounted.current = false;
      preference.removeEventListener('change', update);
      stopTilt.current?.();
      scene.current?.dispose();
    };
  }, []);

  useEffect(() => {
    scene.current?.setPaused(paused || reduced);
    if (paused || reduced) {
      stopTilt.current?.();
      stopTilt.current = null;
      scene.current?.setTilt(0, 0);
      setTiltState('off');
    }
  }, [paused, reduced]);

  async function toggleTilt() {
    if (tiltState === 'on') {
      stopTilt.current?.();
      stopTilt.current = null;
      scene.current?.setTilt(0, 0);
      setTiltState('off');
      setMessage('Movimiento por inclinación desactivado.');
      return;
    }
    setTiltState('pending');
    const result = await requestTilt((x, y) => scene.current?.setTilt(x, y));
    if (!mounted.current) { result.stop?.(); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      result.stop?.();
      scene.current?.setTilt(0, 0);
      setTiltState('off');
      return;
    }
    stopTilt.current = result.stop;
    setTiltState(result.stop ? 'on' : 'off');
    setMessage(result.message);
  }

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <canvas ref={canvas} className="cosmos" aria-hidden="true" />
    <header className="header">
      <a className="brand" href="#inicio" aria-label="Volver al inicio">N<span> / </span>C</a>
      <nav aria-label="Navegación principal">
        <a href="#proyectos">Proyectos</a><a href="#contacto">Contacto</a>
      </nav>
    </header>
    <main id="contenido">
      {sections.map((section, index) => <section className="section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
        <div className="section-content">
          <p className="eyebrow">{section.label}</p>
          {index === 0 ? <h1 id={`${section.id}-title`}>{section.title}</h1> : <h2 id={`${section.id}-title`}>{section.title}</h2>}
          {index === 0 && <div className="hero-actions"><a className="button" href="#proyectos">Ver proyectos <span aria-hidden="true">↗</span></a><a className="text-link" href="#propuesta">Explorar ↓</a></div>}
          {index > 0 && <span className="section-line" aria-hidden="true" />}
        </div>
        <span className="section-count" aria-hidden="true">0{index + 1} / 06</span>
      </section>)}
    </main>
    <footer>
      <span>Ramón Hernández</span>
      <div className="motion-controls">
        <button disabled={!ready || reduced || tiltState === 'pending'} aria-pressed={paused || reduced} onClick={() => setPaused(!paused)}>{reduced ? 'Movimiento reducido' : paused ? 'Reanudar animación' : 'Pausar animación'}</button>
        <button disabled={!ready || paused || reduced || tiltState === 'pending'} aria-pressed={tiltState === 'on'} onClick={toggleTilt}>{tiltState === 'on' ? 'Desactivar inclinación' : tiltState === 'pending' ? 'Comprobando sensor…' : 'Activar inclinación'}</button>
      </div>
      <p className="status" role="status">{message}</p>
    </footer>
  </>;
}
