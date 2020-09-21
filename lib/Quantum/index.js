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
    quants.forEach(function(quant) {
        if (!(quant instanceof Quantum.Quant)) {
            throw new TypeError('Arguments of Quantum.combine must be instances of Quantum.Quant.');
        }
    });
    var combinator = new Quantum.Quant();
    var onChange = function() {
        combinator.setValue(quants.map(function(mutable) {
            return mutable.getValue();
        }));
    };
    onChange();
    quants.forEach(function(quant) {
        quant.addEventListener('change', onChange);
    });
    return combinator;
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
