var Quantum = {};

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
