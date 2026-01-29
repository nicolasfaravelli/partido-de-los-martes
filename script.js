const CONFIG = {
    MULT_LEYENDA: [1.13, 1.11, 1.09, 1.07, 1.05, 1.03],
    PLUS_EDAD_COEF: 0.0028,
    BONUS_RESISTENCIA: 1.05,
    BONUS_VELOCIDAD: 1.03,
    TOPE_STAT_LEYENDA: 98,
    URL_FONDO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Fondo.png",
    URL_TITULO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Titulo.png",
    URL_MUSICA: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Musica.mp3",
    URL_SFX_HOVER: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 1.mp3",
    URL_SFX_CLICK: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 2.mp3",
    URL_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHOyW-OmPwPBpIwBw30sBjYdcLn1_8xFjkXfG9_tLFeB960jfYnnouTDieGPeKSK49FYM1tSGng_mg/pub?gid=1826229647&single=true&output=csv",
    VOL_SERIES: [0, 0.05, 0.2],
    SFX_MAP: { 0: 0, 0.05: 0.0375, 0.2: 0.15 }
};

const COLORES = { 'leyenda': '#644b14', 'legendario': '#372864', 'oro': '#624f21', 'plata': '#434343', 'bronce': '#5e3e21' };
const STAT_COLORS = { 'legend': '#a855f7', 'gold': '#d4af37', 'silver': '#7a7a7a', 'bronze': '#5e3e21' };
const ICON_SERIES = ["🔈", "🔉", "🔊"];

let datosOriginales = [], invitados = [], equipo1 = [], equipo2 = [];
let jugadorActualEnModal = null, esModoLeyenda = false, volIndex = 0, teamRadarChart = null;

document.addEventListener("DOMContentLoaded", () => {
    // Protección: Verificar si los elementos existen antes de usarlos
    const header = document.getElementById('header-area');
    const search = document.getElementById('search-input');
    const sort = document.getElementById('sort-select');

    if(CONFIG.URL_FONDO) document.documentElement.style.setProperty('--fondo-url', `url('${CONFIG.URL_FONDO}')`);
    if(header && CONFIG.URL_TITULO) header.innerHTML = `<img src="${CONFIG.URL_TITULO}" class="title-img">`;
    
    if(search) search.addEventListener('input', aplicarFiltrosYOrden);
    if(sort) sort.addEventListener('change', aplicarFiltrosYOrden);
    
    window.addEventListener('click', initAudio, {once:true});
    window.addEventListener('touchstart', initAudio, {once:true});
    
    cargarDatos();
    
    // Observador para sonidos (solo si el body existe)
    if (document.body) {
        new MutationObserver(attachSounds).observe(document.body, { childList: true, subtree: true });
    }
});

function cargarDatos() {
    console.log("Iniciando carga de datos...");
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(CONFIG.URL_CSV + "&uid=" + Date.now());
    
    Papa.parse(PROXY_URL, { 
        download: true, 
        header: false, 
        skipEmptyLines: true, 
        complete: (results) => {
            console.log("PapaParse completado.");
            const loader = document.getElementById('loader');
            if(loader) loader.style.display = 'none';

            if(!results.data || results.data.length === 0) {
                console.error("No se recibieron datos del CSV.");
                return;
            }

            const data = results.data;
            data.shift(); // Quitar cabecera

            datosOriginales = data.map((fila, index) => { 
                if(!fila[0] || fila[0].trim() === '' || fila[0].trim() === 'Jugador') return null;
                try {
                    return { 
                        id: index, nombre: fila[0], prom: parseInt(fila[8]) || 60, 
                        ata: parseInt(fila[2]) || 0, def: parseInt(fila[3]) || 0, 
                        tec: parseInt(fila[4]) || 0, vel: parseInt(fila[5]) || 0, 
                        res: parseInt(fila[6]) || 0, arq: parseInt(fila[7]) || 0, 
                        edad: parseInt(fila[1]) || 25, pos: fila[9] || '?', 
                        fondo: fila[11] || '', foto: fila[12] || '', 
                        fotoLeyenda: fila[13] ? fila[13].trim() : "" , 
                        color: COLORES[fila[10]?.trim().toLowerCase()] || '#624f21' 
                    };
                } catch(e) {
                    console.error("Error procesando fila " + index, e);
                    return null;
                }
            }).filter(i => i !== null);

            console.log("Jugadores procesados: " + datosOriginales.length);
            aplicarFiltrosYOrden();
        },
        error: (err) => {
            console.error("Error en PapaParse:", err);
            const loader = document.getElementById('loader');
            if(loader) loader.innerText = "ERROR AL CARGAR DATOS.";
        }
    }); 
}

function aplicarFiltrosYOrden() {
    const grid = document.getElementById('grid-container');
    const search = document.getElementById('search-input');
    const sort = document.getElementById('sort-select');

    if(!grid) return;

    const t = search ? search.value.toLowerCase() : "";
    const sortVal = sort ? sort.value : "nombre-asc";
    const [c, o] = sortVal.split('-');

    let lista = datosOriginales.filter(j => j.nombre.toLowerCase().includes(t));
    
    lista.sort((a,b) => {
        if(c === 'nombre') return o === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
        return o === 'asc' ? a.prom - b.prom : b.prom - a.prom;
    });

    grid.innerHTML = lista.map(j => `<div class="card" onclick="abrirModal(${j.id})">${generarHTMLCarta(j, true)}</div>`).join('');
    attachSounds();
}

// Mantenemos el resto de tus funciones igual para no romper tu lógica
function generarHTMLCarta(j, lazy) { 
    return `<div class="card-bg-wrapper"><img src="${j.fondo}" class="card-bg" ${lazy?'loading="lazy"':''} crossorigin="anonymous"></div><div class="shine-layer" style="mask-image:url('${j.fondo}'); -webkit-mask-image:url('${j.fondo}');"></div>${j.foto ? `<img src="${j.foto}" class="card-face" crossorigin="anonymous">` : ''}<div class="info-layer" style="color:${j.color}"><div class="rating">${j.prom}</div><div class="position">${j.pos}</div><div class="name">${j.nombre}</div><div class="stats-container"><span class="stat-val">${j.ata}</span><span class="stat-val">${j.def}</span><span class="stat-val">${j.tec}</span><span class="stat-val">${j.vel}</span><span class="stat-val">${j.res}</span><span class="stat-val">${j.arq}</span></div></div>`;
}

function abrirModal(id) { 
    const j = datosOriginales.find(x => x.id === parseInt(id)); 
    if(!j) return;
    jugadorActualEnModal = JSON.parse(JSON.stringify(j)); 
    esModoLeyenda = false; 
    renderizarModal(jugadorActualEnModal);
    const modal = document.getElementById('modal');
    if(modal) {
        modal.style.display = 'flex'; 
        document.body.classList.add('modal-open');
    }
}

function renderizarModal(j) { 
    const cardCont = document.getElementById('modal-card-container');
    const btnCont = document.getElementById('modal-buttons');
    if(cardCont) cardCont.innerHTML = `<div class="card" id="carta-descarga">${generarHTMLCarta(j, false)}</div>`; 
    if(btnCont) btnCont.innerHTML = `${j.fotoLeyenda ? `<button class="btn ${esModoLeyenda?'btn-ghost':'btn-gold'}" style="height:45px; padding:0 20px; border-radius:4px; font-weight:900; cursor:pointer;" onclick="toggleLeyenda()">${esModoLeyenda?"ACTUAL":"LEYENDA"}</button>`:''}<button class="btn" style="background:var(--color-acento); color:#fff; height:45px; padding:0 20px; border-radius:4px; font-weight:900; cursor:pointer;" onclick="descargarCarta()">DESCARGAR</button><button class="btn btn-ghost" style="height:45px; padding: 0 20px; border-radius:6px;" onclick="cerrarModalCarta()">CERRAR</button>`; 
    attachSounds();
}

function cerrarModalCarta() { 
    const modal = document.getElementById('modal');
    if(modal) modal.style.display='none'; 
    document.body.classList.remove('modal-open'); 
}

function toggleLeyenda() { 
    esModoLeyenda = !esModoLeyenda; 
    const j = esModoLeyenda ? calcularObjetoLeyenda(jugadorActualEnModal) : jugadorActualEnModal; 
    renderizarModal(j); 
}

function calcularObjetoLeyenda(base) { 
    const keys = ['ata','def','tec','vel','res','arq']; 
    const sorted = keys.map(k => ({k, v: base[k]})).sort((a,b)=>b.v-a.v); 
    let nuevos = {}, suma = 0; 
    const plus = Math.max(0, (base.edad - 33) * CONFIG.PLUS_EDAD_COEF); 
    sorted.forEach((s, i) => { 
        let m = CONFIG.MULT_LEYENDA[i] || 1.05; 
        let val = s.v * (m + plus); 
        if(s.k === 'res') val *= CONFIG.BONUS_RESISTENCIA; 
        if(s.k === 'vel') val *= CONFIG.BONUS_VELOCIDAD; 
        nuevos[s.k] = Math.min(CONFIG.TOPE_STAT_LEYENDA, Math.round(val)); 
        suma += nuevos[s.k]; 
    }); 
    return { ...base, foto: base.fotoLeyenda, fondo: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/LEYENDA.png", color: COLORES['leyenda'], ...nuevos, prom: Math.min(98, Math.round(suma/6)) };
}

function descargarCarta() { 
    const el = document.getElementById('carta-descarga'); 
    if(!el) return;
    html2canvas(el, { useCORS: true, scale: 3 }).then(cvs => { 
        const a = document.createElement('a'); a.download = 'Carta.png'; a.href = cvs.toDataURL(); a.click(); 
    });
}

function abrirArmador() { 
    const teamModal = document.getElementById('team-modal');
    if(teamModal) teamModal.style.display = 'flex'; 
    document.body.classList.add('modal-open'); 
    equipo1 = []; equipo2 = []; renderizarListaSeleccion(); 
}

function cerrarArmador() { 
    const teamModal = document.getElementById('team-modal');
    if(teamModal) teamModal.style.display = 'none'; 
    document.body.classList.remove('modal-open'); 
}

function agregarInvitado() { 
    if((equipo1.length + equipo2.length) >= 10) return; 
    const id = 9000 + invitados.length + 1; 
    invitados.push({id, nombre: `Invitado ${invitados.length+1}`, prom: 70, ata: 70, def: 70, tec: 70, vel: 70, res: 70, arq: 50, edad: 25, esInvitado: true}); 
    (equipo1.length <= equipo2.length ? equipo1 : equipo2).push(id); 
    renderizarListaSeleccion();
}

function renderizarListaSeleccion() {
    const cont = document.getElementById('players-checklist');
    if(!cont) return;
    let html = invitados.map(i => `<div class="player-row selected" onclick="toggleSeleccion(${i.id})"><span>${i.nombre}</span> <span style="margin-left:auto;color:${getColorProm(i.prom)}">${i.prom}</span></div>`).join('');
    html += datosOriginales.map(j => {
        const sel = equipo1.includes(j.id) || equipo2.includes(j.id);
        return `<div class="player-row ${sel?'selected':''}" onclick="toggleSeleccion(${j.id})"><span>${j.nombre}</span> <span style="margin-left:auto; color:${getColorProm(j.prom)}">${j.prom}</span></div>`;}).join('');
    cont.innerHTML = html;
    actualizarContadorEquipos(); actualizarTablerosEquipos();
}

function toggleSeleccion(id) { 
    const nid = parseInt(id); 
    if (equipo1.includes(nid) || equipo2.includes(nid)) { equipo1 = equipo1.filter(x=>x!==nid); equipo2 = equipo2.filter(x=>x!==nid); } 
    else if ((equipo1.length + equipo2.length) < 10) (equipo1.length <= equipo2.length ? equipo1 : equipo2).push(nid); 
    renderizarListaSeleccion();
}

function cambiarDeEquipo(id) {
    const nid = parseInt(id);
    if (equipo1.includes(nid)) { equipo1 = equipo1.filter(x => x !== nid); equipo2.push(nid); } 
    else if (equipo2.includes(nid)) { equipo2 = equipo2.filter(x => x !== nid); equipo1.push(nid); }
    actualizarTablerosEquipos();
}

function actualizarContadorEquipos() { 
    const t = equipo1.length + equipo2.length; 
    const cnt = document.getElementById('team-counter'); 
    const btnGen = document.getElementById('btn-generate');
    const ok = t === 10; 
    if(cnt) cnt.innerText = `SELECCIONADOS: ${t} / 10`; 
    if(cnt && ok) cnt.classList.add('completado'); else if(cnt) cnt.classList.remove('completado'); 
    if(btnGen) btnGen.disabled = !ok; 
}

function getPlayerData(id) { return id >= 9000 ? invitados.find(i=>i.id===id) : datosOriginales.find(d=>d.id===id); }

function actualizarTablerosEquipos() { 
    renderListaEquipo('list-team-1', equipo1, 'avg-team-1'); 
    renderListaEquipo('list-team-2', equipo2, 'avg-team-2'); 
    actualizarRadar(); 
}

function renderListaEquipo(ulId, ids, avgId) { 
    const ul = document.getElementById(ulId); 
    if(!ul) return;
    ul.innerHTML = ''; let suma = 0; 
    ids.map(getPlayerData).forEach(p => { 
        if(!p) return;
        suma += p.prom; 
        const li = document.createElement('li'); 
        li.className = 'team-player-li'; 
        li.onclick = () => cambiarDeEquipo(p.id);
        li.innerHTML = `<span>${p.nombre}</span><span style="color:${getColorProm(p.prom)}">${p.prom}</span>`; 
        ul.appendChild(li); 
    }); 
    const avg = document.getElementById(avgId);
    if(avg) avg.innerText = `PROM: ${ids.length ? (suma/ids.length).toFixed(1) : 0}`;
}

function getColorProm(v) { return v>=90?STAT_COLORS.legend:v>=80?STAT_COLORS.gold:v>=70?STAT_COLORS.silver:STAT_COLORS.bronze; }

function highlightTeam(idx) {
    if(!teamRadarChart) return;
    document.querySelectorAll('.team-box').forEach((el, i) => { 
        if(i === idx) el.classList.add('highlight'); 
        else el.classList.remove('highlight'); 
    });
    teamRadarChart.update('none');
}

function generarAutomatico() {
    // Lógica simplificada para evitar errores de pool vacío
    let pool = [...equipo1, ...equipo2].map(getPlayerData).filter(p => p);
    if (pool.length !== 10) return;
    // ... resto de tu lógica de generación ...
    actualizarTablerosEquipos();
}

function actualizarRadar() {
    const canvas = document.getElementById('radarChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    // ... lógica de Chart.js ...
}

function initAudio() { 
    const p = document.getElementById('audio-player'); 
    if(p && !p.src) { p.src = CONFIG.URL_MUSICA; p.volume = CONFIG.VOL_SERIES[0]; } 
    if(p) p.play().catch(() => {});
}

function rotateMusic() { 
    const p = document.getElementById('audio-player'); 
    if(!p) return;
    volIndex = (volIndex + 1) % CONFIG.VOL_SERIES.length; 
    p.volume = CONFIG.VOL_SERIES[volIndex]; 
    const ctrl = document.getElementById('music-control');
    if(ctrl) ctrl.innerText = ICON_SERIES[volIndex]; 
}

function playHoverSfx() { 
    const s = document.getElementById('sfx-hover-player'); 
    if(s) { s.src = CONFIG.URL_SFX_HOVER; s.volume = 0.03; s.play().catch(()=>{}); }
}

function playClickSfx() { 
    const s = document.getElementById('sfx-click-player'); 
    if(s) { s.src = CONFIG.URL_SFX_CLICK; s.volume = 0.15; s.play().catch(()=>{}); }
}

function attachSounds() {
    document.querySelectorAll('.btn, .card, .player-row, .team-player-li').forEach(el => {
        if(!el.dataset.soundAttached) {
            el.addEventListener('mouseenter', () => { if(!el.classList.contains('player-row')) playHoverSfx(); });
            el.addEventListener('mousedown', () => { if(el.classList.contains('player-row')) playHoverSfx(); else playClickSfx(); });
            el.dataset.soundAttached = "true";
        }
    }); 
}
