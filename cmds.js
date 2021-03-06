
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");

//se importa y se alamacena en model, la propiedad models de sequelize
const {models} = require('./model');


/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
    // se usa la funcion findAll que es una promesa y se devuelve un arreglo con todos los registros
    // se itera con la funcion each incluida en sequelize en los ellemtos del arreglo quiz
    models.quiz.findAll()
    .each(quiz=>{
            log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
        })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Esta funcion devuelve una promesa que:
 * -valida que se ha introducido un valor para el parametro
 * -convierte el parametro en un numero entero.
 * si todo va bien, la promesa se satisface y devuelve el valor id a usar
 *
 * @parm id Parametro con indice a validar
 */
const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined"){
            reject( new Error (`Falta el parametro <id>.`) );
        }else {
            id = parseInt(id);
            if (Number.isNaN(id)){
                reject(new Error(`El Valor del parametro <id> no es un numero.`));
            }else {
                resolve(id);
            }
        }
    });
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {

    validateId(id)
    .then(id => models.quiz.findByPk(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });
};
/**
 * esta funcion convierte la llamaa rl.question que esta basada en callbacks en una basada
 * en promesas.
 * esta funcion devuelve una funcion que cuando se cumple, proporciona el texo introduccido
 * entonce la llamda a .then que hay que hacer la promesa devuelta sera
 *      .then(answer => {...})
 * tambien colerea en rojo el texto de la pregunta y elimina espacios al inicio y final
 * @param rl Objeto readline usado para implementar CLI.
 * @param text Pregunta que hay que hacer al usuario.
 */
const makeQuestion=(rl, text) => {

    return new Sequelize.Promise((resolve, reject)=>{
        rl.question(colorize(text, 'red'),answer=> {
            resolve(answer.trim());
        });
    });
};

/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

    makeQuestion(rl, ' Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion(rl, ' Introduzca la respuesta ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then(quiz => {
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });
};


/**
 * Borra un quiz del modelo.
 * se adiciona validacion de existencia de Quiz, antes de borrar
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {

    validateId(id)
    .then(id=>models.quiz.findByPk(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        models.quiz.destroy({where: {id}});
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=>{
        rl.prompt();
    });
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {

    validateId(id)
    .then(id=>models.quiz.findByPk(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        return makeQuestion(rl,' Introduzca la pregunta: ')
        .then(q=>{
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
            return makeQuestion(rl,' Introduzca la respuesta: ')
            .then(a=>{
                quiz.question=q;
                quiz.answer=a;
                return quiz;
            });
        });
    })
    .then(quiz=>{
        return quiz.save();
    })
    .then(quiz=>{
        log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {

    validateId(id)
    .then(id=>models.quiz.findByPk(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(`Probando el quiz ${colorize(quiz.id, 'magenta')}.`);
        return makeQuestion(rl, colorize(`${quiz.question}? : `, 'blue'))
        .then(a=>{
            log('Su respuesta es: ');
            if (a.toLowerCase().trim()===quiz.answer.toLowerCase().trim()) {
                biglog('CORRECTO', 'green');
            } else {
                biglog('INCORRECTO', 'red');
            }
        });
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });
};
/**
 * Funcion que devuelve una promesa que
 * - valida el modelo y si todo esta bien devuelve un arreglo con
 * los id de cada registro en la BBDD
 */
const fillArray = arr => {

    return new Sequelize.Promise((resolve, reject) => {
        //arr = [];
        models.quiz.findAll()
        .each(quiz=>{
            arr.push(quiz.id);
        })
        .catch(error => {
            reject(errorlog(error.message));
        })
        .then(() => {
            if (arr.length===0){
                reject(new Error(`Arreglo vacio.`));
            }else {
                resolve(arr);
            }
        })
    });
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
    log('Jugar.', 'red');
    let score = 0;
    let toBeResolved =[];

    fillArray(toBeResolved)
    .then(quiz => {
        const playOne=(toBeResolved)=>{
            if (toBeResolved.length===0) {
                log(`No hay nada más que preguntar. \nAciertos: ${score}`,'yellow');
                biglog(score,'red');
                rl.prompt();
            } else {
                let id = (Math.floor(Math.random()*(toBeResolved.length)))
                validateId(id)
                .then(id=>models.quiz.findByPk(toBeResolved[id]))
                .then(quiz => {
                    return makeQuestion(rl, colorize(`${quiz.question}? : `, 'blue'))
                    .then(answer => {
                        if (answer.toLowerCase().trim()===quiz.answer.toLowerCase().trim()) {
                            score++;
                            log(`CORRECTO - Llevas ${score} aciertos.`);
                            toBeResolved.splice(id,1);
                            playOne(toBeResolved);
                        } else {
                            log(`INCORRECTO - Fin del Juego.\nAciertos: ${score}`,'yellow');
                            biglog(score,'red');
                            toBeResolved.slice(0,toBeResolved.length);
                            rl.prompt();
                        }
                    })
                })
            }
        }
        playOne(toBeResolved);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
    });

};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autor de la práctica:');
    log('Harmenson Polo Olivo', 'green');
    //log('Nombre 2', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};