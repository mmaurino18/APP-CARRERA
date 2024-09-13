class Participante {
    constructor(nombre, dni, fecha_nacimiento,edad, direccion, ciudad, nro ,id_categoria,id_carrera) {
        this.id;
        this.nombre = nombre;
        this.dni = dni;
        //this.celular = celular;
        this.edad = edad;
        this.fechaNacimiento = new Date(fecha_nacimiento); // Convertir la fecha a objeto Date de JavaScript
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.horaSalida;
        this.horaLlegada;
        this.tiempoCarrera;
        this.posicion;
        this.estado= 'Listo';
        this.diferenciaPrimero;
        this.diferenciaAnterior;
        this.nro = nro;
        this.kmsHora;
        this.id_categoria = id_categoria;
        this.id_carrera =   id_carrera;
        //this.nro = nro;
    }
    iniciarParticipante(){
        this.horaSalida = new Date();
        this.estado = 'Corriendo';
    }
    finalizarParticipante(){
        this.horaLlegada = new Date();
        console.log(this.horaLlegada);
        this.estado = 'Finalizado'
        this.calcularTiempoCarrera();
    }
    finalizarParticipanteForzado(){
        if(this.estado !== 'Finalizado'){
            this.estado = 'No pudo finalizar';
        }
    }
    calcularTiempoCarrera(){
        this.tiempoCarrera = this.horaLlegada - this.horaSalida;
    }
    // Método para obtener la edad del participante
    /*obtenerEdad() {
        const hoy = new Date();
        const edad = hoy.getFullYear() - this.fechaNacimiento.getFullYear();
        const mes = hoy.getMonth() - this.fechaNacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < this.fechaNacimiento.getDate())) {
            return edad - 1;
        }
        return edad;
    }*/

    // Método para mostrar información básica del participante
   
}
module.exports = Participante;
// Ejemplo de uso:
//console.log(`Edad: ${participante.obtenerEdad()} años`);
