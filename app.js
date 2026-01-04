const CONFIG = {
    MULT_LEYENDA: [1.13, 1.11, 1.09, 1.07, 1.05, 1.03],
    PLUS_EDAD_COEF: 0.0028,
    BONUS_RESISTENCIA: 1.05,
    BONUS_VELOCIDAD: 1.03,
    TOPE_STAT_LEYENDA: 98,
    VOL_SERIES: [0.05, 0.2, 0],
    ICON_SERIES: ["🔉", "🔊", "🔈"],
    SFX_MAP: { 0: 0.0075, 0.05: 0.0375, 0.2: 0.15 },
    URLS: {
        FONDO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Fondo.png",
        TITULO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Titulo.png",
        MUSICA: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Musica.mp3",
        LEYENDA_FONDO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/LEYENDA.png",
        SFX_HOVER: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 1.mp3",
        SFX_CLICK: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 2.mp3",
        CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHOyW-OmPwPBpIwBw30sBjYdcLn1_8xFjkXfG9_tLFeB960jfYnnouTDieGPeKSK49FYM1tSGng_mg/pub?gid=1826229647&single=true&output=csv"
    },
    COLORES: {
        leyenda: '#644b14',
        legendario: '#372864',
        oro: '#624f21',
        plata: '#434343',
        bronce: '#5e3e21'
    },
    STATS: {
        legend: '#a855f7',
        gold: '#d4af37',
        silver: '#7a7a7a',
        bronze: '#5e3e21'
    }
};

let volIndex = 0;
let datosOriginales = [];
let invitados = [];
let equipo1 = [];
let equipo2 = [];
let jugadorActualEnModal = null;
let esModoLeyenda = false;

document.addEventListener("DOMContentLoaded", () => {
    if(CONFIG.URLS.FONDO) document.documentElement.style.setProperty('--fondo-url', `url('${CONFIG.URLS.FONDO}')`);
    if(CONFIG.URLS.TITULO) document.getElementById('header-area').innerHTML = `<img src="${CONFIG.URLS.TITULO}" class="title-img">`;
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    cargarDatos();
    new MutationObserver(attachSounds).observe(document.body, { childList: true, subtree: true });
    document.getElementById('search-input').addEventListener('input', aplicarFiltrosYOrden);
    document.getElementById('sort-select').addEventListener('change', aplicarFiltrosYOrden);
});

function initAudio() {
    const p = document.getElementById('audio-player');
    if(!p.src) { p.src = CONFIG.URLS.MUSICA; p.volume = CONFIG.VOL_SERIES[0]; }
    p.play().catch(() => {});
    window.removeEventListener('click', initAudio);
}

function rotateMusic() {
    const p = document.getElementById('audio-player');
    const c = document.getElementById('music-control');
    volIndex = (volIndex + 1) % CONFIG.VOL_SERIES.length;
    p.volume = CONFIG.VOL_SERIES[volIndex];
    c.innerText = CONFIG.ICON_SERIES[volIndex];
    if (p.volume > 0) p.play(); else p.pause();
}

function playHoverSfx() {
    const s = document.getElementById('sfx-hover-player');
    if(CONFIG.URLS.SFX_HOVER) { 
        s.src = CONFIG.URLS.SFX_HOVER; 
        s.volume = CONFIG.SFX_MAP[CONFIG.VOL_SERIES[volIndex]]; 
        s.play().catch(()=>{}); 
    }
}

function playClickSfx() {
    const s = document.getElementById('sfx-click-player');
    if(CONFIG.URLS.SFX_CLICK) { 
        s.src = CONFIG.URLS.SFX_CLICK; 
        s.volume = CONFIG.SFX_MAP[CONFIG.VOL_SERIES[volIndex]]; 
        s.play().catch(()=>{}); 
    }
}

function attachSounds() {
    document.querySelectorAll('.btn, .card, .player-row, .team-player-li').forEach(el => {
        if(!el.dataset.soundAttached) {
            if(!el.classList.contains('player-row')) el.addEventListener('mouseenter', playHoverSfx);
            if(el.classList.contains('player-row')) el.addEventListener('mousedown', playHoverSfx);
            else el.addEventListener('mousedown', playClickSfx);
            el.dataset.soundAttached = "true";
        }
    });
}

function cargarDatos() {
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(CONFIG.URLS.CSV + "&uid=" + Date.now());
    Papa.parse(PROXY_URL, {
        download: true, header: false, skipEmptyLines: true,
        complete: (results) => {
            document.getElementById('loader').style.display = 'none';
            const data = results.data; if(data.length > 0) data.shift();
            datosOriginales = data.map((fila, index) => {
                if(!fila[0] || fila[0].trim() === 'Jugador') return null;
                return {
                    id: index, nombre: fila[0], prom: parseInt(fila[8]) || 60,
                    ata: parseInt(fila[2]), def: parseInt(fila[3]), tec: parseInt(fila[4]),
                    vel: parseInt(fila[5]), res: parseInt(fila[6]), arq: parseInt(fila[7]),
                    edad: parseInt(fila[1]) || 25, pos: fila[9], fondo: fila[11],
                    foto: fila[12], fotoLeyenda: fila[13] ? fila[13].trim() : "", 
                    color: CONFIG.COLORES[fila[10]?.trim().toLowerCase()] || '#624f21'
                };
            }).filter(i => i !== null);
            aplicarFiltrosYOrden();
        }
    });
}

function aplicarFiltrosYOrden() {
    const t = document.getElementById('search-input').value.toLowerCase();
    const [c, o] = document.getElementById('sort-select').value.split('-');
    let lista = datosOriginales.filter(j => j.nombre.toLowerCase().includes(t));
    lista.sort((a,b) => c === 'nombre' ? (o === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)) : (o === 'asc' ? a.prom - b.prom : b.prom - a.prom));
    document.getElementById('grid-container').innerHTML = lista.map(j => `<div class="card" onclick="abrirModal(${j.id})">${generarHTMLCarta(j, true)}</div>`).join('');
    attachSounds();
}

function generarHTMLCarta(j, lazy) {
    return `<div class="card-bg-wrapper"><img src="${j.fondo}" class="card-bg" ${lazy?'loading="lazy"':''} crossorigin="anonymous"></div>
            <div class="shine-layer" style="mask-image:url('${j.fondo}'); -webkit-mask-image:url('${j.fondo}');"></div>
            ${j.foto ? `<img src="${j.foto}" class="card-face" crossorigin="anonymous">` : ''}
            <div class="info-layer" style="color:${j.color}">
                <div class="rating">${j.prom}</div><div class="position">${j.pos}</div><div class="name">${j.nombre}</div>
                <div class="stats-container"><span class="stat-val">${j.ata}</span><span class="stat-val">${j.def}</span><span class="stat-val">${j.tec}</span><span class="stat-val">${j.vel}</span><span class="stat-val">${j.res}</span><span class="stat-val">${j.arq}</span></div>
            </div>`;
}

function abrirModal(id) {
    const j = datosOriginales.find(x => x.id === parseInt(id));
    jugadorActualEnModal = JSON.parse(JSON.stringify(j));
    esModoLeyenda = false;
    document.getElementById('modal').style.display = 'flex';
    renderizarModal(jugadorActualEnModal);
}

function renderizarModal(j) {
    document.getElementById('modal-card-container').innerHTML = `<div class="card" id="carta-descarga">${generarHTMLCarta(j, false)}</div>`;
    document.getElementById('modal-buttons').innerHTML = `<div class="btn-group">
            ${j.fotoLeyenda ? `<button class="btn ${esModoLeyenda?'btn-ghost':'btn-gold'}" onclick="toggleLeyenda()">${esModoLeyenda?"ACTUAL":"LEYENDA"}</button>`:''}
            <button class="btn btn-gold" onclick="descargarCarta()">DESCARGAR</button>
            <button class="btn btn-ghost" onclick="document.getElementById('modal').style.display='none'">CERRAR</button>
        </div>`;
    attachSounds();
}

function toggleLeyenda() {
    esModoLeyenda = !esModoLeyenda;
    const j = esModoLeyenda ? calcularObjetoLeyenda(jugadorActualEnModal) : jugadorActualEnModal;
    renderizarModal(j);
    const card = document.getElementById('carta-descarga');
    if(card) {
        card.classList.remove('trigger-shine', 'trigger-shine-reverse');
        void card.offsetWidth;
        card.classList.add(esModoLeyenda ? 'trigger-shine' : 'trigger-shine-reverse');
    }
}

function calcularObjetoLeyenda(base) {
    const keys = ['ata','def','tec','vel','res','arq'];
    const sorted = keys.map(k => ({k, v: base[k]})).sort((a,b)=>b.v-a.v);
    let nuevos = {}, suma = 0;
    const plus = Math.max(0, (base.edad - 28) * CONFIG.PLUS_EDAD_COEF);
    sorted.forEach((s, i) => {
        let m = CONFIG.MULT_LEYENDA[i] || 1.05;
        let val = s.v * (m + plus);
        if(s.k === 'res') val *= CONFIG.BONUS_RESISTENCIA;
        if(s.k === 'vel') val *= CONFIG.BONUS_VELOCIDAD;
        if(s.k === 'arq' && i > 2) val = Math.min(val, s.v + 12);
        nuevos[s.k] = Math.min(CONFIG.TOPE_STAT_LEYENDA, Math.round(val));
        suma += nuevos[s.k];
    });
    return { ...base, foto: base.fotoLeyenda, fondo: CONFIG.URLS.LEYENDA_FONDO, color: CONFIG.COLORES.leyenda, ...nuevos, prom: Math.min(98, Math.round(suma/6)) };
}

function descargarCarta() {
    const el = document.getElementById('carta-descarga'); 
    el.querySelector('.shine-layer').style.display = 'none';
    html2canvas(el, { useCORS: true, scale: 3 }).then(cvs => {
        const a = document.createElement('a'); 
        a.download = 'Carta.png'; 
        a.href = cvs.toDataURL(); 
        a.click();
        el.querySelector('.shine-layer').style.display = 'block';
    });
}

function abrirArmador() { 
    document.getElementById('team-modal').style.display = 'flex'; 
    equipo1 = []; 
    equipo2 = []; 
    renderizarListaSeleccion(); 
}

function cerrarArmador() { 
    document.getElementById('team-modal').style.display = 'none'; 
}

function agregarInvitado() {
    const id = 9000 + invitados.length + 1;
    invitados.push({id, nombre: `Invitado ${invitados.length+1}`, prom: 70, edad: 25, arq: 50, res: 70, esInvitado: true});
    (equipo1.length <= equipo2.length ? equipo1 : equipo2).push(id); 
    renderizarListaSeleccion();
}

function borrarInvitado(id) { 
    invitados = invitados.filter(i => i.id !== parseInt(id)); 
    equipo1 = equipo1.filter(x=>x!==parseInt(id)); 
    equipo2 = equipo2.filter(x=>x!==parseInt(id)); 
    renderizarListaSeleccion(); 
}

function isPlayerSelected(id) { 
    return equipo1.includes(parseInt(id)) || equipo2.includes(parseInt(id)); 
}

function editarInvitado(id, campo, valor) {
    const inv = invitados.find(i => i.id === parseInt(id));
    if (inv) {
        if (campo === 'nombre') inv.nombre = valor;
        else if (campo === 'prom') inv.prom = parseInt(valor) || 0;
        actualizarTablerosEquipos();
    }
}

function renderizarListaSeleccion() {
    const cont = document.getElementById('players-checklist');
    const total = equipo1.length + equipo2.length;
    let html = invitados.map(i => {
        const sel = isPlayerSelected(i.id);
        return `<div class="player-row guest-item ${sel?'selected':''} ${total>=10 && !sel?'disabled':''}" onclick="toggleSeleccion(${i.id})">
            <div class="guest-controls">
                <input type="checkbox" ${sel?'checked':''} style="pointer-events:none;">
                <input type="text" value="${i.nombre}" onchange="editarInvitado(${i.id},'nombre',this.value)" onclick="event.stopPropagation()" style="background:transparent;border:none;color:white;width:80px;font-family:var(--fuente-datos);">
                <input type="number" value="${i.prom}" onchange="editarInvitado(${i.id},'prom',this.value)" onclick="event.stopPropagation()" style="width:35px;background:transparent;border:1px solid #333;color:${getColorProm(i.prom)};font-family:var(--fuente-datos);text-align:center;padding:2px;">
            </div>
            <span class="delete-guest" onclick="event.stopPropagation(); borrarInvitado(${i.id})">✕</span>
        </div>`;
    }).join('');
    
    html += [...datosOriginales].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(j => {
        const sel = isPlayerSelected(j.id);
        return `<div class="player-row ${sel?'selected':''} ${total>=10 && !sel?'disabled':''}" onclick="toggleSeleccion(${j.id})">
            <input type="checkbox" ${sel?'checked':''} style="pointer-events:none;">
            <span>${j.nombre}</span>
            <span style="margin-left:auto;opacity:0.7;font-family:var(--fuente-datos);color:${getColorProm(j.prom)};">${j.prom}</span>
        </div>`;
    }).join('');
    cont.innerHTML = html;
    actualizarContadorEquipos(); 
    actualizarTablerosEquipos();
}

function toggleSeleccion(id) {
    const nid = parseInt(id);
    if (isPlayerSelected(nid)) { equipo1 = equipo1.filter(x=>x!==nid); equipo2 = equipo2.filter(x=>x!==nid); }
    else if ((equipo1.length + equipo2.length) < 10) (equipo1.length <= equipo2.length ? equipo1 : equipo2).push(nid);
    renderizarListaSeleccion();
}

function actualizarContadorEquipos() {
    const t = equipo1.length + equipo2.length; 
    document.getElementById('team-counter').innerText = `SELECCIONADOS: ${t} / 10`;
    const ok = t === 10; 
    document.getElementById('btn-generate').style.opacity = ok ? '1' : '0.5';
    document.getElementById('btn-generate').style.pointerEvents = ok ? 'auto' : 'none';
    document.getElementById('btn-share-teams').style.display = ok ? 'block' : 'none';
}

function getPlayerData(id) { 
    return id >= 9000 ? invitados.find(i=>i.id===id) : datosOriginales.find(d=>d.id===id); 
}

function actualizarTablerosEquipos() { 
    renderListaEquipo('list-team-1', equipo1, 'avg-team-1'); 
    renderListaEquipo('list-team-2', equipo2, 'avg-team-2'); 
}

function renderListaEquipo(ulId, ids, avgId) {
    const ul = document.getElementById(ulId); ul.innerHTML = ''; let suma = 0;
    ids.map(getPlayerData).filter(x=>x).sort((a,b)=>a.nombre.localeCompare(b.nombre)).forEach(p => {
        suma += p.prom; const li = document.createElement('li'); li.className = 'team-player-li';
        li.innerHTML = `<span>${p.nombre}</span><span style="color:${getColorProm(p.prom)}">${p.prom}</span>`;
        li.onclick = () => { if(equipo1.includes(p.id)){equipo1=equipo1.filter(x=>x!==p.id);equipo2.push(p.id);}else{equipo2=equipo2.filter(x=>x!==p.id);equipo1.push(p.id);} actualizarTablerosEquipos(); };
        ul.appendChild(li);
    });
    document.getElementById(avgId).innerText = `PROM: ${ids.length ? (suma/ids.length).toFixed(1) : 0}`;
}

function getColorProm(v) { 
    if(v>=90) return CONFIG.STATS.legend;
    if(v>=80) return CONFIG.STATS.gold;
    if(v>=70) return CONFIG.STATS.silver;
    return CONFIG.STATS.bronze;
}

function generarAutomatico() {
    let pool = [...equipo1, ...equipo2].map(getPlayerData); if (pool.length !== 10) return;
    const currentE1 = [...equipo1].sort().join(',');
    const sortedProm = [...pool].sort((a,b) => b.prom - a.prom);
    const cracks = sortedProm.slice(0, 2).map(p => p.id);
    const resaca = sortedProm.slice(8, 10).map(p => p.id);
    const pulmones = [...pool].sort((a,b) => b.res - a.res).slice(0, 3).map(p => p.id);
    const graneros = pool.filter(p => p.nombre.includes("Graneros")).map(p => p.id);
    pool.sort((a, b) => (b.arq || 50) - (a.arq || 50));
    const arqA = pool[0], arqB = pool[1], restoOriginal = pool.slice(2);
    let mejorE1 = [], menorFealdad = 999999;
    for (let i = 0; i < 500; i++) {
        let temp = [...restoOriginal].sort(() => Math.random() - 0.5);
        temp.forEach(p => { p._pwr = p.prom + (Math.random() * 2 - 1); });
        let t1 = [arqA], t2 = [arqB], s1 = arqA.prom, s2 = arqB.prom;
        temp.forEach(p => {
            if ((s1 <= s2 && t1.length < 5) || t2.length >= 5) { t1.push(p); s1 += p.prom; }
            else { t2.push(p); s2 += p.prom; }
        });
        const idsT1 = t1.map(p => p.id);
        let f = Math.abs(s1 - s2) * 10; 
        if (graneros.length === 2 && idsT1.includes(graneros[0]) !== idsT1.includes(graneros[1])) f += 500;
        if (cracks.filter(id => idsT1.includes(id)).length !== 1) f += 50; 
        if (resaca.filter(id => idsT1.includes(id)).length !== 1) f += 50;
        if ([0,3].includes(pulmones.filter(id => idsT1.includes(id)).length)) f += 60; 
        if (idsT1.sort().join(',') === currentE1) f += 200; 
        if (f < menorFealdad) { menorFealdad = f; mejorE1 = idsT1; }
    }
    if (mejorE1.length) { 
        equipo1 = mejorE1; equipo2 = pool.map(p=>p.id).filter(id => !equipo1.includes(id));
        if (Math.random() > 0.5) { let t = equipo1; equipo1 = equipo2; equipo2 = t; }
    }
    actualizarTablerosEquipos();
}

function compartirEquipos() {
    html2canvas(document.getElementById('team-capture-area'), { backgroundColor: '#1a1a1a', scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            const file = new File([blob], "equipos.png", { type: "image/png" });
            if(navigator.share) navigator.share({ files: [file], title: 'Equipos' });
            else { const a = document.createElement('a'); a.download = 'Equipos.png'; a.href = canvas.toDataURL(); a.click(); }
        });
    });
}