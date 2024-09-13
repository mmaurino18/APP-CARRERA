const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getCarreras: () => ipcRenderer.invoke('get-carreras'),
    getCategorias: (id) => ipcRenderer.invoke('get-categorias', id),
    getParticipantes: (id) => ipcRenderer.invoke('get-participantes', id),
    saveRace: (carrera) => ipcRenderer.invoke('add-carrera', carrera),
    getCarreraPorId:(id)=> ipcRenderer.invoke('get-carrera-by-id', id),
    iniciarCarrera:(id)=> ipcRenderer.invoke('iniciar-carrera', id),
    finalizarCarrera:(id)=> ipcRenderer.invoke('finalizar-carrera', id),
    iniciarCategoria:(id)=> ipcRenderer.invoke('iniciar-categoria', id),
    finalizarParticipante:(id_participante) => ipcRenderer.invoke('finalizar-participante', id_participante),
    finalizarTodosParticipantes:(id_carrera) => ipcRenderer.invoke('finalizar_todos_participantes', id_carrera),
    processExcel: (filePath, id_carrera) => ipcRenderer.send('process-excel', filePath, id_carrera),
    onProcessExcelResponse: (callback) => ipcRenderer.on('process-excel-response', (event, response) => callback(response)),
    uploadToDrive: (id_carrera) => ipcRenderer.invoke('upload-to-drive', id_carrera),
    downloadStatistics: (id_carrera) => ipcRenderer.invoke('download-statistics', id_carrera)
});
