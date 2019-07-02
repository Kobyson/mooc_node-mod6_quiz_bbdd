
const Sequelize = require('sequelize');
// const Op = Sequelize.Op;

//quizzes Nombre del BBDD donde se almacenan las preguntas.

const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});
/**
* Definiciion de la BBDD, tabla (modelo de datos) quiz
* los columnas question y answer ambos de timpo string y no pueden estar vacias
* las preguntas deben se unicas
*/

sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        unique: {msg: "Ya existe esta pregunta"},
        validate: {notEmpty: {msg: "La pregunta no puede estar vacia"}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg:"La respuesta no puede estar vacia"}}
    }
});

/*
/ se guarda la BBDD syncronizando, si no existen regisgtro,
/ se crean los registros iniciales con el metodo bulkCreate
/ con las preguntas inciales
*/
sequelize.sync()
.then(()=> sequelize.models.quiz.count())
.then( count => {
    if (!count){
        return sequelize.models.quiz.bulkCreate([
            {question: "Capital de Italia", answer: "Roma"},
            {question: "Capital de Francia", answer: "París"},
            {question: "Capital de España", answer: "Madrid"},
            {question: "Capital de Portugal", answer: "Lisboa"}
        ]);
    }
})
.catch(error => {
    console.log(error);
});

module.exports=sequelize;
