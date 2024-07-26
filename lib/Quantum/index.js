var Quantum = {};

Quantum.quantize = function(value) {
    return value instanceof Quantum.Quant ? value : new Quantum.Quant(value);
};

Quantum.getTimer = function(timeout) {
    timeout = timeout || 50;
    if (!this.$$_timers) {
        this.$$_timers = {};
    }
    if (!this.$$_timers[timeout]) {
        var timer = new Quantum.Quant(Date.now());
        setInterval(function() {
            timer.setValue(Date.now());
        }, timeout);
        this.$$_timers[timeout] = timer;
    }
    return this.$$_timers[timeout];
};

Quantum.combine = function(quants) {
    return new Quantum.Combinator(quants);
};

Quantum.debounce = function(quant, delay) {
    var debounced = new Quantum.Quant(quant.getValue());
    quant.addEventListener('change', Bricks.Function.debounce(function() {
        debounced.setValue(quant.getValue());
    }, delay));
    return debounced;
};

Quantum.series = function(values, delay) {
    var quant = new Quantum.Quant();
    var i = 0;
    (function next() {
        quant.setValue(values[i++]);
        if (i < values.length) {
            setTimeout(next, delay || 1);
        }
    })();
    return quant;
};

Quantum.format = function(str) {
    var args = [].slice.call(arguments, 1);
    var format = Bricks.String.format;
    return Quantum.combine(args).when(function(args) {
        return format.apply(Bricks.String, [str].concat(args));
    });
};
