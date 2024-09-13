const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const Carrera = require('./carrera');
const Categoria = require('./categoria'); // Asegúrate de que la ruta es correcta
const Participante = require('./participante');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'carreras.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error al conectar a la base de datos:', err.message);
            } else {
                console.log('Conectado a la base de datos SQLite.');
                this.crearTablaCarreras(); // Asegúrate de crear la tabla al iniciar
            }
        });
    }

    crearTablaCarreras() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS carreras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                fecha TEXT,
                ciudad TEXT,
                kms REAL,
                vueltas INTEGER,
                estado TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla de carreras:', err.message);
            } else {
                console.log('Tabla de carreras lista.');
            }
        });
    }

    insertarCarrera(carrera) {
        console.log('llegue hasta aca');
        const insertCarrera = `INSERT INTO carreras (nombre, fecha, ciudad, kms, vueltas, estado) VALUES (?, ?, ?, ?, ?, ?)`;
        const fechaFormateada = carrera.fecha.toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
        console.log('llegue hasta aca 2');
        return new Promise((resolve, reject) => {
            this.db.run(insertCarrera, [carrera.nombre, fechaFormateada, carrera.ciudad, carrera.kms, carrera.vueltas, carrera.estado], function (err) {
                console.log('llegue hasta aca 3');
                if (err) {
                    console.error('Error al insertar la carrera:', err.message);
                    reject(err);
                } else {
                    console.log('Carrera insertada con éxito.');
                    resolve(this.lastID); // Retorna el ID de la última carrera insertada
                }
            });
        });
    }
    actualizarCarrera(carrera) {
        if (carrera.id === undefined) {
            return Promise.reject(new Error('El ID de la carrera no está definido.'));
        }
        const updateSql = `UPDATE carreras SET nombre = ?, fecha = ?, ciudad = ?, kms = ?, vueltas = ?, estado = ? WHERE id = ?`;
        const fechaFormateada = carrera.fecha.toISOString().split('T')[0];
    
        return new Promise((resolve, reject) => {
            this.db.run(updateSql, [carrera.nombre, fechaFormateada, carrera.ciudad, carrera.kms, carrera.vueltas, carrera.estado, carrera.id], function (err) {
                if (err) {
                    console.error('Error al actualizar la carrera:', err.message);
                    reject(err);
                } else {
                    console.log('Carrera actualizada con éxito.');
                    console.log('Filas afectadas:', this.changes);
                    resolve(this.changes); // Retorna el número de filas afectadas
                }
            });
        });
    }
    
    getCarreras() {
        const select = `SELECT id, nombre, fecha, ciudad, kms, vueltas, estado FROM carreras`;
        return new Promise((resolve, reject) => {
            this.db.all(select, [], (err, rows) => {
                if (err) {
                    console.error('Error al obtener las carreras:', err.message);
                    reject(err);
                } else {
                    try {
                        const carreras = rows.map(row => {
                            const carrera = new Carrera(
                                row.nombre,
                                new Date(row.fecha), // Convertir a objeto Date
                                row.ciudad,
                                row.kms,
                                row.vueltas
                            );
                            carrera.estado = row.estado;
                            carrera.id = row.id;
                            return carrera;
                        });
                        resolve(carreras);
                    } catch (error) {
                        console.error('Error al mapear las carreras:', error.message);
                        reject(error);
                    }
                }
            });
        });
    }
    getCarreraById(id) {
        const selectSql = `SELECT * FROM carreras WHERE id = ?`;
        return new Promise((resolve, reject) => {
            this.db.get(selectSql, [id], (err, row) => {
                if (err) {
                    console.error('Error al obtener la carrera:', err.message);
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    // Crear una instancia de Carrera a partir del resultado
                    const carrera = new Carrera(row.nombre, row.fecha, row.ciudad, row.kms, row.vueltas);
                    carrera.id = row.id;
                    carrera.estado = row.estado;
                    resolve(carrera);
                }
            });
        });
    }
    crearTablaCategorias(){
        this.db.run(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                genero TEXT,
                comenzo BOOLEAN,
                id_carrera INTEGER
            )
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla de categorias:', err.message);
            } else {
                console.log('Tabla de categorias lista.');
            }
        });
    }
    insertarCategoria(categoria,id_carrera){
        const insertCategoria = `INSERT INTO categorias (nombre, genero,comenzo, id_carrera) VALUES (?, ?, ?, ?)`;
        return new Promise((resolve, reject) => {
            this.db.run(insertCategoria, [categoria.nombre, categoria.genero,categoria.comenzo,id_carrera], function (err) {
                if (err) {
                    console.error('Error al insertar la categoria:', err.message);
                    reject(err);
                } else {
                    console.log('Categoria insertada con éxito.');
                    resolve(this.lastID); // Retorna el ID de la última carrera insertada
                }
            });
        });
    }
    actualizarCategoria(categoria) {
        if (categoria.id === undefined) {
            return Promise.reject(new Error('El ID de la carrera no está definido.'));
        }
        const updateSql = `UPDATE categorias SET nombre = ?, genero = ?, comenzo = ?, id_carrera = ? WHERE id = ?`;
    
        return new Promise((resolve, reject) => {
            this.db.run(updateSql, [categoria.nombre, categoria.genero, categoria.comenzo,categoria.id_carrera, categoria.id], function (err) {
                if (err) {
                    console.error('Error al actualizar la categoria:', err.message);
                    reject(err);
                } else {
                    console.log('Categoria actualizada con éxito.');
                    console.log('Filas afectadas:', this.changes);
                    resolve(this.changes); // Retorna el número de filas afectadas
                }
            });
        });
    }
    getCategorias(id){
        const select = `SELECT * FROM categorias WHERE id_carrera = ?`
        return new Promise((resolve, reject) => {
            this.db.all(select, [id], (err, rows) => {
                if (err) {
                    console.error('Error al obtener las categorias:', err.message);
                    reject(err);
                } else {
                    try {
                        const categorias = rows.map(row => {
                            const categoria = new Categoria(
                                row.nombre,
                                row.genero, // Convertir a objeto Date
                                id
                            );
                            categoria.comenzo = row.comenzo;
                            categoria.id = row.id;
                            return categoria;
                        });
                        resolve(categorias);
                    } catch (error) {
                        console.error('Error al mapear las categorias:', error.message);
                        reject(error);
                    }
                }
            });
        });
    }
    getCategoriaById(id){
        const select = `SELECT * FROM categorias WHERE id = ?`
        return new Promise((resolve, reject) => {
            this.db.get(select, [id], (err, row) => {
                if (err) {
                    console.error('Error al obtener la categoria:', err.message);
                    reject(err);
                } else if (!row) {
                    console.log('No se encontró ninguna categoria con los datos proporcionados.');
                    resolve(null);
                } else {
                    const categoria = new Categoria(
                        row.nombre,
                        row.genero,
                        row.id_carrera,
                    );
                    categoria.comenzo = row.comenzo;
                    categoria.id = id;
                    resolve(categoria);
                }
            });
        });
    }
    getIdByCategoria(categoria) {
        const select = `SELECT id FROM categorias WHERE nombre = ? AND genero = ? AND id_carrera = ?`;
        return new Promise((resolve, reject) => {
            this.db.get(select, [categoria.nombre, categoria.genero, categoria.id_carrera], (err, row) => {
                if (err) {
                    // Manejo de error en la consulta SQL
                    console.error('Error al obtener la categoria:', err.message);
                    reject(err); // Rechaza la promesa con el error
                } else if (!row) {
                    // Si no se encuentra ninguna fila, devolver -1
                    console.log('No se encontró ninguna categoria con los datos proporcionados.');
                    resolve(-1); // Indica que la categoría no existe
                } else {
                    // Si se encuentra la categoría, devuelve el id
                    resolve(row.id);
                }
            });
        });
    }
    

    crearTablaParticipantes(){
        this.db.run(`
            CREATE TABLE IF NOT EXISTS participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                dni INTEGER,
                fecha_nacimiento TEXT,
                edad INTEGER,
                direccion TEXT,
                ciudad TEXT,
                hora_salida TEXT,
                hora_llegada TEXT,
                tiempo_carrera INTEGER,
                posicion INTEGER,
                estado TEXT,
                diferencia_primero INTEGER,
                diferencia_anterior INTEGER,
                nro INTEGER,
                kms_hora REAL,
                id_categoria INTEGER,
                id_carrera INTEGER
            )
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla de participantes:', err.message);
            } else {
                console.log('Tabla de participantes lista.');
            }
        });
    }

    insertarParticipante(participante){
        console.log(participante.nombre);
        const insertParticipante = `INSERT INTO participantes (nombre, dni, fecha_nacimiento, edad, direccion, ciudad,estado, nro,id_categoria,id_carrera) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const fechaFormateada = participante.fechaNacimiento.toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
        return new Promise((resolve, reject) => {
            this.db.run(insertParticipante, [participante.nombre, participante.dni, fechaFormateada, participante.edad, participante.direccion, participante.ciudad, participante.estado, participante.nro,participante.id_categoria,participante.id_carrera], function (err) {
                if (err) {
                    console.error('Error al insertar el participante:', err.message);
                    reject(err);
                } else {
                    console.log('Participante insertado con éxito.');
                    resolve(this.lastID); // Retorna el ID de la última carrera insertada
                }
            });
        });
    }
    actualizarParticipante(participante) {
        if (participante.id === undefined) {
            return Promise.reject(new Error('El ID del participante no está definido.'));
        }
        const updateSql = `UPDATE participantes SET nombre = ?, dni = ?, fecha_nacimiento = ?, edad = ?, direccion = ?, ciudad = ?, hora_salida = ?, hora_llegada = ?, tiempo_carrera = ?, posicion = ?, estado = ?, diferencia_primero = ?, diferencia_anterior = ?, nro = ?, kms_hora = ?, id_categoria = ? WHERE id = ?`;
        const fechaFormateada = participante.fechaNacimiento.toISOString().split('T')[0];
        const convertirFecha = (fecha) => {
            if (!fecha) return null;
            if (fecha instanceof Date && !isNaN(fecha)) return fecha.toISOString();
            if (typeof fecha === 'string') {
                const parsedDate = new Date(fecha);
                return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
            }
            return null;
        };
        
        const horaSalida = convertirFecha(participante.horaSalida);
        const horaLlegada = convertirFecha(participante.horaLlegada);
        
        /*console.log('Hora de salida:', horaSalida);
        console.log('Hora de llegada:', horaLlegada);*/
        
    
        return new Promise((resolve, reject) => {
            this.db.run(updateSql, [
                participante.nombre, 
                participante.dni, 
                fechaFormateada, 
                participante.edad, 
                participante.direccion, 
                participante.ciudad, 
                horaSalida, 
                horaLlegada, 
                participante.tiempoCarrera, 
                participante.posicion, // Añadir el campo 'posicion' que parece estar faltando en tu código original
                participante.estado, 
                participante.diferenciaPrimero, 
                participante.diferenciaAnterior, 
                participante.nro,
                participante.kmsHora,
                participante.id_categoria, 
                participante.id
            ], function (err) {
                if (err) {
                    console.error('Error al actualizar el participante:', err.message);
                    reject(err);
                } else {
                    console.log('Participante actualizado con éxito.');
                    console.log('Filas afectadas:', this.changes);
                    resolve(this.changes); // Retorna el número de filas afectadas
                }
            });
        });
    }
    getParticipantesByCategoria(id_categoria){
        const select = `SELECT * FROM participantes WHERE id_categoria = ?`
        return new Promise((resolve, reject) => {
            this.db.all(select, [id_categoria], (err, rows) => {
                if (err) {
                    console.error('Error al obtener los participantes:', err.message);
                    reject(err);
                } else {
                    try {
                        const participantes = rows.map(row => {
                            const participante = new Participante(
                                row.nombre,
                                row.dni,
                                row.fecha_nacimiento,
                                row.edad,
                                row.direccion,
                                row.ciudad,
                                row.nro,
                                id_categoria,
                                row.id_carrera
                            );
                            participante.horaSalida= row.hora_salida ? new Date(row.hora_salida) : null;
                            participante.horaLlegada = row.hora_llegada ? new Date(row.hora_llegada) : null;
                            participante.tiempoCarrera = row.tiempo_carrera
                            participante.posicion = row.posicion;
                            participante.estado = row.estado;
                            participante.diferenciaPrimero = row.diferencia_primero;
                            participante.diferenciaAnterior = row.diferencia_anterior;
                            participante.id = row.id;
                            participante.kmsHora = row.kms_hora;
                            return participante;
                        });
                        resolve(participantes);
                    } catch (error) {
                        console.error('Error al mapear los participantes:', error.message);
                        reject(error);
                    }
                }
            });
        });
    }
    getParticipantesByCarrera(id_carrera){
        const select = `SELECT * FROM participantes WHERE id_carrera = ?`
        return new Promise((resolve, reject) => {
            this.db.all(select, [id_carrera], (err, rows) => {
                if (err) {
                    console.error('Error al obtener los participantes:', err.message);
                    reject(err);
                } else {
                    try {
                        const participantes = rows.map(row => {
                            const participante = new Participante(
                                row.nombre,
                                row.dni,
                                row.fecha_nacimiento,
                                row.edad,
                                row.direccion,
                                row.ciudad,
                                row.nro,
                                row.id_categoria,
                                id_carrera
                            );
                            participante.horaSalida= row.hora_salida ? new Date(row.hora_salida) : null;
                            participante.horaLlegada = row.hora_llegada ? new Date(row.hora_llegada) : null;
                            participante.tiempoCarrera = row.tiempo_carrera
                            participante.posicion = row.posicion;
                            participante.estado = row.estado;
                            participante.diferenciaPrimero = row.diferencia_primero;
                            participante.diferenciaAnterior = row.diferencia_anterior;
                            participante.id = row.id;
                            participante.kmsHora = row.kms_hora;
                            return participante;
                        });
                        resolve(participantes);
                    } catch (error) {
                        console.error('Error al mapear los participantes:', error.message);
                        reject(error);
                    }
                }
            });
        });
    }
    getParticipanteById(id_participante){
        const select = `SELECT * FROM participantes WHERE id = ?`
        return new Promise((resolve, reject) => {
            this.db.get(select, [id_participante], (err, row) => {
                if (err) {
                    console.error('Error al obtener los participantes:', err.message);
                    reject(err);
                } else {
                    try {
                        const participante = new Participante(
                            row.nombre,
                            row.dni,
                            row.fecha_nacimiento,
                            row.edad,
                            row.direccion,
                            row.ciudad,
                            row.nro,
                            row.id_categoria,
                            row.id_carrera
                        );
                        participante.horaSalida= row.hora_salida ? new Date(row.hora_salida) : null;
                        participante.horaLlegada = row.hora_llegada ? new Date(row.hora_llegada) : null;
                        participante.tiempoCarrera = row.tiempo_carrera
                        participante.posicion = row.posicion;
                        participante.estado = row.estado;
                        participante.diferenciaPrimero = row.diferencia_primero;
                        participante.diferenciaAnterior = row.diferencia_anterior;
                        participante.id = id_participante;
                        participante.kmsHora = row.kms_hora;
                        resolve(participante);
                    } catch (error) {
                        console.error('Error al mapear el participante:', error.message);
                        reject(error);
                    }
                }
            });
        });
    }
    cerrarConexion() {
        this.db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos:', err.message);
            } else {
                console.log('Conexión a la base de datos cerrada.');
            }
        });
    }
}


module.exports = Database;
