const CONFIG = {
    URL_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHOyW-OmPwPBpIwBw30sBjYdcLn1_8xFjkXfG9_tLFeB960jfYnnouTDieGPeKSK49FYM1tSGng_mg/pub?gid=1826229647&single=true&output=csv",
    URL_FONDO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Fondo.png",
    URL_TITULO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Titulo.png",
    URL_MUSICA: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Musica.mp3",
    URL_SFX_HOVER: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 1.mp3",
    URL_SFX_CLICK: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 2.mp3",
    MULT_LEYENDA: [1.13, 1.11, 1.09, 1.07, 1.05, 1.03],
    PLUS_EDAD_COEF: 0.0028,
    BONUS_RESISTENCIA: 1.05,
    BONUS_VELOCIDAD: 1.03,
    TOPE_STAT_LEYENDA: 98,
    VOL_SERIES: [0, 0.05, 0.3],
    SFX_MAP: { 0: 0, 0.05: 0.0375, 0.3: 0.225 }
};

const COLORES = { 'leyenda': '#644b14', 'legendario': '#372864', 'oro': '#624f21', 'plata': '#434343', 'bronce': '#5e3e21' };
const STAT_COLORS = { 'legend': '#a855f7', 'gold': '#d4af37', 'silver': '#7a7a7a', 'bronze': '#5e3e21' };
const ICON_SERIES = ["🔈", "🔉", "🔊"];
let datosOriginales = [], invitados = [], equipo1 = [], equipo2 = [];
let jugadorActualEnModal = null, esModoLeyenda = false, volIndex = 0, teamRadarChart = null;

/* --- INICIO Y CARGA --- */

document.addEventListener("DOMContentLoaded", () => {
    if(CONFIG.URL_FONDO) document.documentElement.style.setProperty('--fondo-url', `url('${CONFIG.URL_FONDO}')`);
    const header = document.getElementById('header-area');
    if(header) header.innerHTML = `<img src="${CONFIG.URL_TITULO}" class="title-img">`;
    document.getElementById('search-input').addEventListener('input', aplicarFiltrosYOrden);
    document.getElementById('sort-select').addEventListener('change', aplicarFiltrosYOrden);
    window.addEventListener('click', initAudio, {once:true});
    window.addEventListener('touchstart', initAudio, {once:true});
    cargarDatos();
    new MutationObserver(attachSounds).observe(document.body, { childList: true, subtree: true });
});

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0,0,0";
}

function cargarDatos() {
    Papa.parse(CONFIG.URL_CSV, { 
        download: true, 
        header: false, 
        skipEmptyLines: true, 
        complete: (results) => {
            const loader = document.getElementById('loader');
            if(loader) loader.style.display = 'none';
            const data = results.data; 
            if(data && data.length > 0) data.shift(); 
            datosOriginales = data.map((fila, index) => { 
                if(!fila || !fila[0] || fila[0].trim() === 'Jugador') return null;
                return { 
                    id: index, nombre: fila[0], prom: parseInt(fila[8]) || 60, 
                    ata: parseInt(fila[2]) || 0, def: parseInt(fila[3]) || 0, tec: parseInt(fila[4]) || 0, 
                    vel: parseInt(fila[5]) || 0, res: parseInt(fila[6]) || 0, arq: parseInt(fila[7]) || 0, 
                    edad: parseInt(fila[1]) || 25, pos: fila[9] || '?', fondo: fila[11] || '', 
                    foto: fila[12] || '', fotoLeyenda: fila[13] ? fila[13].trim() : "" , 
                    flecha: fila[14] || '',
                    color: COLORES[fila[10]?.trim().toLowerCase()] || '#624f21' 
                };
            }).filter(i => i !== null);
            aplicarFiltrosYOrden();
        }
    }); 
}

/* --- FILTROS Y CARTAS --- */

function aplicarFiltrosYOrden() {
    const grid = document.getElementById('grid-container');
    if(!grid) return;
    const t = document.getElementById('search-input').value.toLowerCase();
    const [c, o] = document.getElementById('sort-select').value.split('-');
    let lista = datosOriginales.filter(j => j.nombre.toLowerCase().includes(t));
    lista.sort((a,b) => c === 'nombre' ? (o === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)) : (o === 'asc' ? a.prom - b.prom : b.prom - a.prom));
    grid.innerHTML = lista.map(j => `<div class="card" onclick="abrirModal(${j.id})">${generarHTMLCarta(j, true)}</div>`).join('');
    attachSounds();
}

function generarHTMLCarta(j, lazy) { 
    const rgb = hexToRgb(j.color);
    const flechaImg = j.flecha ? `<img src="${j.flecha}" class="card-arrow" style="--color-rgb: ${rgb}" crossorigin="anonymous">` : '';
    return `<div class="card-bg-wrapper" style="--card-glow-color:${j.color}"><img src="${j.fondo}" class="card-bg" ${lazy?'loading="lazy"':''} crossorigin="anonymous"></div><div class="shine-layer" style="mask-image:url('${j.fondo}'); -webkit-mask-image:url('${j.fondo}');"></div>${j.foto ? `<img src="${j.foto}" class="card-face" crossorigin="anonymous">` : ''}<div class="info-layer" style="color:${j.color}"><div class="rating">${j.prom}</div><div class="position">${j.pos}</div>${flechaImg}<div class="name">${j.nombre}</div><div class="stats-container"><span class="stat-val">${j.ata}</span><span class="stat-val">${j.def}</span><span class="stat-val">${j.tec}</span><span class="stat-val">${j.vel}</span><span class="stat-val">${j.res}</span><span class="stat-val">${j.arq}</span></div></div>`;
}

/* --- MODALES --- */

function abrirModal(id) { 
    const j = datosOriginales.find(x => x.id === parseInt(id)); 
    if(!j) return;
    jugadorActualEnModal = JSON.parse(JSON.stringify(j)); 
    esModoLeyenda = false; 
    renderizarModal(jugadorActualEnModal);
    const modal = document.getElementById('modal');
    if(modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function renderizarModal(j) { 
    const cardCont = document.getElementById('modal-card-container');
    const btnCont = document.getElementById('modal-buttons');
    if(cardCont) cardCont.innerHTML = `<div class="card" id="carta-descarga">${generarHTMLCarta(j, false)}</div>`; 
    if(btnCont) {
        btnCont.innerHTML = `
            ${j.fotoLeyenda ? `<button class="btn ${esModoLeyenda?'btn-ghost':'btn-gold'}" onclick="toggleLeyenda()">${esModoLeyenda?"ACTUAL":"LEYENDA"}</button>` : ''}
            <button class="btn" onclick="descargarCarta()">DESCARGAR</button>
            <button class="btn btn-ghost" onclick="cerrarModalCarta()">CERRAR</button>
        `; 
    }
    attachSounds();
}

function cerrarModalCarta() { document.getElementById('modal').style.display='none'; document.body.classList.remove('modal-open'); }

/* FUNCIÓN DE TRANSICIÓN BLANCA (NUEVA) */
function toggleLeyenda() { 
    const cont = document.getElementById('modal-card-container');
    if(!cont) return;
    
    // 1. Activar el flash blanco
    triggerWhiteFlash();
    
    // 2. Cambiar los datos (esperamos un poquito para que no se vea el corte)
    esModoLeyenda = !esModoLeyenda; 
    const j = esModoLeyenda ? calcularObjetoLeyenda(jugadorActualEnModal) : jugadorActualEnModal; 
    
    setTimeout(() => {
        renderizarModal(j); 
    }, 150); // Cambia la carta cuando la pantalla está blanca
}

function triggerWhiteFlash() {
    // 1. Buscamos el contenedor de la carta para copiar su posición
    const cont = document.getElementById('modal-card-container');
    if (!cont) return;
    
    // Obtenemos las coordenadas exactas y tamaño
    const rect = cont.getBoundingClientRect(); 

    // 2. Buscamos o creamos el overlay
    let overlay = document.getElementById('white-flash-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'white-flash-overlay';
        document.body.appendChild(overlay);
    }
    
    // 3. Le aplicamos la posición exacta de la carta actual
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    // 4. Encendemos
    overlay.classList.add('active');
    
    // 5. Apagamos a los 0.3 segundos
    setTimeout(() => {
        overlay.classList.remove('active');
    }, 150);
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
    return { ...base, foto: base.fotoLeyenda, flecha: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Estado/6.png", fondo: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/LEYENDA.png", color: COLORES['leyenda'], ...nuevos, prom: Math.min(98, Math.round(suma/6)) };
}

function descargarCarta() { 
    const el = document.getElementById('carta-descarga'); 
    if(!el) return;
    html2canvas(el, { useCORS: true, scale: 3 }).then(cvs => { 
        const a = document.createElement('a'); a.download = 'Carta.png'; a.href = cvs.toDataURL(); a.click(); 
    });
}

/* --- ARMADOR DE EQUIPOS --- */

function abrirArmador() { 
    const m = document.getElementById('team-modal');
    if(m) m.style.display = 'flex'; 
    document.body.classList.add('modal-open'); 
    renderizarListaSeleccion(); 
}

function cerrarArmador() { 
    const m = document.getElementById('team-modal');
    if(m) m.style.display = 'none'; 
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
        const flechaHtml = j.flecha ? `<img src="${j.flecha}" class="list-arrow-img">` : '<div class="list-arrow-spacer"></div>';
        const esLesionado = j.flecha && (j.flecha.includes("/0.") || j.flecha.includes("0.png"));
        if (esLesionado) {return `<div class="player-row disabled">${flechaHtml}<span>${j.nombre}</span> <span style="margin-left:auto; color:#666">${j.prom}</span></div>`;
        } else {return `<div class="player-row ${sel?'selected':''}" onclick="toggleSeleccion(${j.id})">${flechaHtml}<span>${j.nombre}</span> <span style="margin-left:auto; color:${getColorProm(j.prom)}">${j.prom}</span></div>`; }
    }).join('');
    
    cont.innerHTML = html;
    actualizarContadorEquipos(); 
    actualizarTablerosEquipos();
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
    const ok = t === 10; 

    if(cnt) {
        cnt.innerText = `SELECCIONADOS: ${t} / 10`; 
        if(ok) cnt.classList.add('completado'); else cnt.classList.remove('completado'); 
    }

    const checklist = document.getElementById('players-checklist');
    if(checklist) {
        if(ok) checklist.classList.add('limit-reached');
        else checklist.classList.remove('limit-reached');
    }

    // Inhabilitar botón de invitado si llegamos a 10
    const btnAddGuest = document.querySelector('.btn-add-guest');
    if(btnAddGuest) btnAddGuest.disabled = ok;

    const btnGen = document.getElementById('btn-generate');
    if(btnGen) btnGen.disabled = !ok; 
     
    const btnShare = document.getElementById('btn-share-teams');
    if(btnShare) btnShare.style.display = ok ? 'inline-flex' : 'none';
}

function getPlayerData(id) { return id >= 9000 ? invitados.find(i=>i.id===id) : datosOriginales.find(d=>d.id===id); }

function actualizarTablerosEquipos() { 
    renderListaEquipo('list-team-1', equipo1, 'avg-team-1'); 
    renderListaEquipo('list-team-2', equipo2, 'avg-team-2'); 
    actualizarRadar(); 
}

function renderListaEquipo(ulId, ids, avgId) { 
    const ul = document.getElementById(ulId); if(!ul) return;
    ul.innerHTML = ''; let suma = 0; 
    ids.map(getPlayerData).forEach(p => { 
        if(!p) return;
        suma += p.prom; 
        const li = document.createElement('li'); li.className = 'team-player-li'; li.onclick = () => cambiarDeEquipo(p.id);
        const flechaHtml = p.flecha ? `<img src="${p.flecha}" class="list-arrow-img team-list-arrow">` : '';
        li.innerHTML = `<div style="display:flex; align-items:center; gap:8px;">${flechaHtml}<span>${p.nombre}</span></div><span style="color:${getColorProm(p.prom)}">${p.prom}</span>`; 
        ul.appendChild(li); 
    }); 
    const avg = document.getElementById(avgId); if(avg) avg.innerText = `PROM: ${ids.length ? (suma/ids.length).toFixed(1) : 0}`;
}

function getColorProm(v) { return v>=90?STAT_COLORS.legend:v>=80?STAT_COLORS.gold:v>=70?STAT_COLORS.silver:STAT_COLORS.bronze; }

function highlightTeam(idx) {
    if(!teamRadarChart) return;
    document.querySelectorAll('.team-box').forEach((el, i) => { 
        if(i === idx) el.classList.add('highlight'); else el.classList.remove('highlight'); 
    });
    if (idx !== -1) {
        teamRadarChart.data.datasets[0].order = (idx === 0) ? 0 : 1;
        teamRadarChart.data.datasets[1].order = (idx === 1) ? 0 : 1;
    }
    teamRadarChart.update('none');
}

function generarAutomatico() {
    let pool = [...equipo1, ...equipo2].map(getPlayerData);
    if (pool.length !== 10) return;
    const actualSet = new Set([...equipo1]);
    const topArq = [...pool].sort((a, b) => b.arq - a.arq).slice(0, 2).map(p => p.id);
    const topAta = [...pool].sort((a, b) => b.ata - a.ata).slice(0, 2).map(p => p.id);
    const topDef = [...pool].sort((a, b) => b.def - a.def).slice(0, 2).map(p => p.id);
    const topRunners = [...pool].sort((a, b) => (b.vel + b.res) - (a.vel + a.res)).slice(0, 2).map(p => p.id);
    const botRunners = [...pool].sort((a, b) => (b.vel + b.res) - (a.vel + a.res)).slice(8, 10).map(p => p.id);
    const granerosPool = pool.filter(p => p.nombre.toUpperCase().includes("GRANEROS")).map(p => p.id);

    let mejorE1 = [], mejorFealdad = Infinity;

    for (let i = 0; i < 2000; i++) {
        let t = [...pool].sort(() => Math.random() - 0.5);
        let t1 = t.slice(0, 5), t2 = t.slice(5);
        let ids1 = t1.map(p => p.id);
        let s1 = t1.reduce((a, b) => a + b.prom, 0), s2 = t2.reduce((a, b) => a + b.prom, 0);
        let f = Math.abs(s1 - s2) * 100;
        if (granerosPool.length === 2 && ids1.includes(granerosPool[0]) !== ids1.includes(granerosPool[1])) f += 1000000;
        if (ids1.every(id => actualSet.has(id))) f += 5000000;
        if (ids1.filter(id => topArq.includes(id)).length !== 1) f += 15000;
        if (ids1.filter(id => topAta.includes(id)).length !== 1) f += 10000;
        if (ids1.filter(id => topDef.includes(id)).length !== 1) f += 10000;
        if (ids1.filter(id => topRunners.includes(id)).length !== 1) f += 5000;
        if (ids1.filter(id => botRunners.includes(id)).length !== 1) f += 5000;
        if (f < mejorFealdad) { mejorFealdad = f; mejorE1 = ids1; }
    }
    equipo1 = mejorE1;
    equipo2 = pool.map(p => p.id).filter(id => !equipo1.includes(id));
    actualizarTablerosEquipos();
}

function actualizarRadar() {
    const canvas = document.getElementById('radarChart');
    if(!canvas) return;
    const getAvgStats = (ids) => {
        if (!ids.length) return [0,0,0,0,0,0];
        const ps = ids.map(getPlayerData);
        const sum = ps.reduce((acc, p) => ({ ata: acc.ata + (p.ata || 0), def: acc.def + (p.def || 0), tec: acc.tec + (p.tec || 0), vel: acc.vel + (p.vel || 0), res: acc.res + (p.res || 0), arq: acc.arq + (p.arq || 0) }), {ata:0, def:0, tec:0, vel:0, res:0, arq:0});
        return [sum.ata/ids.length, sum.def/ids.length, sum.tec/ids.length, sum.vel/ids.length, sum.res/ids.length, sum.arq/ids.length];
    };
    const data1 = getAvgStats(equipo1), data2 = getAvgStats(equipo2);
    if (!teamRadarChart) {
        const ctx = canvas.getContext('2d');
        teamRadarChart = new Chart(ctx, { type: 'radar', data: { labels: ['ATA', 'DEF', 'TEC', 'VEL', 'RES', 'ARQ'], datasets: [ { label: 'CLARO', data: data1, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: '#ffffff', borderWidth: 3, pointRadius: 0 }, { label: 'OSCURO', data: data2, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderColor: '#000000', borderWidth: 3, pointRadius: 0 } ] }, options: { animation: { duration: 250 }, responsive: true, maintainAspectRatio: false, scales: { r: { 
            min: 0, // AHORA PARTE DESDE CERO
            max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.15)' }, angleLines: { color: 'rgba(255,255,255,0.15)' }, pointLabels: { color: '#ffffff', font: { family: 'Bebas Neue', size: 16 } } } }, plugins: { legend: { display: false } } } });
    } else { teamRadarChart.data.datasets[0].data = data1; teamRadarChart.data.datasets[1].data = data2; teamRadarChart.update(); }
}

async function compartirEquipos() {
    const area = document.getElementById('main-teams-layout');
    const radar = document.getElementById('radar-container');
    if(!area || !radar) return;

    radar.style.display = 'none';

    html2canvas(area, { useCORS: true, backgroundColor: "#1a1a1a", scale: 2 }).then(async canvas => {
        radar.style.display = 'flex';

        canvas.toBlob(async blob => {
            const file = new File([blob], 'Equipos.png', { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Partido de los Martes',
                        text: '¡Equipos armados!'
                    });
                } catch (err) {
                    console.error("Error sharing:", err);
                }
            } else {
                const a = document.createElement('a');
                a.href = canvas.toDataURL();
                a.download = 'Equipos.png';
                a.click();
                alert("Navegador no compatible con compartir. Se descargó la imagen.");
            }
        }, 'image/png');
    });
}

function initAudio() { 
    const p = document.getElementById('audio-player'); 
    if(p && !p.src) { 
        p.src = CONFIG.URL_MUSICA; 
        p.volume = CONFIG.VOL_SERIES[volIndex];
    } 
    if(p) p.play().catch(() => {});
}

function rotateMusic() { 
    const p = document.getElementById('audio-player'); if(!p) return;
    volIndex = (volIndex + 1) % CONFIG.VOL_SERIES.length; 
    p.volume = CONFIG.VOL_SERIES[volIndex]; 
    const ctrl = document.getElementById('music-control'); 
    if(ctrl) ctrl.innerText = ICON_SERIES[volIndex]; 
}

function playHoverSfx() { 
    const s = document.getElementById('sfx-hover-player'); 
    if(s) { 
        s.src = CONFIG.URL_SFX_HOVER; 
        s.volume = CONFIG.SFX_MAP[CONFIG.VOL_SERIES[volIndex]]; 
        s.play().catch(()=>{}); 
    } 
}

function playClickSfx() { 
    const s = document.getElementById('sfx-click-player'); 
    if(s) { 
        s.src = CONFIG.URL_SFX_CLICK; 
        s.volume = Math.min(1, CONFIG.SFX_MAP[CONFIG.VOL_SERIES[volIndex]] * 4); 
        s.play().catch(()=>{}); 
    } 
}

function attachSounds() {
    document.querySelectorAll('.btn, .card, .player-row, .team-player-li').forEach(el => {
        if(!el.dataset.soundAttached) {
            if(!el.classList.contains('player-row')) el.addEventListener('mouseenter', playHoverSfx);
            el.addEventListener('mousedown', () => { if(el.classList.contains('player-row')) playHoverSfx(); else playClickSfx(); });
            el.dataset.soundAttached = "true";
        }
    }); 
}





