class Carrera {
    constructor(nombre, fecha, ciudad, kms, vueltas) {
        this.id = -1;
        this.nombre = nombre;
        this.fecha = new Date(fecha); // Convertir la fecha a objeto Date de JavaScript
        this.ciudad = ciudad;
        this.kms = kms;
        this.vueltas = vueltas;
        //this.participantes = [];
        this.categorias = [];
        this.estado = 'Creada'; // Asumimos que Estado es una cadena en lugar de una enumeración
        //this.cronometrajeVueltas = cronometrajeVueltas;
       // this.carreraDb = null; // Inicializar con null o un objeto adecuado
    }
    toString() {
        return `Carrera:
        ID: ${this.id}
        Nombre: ${this.nombre}
        Fecha: ${this.fecha.toISOString().split('T')[0]}
        Ciudad: ${this.ciudad}
        Kms: ${this.kms}
        Vueltas: ${this.vueltas}
        Estado: ${this.estado}
        Categorías: ${this.categorias.length}`;
    }

    iniciarCarrera() {
        if (this.estado === 'Creada') {
            this.estado = 'En Proceso';
            console.log(`La carrera ${this.nombre} ha comenzado.`);
        } else {
            console.log('La carrera ya está en proceso o ha finalizado.');
        }
    }

    finalizarCarrera() {
        if (this.estado === 'En Proceso') {
            this.estado = 'Finalizada';
            console.log(`La carrera ${this.nombre} ha finalizado.`);
        } else {
            console.log('La carrera no se puede finalizar en su estado actual.');
        }
    }


    // Otros métodos pueden ser añadidos según sea necesario.
}
module.exports = Carrera;
// Ejemplo de uso:
/*const carrera = new Carrera('Gran Fondo', '2024-01-05', 'Palo Alto', 100, 3, true);
carrera.agregarParticipante({ nombre: 'Juan Pérez', dni: '12345678' });
carrera.iniciarCarrera();
carrera.finalizarCarrera();*/
