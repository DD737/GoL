
class _grid_row extends Map
{

    _a = [];

    _index(xi, create = true, create_val = 0)
    {
        if(super.has(xi)) return super.get(xi); // index cached? return it
        if(create)
        {
            const index = this._a.length;
            this._a.push(create_val);
            super.set(xi, index);
        }
        return undefined; // element doesnt/didnt exist => err_val
    }
    get(x, create = true)
    {
        const xo = x % 8;
        const xi = (x - xo) / 8;
        const mask = 1 << xo;

        const i = this._index(xi, create, 0);
        if(typeof(i) == 'undefined') return 0; // element doesnt/didnt exist => val is 0
        return (this._a[i] & mask) >> xo;
    }
    set(x, v, create = true)
    {
        const xo = x % 8;
        const xi = (x - xo) / 8;
        const mask = 1 << xo;

        const i = this._index(xi, create, (v ? mask : 0));
        if(typeof(i) == 'undefined') return;

        if(v) this._a[i] |=  mask; // turns mask bit on
        else  this._a[i] &= ~mask; // turns mask bit off
    }

    exists(x)
    {
        const xo = x % 8;
        const xi = (x - xo) / 8;
        return super.has(xi);
    }

}
class _grid extends Map
{

    /** @type {_grid_row[]} */
    _rows = [];

    _index(y, create = true)
    {
        if(super.has(y)) return super.get(y); // index cached? return it
        if(create)
        {
            const i = this._rows.length;
            this._rows.push(new _grid_row());
            super.set(y, i);
            return i;
        }
        return undefined; // element doesnt/didnt exist => err_val
    }
    get(x, y, create = true)
    {
        const i = this._index(y, create);
        if(typeof(i) == 'undefined') return 0; // element doesnt exist => val is 0
        return this._rows[i].get(x, create);
    }
    set(x, y, v, create = true)
    {
        const i = this._index(y, create);
        if(typeof(i) == 'undefined') return 0; // element doesnt exist => val is 0
        this._rows[i].set(x, v, create);
    }

    exists(x, y)
    {
        /** @type {_grid_row} */ const i = super.get(y);
        if(typeof(i) == 'undefined') return false;
        return this._rows[i].exists(x);
    }

}

let g = 0;
const grid = [ new _grid(), new _grid() ];

const grid_elem = document.getElementById('grid');

for(let y = 0; y < 10; y++)
    for(let x = 0; x < 10; x++)
        grid[g].set(x,y,0);

const camera = {
    view_off_x: -80,
    view_off_y: -80,
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
    document.addEventListener('mouseleave', () => is_dragging = false);
}

let coords = [];

const simulation = new (class {

    applyRules(v, n)
    {
        if(n === 1) return 1;
        return 0;
    }

    _simulateCell0(x, y) { this._simulateCell(x, y, grid[g].get(x, y));}
    _simulateCell0(x, y, v, t, r, d, l, tl, tr, dl, dr)
    {

        coords.push([x, y])

        if(!grid[g].exists(x, y)) return;

        const  t0 = (typeof( t) != 'undefined');
        const  l0 = (typeof( l) != 'undefined');
        const  d0 = (typeof( d) != 'undefined');
        const  r0 = (typeof( r) != 'undefined');
        const tl0 = (typeof(tl) != 'undefined');
        const tr0 = (typeof(tr) != 'undefined');
        const dl0 = (typeof(dl) != 'undefined');
        const dr0 = (typeof(dr) != 'undefined');

         t = (  t0 ?  t : grid[g].get(x  ,y-1,false) );
         l = (  l0 ?  l : grid[g].get(x-1,y  ,false) );
         d = (  d0 ?  d : grid[g].get(x  ,y+1,false) );
         r = (  r0 ?  r : grid[g].get(x+1,y  ,false) );
        tl = ( tl0 ? tl : grid[g].get(x-1,y-1,false) );
        tr = ( tr0 ? tr : grid[g].get(x+1,y-1,false) );
        dl = ( dl0 ? dl : grid[g].get(x-1,y+1,false) );
        dr = ( dr0 ? dr : grid[g].get(x+1,y+1,false) );

        const neighbors = [ t, r, d, l, tl, tr, dl, dr ].reduce((c, s) => (s += (c ? 1 : 0)));
        //console.log(neighbors);

        const nv = this.applyRules(v, neighbors);

        const g0  = (g ? 0 : 1);
        grid[g0].set(x, y, nv);
return;
        const u = undefined;
        if(! t0 && !grid[g0].exists(x  ,y-1)) this._simulateCell(x  ,y-1, t, u,tr, v,tl, u, u, l, r);
        if(! l0 && !grid[g0].exists(x-1,y  )) this._simulateCell(x-1,y  , l,tl, v,dl, u, u, t, u, d);
        if(! d0 && !grid[g0].exists(x  ,y+1)) this._simulateCell(x  ,y+1, d, v,dr, u,dl, l, r, u, u);
        if(! r0 && !grid[g0].exists(x+1,y  )) this._simulateCell(x+1,y  , r,tr, u,dr, v, t, u, d, u);
        if(!tl0 && !grid[g0].exists(x-1,y-1)) this._simulateCell(x-1,y-1,tl, u, t, l, u, u, u, u, v);
        if(!tr0 && !grid[g0].exists(x+1,y-1)) this._simulateCell(x+1,y-1,tr, u, u, r, t, u, u, v, u);
        if(!dl0 && !grid[g0].exists(x-1,y+1)) this._simulateCell(x-1,y+1,dl, l, d, u, u, u, v, u, u);
        if(!dr0 && !grid[g0].exists(x+1,y+1)) this._simulateCell(x+1,y+1,dr, r, u, u, d, v, u, u, u);

    }
    _simulateCell(x, y)
    {

        const  t = grid[g].get(x  ,y-1,false);
        const  l = grid[g].get(x-1,y  ,false);
        const  d = grid[g].get(x  ,y+1,false);
        const  r = grid[g].get(x+1,y  ,false);
        const tl = grid[g].get(x-1,y-1,false);
        const tr = grid[g].get(x+1,y-1,false);
        const dl = grid[g].get(x-1,y+1,false);
        const dr = grid[g].get(x+1,y+1,false);

        const neighbors = [ t, r, d, l, tl, tr, dl, dr ].reduce((c, s) => (s += (c ? 1 : 0)));
        //console.log(neighbors);

        const nv = this.applyRules(v, neighbors);

        const g0  = (g ? 0 : 1);
        grid[g0].set(x, y, nv);

    }


    step()
    {

        let xl = 0, xr = 0;

        while(true)
        {

            const Y = (x) => {
                let yu = 0, yd = 0;

                while(true)
                {
                    let skip1 = false;
                    let skip2 = false;

                    if(grid[g].exists(x, yu))
                        this._simulateCell(x,yu);
                    else skip1 = true;
                    yu++;

                    if(grid[g].exists(x, yd))
                        this._simulateCell(x,yd);
                    else skip2 = true;
                    yd--;

                    if(skip1 && skip2) break;
                }
            }

            Y(xl);

        }

        g = g ? 0 : 1;
        grid_elem.innerHTML = '';
        for(let k of _html_cells.keys()) _html_cells.delete(k);

    }

})();

/** @type {Map<number,Map<number,HTMLDivElement>>} */
const _html_cells = new Map();

{

    let cell_width = 50;
    let removal_queue = [];

    function render()
    {

        const OFF_X = camera.view_off_x;
        const OFF_Y = camera.view_off_y;

        const MIN_Y = Math.floor(-OFF_Y / cell_width);
        const MIN_X = Math.floor(-OFF_X / cell_width);
        const MAX_Y = Math.ceil((window.innerHeight - OFF_Y) / cell_width);
        const MAX_X = Math.ceil((window.innerWidth  - OFF_X) / cell_width);

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
                if(!grid[g].exists(x,y)) continue;
                const v = grid[g].get(x, y, false);

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
                        if(ev.  altKey) grid[g].set(x,y,!grid[g].get(x,y));
                    });
                    const info = document.createElement('div');
                    info.classList.add('cell-info');
                    cell.appendChild(info);
                    info.innerText = `[${x}|${y}]`
                }

                cell.classList.remove((v ? 'cell-dead' : 'cell-alive'));
                cell.classList.add   ((v ? 'cell-alive' : 'cell-dead'));
                cell.style.top  = (y * cell_width + OFF_Y) + 'px';
                cell.style.left = (x * cell_width + OFF_X) + 'px';
            }
            

        requestAnimationFrame(render);

    }

    render();

    setInterval(async () => {
        if(removal_queue.length == 0) return;
        for(el of removal_queue)
            grid_elem.removeChild(el);
        removal_queue = [];
    }, 330);

}

const _debug = (new (class {
    info = document.getElementById('_debug');
    debugInfoVisibility(visible) { this.info.style.visibility = (visible ? 'visible' : 'hidden'); }
    cellInfoVisiblity(visible) { document.body.style.setProperty('--cell-info-visibility',`var(--cell-info-${( visible ? 'enabled' : 'disabled' )})`); }
})());
_debug.debugInfoVisibility(false);
