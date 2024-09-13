const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const Database = require('./database');
const Carrera = require('./carrera'); // Asegúrate de que la ruta es correcta
const Categoria = require('./categoria');
const Participante = require('./participante');
const { generarYSubirExcel ,authenticateUser, crearYDescargarExcel} = require('./subir_drive');

let db; // Variable para almacenar la instancia de la base de datos

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    win.loadFile('inicio.html');
}

app.whenReady().then(async () => {
    // Crea la instancia de la base de datos y crea la tabla si no existe
    db = new Database();
    const c = new Carrera('jose', '2024-08-29', 'lobos', 2, 2);
    // Asegúrate de que la tabla se crea al iniciar la aplicación
    db.crearTablaCarreras();
    db.crearTablaCategorias();
    db.crearTablaParticipantes();
    console.log(`La carrera ${c.nombre}.`);
    //db.insertarCarrera(c);
    
    createWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => {
    db.cerrarConexion();
});

// Maneja la petición de obtener carreras
ipcMain.handle('get-carreras', async () => {
    try {
        const carreras = await db.getCarreras();
        //console.log(carreras);
        return carreras;
    } catch (err) {
        console.error('Error al obtener las carreras:', err);
        return [];
    }
});
ipcMain.handle('add-carrera', async (event, carreraData) => {
    try {
        // Convertir la fecha a un objeto Date
        const fecha = new Date(carreraData.fecha);

        // Verificar si la conversión fue exitosa
        if (isNaN(fecha.getTime())) {
            throw new Error('Fecha inválida');
        }

        // Crear la instancia de Carrera con la fecha convertida
        const carrera = new Carrera(
            carreraData.nombre,
            fecha,  // Usar el objeto Date
            carreraData.ciudad,
            carreraData.kms,
            carreraData.vueltas
        );

        // Llamar a la función de inserción en la base de datos
        await db.insertarCarrera(carrera);
        console.log('Carrera agregada con éxito:', carreraData);
    } catch (err) {
        console.error('Error al agregar la carrera:', err);
    }
});
ipcMain.handle('get-carrera-by-id', async (event, id) => {
    // Código para obtener una carrera específica por ID
    return await db.getCarreraById(id);
});
ipcMain.handle('iniciar-carrera', async (event, id_carrera) => {
    try {
        const carrera = await db.getCarreraById(id_carrera);
        carrera.iniciarCarrera();
        await db.actualizarCarrera(carrera);
        console.log('Datos de la carrera después de iniciar:', carrera.toString());
        //return { success: true, message: 'Carrera iniciada con éxito' }; // Respuesta opcional
    } catch (error) {
        console.error('Error al iniciar la carrera:', error.message);
        throw new Error('Error al iniciar la carrera');
    }
});



ipcMain.handle('get-categorias', async (event, id) => {
    try {
        //console.log('Obteniendo las categorias');
        const categorias = await db.getCategorias(id);
        //console.log(categorias);
       // console.log(categorias);
        return categorias;
    } catch (err) {
        console.error('Error al obtener las categorias:', err);
        return [];
    }
});
ipcMain.handle('get-participantes', async (event, id) => {
    try {
        //console.error('estoy intento hacer esto:', err);
        const participantes = await db.getParticipantesByCarrera(id);
        //console.log(categorias);
        return participantes;
    } catch (err) {
        console.error('Error al obtener los participantes:', err);
        return [];
    }
});
ipcMain.handle('iniciar-categoria', async (event, id_categoria) => {
    try {
        const categoria = await db.getCategoriaById(id_categoria);
        categoria.iniciarCategoria();
        await db.actualizarCategoria(categoria);
        const participantes = await db.getParticipantesByCategoria(id_categoria);
        //console.log('Datos de los participantes son:', participantes);
        await Promise.all(participantes.map(async (participante) => {
            participante.iniciarParticipante();
            console.log('Iniciando y actualizando:', participante);
            await db.actualizarParticipante(participante); // Aquí se espera correctamente la actualización
        }));
        //console.log('Datos de la carrera después de iniciar:', categoria.toString());
        //return { success: true, message: 'Carrera iniciada con éxito' }; // Respuesta opcional
    } catch (error) {
        console.error('Error al iniciar la carrera:', error.message);
        throw new Error('Error al iniciar la carrera');
    }
});
ipcMain.handle('finalizar-carrera', async (event, id_carrera) => {
    try {
        const carrera = await db.getCarreraById(id_carrera);
        carrera.finalizarCarrera();
        await db.actualizarCarrera(carrera);
        //console.log('Datos de la carrera después de iniciar:', carrera.toString());
        //return { success: true, message: 'Carrera iniciada con éxito' }; // Respuesta opcional
    } catch (error) {
        console.error('Error al finalizar la carrera:', error.message);
        throw new Error('Error al finalizar la carrera');
    }
});

ipcMain.handle('finalizar-participante', async (event, id_participante) => {
    try {
        const participante = await db.getParticipanteById(id_participante);
        console.log('Participante antes de finalizar:', participante);
        
        participante.finalizarParticipante();
        console.log('Participante después de finalizar:', participante);
        
        await db.actualizarParticipante(participante);
        console.log('Actualización completada para el participante:', participante.id);
    } catch (error) {
        console.error('Error al finalizar el participante:', error.message);
        throw new Error('Error al finalizar el participante');
    }
});
ipcMain.handle('finalizar_todos_participantes', async (event, id_carrera) => {
    try {
        const participantes = await db.getParticipantesByCarrera(id_carrera);
        console.log(participantes);
        
        /*await Promise.all(participantes.map(async (participante) => {
            participante.finalizarParticipanteForzado();
            console.log('Finalizado y actualizando:', participante);
            await db.actualizarParticipante(participante); // Aquí se espera correctamente la actualización
        }));*/
        participantes.forEach(participante => {participante
            participante.finalizarParticipanteForzado();
        });
        const carrera = await db.getCarreraById(id_carrera);
        carrera.finalizarCarrera();
        await db.actualizarCarrera(carrera);

        const categorias = await db.getCategorias(id_carrera);
        for (const categoria of categorias) {
            // Obtener los participantes de la categoría actual
            const participantesCategoria = participantes.filter(p => p.id_categoria === categoria.id);

            // Separar los finalizados y no finalizados
            const finalizados = participantesCategoria.filter(p => p.estado === 'Finalizado');
            const noFinalizados = participantesCategoria.filter(p => p.estado === 'No pudo finalizar');

            // Ordenar los finalizados por tiempo de carrera
            finalizados.sort((a, b) => a.tiempoCarrera - b.tiempoCarrera);
            for (let i = 0; i < finalizados.length; i++) {
                console.log('llegue hasta aca');
                if (i === 0) {
                    // El primero no tiene diferencia con nadie
                    finalizados[i].diferenciaPrimero = 0;
                    finalizados[i].diferenciaAnterior = 0;


                } else {
                    console.log('llegue hasta aca 2');
                    let diferenciaPrimero = finalizados[i].tiempoCarrera - finalizados[0].tiempoCarrera;;
                    let diferencia_anterior = finalizados[i].tiempoCarrera - finalizados[i - 1].tiempoCarrera;;
                    // Diferencia con el primero (siempre el primer elemento)
                    console.log(`diferencia primero ${diferenciaPrimero}`);
                    console.log(`diferencia anterior ${diferencia_anterior}`);
                    finalizados[i].diferenciaPrimero = diferenciaPrimero;
                    // Diferencia con el anterior en la lista
                    finalizados[i].diferenciaAnterior = diferencia_anterior;
                }
            const segundosAMinutos =  (Math.floor((finalizados[i].tiempoCarrera / 1000) % 60))/60;
            const minutosAHora = ((Math.floor((finalizados[i].tiempoCarrera / (1000 * 60)) % 60))+segundosAMinutos)/60;
            const horas = (Math.floor((finalizados[i].tiempoCarrera / (1000 * 60 * 60)) % 24)) + minutosAHora;
            const velocidadKmh = carrera.kms / horas;
            finalizados[i].kmsHora = parseFloat(velocidadKmh.toFixed(1));
            }
            const todosParticipantes = [...finalizados, ...noFinalizados];
            // Asignar posiciones
            for (let i = 0; i < todosParticipantes.length; i++) {
                const participante = todosParticipantes[i];
                participante.posicion = i + 1; // Asignar posición
                await db.actualizarParticipante(participante); // Actualizar en la base de datos
            }
        }
    } catch (error) {
        console.error('Error al finalizar los participantes:', error.message);
        throw new Error('Error al finalizar los participantes');
    }
});

ipcMain.on('process-excel', async (event, filePath, id_carrera) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error('El archivo no existe:', filePath);
            event.reply('process-excel-response', { success: false, message: 'El archivo no existe.' });
            return;
        }

        // Leer el archivo Excel
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Supongamos que los datos están en la primera hoja
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Convertir la hoja a un array de arrays

        //console.log('Datos leídos del archivo:', data); // Agregar log para ver el contenido del archivo

        // Iterar sobre las filas, ignorando la primera fila de encabezados
        for (let index = 0; index < data.length; index++) {
            if (index === 0) continue; // Saltar la primera fila de encabezados
            
            const fila = data[index]; // Obtener la fila actual

            // Validar que la fila no esté vacía
            if (!fila || fila.every(cell => !cell || cell.toString().trim() === '')) {
                //console.log(`Fila ${index + 1} está vacía, se omite.`); // Ajustar el índice para mostrar correctamente el número de fila
                continue;
            }

            try {
                // Extracción de cada celda
                const nombre = fila[0] ? fila[0].toString() : '';
                const dni = fila[1] ? parseInt(fila[1], 10) : 0;
                let fecha_nac = null;

                if (fila[2]) {
                    if (typeof fila[2] === 'number') {
                        fecha_nac = new Date(Math.round((fila[2] - 25569) * 86400 * 1000)); // Convertir Excel date a JS Date
                    } else {
                        const fechaString = fila[2].toString();
                        const [day, month, year] = fechaString.split('/').map(Number);
                        fecha_nac = new Date(year, month - 1, day);
                    }
                }

                const edad = fila[3] ? parseInt(fila[3], 10) : 0;
                const direccion = fila[4] ? fila[4].toString() : '';
                const ciudad = fila[5] ? fila[5].toString() : '';
                const nombre_cat = fila[6] ? fila[6].toString() : '';
                const nro = fila[7] ? parseInt(fila[7], 10) : 0;
                let nombre_genero = '';

                if (nombre_cat.toLowerCase().includes('damas')) {
                    nombre_genero = 'Femenino';
                } else {
                    nombre_genero = 'Masculino';
                }

                // Crear y guardar la categoría
                const categoria = new Categoria(nombre_cat, nombre_genero, id_carrera);
                let id_categoria = await db.getIdByCategoria(categoria); // Verifica si existe la categoría

                // Si la categoría no existe, insertar primero la categoría
                if (id_categoria == -1) {
                    id_categoria = await db.insertarCategoria(categoria, id_carrera);
                }

                // Verifica que id_categoria sea válido después de la inserción
                if (id_categoria != -1) {
                    const participante = new Participante(nombre, dni, fecha_nac, edad, direccion, ciudad, nro,id_categoria,id_carrera);
                    await db.insertarParticipante(participante, id_categoria);
                } else {
                    console.error('Error al insertar la categoría. ID no válido.');
                }

            } catch (innerError) {
                console.error(`Error processing row ${index + 1}: ${innerError.message}`);
            }
            console.log('----------------------------------------------------------------------------------------');
        }

        // Enviar respuesta exitosa
        event.reply('process-excel-response', { success: true });

    } catch (error) {
        // Manejo de errores generales
        event.reply('process-excel-response', { success: false, message: error.message });
    }
});
ipcMain.handle('upload-to-drive', async (event,id_carrera) => {
    try {
        const carrera = await db.getCarreraById(id_carrera);
        const categorias = await db.getCategorias(id_carrera);
        const participantes = await db.getParticipantesByCarrera(id_carrera);
        const auth = await authenticateUser();
        await generarYSubirExcel(auth,carrera, categorias, participantes);
        return { success: true };
    } catch (error) {
        console.error('Error al generar y subir el Excel:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('download-statistics', async (event,id_carrera) => {
    try {
        const carrera = await db.getCarreraById(id_carrera);
        const categorias = await db.getCategorias(id_carrera);
        const participantes = await db.getParticipantesByCarrera(id_carrera);
        crearYDescargarExcel(carrera, categorias, participantes);
        return { success: true };
    } catch (error) {
        console.error('Error al generar y subir el Excel:', error);
        return { success: false, message: error.message };
    }
});






