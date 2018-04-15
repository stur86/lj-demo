var LJDemo = function() {
    this.num = 20;
    this.R0 = 3.0;
    this.DV = 1.0;
    this.T = 1;
    this.tdamp = 1;

    this.svg = d3.select('#main-svg');

    this.cin = null;
    this.cmid = null;
    this.cout = null;

    this.initialise();
}

function dist(x1, x2) {
    return Math.sqrt(Math.pow(x2[0]-x1[0], 2) + Math.pow(x2[1]-x1[1], 2));
}

function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

LJDemo.prototype = {
    initialise: function() {

        this.stop();

        this.dt = 20;
        this.runproc = -1;

        // Generate random values of positions and speeds;
        this.x = [];
        this.v = [];

        this.recalcAB();

        var vmag = Math.sqrt(this.T);
        var R = Math.pow(2*this.B/this.A, 1.0/6.0)/2;
        var r6o2 = Math.pow(2.0, 1.0/6.0);


        while (this.x.length < this.num) {
            var x = [Math.random()*100, Math.random()*100];
            var theta = Math.random()*2*Math.PI;
            var v = [vmag*Math.cos(theta), vmag*Math.sin(theta)];

            // Check for distances...
            var discard = false;
            for (var j = 0; j < this.x.length; ++j) {
                var d = dist(x, this.x[j]);
                if (d < 2*R/r6o2) {
                    discard = true;
                    break;
                }
            }
            if (discard)
                continue;

            this.x.push(x);
            this.v.push(v);
        }

        // Draw circles
        // We need three "auras"
        this.svg.selectAll('circle').remove();
        this.cin = this.svg.selectAll('circle.atom-in');
        this.cmid = this.svg.selectAll('circle.atom-mid');
        this.cout = this.svg.selectAll('circle.atom-out');

        this.cin.data(this.x).enter().append('circle')
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R/r6o2)
            .classed('atom-in', true);
        this.cmid.data(this.x).enter().append('circle')
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R)
            .classed('atom-mid', true);
        this.cout.data(this.x).enter().append('circle')
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R*r6o2)
            .classed('atom-out', true);

        this.start();
    },

    recalcAB: function() {
        this.A = 2*Math.pow(this.R0, 6)*this.DV;
        this.B = this.A*Math.pow(this.R0, 6)/2.0;
    },

    forces: function() {
        // Compute the forces
        var F = new Array(this.x.length).fill(0);
        F = F.map(function(x) { return [0,0];});
        for (var i = 0; i < this.x.length; ++i) {
            for (var j = i+1; j < this.x.length; ++j) {
                var d = dist(this.x[i], this.x[j]);
                var v = [(this.x[j][0]-this.x[i][0])/d,
                         (this.x[j][1]-this.x[i][1])/d];
                var Fmag = (12*this.B/Math.pow(d, 13.0)-6*this.A/Math.pow(d, 7.0))*1e2;
                
                Fmag = Math.min(Fmag, 500);
                F[i][0] -= v[0]*Fmag;
                F[i][1] -= v[1]*Fmag;
                F[j][0] += v[0]*Fmag;
                F[j][1] += v[1]*Fmag;
            }
        }

        // Now thermostat effects
        var vtarg = Math.sqrt(this.T);
        for (var i = 0; i < this.x.length; ++i) {
            var vmag = dist([0,0], this.v[i]);
            var vdir = [this.v[i][0]/vmag, this.v[i][1]/vmag];
            var damp = (vtarg-vmag)*this.tdamp;
            F[i][0] -= this.v[i][0]*this.tdamp + randn_bm()*2*this.tdamp*this.T*1000/this.dt; 
            F[i][1] -= this.v[i][1]*this.tdamp + randn_bm()*2*this.tdamp*this.T*1000/this.dt;
        }

        return F;
    }, 

    step: function() {

        // First, move particles by half step
        for (var i = 0; i < this.x.length; ++i) {
            this.x[i][0] += this.v[i][0]*this.dt/2000.0;
            this.x[i][1] += this.v[i][1]*this.dt/2000.0;
        }

        // Then compute forces and accelerations
        var F = this.forces();
        for (var i = 0; i < this.x.length; ++i) {
            this.v[i][0] += F[i][0]*this.dt/1000.0;
            this.v[i][1] += F[i][1]*this.dt/1000.0;
        }

        // Finally, move particles by half step again
        for (var i = 0; i < this.x.length; ++i) {
            this.x[i][0] += this.v[i][0]*this.dt/2000.0;
            this.x[i][1] += this.v[i][1]*this.dt/2000.0;
        }

        // Now check for boundaries 
        for (var i = 0; i < this.x.length; ++i) {
            if (this.x[i][0] < 0) {
                this.x[i][0] = -this.x[i][0];
                this.v[i][0] *= -1;
            }
            if (this.x[i][0] > 100) {
                this.x[i][0] = 200-this.x[i][0];
                this.v[i][0] *= -1;
            }
            if (this.x[i][1] < 0) {
                this.x[i][1] = -this.x[i][1];
                this.v[i][1] *= -1;
            }
            if (this.x[i][1] > 100) {
                this.x[i][1] = 200-this.x[i][1];
                this.v[i][1] *= -1;
            }

        }

        // Now redraw
        var R = Math.pow(2*this.B/this.A, 1.0/6.0)/2;
        var r6o2 = Math.pow(2.0, 1.0/6.0);

        this.cin = this.svg.selectAll('circle.atom-in');
        this.cmid = this.svg.selectAll('circle.atom-mid');
        this.cout = this.svg.selectAll('circle.atom-out');

        this.cin.data(this.x)
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R/r6o2);
        this.cmid.data(this.x)
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R);
        this.cout.data(this.x)
            .attr('cx', function(d) { return d[0];} )
            .attr('cy', function(d) { return d[1];} )
            .attr('r', R*r6o2);
    },

    start: function() {
        var that = this;
        this.runproc = setInterval(function() { that.step();}, this.dt);
    },

    stop: function() {
        clearInterval(this.runproc);
    }
}

window.onload = function() {
    var demo = new LJDemo();
    var gui = new dat.GUI();

    gui.add(demo, 'num', 10, 200).step(1).onFinishChange(function(value) {
        demo.initialise();
    });;
    gui.add(demo, 'R0', 1, 10).onFinishChange(function(value) {demo.recalcAB()});
    gui.add(demo, 'DV', 0.2, 3).onFinishChange(function(value) {demo.recalcAB()});
    gui.add(demo, 'T', 0.0001, 1);
    gui.add(demo, 'tdamp', 0, 5);
};