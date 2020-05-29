var Quantum = {};

Quantum.quantize = function(value) {
    return value instanceof Quantum.Quant ? value : new Quantum.Quant(value);
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
