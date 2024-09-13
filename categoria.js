class Categoria {
    constructor(nombre, genero, id) {
        this.id = -1;
        this.nombre = nombre;
        this.genero = genero
        //this.participantes = [];
        this.comenzo= false;
        this.id_carrera = id ;// Inicializamos la lista de participantes como un array vacío
    }
    iniciarCategoria(){
        this.comenzo = true;
    }
    // Método para agregar un participante a la categoría
    // Método para obtener todos los participantes en la categoría
    

    // Método para mostrar información de la categoría
    mostrarInfo() {
        return `Categoría: ${this.nombre}, Cantidad de participantes: ${this.participantes.length}`;
    }
}
module.exports = Categoria;
// Ejemplo de uso:
/*const categoria = new Categoria('Elite');
console.log(categoria.mostrarInfo());

// Suponiendo que ya tienes una instancia de `Participante` llamada `participante`:
// categoria.agregarParticipante(participante);
console.log(categoria.obtenerParticipantes());*/
