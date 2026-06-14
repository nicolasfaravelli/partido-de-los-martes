const CONFIG = {
    URL_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHOyW-OmPwPBpIwBw30sBjYdcLn1_8xFjkXfG9_tLFeB960jfYnnouTDieGPeKSK49FYM1tSGng_mg/pub?gid=1826229647&single=true&output=csv",
    URL_FONDO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Fondo.png",
    URL_TITULO: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Titulo.png",
    URL_MUSICA: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Musica.mp3",
    URL_SFX_HOVER: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 1.mp3",
    URL_SFX_CLICK: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Click 2.mp3",
    VOL_SERIES: [0, 0.05, 0.3],
    SFX_MAP: { 0: 0, 0.05: 0.0375, 0.3: 0.225 }
};

const COLORES = { 'leyenda': '#675022', 'legendario': '#372864', 'oro': '#6e5a27', 'plata': '#4c4c4c', 'bronce': '#5e3e21' };
const STAT_COLORS = { 'legend': '#372864', 'gold': '#6e5a27', 'silver': '#4c4c4c', 'bronze': '#5e3e21' };
const ICON_SERIES = ["🔈", "🔉", "🔊"];
let datosOriginales = [], invitados = [], equipo1 = [], equipo2 = [];
let jugadorActualEnModal = null, esModoLeyenda = false, volIndex = 0, teamRadarChart = null;
let ultimasFechas = [];
let totalPartidosAnio = 0;

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
            
            if(data && data.length > 0) {
                ultimasFechas = [data[0][15]||"", data[0][16]||"", data[0][17]||"", data[0][18]||"", data[0][19]||""];
                totalPartidosAnio = parseInt(data[0][20]) || 0;
                data.shift(); 
            }
            datosOriginales = data.map((fila, index) => { 
                if(!fila || !fila[0] || fila[0].trim() === 'Jugador') return null;
                return { 
                    id: index, nombre: fila[0], prom: parseInt(fila[8]) || 60, 
                    ata: parseInt(fila[2]) || 0, def: parseInt(fila[3]) || 0, tec: parseInt(fila[4]) || 0, 
                    vel: parseInt(fila[5]) || 0, res: parseInt(fila[6]) || 0, arq: parseInt(fila[7]) || 0, 
                    edad: parseInt(fila[1]) || 25, pos: fila[9] || '?', fondo: fila[11] || '', 
                    foto: fila[12] || '', fotoLeyenda: fila[13] ? fila[13].trim() : "" , 
                    flecha: fila[14] || '',
                    color: COLORES[fila[10]?.trim().toLowerCase()] || '#624f21',
                    racha: [fila[15]||"-", fila[16]||"-", fila[17]||"-", fila[18]||"-", fila[19]||"-"],
                    pj: fila[20] || '0',
                    pg: fila[21] || '0',
                    pp: fila[22] || '0',
                    efec: fila[23] || '0%',
                    mejorComp: fila[24] ? fila[24].trim() : '',
                    peorComp: fila[25] ? fila[25].trim() : ''
                };
            }).filter(i => i !== null);
            aplicarFiltrosYOrden();
        }
    }); 
}

function aplicarFiltrosYOrden() {
    const grid = document.getElementById('grid-container');
    if(!grid) return;
    const t = document.getElementById('search-input').value.toLowerCase();
    const [c, o] = document.getElementById('sort-select').value.split('-');
    let lista = datosOriginales.filter(j => j.nombre.toLowerCase().includes(t));
    lista.sort((a, b) => {
        if (c === 'nombre') {
            const apellidoA = a.nombre.trim().split(' ').pop();
            const apellidoB = b.nombre.trim().split(' ').pop();
            return o === 'asc' ? apellidoA.localeCompare(apellidoB) : apellidoB.localeCompare(apellidoA);
        }
        return o === 'asc' ? a.prom - b.prom : b.prom - a.prom;
    });
    grid.innerHTML = lista.map(j => {
        const esSSJ2 = j.flecha && j.flecha.includes("5.png");
        // Reemplazá 'URL_DE_TU_GIF.gif' por el link real a tu archivo de electricidad
        const capaRayos = esSSJ2 ? `<div class="efecto-rayos" style="background-image: url('URL_DE_TU_GIF.gif'); -webkit-mask-image: url('${j.fondo}'); mask-image: url('${j.fondo}');"></div>` : "";
        return `<div class="card" onclick="abrirModal(${j.id})">
        ${generarHTMLCarta(j, true)}
        ${capaRayos}
        </div>`;
    }).join('');
    attachSounds();
}

function generarHTMLCarta(j, lazy) { 
    const rgb = hexToRgb(j.color);
    const flechaImg = j.flecha ? `<img src="${j.flecha}" class="card-arrow" style="--color-rgb: ${rgb}" crossorigin="anonymous">` : '';
    return `<div class="card-bg-wrapper" style="--card-glow-color:${j.color}"><img src="${j.fondo}" class="card-bg" ${lazy?'loading="lazy"':''} crossorigin="anonymous"></div><div class="shine-layer" style="mask-image:url('${j.fondo}'); -webkit-mask-image:url('${j.fondo}');"></div>${j.foto ? `<img src="${j.foto}" class="card-face" crossorigin="anonymous">` : ''}<div class="info-layer" style="color:${j.color}"><div class="rating">${j.prom}</div><div class="position">${j.pos}</div>${flechaImg}<div class="name">${j.nombre}</div><div class="stats-container"><span class="stat-val">${j.ata}</span><span class="stat-val">${j.def}</span><span class="stat-val">${j.tec}</span><span class="stat-val">${j.vel}</span><span class="stat-val">${j.res}</span><span class="stat-val">${j.arq}</span></div></div>`;
}

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
    if(cardCont) {
        const fondoDorso = j.fondo.replace(/\.png/i, '_DORSO.png');
        
        // --- CÁLCULOS Y GRADIENTES ---
        const efecNum = parseInt(j.efec) || 0;
        const asisPorcentaje = totalPartidosAnio > 0 ? Math.round((parseInt(j.pj) / totalPartidosAnio) * 100) : 0;

        // Fórmula para gradiente exacto: Rojo (#C62828) -> Amarillo homogéneo -> Verde (#2E7D32)
        const getColorRango = (val) => {
            const v = Math.max(0, Math.min(100, val));
            const h = (v / 100) * 123;       // Tono: de 0 (Rojo) a 123 (Verde)
            const s = 66 - ((v / 100) * 20); // Saturación: de 66% a 46%
            const l = 47 - ((v / 100) * 13); // Luminosidad: de 47% a 34%
            return `hsl(${h}, ${s}%, ${l}%)`;
        };

        const colorEfec = getColorRango(efecNum);
        const colorAsis = getColorRango(asisPorcentaje);

        // --- VARIABLES EDITABLES: TAMAÑOS ---
        const tam2026 = "9cqw";               
        const tamLblAsistencia = "6.75cqw";    
        const tamValAsistencia = "9cqw";      
        const tamValAsisFraccion = "6.75cqw";  
        const tamLblRend = "6.75cqw";          
        const tamValRend = "9cqw";            
        const tamSocioTexto = "4.5cqw";       
        const tamSocioIcono = "4.5cqw";       

        // --- VARIABLES EDITABLES: ESPACIOS VERTICALES ---
        const posVBloquePrincipal = "5%";     
        const esp_Bajo_2026 = "15px";          
        const esp_Bajo_PalabraAsis = "5px";   
        const esp_Bajo_NumAsis = "15px";      
        const esp_Bajo_PalabrasRend = "5px";  
        const esp_Bajo_BloqueRend = "15px";   
        const esp_Entre_Socios = "5px";       
        
        // --- IMÁGENES ---
        const urlSocioIdeal = "https://via.placeholder.com/20/000000/FFFFFF/?text=+";
        const urlMalaQuimica = "https://via.placeholder.com/20/000000/FFFFFF/?text=-";
        const htmlStatsTop = `
            <div style="position:absolute; top:${posVBloquePrincipal}; left:5%; width:90%; display:flex; flex-direction:column; z-index:10; text-align:center;">
                
                <div style="font-family:var(--fuente-impacto); font-size:${tam2026}; color:${j.color}; line-height:1; margin-bottom:${esp_Bajo_2026};">
                    2026
                </div>

                <div style="font-family:var(--fuente-impacto); font-size:${tamLblAsistencia}; color:${j.color}; line-height:1; margin-bottom:${esp_Bajo_PalabraAsis};">
                    ASISTENCIA
                </div>
                <div style="font-family:var(--fuente-impacto); font-size:${tamValAsistencia}; color:${colorAsis}; line-height:1; margin-bottom:${esp_Bajo_NumAsis};">
                    ${asisPorcentaje}% <span style="font-size:${tamValAsisFraccion}; color:#fff;">(${j.pj}/${totalPartidosAnio})</span>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:0 5%; margin-bottom:${esp_Bajo_BloqueRend};">
                    <div style="display:flex; flex-direction:column; align-items:center; width:30%; gap:${esp_Bajo_PalabrasRend};">
                        <span style="font-family:var(--fuente-impacto); font-size:${tamLblRend}; color:${j.color}; line-height:1;">GANADOS</span>
                        <span style="font-family:var(--fuente-impacto); font-size:${tamValRend}; color:#2E7D32; line-height:1;">${j.pg}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; width:40%; gap:${esp_Bajo_PalabrasRend};">
                        <span style="font-family:var(--fuente-impacto); font-size:${tamLblRend}; color:${j.color}; line-height:1;">EFECTIVIDAD</span>
                        <span style="font-family:var(--fuente-impacto); font-size:${tamValRend}; color:${colorEfec}; line-height:1;">${j.efec}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; width:30%; gap:${esp_Bajo_PalabrasRend};">
                        <span style="font-family:var(--fuente-impacto); font-size:${tamLblRend}; color:${j.color}; line-height:1;">PERDIDOS</span>
                        <span style="font-family:var(--fuente-impacto); font-size:${tamValRend}; color:#C62828; line-height:1;">${j.pp}</span>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:${esp_Entre_Socios};">
                    ${j.mejorComp ? `
                        <div style="font-family:var(--fuente-datos); font-size:${tamSocioTexto}; font-weight:800; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <img src="${urlSocioIdeal}" alt="Icono" style="width:${tamSocioIcono}; height:${tamSocioIcono}; object-fit:contain;">
                            <span style="color:${j.color};">MEJOR SOCIO:</span> <span style="color:#2E7D32;">${j.mejorComp}</span>
                        </div>` : ''}
                    ${j.peorComp ? `
                        <div style="font-family:var(--fuente-datos); font-size:${tamSocioTexto}; font-weight:800; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <img src="${urlMalaQuimica}" alt="Icono" style="width:${tamSocioIcono}; height:${tamSocioIcono}; object-fit:contain;">
                            <span style="color:${j.color};">MALA QUÍMICA:</span> <span style="color:#C62828;">${j.peorComp}</span>
                        </div>` : ''}
                </div>

            </div>
        `;
        
        // --- 1. POSICIÓN DEL BLOQUE COMPLETO DE RACHAS (ABAJO) ---
        const posVBloque = "75%";            
        // --- 2. LAS FECHAS ---
        const tamFuenteFecha = "8.65cqw";    
        const grosorFecha = "599.9";          
        const anchoEscalaFecha = "0.925";        
        const espaciadoLetraFecha = "-0.5px";   
        const espacioHaciaCuadrado = "3.25px";  
        // --- 3. LOS CUADRADOS ---
        const anchoCuadrado = "46%";         
        const redondeoCuadrado = "100px";      
        // --- 4. LAS LETRAS DE RESULTADO (EL DESFASE VISUAL) ---
        const tamLetraRes = "6.5cqw";        
        const microAjusteLetraV = "1px";      

        const htmlRacha = ultimasFechas.map((fecha, i) => {
        const res = (j.racha[i] || "-").trim().toUpperCase();            
            let bgColor = 'rgba(0, 0, 0, 0.25)';
            if(res === 'G') bgColor = '#2E7D32';
            if(res === 'P') bgColor = '#C62828';            
            return `
                <div style="display:flex; flex-direction:column; align-items:center; width:20%; box-sizing:border-box;">
                    <span style="
                        font-family:var(--fuente-impacto); 
                        font-size:${tamFuenteFecha}; 
                        font-weight:${grosorFecha};
                        letter-spacing:${espaciadoLetraFecha};
                        transform:scaleX(${anchoEscalaFecha});
                        display:inline-block;
                        color:${j.color}; 
                        margin-bottom:${espacioHaciaCuadrado}; 
                        line-height:1;
                        text-align:center;
                    ">${fecha}</span>
                    
                    <div style="
                        background-color:${bgColor}; 
                        width:${anchoCuadrado}; 
                        aspect-ratio:1; 
                        position:relative; 
                        border-radius:${redondeoCuadrado}; 
                        border:0.15px solid rgba(0,0,0,0.15);
                        box-sizing:border-box;
                    ">
                        <span style="
                            font-family:var(--fuente-impacto); 
                            font-size:${tamLetraRes}; 
                            color:#FFF; 
                            line-height:1; 
                            position:absolute;
                            top:50%;
                            left:50%;
                            transform:translate(-50%, calc(-50% + ${microAjusteLetraV}));
                            margin:0;
                        ">${res}</span>
                    </div>
                </div>
            `;
        }).join('');

        const esSSJ2 = j.flecha && j.flecha.includes("5.png");
        const capaRayos = esSSJ2 ? `<div class="efecto-rayos" style="background-image: url('URL_DE_TU_GIF.gif'); -webkit-mask-image: url('${j.fondo}'); mask-image: url('${j.fondo}');"></div>` : "";

        cardCont.innerHTML = `
            <div class="card modal-card" id="carta-descarga" onclick="this.classList.toggle('flipped')">
                <div class="card-inner">
                    <div class="card-front">
                        ${generarHTMLCarta(j, false)}
                        ${capaRayos}
                    </div>
                    <div class="card-back">
                        <div class="card-bg-wrapper" style="--card-glow-color:${j.color}">
                        <img src="${fondoDorso}" class="card-bg" crossorigin="anonymous">
                        </div>
                        
                        ${j.foto ? `<img src="${j.foto}" class="card-face" style="opacity: 0.35;" crossorigin="anonymous">` : ''}
                        
                        <div class="card-bg-wrapper blend-layer">
                        <img src="${fondoDorso}" class="card-bg" crossorigin="anonymous">
                        </div>
                        <div class="info-layer" style="color:${j.color}">
                            ${htmlStatsTop}
                            <div class="name">${j.nombre}</div>
                            <div class="stats-container" style="top: ${posVBloque}; left: 6.25%; width: 87.5%; justify-content: space-between;">
                                ${htmlRacha}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if(btnCont) {
        btnCont.innerHTML = `
            ${j.fotoLeyenda ? `<button class="btn ${esModoLeyenda?'':'btn-gold'}" onclick="toggleLeyenda()">${esModoLeyenda?"ACTUAL":"LEYENDA"}</button>` : ''}
            <button class="btn" onclick="descargarCarta()">DESCARGAR</button>
            <button class="btn btn-ghost" onclick="cerrarModalCarta()">CERRAR</button>
        `; 
    }
    attachSounds();
}

function cerrarModalCarta() { document.getElementById('modal').style.display='none'; document.body.classList.remove('modal-open'); }
function toggleLeyenda() { 
    const cont = document.getElementById('modal-card-container');
    if(!cont) return;
    triggerWhiteFlash();
    esModoLeyenda = !esModoLeyenda; 
    const j = esModoLeyenda ? calcularObjetoLeyenda(jugadorActualEnModal) : jugadorActualEnModal; 
    setTimeout(() => {
        renderizarModal(j); 
    }, 150);
}

function triggerWhiteFlash() {
    const cont = document.getElementById('modal-card-container');
    if (!cont) return;
    const rect = cont.getBoundingClientRect(); 
    let overlay = document.getElementById('white-flash-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'white-flash-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.classList.add('active');
    setTimeout(() => {
        overlay.classList.remove('active');
    }, 150);
}

function calcularObjetoLeyenda(base) { 
    const sumaStatsBase = base.ata + base.def + base.tec + base.vel + base.res + base.arq;
    const promedioRealBase = sumaStatsBase / 6;
    const F = base.prom / promedioRealBase;
    const keys = ['ata','def','tec','vel','res','arq']; 
    const sorted = keys.map(k => ({k, v: base[k]})).sort((a,b) => b.v - a.v); 
    const escala = [1.086, 1.076, 1.076, 1.066, 1.066, 1.056];
    const plusEdad = Math.max(0, (base.edad - 33) * 0.004);
    let nuevosStats = {}, sumaRealLeyenda = 0; 
    sorted.forEach((s, i) => { 
        let m = escala[i] + plusEdad; 
        if(s.k === 'res') m += 0.015; 
        if(s.k === 'vel') m += 0.005; 
        nuevosStats[s.k] = Math.min(98.4, Math.round(base[s.k] * m)); 
        sumaRealLeyenda += nuevosStats[s.k]; 
    }); 
    const promedioRealLeyenda = sumaRealLeyenda / 6;
    const promFinal = Math.min(98.4, Math.round(promedioRealLeyenda * F));
    return { ...base, foto: base.fotoLeyenda, flecha: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Estado/6.png", fondo: "https://raw.githubusercontent.com/nicolasfaravelli/partido-de-los-martes/main/Cartas/LEYENDA.png", color: '#644b14', ...nuevosStats, prom: promFinal };
}

function descargarCarta() { 
    const el = document.getElementById('carta-descarga'); 
    if(!el) return;
    const isFlipped = el.classList.contains('flipped');
    const front = el.querySelector('.card-front');
    const back = el.querySelector('.card-back');
    if (isFlipped) {
        front.style.display = 'none';
    } else {
        back.style.display = 'none';
    }
    html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(cvs => { 
        front.style.display = '';
        back.style.display = '';

        const a = document.createElement('a'); 
        a.download = 'Carta.png'; 
        a.href = cvs.toDataURL(); 
        a.click(); 
    });
}

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
    invitados.push({id, nombre: `Invitado ${invitados.length+1}`, prom: 70, ata: 70, def: 70, tec: 70, vel: 70, res: 70, arq: 70, edad: 30, esInvitado: true}); 
    (equipo1.length <= equipo2.length ? equipo1 : equipo2).push(id); 
    renderizarListaSeleccion();
}

function renderizarListaSeleccion() {
    const cont = document.getElementById('players-checklist');
    if(!cont) return;
    
    let html = invitados.map(i => {
        const sel = equipo1.includes(i.id) || equipo2.includes(i.id);
        return `
        <div class="player-row ${sel ? 'selected' : ''}" onclick="toggleSeleccion(${i.id})">
            <span onclick="event.stopPropagation(); borrarInvitado(${i.id})" 
                style="color: #ff4444; font-weight: bold; font-size: 1.5rem; display: inline-block; width: 22px; text-align: center;">×</span>
            <span contenteditable="true" spellcheck="false" 
                onclick="event.stopPropagation()" 
                onblur="actualizarInvitado(${i.id}, 'nombre', this.innerText)">${i.nombre}</span>
            <span contenteditable="true" 
                onclick="event.stopPropagation()" 
                onblur="actualizarInvitado(${i.id}, 'prom', this.innerText, this)" 
                style="margin-left:auto; color:${getColorProm(i.prom)}">${i.prom}</span>
        </div>
        `;
    }).join('');

    html += datosOriginales.map(j => {
        const sel = equipo1.includes(j.id) || equipo2.includes(j.id);
        const flechaHtml = j.flecha ? `<img src="${j.flecha}" class="list-arrow-img">` : '<div class="list-arrow-spacer"></div>';
        const esLesionado = j.flecha && (j.flecha.includes("/0.") || j.flecha.includes("0.png"));
        
        if (esLesionado) {
            return `<div class="player-row disabled">${flechaHtml}<span>${j.nombre}</span> <span style="margin-left:auto; color:#666">${j.prom}</span></div>`;
        } else {
            return `<div class="player-row ${sel?'selected':''}" onclick="toggleSeleccion(${j.id})">${flechaHtml}<span>${j.nombre}</span> <span style="margin-left:auto; color:${getColorProm(j.prom)}">${j.prom}</span></div>`; 
        }
    }).join('');

    cont.innerHTML = html;
    actualizarContadorEquipos(); 
    actualizarTablerosEquipos();
}

function actualizarInvitado(id, campo, valor, el) {
    const invitado = invitados.find(i => i.id === id);
    if (!invitado) return;

    if (campo === 'prom') {
        const num = parseInt(valor) || 0;
        invitado.prom = num;
        invitado.ata = invitado.def = invitado.tec = invitado.vel = invitado.res = invitado.arq = num;
        if (el) el.style.color = getColorProm(num);
    } else {
        invitado.nombre = valor;
    }
    
    actualizarTablerosEquipos();
}

function borrarInvitado(id) {
    invitados = invitados.filter(i => i.id !== id);
    equipo1 = equipo1.filter(x => x !== id);
    equipo2 = equipo2.filter(x => x !== id);
    renderizarListaSeleccion();
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
    const btnAddGuest = document.querySelector('.btn-add-guest');
    if(btnAddGuest) btnAddGuest.disabled = ok;
    const btnGen = document.getElementById('btn-generate');
    if(btnGen) btnGen.style.display = ok ? 'inline-flex' : 'none';
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
    const ordenPos = { 'POR': 1, 'DFC': 2, 'MCD': 3, 'MO': 4, 'SD': 5, 'DC': 6 };
    let jugadores = ids.map(getPlayerData).filter(p => p !== undefined && p !== null);
    jugadores.forEach(p => suma += p.prom);
    jugadores.sort((a, b) => {
        const posA = ordenPos[a.pos] || 99;
        const posB = ordenPos[b.pos] || 99;
        return posA - posB;
    });
    jugadores.forEach(p => { 
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
    const currentT1 = new Set(equipo1);
    const currentT2 = new Set(equipo2);
    const topArq = [...pool].sort((a, b) => b.arq - a.arq).slice(0, 2).map(p => p.id);
    const topAta = [...pool].sort((a, b) => b.ata - a.ata).slice(0, 2).map(p => p.id);
    const topDef = [...pool].sort((a, b) => b.def - a.def).slice(0, 2).map(p => p.id);
    const topRunners = [...pool].sort((a, b) => (b.vel + b.res) - (a.vel + a.res)).slice(0, 2).map(p => p.id);
    const botRunners = [...pool].sort((a, b) => (b.vel + b.res) - (a.vel + a.res)).slice(8, 10).map(p => p.id);
    const granerosPool = pool.filter(p => p.nombre.toUpperCase().includes("GRANEROS")).map(p => p.id);
    let mejorE1 = [], mejorFealdad = Infinity;
    for (let i = 0; i < 5000; i++) {
        let t = [...pool].sort(() => Math.random() - 0.5);
        let t1 = t.slice(0, 5), t2 = t.slice(5);
        let ids1 = t1.map(p => p.id);
        let s1 = t1.reduce((a, b) => a + b.prom, 0), s2 = t2.reduce((a, b) => a + b.prom, 0);
        let f = Math.abs(s1 - s2) * 100;
        if (granerosPool.length === 2 && ids1.includes(granerosPool[0]) !== ids1.includes(granerosPool[1])) f += 1000000;
        const matchesT1 = ids1.every(id => currentT1.has(id));
        const matchesT2 = ids1.every(id => currentT2.has(id));
        if (matchesT1 || matchesT2) f += 10000000;
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
        const ps = ids.map(getPlayerData).filter(p => p !== undefined && p !== null);
        if (!ps.length) return [0,0,0,0,0,0];
        const sum = ps.reduce((acc, p) => ({ 
            ata: acc.ata + (p.ata || 0), 
            def: acc.def + (p.def || 0), 
            tec: acc.tec + (p.tec || 0), 
            vel: acc.vel + (p.vel || 0), 
            res: acc.res + (p.res || 0), 
            arq: acc.arq + (p.arq || 0) 
        }), {ata:0, def:0, tec:0, vel:0, res:0, arq:0});
        
        return [
            sum.ata/ps.length, 
            sum.tec/ps.length, 
            sum.arq/ps.length, 
            sum.def/ps.length, 
            sum.res/ps.length, 
            sum.vel/ps.length
        ];
    };
    
    const data1 = getAvgStats(equipo1), data2 = getAvgStats(equipo2);
    
    if (!teamRadarChart) {
        const ctx = canvas.getContext('2d');
        teamRadarChart = new Chart(ctx, { 
            type: 'radar', 
            data: { 
                labels: ['ATA', 'TEC', 'ARQ', 'DEF', 'RES', 'VEL'], 
                datasets: [ 
                    { label: 'CLARO', data: data1, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: '#ffffff', borderWidth: 3, pointRadius: 0 }, 
                    { label: 'OSCURO', data: data2, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderColor: '#000000', borderWidth: 3, pointRadius: 0 } 
                ] 
            }, 
            options: { 
                animation: { duration: 250 }, 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    r: { 
                        min: 33, 
                        max: 99, 
                        ticks: { display: false }, 
                        grid: { color: 'rgba(255,255,255,0.15)' }, 
                        angleLines: { color: 'rgba(255,255,255,0.15)' }, 
                        pointLabels: { color: '#ffffff', font: { family: 'Bebas Neue', size: 16 } } 
                    } 
                }, 
                plugins: { legend: { display: false } } 
            } 
        });
    } else { 
        teamRadarChart.data.datasets[0].data = data1; 
        teamRadarChart.data.datasets[1].data = data2; 
        teamRadarChart.update(); 
    }
}

async function compartirEquipos() {
    const team1 = document.getElementById('list-team-1');
    const team2 = document.getElementById('list-team-2');
    const btnShare = document.getElementById('btn-share-teams');
    if (!team1 || !team2 || btnShare.disabled) return;

    btnShare.disabled = true;
    const textoOriginal = btnShare.innerText;
    btnShare.innerText = "GENERANDO...";

    const capturador = document.createElement('div');
    capturador.style.cssText = `
        position: absolute; left: -9999px; top: 0;
        display: flex; flex-direction: row; flex-wrap: nowrap; gap: 16px; padding: 16px;
        background-color: #1a1a1a; width: max-content; align-items: stretch;
    `;

    const t1Clon = team1.closest('.team-box').cloneNode(true);
    const t2Clon = team2.closest('.team-box').cloneNode(true);
    t1Clon.style.boxShadow = 'none';
    t2Clon.style.boxShadow = 'none';
    capturador.appendChild(t1Clon);
    capturador.appendChild(t2Clon);
    document.body.appendChild(capturador);
    const w1 = team1.closest('.team-box').offsetWidth;
    const w2 = team2.closest('.team-box').offsetWidth;
    t1Clon.style.width = (w1 > 0 ? w1 + 6 : 300) + 'px';
    t2Clon.style.width = (w2 > 0 ? w2 + 6 : 300) + 'px';
    try {
        const canvas = await html2canvas(capturador, {
            useCORS: true, 
            backgroundColor: "#1a1a1a",
            scale: 3, 
            logging: false
        });
        document.body.removeChild(capturador);

        canvas.toBlob(async blob => {
            if (!blob) {
                btnShare.disabled = false;
                btnShare.innerText = textoOriginal;
                return;
            }
            const file = new File([blob], 'Equipos.png', { type: 'image/png' });
            if (navigator.share) {
                try { 
                await navigator.share({ files: [file] }); 
                } catch (err) { 
                console.error(err); 
                }
            } else {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'Equipos.png';
                a.click();
            }
            btnShare.disabled = false;
            btnShare.innerText = textoOriginal;
        }, 'image/png');
    } catch (error) {
        if (document.body.contains(capturador)) document.body.removeChild(capturador);
        btnShare.disabled = false;
        btnShare.innerText = textoOriginal;
    }
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
