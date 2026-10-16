export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function sanitizeFilename(name) {
  if (!name) return '';
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 80);
}

export function buildFilename({ deviceName, appName, projectName, lang }) {
  const parts = [];
  if (deviceName) parts.push(sanitizeFilename(deviceName));
  if (appName) parts.push(sanitizeFilename(appName));
  if (projectName) parts.push(sanitizeFilename(projectName));
  if (lang) parts.push(sanitizeFilename(lang));
  return parts.join('_') + '.png';
}

export function isOnline() {
  return navigator.onLine;
}

export function hashFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
      }
      resolve(Math.abs(hash).toString(16) + '_' + Date.now());
    };
    reader.readAsArrayBuffer(file);
  });
}

export function getTimestamp() {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}