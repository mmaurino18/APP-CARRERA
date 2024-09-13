const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const { BrowserWindow } = require('electron');
const xlsx = require('xlsx');
const os = require('os');
const { Readable } = require('stream');

// Definir los alcances necesarios para la API de Google Drive
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Cargar las credenciales desde el archivo JSON descargado
function loadCredentials() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));
}

// Función para autenticar al usuario
function authenticateUser() {
  const credentials = loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Siempre mostrar la ventana de autenticación para elegir cuenta
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'online', // Cambiado a 'online' para que pida cuenta cada vez
      prompt: 'select_account', // Forzar selección de cuenta
      scope: SCOPES,
    });

    // Crear una ventana para que el usuario inicie sesión en Google
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'), // Asegúrate de que la ruta sea correcta
      },
    });

    // Cargar la URL de autenticación de Google
    authWindow.loadURL(authUrl);

    // Escuchar cambios en la URL para capturar el código de autorización
    authWindow.webContents.on('will-redirect', (event, url) => {
      const code = new URL(url).searchParams.get('code');
      if (code) {
        // Intercambiar el código por un token de acceso
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return reject('Error al obtener el token de acceso.');
          oAuth2Client.setCredentials(token);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
          authWindow.close();
          resolve(oAuth2Client);
        });
      }
    });

    authWindow.on('closed', () => reject('Ventana de autenticación cerrada.')); // Manejar el caso en que el usuario cierra la ventana
  });
}

// Función para generar un archivo Excel y subirlo a Google Drive
async function generarYSubirExcel(auth, carrera, categorias, participantes) {
  const workbook = xlsx.utils.book_new();
  const sheetCategorias = generarDatosCategorias(categorias, participantes);
  xlsx.utils.book_append_sheet(workbook, sheetCategorias, `Ranking de categorías`);

  // Crear el buffer del archivo Excel
  const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Subir el archivo Excel a Google Drive
  await subirArchivoDrive(auth, excelBuffer, `${carrera.nombre}_archivo.xlsx`);
}
function crearYDescargarExcel(carrera,categorias, participantes) {
  // Generar los datos para las categorías y participantes
  const hojaDeDatos = generarDatosCategorias(categorias, participantes);

  // Crear un nuevo libro de Excel
  const workbook = xlsx.utils.book_new();

  // Agregar la hoja generada al libro de Excel
  xlsx.utils.book_append_sheet(workbook, hojaDeDatos, 'Resultados');

  // Obtener la ruta del escritorio del usuario
  const rutaEscritorio = path.join(os.homedir(), 'Desktop');
  
  // Definir la ruta completa donde se guardará el archivo Excel en el escritorio
  const rutaArchivo = path.join(rutaEscritorio, `${carrera.nombre}_archivo.xlsx`);

  // Escribir el libro en la ruta especificada
  xlsx.writeFile(workbook, rutaArchivo);

  console.log(`Archivo Excel creado exitosamente en: ${rutaArchivo}`);
}
// Función para generar datos de categorías y participantes en formato de hoja de Excel
function generarDatosCategorias(categorias, participantes) {
  const data = [];
  categorias.forEach((categoria) => {
    data.push([`Categoría: ${categoria.nombre}`]);
    data.push([]);
    const headers = ['Pos.', 'Nro', 'Nombre', 'Ciudad', 'tm Final', 'Km/h', 'Dif.Ant.', 'Dif.1°'];
    data.push(headers);

    const participantesCategoria = participantes.filter(p => p.id_categoria === categoria.id);
    participantesCategoria.sort((a, b) => a.posicion - b.posicion);

    participantesCategoria.forEach((participante) => {
      const row = [
        participante.posicion,
        participante.nro,
        participante.nombre,
        participante.ciudad,
        msToTime(participante.tiempoCarrera),  // Convertir tiempo de carrera a hh:mm:ss
        participante.kmsHora || 'No finalizo',
        participante.posicion === 1 ? '-' : msToTime(participante.diferenciaAnterior),  // Convertir diferencia con anterior
        participante.posicion === 1 ? '-' : msToTime(participante.diferenciaPrimero)   // Convertir diferencia con primero
      ];
      data.push(row);
    });
    data.push([], []);
  });

  return xlsx.utils.aoa_to_sheet(data);
}

function msToTime(ms) {
  if (ms === 'No finalizo' || ms == null) return 'No finalizo'; // Caso especial si el participante no finalizó
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const formattedTime = [hours, minutes, seconds]
    .map(unit => String(unit).padStart(2, '0'))
    .join(':');

  return formattedTime;
}

// Función para subir el archivo a Google Drive usando el buffer generado
async function subirArchivoDrive(auth, buffer, nombreArchivo) {
  const drive = google.drive({ version: 'v3', auth });
  const bufferStream = new Readable();
  bufferStream.push(buffer);
  bufferStream.push(null);

  try {
    const response = await drive.files.create({
      requestBody: {
        name: nombreArchivo,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: bufferStream,
      },
      fields: 'id',
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader', // Permiso de lectura
        type: 'anyone', // Cualquiera con el enlace puede acceder
      },
    });

    console.log('Archivo subido correctamente, ID del archivo:', response.data.id);
    console.log(`El archivo es público y se puede acceder desde: https://drive.google.com/file/d/${response.data.id}/view`);
  } catch (error) {
    console.error('Error al subir el archivo a Google Drive:', error);
    throw new Error('Error al subir el archivo a Google Drive.');
  }
}

module.exports = { authenticateUser, generarYSubirExcel ,crearYDescargarExcel};






// Manejar el evento de subida de archivos desde el renderer



