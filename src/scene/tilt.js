export async function requestTilt(onChange) {
  if (!window.isSecureContext || !window.DeviceOrientationEvent) {
    return { message: 'La inclinación no está disponible. Puedes seguir explorando con el scroll.' };
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') return { message: 'Sin permiso de sensores. El scroll sigue funcionando.' };
    }
    return await new Promise(resolve => {
      let baseline = null;
      const stop = () => {
        clearTimeout(timeout);
        window.removeEventListener('deviceorientation', handle);
        window.removeEventListener('orientationchange', reset);
      };
      const reset = () => { baseline = null; };
      function handle(event) {
        if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
        if (!baseline) baseline = { beta: event.beta, gamma: event.gamma };
        const clamp = value => Math.max(-1, Math.min(1, value / 25));
        const dx = clamp(event.gamma - baseline.gamma), dy = clamp(event.beta - baseline.beta);
        const angle = (screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
        onChange(dx * Math.cos(angle) + dy * Math.sin(angle), dy * Math.cos(angle) - dx * Math.sin(angle));
        clearTimeout(timeout);
        resolve({ stop, message: 'Inclinación activada. Mueve suavemente el teléfono.' });
      }
      const timeout = setTimeout(() => {
        stop();
        resolve({ message: 'No se recibieron datos del sensor. El scroll sigue funcionando.' });
      }, 2500);
      window.addEventListener('deviceorientation', handle);
      window.addEventListener('orientationchange', reset);
    });
  } catch {
    return { message: 'No se pudo activar la inclinación. El scroll sigue funcionando.' };
  }
}
