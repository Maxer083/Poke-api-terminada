// ==========================================
// CONFIGURACIÓN DE AUDIO MANUAL
// ==========================================
// Archivo de audio local que se usará para la música ambiental de la Pokédex
const URL_MUSICA_FONDO = "Littlerooot_town.mp3"; 
const ICONO_MUSICA_ACTIVA = "volume.png";
const ICONO_MUSICA_PAUSADA = "mute.png";

// Selección de elementos del DOM (Document Object Model) para interactuar con el HTML
const listaPokemon = document.getElementById('pokemonList'); // Contenedor del listado lateral derecho
const uiName = document.getElementById('pokeName');         // Etiqueta del nombre en la pantalla principal
const uiSprite = document.getElementById('pokeSprite');     // Elemento <img> para el sprite del Pokémon
const uiTypes = document.getElementById('pokeTypes');       // Contenedor para las medallas de tipo elemental
const pokeSearch = document.getElementById('pokeSearch');   // Barra de entrada de texto para buscar

// Botón de inicio para saltar el bloqueo de autoplay estricto que tienen los navegadores modernos
const btnMusicToggle = document.getElementById('btnMusicToggle'); 

// Botones de acción e interactividad de la consola retro
const btnInfo = document.getElementById('btnInfo');     // Abre el modal con estadísticas, debilidades y evoluciones
const btnShiny = document.getElementById('btnShiny');   // Alterna el aspecto del sprite a su versión variocolor
const btnShapes = document.getElementById('btnShapes'); // Abre el modal de formas alternativas (regionales, megas, etc.)
const btnCry = document.getElementById('btnCry');       // Reproduce el rugido oficial del Pokémon seleccionado

// Modales secundarios y sus respectivos cuerpos contenedores de datos
const infoModal = document.getElementById('infoModal');                 // Ventana flotante de información general
const btnCloseModal = document.getElementById('btnCloseModal');         // Botón 'X' para cerrar el modal de info
const modalPokeName = document.getElementById('modalPokeName');         // Título del Pokémon dentro de la ventana info
const modalPokeBody = document.getElementById('modalPokeBody');         // Zona de inyección dinámica para stats y árbol familiar

const shapesModal = document.getElementById('shapesModal');             // Ventana flotante de variantes de forma
const btnCloseShapesModal = document.getElementById('btnCloseShapesModal'); // Botón 'X' para cerrar el modal de formas
const modalShapesBody = document.getElementById('modalShapesBody');     // Zona de inyección para los botones de formas alternativas

// Estados globales de la aplicación (Memoria temporal de lo que hace el usuario)
let pokemonActualData = null;  // Almacena el objeto JSON completo del Pokémon que se ve en pantalla
let modoShinyActivo = false;   // Bandera booleana (true/false) para saber si el botón Shiny está encendido
let urlSpriteNormal = "";      // Guarda de forma fija la URL del sprite normal (estático o animado)
let urlSpriteShiny = "";       // Guarda de forma fija la URL del sprite brillante (estático o animado)
let audioActual = null;        // Almacena el objeto de audio del grito para poder frenarlo si el usuario spamea el botón

// Sistema de Música de Fondo (Pueblo Villa Raíz)
let bgMusic = null;            // Objeto de audio global para controlar la pista de fondo

// Almacenamiento de datos crudos extraídos de la PokeAPI
let todosLosPokemonRaw = [];   // Guarda el total absoluto de la petición API (incluyendo formas especiales > 10000)
let listaBaseGlobal = [];      // Guarda únicamente la lista limpia de Pokémon nacionales (ID del 1 al 1025)
let diccionarioVariantes = {}; // Diccionario clave-valor para agrupar formas alternativas indexadas por el nombre base

// MATRIZ DE RELACIÓN DE TIPOS (Define las debilidades y resistencias del meta de Pokémon)
const TABLA_EFECTIVIDADES = {
    normal: { doubleFrom: ['fighting'], halfFrom: [], noneFrom: ['ghost'] },
    fire: { doubleFrom: ['water', 'ground', 'rock'], halfFrom: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], noneFrom: [] },
    water: { doubleFrom: ['electric', 'grass'], halfFrom: ['fire', 'water', 'ice', 'steel'], noneFrom: [] },
    grass: { doubleFrom: ['fire', 'ice', 'poison', 'flying', 'bug'], halfFrom: ['water', 'electric', 'grass', 'ground'], noneFrom: [] },
    electric: { doubleFrom: ['ground'], halfFrom: ['electric', 'flying', 'steel'], noneFrom: [] },
    ice: { doubleFrom: ['fire', 'fighting', 'rock', 'steel'], halfFrom: ['ice'], noneFrom: [] },
    fighting: { doubleFrom: ['flying', 'psychic', 'fairy'], halfFrom: ['bug', 'rock', 'dark'], noneFrom: [] },
    poison: { doubleFrom: ['ground', 'psychic'], halfFrom: ['fighting', 'poison', 'grass', 'bug', 'fairy'], noneFrom: [] },
    ground: { doubleFrom: ['water', 'grass', 'ice'], halfFrom: ['poison', 'rock'], noneFrom: ['electric'] },
    flying: { doubleFrom: ['electric', 'ice', 'rock'], halfFrom: ['fighting', 'bug', 'grass'], noneFrom: ['ground'] },
    psychic: { doubleFrom: ['bug', 'ghost', 'dark'], halfFrom: ['fighting', 'psychic'], noneFrom: [] },
    bug: { doubleFrom: ['fire', 'flying', 'rock'], halfFrom: ['fighting', 'ground', 'grass'], noneFrom: [] },
    rock: { doubleFrom: ['water', 'grass', 'fighting', 'ground', 'steel'], halfFrom: ['normal', 'fire', 'poison', 'flying'], noneFrom: [] },
    ghost: { doubleFrom: ['ghost', 'dark'], halfFrom: ['poison', 'bug'], noneFrom: ['normal', 'fighting'] },
    dragon: { doubleFrom: ['ice', 'dragon', 'fairy'], halfFrom: ['fire', 'water', 'grass', 'electric'], noneFrom: [] },
    dark: { doubleFrom: ['fighting', 'bug', 'fairy'], halfFrom: ['ghost', 'dark'], noneFrom: ['psychic'] },
    steel: { doubleFrom: ['fire', 'fighting', 'ground'], halfFrom: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], noneFrom: ['poison'] },
    fairy: { doubleFrom: ['poison', 'steel'], halfFrom: ['fighting', 'bug', 'dark'], noneFrom: ['dragon'] }
};

// Inicialización automática: Cuando el navegador termina de estructurar el HTML, arranca la carga lógica
window.addEventListener('DOMContentLoaded', () => {
    cargarPokemones(); // Dispara la descarga de la base de datos desde internet
    prepararAudio();   // Configura los hilos de audio para la música de fondo
});

// Configura el objeto de audio pero no lo reproduce inmediatamente debido a las políticas de seguridad del navegador
function prepararAudio() {
    if (URL_MUSICA_FONDO) {
        bgMusic = new Audio(URL_MUSICA_FONDO); // Instancia el reproductor con el track de Villa Raíz
        bgMusic.loop = true;                   // Configura bucle infinito para que nunca se corte la música
        bgMusic.volume = 0.25;                 // Setea el volumen a un nivel bajo y agradable (25%)
    }

    // Si existe el botón físico de encendido/inicio en el HTML
    if (btnMusicToggle) {
        actualizarIconoMusica();

        btnMusicToggle.addEventListener('click', () => {
            if (!bgMusic) return;

            if (bgMusic.paused) {
                bgMusic.play()
                    .then(actualizarIconoMusica)
                    .catch(err => console.log("Bloqueo de audio del navegador:", err));
            } else {
                bgMusic.pause();
                actualizarIconoMusica();
            }
        });
    } else {
        const reproducirPrimerClick = () => {
            if (bgMusic) {
                bgMusic.play().catch(err => console.log("Esperando interacción:", err));
                document.removeEventListener('click', reproducirPrimerClick); // Remueve el evento para que no se ejecute más de una vez
            }
        };
        document.addEventListener('click', reproducirPrimerClick);
    }
}

function actualizarIconoMusica() {
    if (!btnMusicToggle || !bgMusic) return;

    const iconoMusica = btnMusicToggle.querySelector('img');
    if (!iconoMusica) return;

    const musicaPausada = bgMusic.paused;
    iconoMusica.src = 'img/' + (musicaPausada ? ICONO_MUSICA_PAUSADA : ICONO_MUSICA_ACTIVA);
    iconoMusica.alt = musicaPausada ? "Musica pausada" : "Musica activa";
    btnMusicToggle.title = musicaPausada ? "Activar musica" : "Pausar musica";
}

// Evento para escuchar la barra de búsqueda en tiempo real (Filtrado dinámico 'on input')
pokeSearch.addEventListener('input', (e) => {
    const textoBusqueda = e.target.value.toLowerCase().trim(); // Lee la entrada, la pasa a minúsculas y remueve espacios vacíos
    const listaFiltrada = listaBaseGlobal.filter(pokemon => 
        pokemon.name.toLowerCase().includes(textoBusqueda)     // Compara si el nombre contiene la cadena ingresada
    );
    renderizarLista(listaFiltrada); // Redibuja el panel derecho mostrando solo los resultados del filtro
});

// Controladores de Apertura de Modales
btnInfo.addEventListener('click', () => {
    if (pokemonActualData) mostrarMenuInfo(pokemonActualData); // Si hay un Pokémon cargado, abre su ficha técnica
});

btnShapes.addEventListener('click', () => {
    shapesModal.classList.add('open'); // Agrega la clase CSS que activa la visibilidad del panel de formas
});

// Controladores de Cierre de Modales
btnCloseModal.addEventListener('click', () => infoModal.classList.remove('open'));         // Apaga el modal de info
btnCloseShapesModal.addEventListener('click', () => shapesModal.classList.remove('open')); // Apaga el modal de variantes

// Lógica del interruptor Shiny / Normal
btnShiny.addEventListener('click', () => {
    if (!pokemonActualData) return; // Si la app está vacía, frena la ejecución
    modoShinyActivo = !modoShinyActivo; // Invierte el estado booleano (si era false pasa a true, y viceversa)

    if (modoShinyActivo) {
        btnShiny.classList.add('active'); // Aplica estilos visuales de botón presionado
        uiSprite.src = urlSpriteShiny || urlSpriteNormal; // Cambia el origen de imagen al sprite brillante (o al normal si no tiene shiny)
    } else {
        btnShiny.classList.remove('active'); // Quita los estilos de botón presionado
        uiSprite.src = urlSpriteNormal; // Restaura el origen de imagen al sprite base
    }
});

// Evento asíncrono para reproducir el grito original de la criatura
btnCry.addEventListener('click', async () => {
    if (pokemonActualData && pokemonActualData.cries && pokemonActualData.cries.latest) {
        try {
            // Si ya se estaba reproduciendo un grito anterior, lo frena de golpe para evitar solapamiento asqueroso
            if (audioActual) {
                audioActual.pause();
                audioActual = null;
            }
            audioActual = new Audio(pokemonActualData.cries.latest); // Obtiene la URL del archivo .ogg/.mp3 de la API
            audioActual.volume = 0.5; // Volumen al 50%
            await audioActual.play(); // Espera a que el navegador procese el buffer y da play
        } catch (err) {
            console.warn("No se pudo reproducir el grito del Pokémon:", err);
        }
    }
});

// FUNCIÓN CENTRAL: Descarga, procesa y distribuye Pokémon estándar y variantes regionales
async function cargarPokemones() {
    const url = "https://pokeapi.co/api/v2/pokemon?limit=1400&offset=0"; // Trae un lote masivo con casi todas las especies del juego
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        todosLosPokemonRaw = datos.results; // Almacena el array plano original entregado por PokeAPI
        
        // Limpiamos los contenedores de memoria interna para arrancar el procesamiento limpio
        listaBaseGlobal = [];
        diccionarioVariantes = {};

        todosLosPokemonRaw.forEach((pokemon) => {
            // Descompone la URL (ej: "https://pokeapi.co/api/v2/pokemon/25/") para extraer el ID numérico real
            const urlPartes = pokemon.url.split('/');
            const idReal = parseInt(urlPartes[urlPartes.length - 2]);

            if (idReal <= 1025) {
                // Es un Pokémon base oficial de la Pokédex Nacional
                listaBaseGlobal.push(pokemon);
            } else if (idReal >= 10001) {
                // Es una variante especial (Mega, Alola, Galar, Hisui, Paldea o Gigamax)
                const raizNombre = pokemon.name.split('-')[0]; // Extrae la primera palabra del nombre (ej: de "raichu-alola" saca "raichu")
                if (!diccionarioVariantes[raizNombre]) {
                    diccionarioVariantes[raizNombre] = []; // Si la clave no existía en el diccionario, inicializa un array vacío
                }
                diccionarioVariantes[raizNombre].push(pokemon); // Introduce la variante dentro del cajón de su Pokémon raíz
            }
        });

        renderizarLista(listaBaseGlobal); // Pinta la lista completa en el visor scroll derecho

        // Autocarga el primer Pokémon de la lista (Bulbasaur N°001) para que la Pokédex no inicie apagada
        if(listaBaseGlobal.length > 0) {
            actualizarDetalles(listaBaseGlobal[0].url);
        }
    } catch (error) {
        console.error("Error general de carga:", error);
        uiName.innerText = "Error API";
    }
}

// Inyecta de forma masiva los nodos HTML en la lista lateral derecha
function renderizarLista(arregloPokemon) {
    listaPokemon.innerHTML = ""; // Vacía el contenedor visual por completo antes de reescribir

    // Caso de seguridad: Si el usuario busca algo que no existe (ej: "Miku")
    if (arregloPokemon.length === 0) {
        listaPokemon.innerHTML = `<div style="padding: 15px; font-size: 8px; color: #666; text-align: center;">SIN RESULTADOS</div>`;
        return;
    }

    arregloPokemon.forEach((pokemon) => {
        const urlPartes = pokemon.url.split('/');
        const idReal = urlPartes[urlPartes.length - 2];
        const idFormateated = String(idReal).padStart(3, '0'); // Rellena con ceros a la izquierda (ej: "5" se transforma en "005")
        
        const item = document.createElement('div');
        item.className = 'pokemon-item';
        item.setAttribute('data-name', pokemon.name.toLowerCase().trim()); // Atributo personalizado clave para el buscador y saltos evolutivos
        
        // Verifica si el ítem que se está dibujando coincide con el Pokémon activo para dejarlo seleccionado con estilos CSS
        if (pokemonActualData && pokemonActualData.name.split('-')[0] === pokemon.name) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <img class="pokeball-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg" alt="ball">
            <span>${idFormateated} ${pokemon.name}</span>
        `;
        
        // Evento de click para cambiar de criatura al interactuar con la lista
        item.addEventListener('click', () => {
            document.querySelector('.pokemon-item.active')?.classList.remove('active'); // Quita la selección anterior
            item.classList.add('active'); // Aplica foco visual al nuevo ítem presionado
            infoModal.classList.remove('open'); // Cierra modales residuales abiertos para evitar bugs de visualización
            shapesModal.classList.remove('open');
            actualizarDetalles(pokemon.url); // Dispara la actualización del panel izquierdo
        });

        listaPokemon.appendChild(item); // Agrega físicamente el nodo al scroll visible
    });
}

// Descarga la información extendida de una criatura, actualiza la UI, inyecta tipos y calcula variantes de formas
async function actualizarDetalles(urlPokemon) {
    try {
        const respuesta = await fetch(urlPokemon);
        const infoPokemon = await respuesta.json();
        
        pokemonActualData = infoPokemon; // Setea el estado global con el JSON fresco recibido de internet
        uiName.innerText = infoPokemon.name; // Escribe el nombre en la pantalla principal
        
        // Desactiva el botón de grito si el Pokémon carece de registros de audio en la API
        if (btnCry) {
            btnCry.disabled = !(infoPokemon.cries && infoPokemon.cries.latest);
        }

        // EXTRACCIÓN SEGURO DE SPRITES ANIMADOS (QUINTA GENERACIÓN ESTILO BLACK & WHITE)
        // Si la API no tiene el GIF animado de ese Pokémon en particular, retrocede en cascada al sprite estático por defecto
        urlSpriteNormal = infoPokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default 
                          || infoPokemon.sprites.front_default 
                          || "";

        urlSpriteShiny = infoPokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny 
                         || infoPokemon.sprites.front_shiny 
                         || "";

        // Renderiza en pantalla el sprite correspondiente evaluando si el usuario activó el modo Shiny
        uiSprite.src = modoShinyActivo ? (urlSpriteShiny || urlSpriteNormal) : urlSpriteNormal;
        uiSprite.alt = infoPokemon.name;

        // Limpieza de dimensiones en línea para evitar estiramientos raros heredados y dejar que actúe el CSS nativo
        uiSprite.style.width = "";
        uiSprite.style.height = "";

        // INYECCIÓN DE TIPOS ELEMENTALES
        uiTypes.innerHTML = ""; 
        infoPokemon.types.forEach(t => {
            const tipoNombre = t.type.name;
            const badge = document.createElement('span');
            badge.className = `type-badge type-${tipoNombre}`; // Asigna la clase dinámica para pintar el fondo según la paleta del CSS
            badge.innerText = tipoNombre;
            uiTypes.appendChild(badge);
        });

        // VERIFICACIÓN Y CONSTRUCCIÓN DEL MENÚ DE FORMAS ALTERNATIVAS
        const nombreRaiz = infoPokemon.name.split('-')[0];
        const variantesEncontradas = diccionarioVariantes[nombreRaiz] || [];

        if (variantesEncontradas.length > 0) {
            btnShapes.disabled = false; // Habilita el botón físico de formas en la Pokédex
            modalShapesBody.innerHTML = ""; // Limpia el modal interno de variantes
            
            // Creamos manualmente la opción para volver siempre a la Forma Original/Base
            const btnBaseForm = document.createElement('div');
            btnBaseForm.className = 'shape-option-item';
            btnBaseForm.innerText = `${nombreRaiz} (Orig.)`;
            btnBaseForm.addEventListener('click', () => {
                shapesModal.classList.remove('open');
                const objBase = todosLosPokemonRaw.find(p => p.name === nombreRaiz);
                if(objBase) actualizarDetalles(objBase.url); // Redirige la Pokédex al endpoint base
            });
            modalShapesBody.appendChild(btnBaseForm);

            // Añadimos botones dinámicos para cada variante regional o megaforma encontrada en el diccionario
            variantesEncontradas.forEach(variante => {
                const btnVariante = document.createElement('div');
                btnVariante.className = 'shape-option-item';
                btnVariante.innerText = variante.name.replace(`${nombreRaiz}-`, 'F: '); // Formatea texto largo (ej: "F: alola")
                
                btnVariante.addEventListener('click', () => {
                    shapesModal.classList.remove('open');
                    actualizarDetalles(variante.url); // Redirige la Pokédex al endpoint exclusivo de la variante
                });
                modalShapesBody.appendChild(btnVariante);
            });
        } else {
            btnShapes.disabled = true; // Si no tiene variantes (ej: Bulbasaur), el botón se bloquea por completo
        }

    } catch (error) {
        console.error("Error en procesamiento de detalles:", error);
    }
}

// Analiza los metadatos de evolución de la API y los traduce a texto legible de consolas retro
function traducirMetodoEvolucion(details) {
    if (!details || details.length === 0) return "ESPECIAL"; // Métodos raros o de eventos de juego

    // Caso A: Evolución mediante uso de Piedras Evolutivas u objetos equipables (ej: Piedra Fuego)
    const detalleItem = details.find(d => d.trigger?.name === "use-item" && d.item?.name);
    if (detalleItem) {
        return detalleItem.item.name.replace(/-/g, " ").toUpperCase();
    }

    // Caso B: Evolución clásica por entrenamiento y subida de Nivel (opcional condicionado por horario)
    const detalleNivel = details.find(d => d.min_level);
    if (detalleNivel) {
        let extra = "";
        if (detalleNivel.time_of_day) {
            const horaTraduccion = detalleNivel.time_of_day === 'day' ? 'DÍA' : detalleNivel.time_of_day === 'night' ? 'NOCHE' : 'ATARDECER';
            extra = ` (${horaTraduccion})`;
        }
        return `LVL ${detalleNivel.min_level}${extra}`;
    }

    // Caso C: Evolución por Intercambio de cable link (con o sin objeto retenido)
    const detalleTrade = details.find(d => d.trigger?.name === "trade");
    if (detalleTrade) {
        return detalleTrade.held_item ? `TRAD. + ${detalleTrade.held_item.name.replace(/-/g, " ").toUpperCase()}` : "INTERCAMBIO";
    }

    // Caso D: Evolución por nivel de Amistad/Felicidad máxima
    const detalleFelicidad = details.find(d => d.min_happiness);
    if (detalleFelicidad) {
        return "AMISTAD";
    }

    // Casos residuales: Por localización de mapa, movimientos aprendidos o tipos en el equipo
    const d = details[0];
    if (d.location?.name) return `LUGAR: ${d.location.name.split("-")[0].toUpperCase()}`;
    if (d.known_move?.name) return `MOV: ${d.known_move.name.toUpperCase()}`;
    if (d.known_move_type?.name) return `TIPO MOV: ${d.known_move_type.name.toUpperCase()}`;

    return "ESPECIAL";
}

// ESTRUCTURA EL PANEL DE INFORMACIÓN EXTENDIDA, CALCULA EL DAÑO DEL META Y MAPEA EL ÁRBOL RECURSIVO
async function mostrarMenuInfo(data) {
    modalPokeName.innerText = `${data.name} (N° ${data.id})`;
    const altura = (data.height / 10).toFixed(1) + " m"; // Pasa de decímetros a metros reales fijando 1 decimal
    const peso = (data.weight / 10).toFixed(1) + " kg";   // Pasa de hectogramos a kilogramos reales fijando 1 decimal
    const tiposPokemon = data.types.map(t => t.type.name); // Crea un array plano con los strings de tipos (ej: ['grass', 'poison'])

    // ======================================================================
    // CÁLCULO MATEMÁTICO DE EFECTIVIDADES DE DEFENSA (Daño Recibido)
    // ======================================================================
    let modificadoresDefensa = {};
    // Inicializa todos los tipos elementales existentes del juego en daño neutro (= 1)
    Object.keys(TABLA_EFECTIVIDADES).forEach(tipo => { modificadoresDefensa[tipo] = 1; });
    
    // Cruza las debilidades combinando las debilidades/resistencias de los dos tipos del Pokémon simultáneamente
    tiposPokemon.forEach(tipoDelPokemon => {
        const relaciones = TABLA_EFECTIVIDADES[tipoDelPokemon];
        if (relaciones) {
            relaciones.doubleFrom.forEach(t => { modificadoresDefensa[t] *= 2; });   // Si es débil, multiplica por 2
            relaciones.halfFrom.forEach(t => { modificadoresDefensa[t] *= 0.5; }); // Si es resistente, divide por 2
            relaciones.noneFrom.forEach(t => { modificadoresDefensa[t] *= 0; });   // Si es inmune, lo neutraliza por 0
        }
    });

    let debilidadesX2 = [];
    let debilidadesX4 = [];
    // Clasifica los coeficientes resultantes en arreglos independientes según su valor final
    Object.keys(modificadoresDefensa).forEach(tipo => {
        if (modificadoresDefensa[tipo] === 2) debilidadesX2.push(tipo); // Daño doble
        if (modificadoresDefensa[tipo] === 4) debilidadesX4.push(tipo); // Debilidad crítica cuádruple (ej: Charizard contra Tipo Roca)
    });

    // ======================================================================
    // CÁLCULO MATEMÁTICO DE EFECTIVIDADES DE OFENSIVA (Daño Causado con STAB)
    // ======================================================================
    let ofensivaX2 = new Set();
    let ofensivaX4 = new Set();
    
    tiposPokemon.forEach(tipoDelPokemon => {
        Object.keys(TABLA_EFECTIVIDADES).forEach(tipoObjetivo => {
            // Revisa a qué tipos elementales del juego hiere de forma súper efectiva el tipo analizado
            if (TABLA_EFECTIVIDADES[tipoObjetivo].doubleFrom.includes(tipoDelPokemon)) {
                if (tiposPokemon.length === 1) {
                    ofensivaX2.add(tipoObjetivo);
                } else {
                    const otroTipo = tiposPokemon.find(t => t !== tipoDelPokemon);
                    // Comprobación analítica avanzada: Si AMBOS tipos del Pokémon golpean súper efectivo al mismo objetivo, se considera Efectividad Máxima X4
                    if (TABLA_EFECTIVIDADES[tipoObjetivo].doubleFrom.includes(otroTipo)) {
                        ofensivaX4.add(tipoObjetivo);
                    } else {
                        ofensivaX2.add(tipoObjetivo);
                    }
                }
            }
        });
    });
    ofensivaX4.forEach(tipo => ofensivaX2.delete(tipo)); // Remueve duplicados del set X2 si ya escalaron a la categoría X4
    let listaOfensivaX2 = Array.from(ofensivaX2);
    let listaOfensivaX4 = Array.from(ofensivaX4);

    // Helper interno rápido para generar badges de tipos en string HTML
    const crearBadges = (lista) => {
        return lista.map(t => `<span class="type-badge type-${t}" style="font-size:8px; padding:6px 0; flex:none; width:72px; display:inline-block; margin:3px 2px; text-align:center;">${t}</span>`).join('') 
                || '<span style="font-size:10px; color:#666; margin-left:6px; font-weight:normal;">- NONE -</span>';
    };

    // Construcción de filas de estadísticas base
    let statsHTML = '';
    data.stats.forEach(s => {
        let nombreStat = s.stat.name.replace('special-', 'sp. '); // Acomoda nombres largos de stats especiales para conservar look retro
        statsHTML += `
            <div class="info-row">
                <span class="info-label">${nombreStat}:</span>
                <span>${s.base_stat}</span>
            </div>
        `;
    });

    // INYECCIÓN GRÁFICA COMPLETA DEL ESQUELETO INTERNO DEL MODAL
    modalPokeBody.innerHTML = `
        <div class="info-row"><span class="info-label">ALTURA:</span><span>${altura}</span></div>
        <div class="info-row"><span class="info-label">PESO:</span><span>${peso}</span></div>
        <div style="font-weight:bold; margin-top:5px; border-bottom: 1px solid #333; color:#111;">STATS BASE:</div>
        ${statsHTML}
        <div style="font-weight:bold; margin-top:8px; border-bottom: 1px solid #333; color:#111;">DESCRIPCIÓN:</div>
        
        <div class="pokedex-description-box" id="pokedexDesc" style="height: auto !important; min-height: 50px; overflow: visible !important; word-wrap: break-word !important; overflow-wrap: break-word !important; white-space: normal !important; display: block !important; width: 100%; box-sizing: border-box; padding: 10px; margin-top: 5px;">Buscando en la base de datos...</div>
        
        <div style="font-weight:bold; margin-top:12px; border-bottom: 1px solid #333; color:#111; font-size:11px;">ANÁLISIS DE TIPOS:</div>
        
        <div style="margin-top:8px; background: rgba(200,0,0,0.04); padding: 6px; border-radius:6px; border: 1px dashed rgba(200,0,0,0.25);">
            <div style="font-size:10px; font-weight:bold; color:#cc3333; margin-bottom:6px;">❌ DAÑO RECIBIDO (DEFENSA)</div>
            <div style="font-size:9px; color:#444; font-weight:bold; margin-left:2px; margin-top:2px;">DEBILIDAD x2:</div>
            <div style="display:flex; flex-wrap:wrap; margin-bottom:6px;">${crearBadges(debilidadesX2)}</div>
            <div style="font-size:9px; color:#990000; font-weight:bold; margin-left:2px; margin-top:2px;">DEBILIDAD CUÁDRUPLE x4:</div>
            <div style="display:flex; flex-wrap:wrap;">${crearBadges(debilidadesX4)}</div>
        </div>

        <div style="margin-top:10px; background: rgba(0,200,0,0.03); padding: 6px; border-radius:6px; border: 1px dashed rgba(0,200,0,0.25);">
            <div style="font-size:10px; font-weight:bold; color:#2d632d; margin-bottom:6px;">⚔️ DAÑO CAUSADO (ATAQUE)</div>
            <div style="font-size:9px; color:#444; font-weight:bold; margin-left:2px; margin-top:2px;">SÚPER EFECTIVO x2:</div>
            <div style="display:flex; flex-wrap:wrap; margin-bottom:6px;">${crearBadges(listaOfensivaX2)}</div>
            <div style="font-size:9px; color:#1b4d1b; font-weight:bold; margin-left:2px; margin-top:2px;">EFECTIVIDAD MÁXIMA x4:</div>
            <div style="display:flex; flex-wrap:wrap;">${crearBadges(listaOfensivaX4)}</div>
        </div>

        <div id="evolutionTitleBox" style="font-weight:bold; margin-top:16px; border-bottom: 1px solid #333; color:#111; font-size:11px; display:none;">LÍNEA EVOLUTIVA:</div>
        <div id="evolutionChainBox" style="margin-top:8px; display:none; background: #fff; border:3px solid #222; border-radius:8px; padding:20px 15px; box-sizing:border-box; width:100%; height:auto !important; overflow:visible !important; margin-bottom:20px;"></div>
    `;
    
    infoModal.classList.add('open'); // Muestra la ventana en pantalla

    try {
        // Segunda petición asíncrona: Busca los datos biológicos de la Especie (descripciones multilenguaje y URL de evolución)
        const resEspecie = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}/`);
        const datosEspecie = await resEspecie.json();
        
        // Filtra el array de textos para extraer la descripción en Español de los juegos oficiales
        const entradaEspañol = datosEspecie.flavor_text_entries.find(entrada => entrada.language.name === 'es');
        const descElement = document.getElementById('pokedexDesc');
        if (entradaEspañol && descElement) {
            // Remueve saltos de página e interrupciones extrañas de bytes (\n \f) que vienen incrustadas en el servidor antiguo de PokeAPI
            descElement.innerText = entradaEspañol.flavor_text.replace(/[\n\f]/g, " ");
        }

        if (datosEspecie.evolution_chain?.url) {
            // Tercera petición asíncrona: Descarga el árbol familiar de evolución enlazado
            const resChain = await fetch(datosEspecie.evolution_chain.url);
            const dataChain = await resChain.json();
            
            let chainDataBase = dataChain.chain;

            // PARCHE DE SEGURIDAD MANUAL: Soporte cableado exclusivo para la rama evolutiva rota de Rockruff/Lycanroc en PokeAPI
            if (data.name.includes("rockruff") || data.name.includes("lycanroc")) {
                chainDataBase.evolves_to = [
                    {
                        species: { name: "lycanroc (diurna)", url: "https://pokeapi.co/api/v2/pokemon-species/745/" },
                        evolution_details: [{ min_level: 25, time_of_day: "day" }],
                        evolves_to: []
                    },
                    {
                        species: { name: "lycanroc (nocturna)", url: "https://pokeapi.co/api/v2/pokemon-species/10126/" },
                        evolution_details: [{ min_level: 25, time_of_day: "night" }],
                        evolves_to: []
                    },
                    {
                        species: { name: "lycanroc (crepuscular)", url: "https://pokeapi.co/api/v2/pokemon-species/10152/" },
                        evolution_details: [{ min_level: 25, time_of_day: "dusk" }],
                        evolves_to: []
                    }
                ];
            }

            // Si el Pokémon no evoluciona ni viene de una pre-evolución (ej: Legendarios independientes), esconde la sección por completo
            if (!chainDataBase.evolves_to || chainDataBase.evolves_to.length === 0) {
                document.getElementById('evolutionTitleBox').style.display = 'none';
                document.getElementById('evolutionChainBox').style.display = 'none';
                return; 
            }

            // Enciende visualmente las cajas destinadas a la cadena evolutiva
            document.getElementById('evolutionTitleBox').style.display = 'block';
            const chainBox = document.getElementById('evolutionChainBox');
            chainBox.style.display = 'block';
            chainBox.innerHTML = "";

            // ======================================================================
            // FUNCIÓN RECURSIVA AVANZADA: Construye ramificaciones complejas (ej: Eevee) sin desarmar layouts
            // ======================================================================
            function generarEstructuraArbol(nodo) {
                const urlPartes = nodo.species.url.split('/');
                const idRealEspecie = urlPartes[urlPartes.length - 2];
                // Genera la URL directa del sprite en el repositorio oficial de GitHub de PokeAPI
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idRealEspecie}.png`;

                // Contenedor principal de la etapa evolutiva actual (Usa Flexbox horizontal estricto)
                const bloqueEtapa = document.createElement('div');
                bloqueEtapa.className = "evolution-node";
                bloqueEtapa.style.display = "flex";
                bloqueEtapa.style.alignItems = "center";
                bloqueEtapa.style.justifyContent = "center";
                bloqueEtapa.style.gap = "15px";

                // Ficha miniatura del Pokémon dentro de la cadena
                const pkmCard = document.createElement('div');
                pkmCard.className = "pkm-evolution-card";
                pkmCard.style.display = "flex";
                pkmCard.style.flexDirection = "column";
                pkmCard.style.alignItems = "center";
                pkmCard.style.justifyContent = "center";
                pkmCard.style.width = "110px"; 
                pkmCard.style.minHeight = "115px"; 
                pkmCard.style.flexShrink = "0"; 
                pkmCard.style.transition = "transform 0.15s ease, opacity 0.15s ease";

                const nombreNodoLimpio = nodo.species.name.split(" ")[0].toLowerCase().trim();
                const nombreActualLimpio = pokemonActualData ? pokemonActualData.name.split("-")[0].toLowerCase().trim() : "";
                const esElPokemonActual = (nombreNodoLimpio === nombreActualLimpio);

                if (esElPokemonActual) {
                    // Si la ficha de la cadena es la misma criatura que está de fondo en la Pokédex, se desactiva el click y se opaca
                    pkmCard.style.cursor = "default";
                    pkmCard.style.opacity = "0.4"; 
                } else {
                    // Permite interacción táctil/click para saltar directo a ese Pokémon de la cadena
                    pkmCard.style.cursor = "pointer";
                    pkmCard.addEventListener('mouseenter', () => { 
                        pkmCard.style.opacity = "0.75"; 
                        pkmCard.style.transform = "scale(1.03)"; 
                    });
                    pkmCard.addEventListener('mouseleave', () => { 
                        pkmCard.style.opacity = "1"; 
                        pkmCard.style.transform = "scale(1)"; 
                    });

                    pkmCard.addEventListener('click', () => {
                        const nombreLimpio = nodo.species.name.split(" ")[0].toLowerCase().trim();
                        let pokemonEncontrado = listaBaseGlobal.find(p => p.name.toLowerCase().trim() === nombreLimpio);
                        
                        // Si es una variante oculta en el pool de crudos, la intercepta por prefijo
                        if (!pokemonEncontrado) {
                            pokemonEncontrado = todosLosPokemonRaw.find(p => p.name.toLowerCase().trim().startsWith(nombreLimpio));
                        }

                        if (pokemonEncontrado) {
                            const nombreABuscar = pokemonEncontrado.name.toLowerCase().trim();
                            // Intenta buscar el elemento físico correspondiente en la lista del DOM derecho
                            let domItem = document.querySelector(`.pokemon-item[data-name="${nombreABuscar}"]`);
                            if (!domItem) {
                                // Si no está visible por culpa de un filtro de búsqueda activo, limpia el buscador y regenera la lista
                                pokeSearch.value = ""; 
                                renderizarLista(listaBaseGlobal); 
                                domItem = document.querySelector(`.pokemon-item[data-name="${nombreABuscar}"]`);
                            }

                            document.querySelector('.pokemon-item.active')?.classList.remove('active');
                            if (domItem) {
                                domItem.classList.add('active');
                                domItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Centra el scroll automático sobre el ítem activo
                            }
                            
                            infoModal.classList.remove('open'); // Cierra el modal para revelar los nuevos sprites cargados
                            actualizarDetalles(pokemonEncontrado.url); // Actualiza la Pokédex con el nuevo Pokémon seleccionado
                        }
                    });
                }

                pkmCard.innerHTML = `
                    <img src="${spriteUrl}" alt="${nodo.species.name}" style="width:96px; height:96px; image-rendering:pixelated; object-fit:contain;">
                    <span style="font-size:10px; text-transform:uppercase; font-weight:bold; margin-top:2px; text-align:center; color:#111; width:auto; white-space:nowrap; overflow:visible;">${nodo.species.name.split(" ")[0]}</span>
                `;
                bloqueEtapa.appendChild(pkmCard);

                // Si este nodo padre posee evoluciones subsecuentes, entramos en la lógica de ramificaciones
                if (nodo.evolves_to && nodo.evolves_to.length > 0) {
                    // Contenedor vertical en columna para albergar bifurcaciones complejas (ej: las 8 evoluciones de Eevee)
                    const columnaRamasHijas = document.createElement('div');
                    columnaRamasHijas.style.display = "flex";
                    columnaRamasHijas.style.flexDirection = "column";
                    columnaRamasHijas.style.gap = "25px"; 
                    columnaRamasHijas.style.justifyContent = "center";

                    nodo.evolves_to.forEach((hijoNodo, index) => {
                        // Fila contenedora individual para cada hijo (Une su propia flecha con su propio cuerpo)
                        const filaFila = document.createElement('div');
                        filaFila.style.display = "flex";
                        filaFila.style.alignItems = "center";
                        filaFila.style.gap = "15px";

                        // Traduce los requerimientos de nivel u objetos de este hijo
                        const metodoTexto = traducirMetodoEvolucion(hijoNodo.evolution_details);
                        const contenedorFlecha = document.createElement('div');
                        contenedorFlecha.className = "evolution-arrow-box";
                        contenedorFlecha.style.display = "flex";
                        contenedorFlecha.style.flexDirection = "column";
                        contenedorFlecha.style.alignItems = "center";
                        contenedorFlecha.style.justifyContent = "center";
                        contenedorFlecha.style.minWidth = "85px";
                        contenedorFlecha.style.flexShrink = "0";

                        // Efecto estético retro: Si hay múltiples ramificaciones (ej: Kirlia evolucionando a Gardevoir o Gallade), 
                        // inclina sutilmente las flechas externas para simular un árbol genealógico limpio
                        let rotacionEstilo = "transform: rotate(0deg);";
                        if (nodo.evolves_to.length > 1) {
                            if (index === 0) {
                                rotacionEstilo = "transform: rotate(-24deg); margin-bottom: 6px;"; // Flecha apuntando ligeramente hacia arriba
                            } else if (index === nodo.evolves_to.length - 1) {
                                rotacionEstilo = "transform: rotate(24deg); margin-top: 6px;";     // Flecha apuntando ligeramente hacia abajo
                            }
                        }

                        contenedorFlecha.innerHTML = `
                            <span style="font-size:8px; font-weight:bold; background:#e0f0f8; color:#0b415b; padding:3px 6px; border:2px solid #222; border-radius:5px; white-space:nowrap; text-transform:uppercase; text-align:center; box-shadow: 1px 1px 0px #000;">${metodoTexto}</span>
                            <span class="evolution-arrow" style="font-size:22px; font-weight:bold; color:#222; display:inline-block; ${rotacionEstilo}">➔</span>
                        `;
                        filaFila.appendChild(contenedorFlecha);

                        // LLAMADA RECURSIVA: La función se llama a sí misma para procesar si este hijo tiene más evoluciones futuras (ej: Bulbasaur -> Ivysaur -> Venusaur)
                        const subArbolHijo = generarEstructuraArbol(hijoNodo);
                        filaFila.appendChild(subArbolHijo);
                        columnaRamasHijas.appendChild(filaFila);
                    });

                    bloqueEtapa.appendChild(columnaRamasHijas);
                }

                return bloqueEtapa; // Retorna el árbol de nodos completo estructurado en memoria pura
            }

            // Dispara la recursión partiendo de la raíz absoluta del árbol (Etapa básica N°1)
            const arbolCompleto = generarEstructuraArbol(chainDataBase);
            
            // Envoltorio de centrado simétrico final
            const wrapperCentrado = document.createElement('div');
            wrapperCentrado.style.display = "flex";
            wrapperCentrado.style.flexDirection = "column";
            wrapperCentrado.style.justifyContent = "center";
            wrapperCentrado.style.alignItems = "center";
            wrapperCentrado.style.width = "100%";
            wrapperCentrado.style.height = "auto";
            wrapperCentrado.appendChild(arbolCompleto);
            
            chainBox.appendChild(wrapperCentrado); // Inyecta el árbol genealógico completo en el HTML visible
        }

    } catch (error) {
        console.error("Error al construir la sección evolutiva:", error);
        const chainBox = document.getElementById('evolutionChainBox');
        if (chainBox) chainBox.innerHTML = `<span style="font-size:9px; color:#cc3333;">ERROR AL MAPEAR MATRIZ EVOLUTIVA</span>`;
    }
}