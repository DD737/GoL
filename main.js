let DIMENSION = 16;
const size = () => (DIMENSION**2/8);

{if(DIMENSION%8){DIMENSION+=8-(DIMENSION%8);console.info('Rounded dimension up to ',DIMENSION)}}

let c0 = 0;
let cells = [ new Uint8Array(size()), new Uint8Array(size()) ];

function RESIZE(DIM)
{
    clear_screen();
    DIMENSION = Math.max(1,DIM);
    {if(DIMENSION%8){DIMENSION+=8-(DIMENSION%8);console.info('Rounded dimension up to ',DIMENSION)}}
    cells = cells.map(x => new Uint8Array(size()));
}

function __transpose_coords(x,y)
{
    return [
        x+(DIMENSION/2),
        y+(DIMENSION/2),
    ];
}
function exists(x, y)
{
    {
        const c = __transpose_coords(x,y);
        x = c[0];
        y = c[1];
    }
    if(x < 0 || y < 0) return false;
    if(y >= DIMENSION) return false;
    if(x >= DIMENSION) return false;
    return true;
}
function get(x, y, c=undefined)
{

    if(typeof(c) == 'undefined') c = c0;

    if(!exists(x, y)) return 0;
    {
        const c = __transpose_coords(x,y);
        x = c[0];
        y = c[1];
    }

    const xo = x % 8;
    const xi = (x - xo) / 8;
    const mask = 1 << xo;

    const yi = y * DIMENSION / 8;

    const index = yi + xi;

    return (cells[c][index] & mask) >> xo;

}
function set(x, y, v, c=undefined)
{

    if(typeof(c) == 'undefined') c = c0;

    if(!exists(x, y)) return;
    {
        const c = __transpose_coords(x,y);
        x = c[0];
        y = c[1];
    }

    const xo = x % 8;
    const xi = (x - xo) / 8;
    const mask = 1 << xo;

    const yi = y * DIMENSION / 8;

    const index = yi + xi;
    
    if(v) cells[c][index] |=  mask;
    else  cells[c][index] &= ~mask;

}

const camera = {
    view_off_x: 0,
    view_off_y: 0,
};

{
    let is_dragging = false;
    let drag_x = 0;
    let drag_y = 0;
    document.addEventListener('mousedown', ev => {
        drag_x = ev.pageX;
        drag_y = ev.pageY;
        if(!ev.altKey) is_dragging = true;
    });
    document.addEventListener('mousemove', ev => {
        if(!is_dragging) return;
        const dx = ev.pageX - drag_x;
        const dy = ev.pageY - drag_y;
        drag_x = ev.pageX;
        drag_y = ev.pageY;
        camera.view_off_x += dx;
        camera.view_off_y += dy;
    });
    document.addEventListener('mouseup'   , () => is_dragging = false);
    document.addEventListener('mouseenter', () => is_dragging = false);
    document.addEventListener('mouseleave', () => is_dragging = false);
}


const grid_elem = document.getElementById('grid');

/** @type {Map<number,Map<number,HTMLDivElement>>} */
const _html_cells = new Map();

{

    let cell_width = 50;
    let removal_queue = [];

    function render()
    {

        const OFF_X = camera.view_off_x;
        const OFF_Y = camera.view_off_y;

        const MIN_Y = Math.floor((-OFF_Y - window.innerHeight / 2) / cell_width);
        const MIN_X = Math.floor((-OFF_X - window.innerWidth  / 2) / cell_width);
        const MAX_Y = Math.ceil((window.innerHeight / 2 - OFF_Y) / cell_width);
        const MAX_X = Math.ceil((window.innerWidth  / 2 - OFF_X) / cell_width);

        for(y of _html_cells.keys())
        {
            const y_delete = (y < MIN_Y || y >= MAX_Y);
            for(x of _html_cells.get(y).keys())
                if(y_delete || x < MIN_X || x >= MAX_X)
                {
                    const el = _html_cells.get(y).get(x);
                    el.style.display = 'none';
                    removal_queue.push(el);
                    _html_cells.get(y).delete(x);
                }
            if(y_delete)
                _html_cells.delete(y);
        }

        for(let y = MIN_Y; y < MAX_Y; y++)
            for(let x = MIN_X; x < MAX_X; x++)
            {

                if(!exists(x, y)) continue;

                const v = get(x, y);

                if(!_html_cells.has(y)) _html_cells.set(y, new Map());
                let cell = _html_cells.get(y).get(x);

                if(!cell)
                {
                    cell = document.createElement('div');
                    cell.setAttribute('data-x', x);
                    cell.setAttribute('data-y', y);
                    cell.classList.add('cell');
                    _html_cells.get(y).set(x, cell);
                    grid_elem.appendChild(cell);
                    cell.addEventListener('click', ev => { 
                        if(ev.shiftKey) console.log(x,y); 
                        if(ev.  altKey) set(x,y,!get(x,y));
                    });
                    const info = document.createElement('div');
                    info.classList.add('cell-info');
                    cell.appendChild(info);
                    info.innerText = `${x} | ${y}`
                }

                cell.classList.remove((v ? 'cell-dead' : 'cell-alive'));
                cell.classList.add   ((v ? 'cell-alive' : 'cell-dead'));
                cell.style.top  = (y * cell_width + OFF_Y + (window.innerHeight / 2)) + 'px';
                cell.style.left = (x * cell_width + OFF_X + (window.innerWidth  / 2)) + 'px';
            }
            

        requestAnimationFrame(render);

    }
    render();

}

function clear()
{
    for(let y = 0; y < DIMENSION; y++)
        for(let x = 0; x < DIMENSION; x++)
            set(x-DIMENSION/2,y-DIMENSION/2,0);
}

function clear_screen()
{
    grid_elem.innerHTML = '';
    for(let k of _html_cells.keys()) _html_cells.delete(k);
}

const simulation = new (class {

    applyRules(v, n)
    {
        switch(n)
        {
            case 0: return v;   
            case 1: return 0;
            case 2: return v;
            case 3: return v;
            case 4: return 1;
            case 5: return 0;
            case 6: return 1;
            case 7: return 0;
            case 8: return 0;
        }
    }

    cell(x, y)
    {

        const v = get(x, y);

        const dirs = [
            [ -1 + x, -1 + y ], // tl
            [  0 + x, -1 + y ], // tm
            [  1 + x, -1 + y ], // tr
            [ -1 + x,  0 + y ], // cl
          //[  0 + x,  0 + y ], // cm
            [  1 + x,  0 + y ], // cr
            [ -1 + x,  1 + y ], // dl
            [  0 + x,  1 + y ], // dm
            [  1 + x,  1 + y ], // dr
        ];

        const neighbors = dirs.map(d => (exists(d[0],d[1]) ? get(d[0],d[1]) : 0)).reduce((d,n) => n + d);

        set(x, y, this.applyRules(v, neighbors), (c0 ? 0 : 1));

    }

    step()
    {

        for(let y = -DIMENSION/2; y < DIMENSION/2; y++)
            for(let x = -DIMENSION/2; x < DIMENSION/2; x++)
                this.cell(x, y);

        c0 = c0 ? 0 : 1;
        clear_screen();

    }

})();

document.addEventListener('keydown', ev => {
    switch(ev.key.toLowerCase())
    {
        case 'escape':
            clear();
            break;
        case 'enter':
            simulation.step();
            break;
    }
});

const _debug = (new (class {
    info = document.getElementById('_debug');
    debugInfoVisibility(visible) { this.info.style.visibility = (visible ? 'visible' : 'hidden'); }
    cellInfoVisiblity(visible) { document.body.style.setProperty('--cell-info-visibility',`var(--cell-info-${( visible ? 'enabled' : 'disabled' )})`); }
})());
_debug.debugInfoVisibility(false);
