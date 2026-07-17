/**
 * Electron Preload Bridge — Secure IPC communication
 *
 * Exposes safe desktop utilities to the web app (`window.electronAPI`),
 * allowing native file saving, external URL opening, and platform detection
 * without exposing raw Node.js APIs to renderer code.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  exportFile: (options) => ipcRenderer.invoke('export-file', options),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  checkServerHealth: () => ipcRenderer.invoke('check-server-health'),
});
