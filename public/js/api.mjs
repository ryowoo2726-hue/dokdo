// Local previews proxy the API on the same origin; Pages uses the laptop tunnel.
export const apiBase=['localhost','127.0.0.1','[::1]'].includes(location.hostname)
  ? ''
  : 'https://dokdo-api.sangsangbar.com';
