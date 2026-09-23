import React, { useEffect, useRef, useState } from 'react';
import { sections, services, projects, profile } from './content.js';
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
      <a className="brand" href="#inicio" aria-label="Volver al inicio">R<span> / </span>H</a>
      <nav aria-label="Navegación principal">
        <a href="#servicios">Servicios</a><a href="#contacto">Contacto</a>
      </nav>
    </header>
    <main id="contenido">
      {sections.map((section, index) => <section className="section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
        <div className="section-content">
          <p className="eyebrow">{section.label}</p>
          {index === 0 ? <h1 id={`${section.id}-title`}>{section.title}</h1> : <h2 id={`${section.id}-title`}>{section.title}</h2>}
          {section.description && (<p className="section-description">{section.description}</p>
)}
          {index === 0 && <div className="hero-actions"><a className="button" href="#contacto">Cuéntame qué necesitas ↗</a><a className="text-link" href="#servicios">Ver servicios ↓</a></div>}
          {section.id === 'servicios' && <div className="service-grid">{services.map(service => <article className="service-card" key={service.title}><h3>{service.title}</h3><p>{service.description}</p><p className="detail">{service.detail}</p></article>)}</div>}
          {section.id === 'proyectos' && projects.length > 0 && <div className="service-grid">{projects.map(project => <article className="service-card" key={project.title}>
            {project.image && <img className="project-image" src={`${import.meta.env.BASE_URL}${project.image}`} alt={project.imageAlt || `Captura de ${project.title}`} loading="lazy" decoding="async" width="1600" height="1000" />}
            <h3>{project.title}</h3><p>{project.description}</p>{/^https:\/\//.test(project.url || '') && <a href={project.url} target="_blank" rel="noreferrer">Ver proyecto ↗</a>}
          </article>)}</div>}
          {section.id === 'contacto' && <div className="hero-actions">{profile.email && <a className="button" href={`mailto:${profile.email}`}>Contactar por correo ↗</a>}{!profile.whatsapp && !profile.email && <p>Datos de contacto próximamente.</p>}</div>}
          {index > 0 && <span className="section-line" aria-hidden="true" />}
        </div>
        <span className="section-count" aria-hidden="true">0{index + 1} / {String(sections.length).padStart(2, '0')}</span>
      </section>)}
    </main>
    <footer>
      <span>{profile.name}</span>
      <div className="motion-controls">
        <button disabled={!ready || reduced || tiltState === 'pending'} aria-pressed={paused || reduced} onClick={() => setPaused(!paused)}>{reduced ? 'Movimiento reducido' : paused ? 'Reanudar animación' : 'Pausar animación'}</button>
        <button disabled={!ready || paused || reduced || tiltState === 'pending'} aria-pressed={tiltState === 'on'} onClick={toggleTilt}>{tiltState === 'on' ? 'Desactivar inclinación' : tiltState === 'pending' ? 'Comprobando sensor…' : 'Activar inclinación'}</button>
      </div>
      <p className="status" role="status">{message}</p>
    </footer>
    {profile.whatsapp && <a className="whatsapp-floating" href={profile.whatsapp} aria-label="Contactar por WhatsApp" title="Contactar por WhatsApp">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z"/><path d="M8 7.5c-.9 1-.3 3.4 1.7 5.4s4.4 2.6 5.4 1.7l.9-1.1-2.5-1.3-.9.9a7.2 7.2 0 0 1-2.7-2.7l.9-.9L9.5 7Z"/></svg>
    </a>}
  </>;
}


