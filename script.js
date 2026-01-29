:root {
    --color-acento: #75AADB; 
    --color-bordes: #333333;
    --fuente-impacto: 'Bebas Neue', sans-serif;
    --fuente-datos: 'Montserrat', sans-serif;
    --radio-base: 6px; 
    --altura-base: 40px; 
}

body { 
    background-color: #0f0f0f; 
    color: #fff; 
    font-family: var(--fuente-datos); 
    margin: 0; 
    padding: 0 20px 20px 20px; 
    background-image: var(--fondo-url); 
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover; 
    background-attachment: fixed; 
    user-select: none;
}

body.modal-open { overflow: hidden; }

#version-tag { position: fixed; bottom: 10px; left: 15px; font-size: 0.7rem; color: #444; z-index: 5000; font-weight: bold; }

/* --- PANTALLA DE CARGA --- */

#loader { 
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: row; 
    align-items: center;
    justify-content: center;
    gap: 15px;
    color: #fff;
    font-family: var(--fuente-datos);
    font-weight: 700;
    letter-spacing: 1px;
    z-index: 10000;
}

.soccer-ball {
    width: 30px;
    height: 30px;
    object-fit: contain;
    animation: spin-ball 2s linear infinite;
}

.loading-text {
    font-size: 1rem;
    text-transform: uppercase;
    margin: 0;
}

.loading-text::after {
    content: "";
    display: inline-block;
    width: 24px;
    text-align: left;
    animation: dots-cycle 1.5s steps(4, end) infinite;
}

@keyframes spin-ball { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes dots-cycle { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } }

/* --- ENCABEZADO --- */

.main-sticky-header {
    position: sticky;
    top: 0;
    z-index: 2000;
    margin: 0 -20px 30px -20px;
    padding: 0 20px 20px 20px;
    background: rgba(15, 15, 15, 0.85);
    backdrop-filter: blur(15px);
    border-bottom: 2px solid var(--color-acento);
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}

.header-container { text-align: center; padding: 15px 0 10px 0; }
.title-img { max-width: 80%; height: auto; max-height: 100px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); }

.controls-area { 
    max-width: 1100px; 
    margin: 0 auto; 
    display: flex; 
    gap: 12px; 
    flex-wrap: wrap; 
    justify-content: center; 
    align-items: center;
}

/* --- ELEMENTOS INTERACTIVOS --- */

#search-input, #sort-select, .btn, .btn-add-guest { 
    height: var(--altura-base); 
    box-sizing: border-box; 
    border-radius: var(--radio-base); 
    font-family: var(--fuente-datos); 
    font-weight: 700; 
    font-size: 0.85rem; 
    text-transform: uppercase; 
    letter-spacing: 0.5px;
    border: 1px solid var(--color-bordes);
    transition: all 0.2s ease;
    outline: none;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
}

#search-input, #sort-select { 
    padding: 0 15px; 
    background: rgba(42, 42, 42, 0.9); 
    color: white; 
    min-width: 150px;
    flex: 1;
}

#search-input:focus, #sort-select:focus { border-color: var(--color-acento); background: #333; }

.btn {
    padding: 0 25px;
    background: var(--color-acento);
    color: #fff;
    cursor: pointer;
    border: none;
    width: auto;
}

.btn:hover:not(:disabled) { background: #8bb7e2 !important; box-shadow: 0 0 20px rgba(117, 170, 219, 0.6) !important; transform: translateY(-1px); }
.btn:disabled { background-color: #444 !important; color: #888 !important; cursor: not-allowed !important; opacity: 0.6; box-shadow: none !important; }

.btn-ghost { background: rgba(42, 42, 42, 0.9); color: #fff; border: 1px solid #444; }

.btn-gold { 
    background: var(--color-acento); 
    color: #000; 
    border: 1px solid #fff;
    box-shadow: 0 0 15px rgba(117, 170, 219, 0.5);
    font-weight: 900;
}
.btn-gold:hover { background: #fff !important; color: var(--color-acento) !important; }

.btn-add-guest { background: #111; color: #eee; padding: 0 15px; cursor: pointer; }
.btn-add-guest:hover { border-color: var(--color-acento); background: #1a1a1a; }

/* --- CARTAS Y GRID --- */

.grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); 
    gap: 25px; 
    max-width: 1200px; 
    margin: 0 auto; 
    padding-bottom: 50px;
}

.card { position: relative; width: 100%; aspect-ratio: 2 / 3; cursor: pointer; transition: transform 0.2s; container-type: size; outline: none; -webkit-tap-highlight-color: transparent; }
.card:hover { transform: scale(1.05); z-index: 10; }

.card-bg-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; filter: drop-shadow(0 8px 12px rgba(0,0,0,0.7)); }
.card-bg { width: 100%; height: 100%; object-fit: contain; }
.card-face { position: absolute; z-index: 2; top: 9.75%; left: 5.25%; width: 95%; object-fit: contain; }
.info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; }

.rating { font-family: var(--fuente-impacto); position: absolute; top: 13.5%; left: 6%; font-size: 18cqw; text-align: center; width: 25%; line-height: 0.8; }
.position { font-family: var(--fuente-impacto); position: absolute; top: 24%; left: 6%; font-size: 10cqw; text-align: center; width: 25%; }
.name { font-family: var(--fuente-impacto); position: absolute; top: 64.25%; left: 5%; width: 90%; text-align: center; font-size: 14.5cqw; text-transform: uppercase; }

.stats-container { display: flex; justify-content: space-between; position: absolute; top: 81%; left: 8%; width: 84.1%; }
.stat-val { font-family: var(--fuente-impacto); font-size: 8.5cqw; display: block; text-align: center; width: 16%; }

/* --- EFECTO POKÉMON --- */

#modal-card-container {
    position: relative;
    width: 340px;
    aspect-ratio: 2 / 3;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
}

/* Capa blanca del flash */
#modal-card-container::after {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: white;
    opacity: 0;
    pointer-events: none;
    z-index: 100;
    border-radius: 12px;
}

#modal-card-container.flash-evolucion::after {
    animation: pokemon-flash 0.4s linear forwards;
}

#modal-card-container.flash-evolucion {
    animation: card-glow 0.4s linear forwards;
}

@keyframes pokemon-flash {
    0% { opacity: 0; }
    40%, 60% { opacity: 1; }
    100% { opacity: 0; }
}

@keyframes card-glow {
    0% { filter: drop-shadow(0 0 0px #fff); }
    50% { filter: drop-shadow(0 0 40px #fff); }
    100% { filter: drop-shadow(0 0 0px #fff); }
}

.shine-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 4; overflow: hidden; mask-size: contain; mask-repeat: no-repeat; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; pointer-events: none; }
.shine-layer::after {
    content: ""; position: absolute; top: 0; left: 0; width: 300%; height: 300%; 
    background: linear-gradient(135deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 55%);
    pointer-events: none; opacity: 0; z-index: 6; transform: translate(-100%, -100%);
}
.card:hover .shine-layer::after { animation: brillo-diagonal-ida 1s ease-in-out forwards; }

@keyframes brillo-diagonal-ida { 0% { transform: translate(-100%, -100%); opacity: 1; } 100% { transform: translate(100%, 100%); opacity: 1; } }

/* --- MODALES Y ARMADOR --- */

.modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.875); z-index: 3000; flex-direction
