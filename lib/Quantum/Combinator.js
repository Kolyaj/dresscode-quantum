Quantum.Combinator = Bricks.inherit(Quantum.Quant, {
    constructor: function(quants) {
        Quantum.Combinator.superclass.constructor.apply(this);
        this._quants = quants;
    },

    setValue: function() {
        throw new Error('Not supported');
    },

    addEventListener: function() {
        if (this._listeners.length === 0) {
            this._quants.forEach(function(quant) {
                if (quant instanceof Quantum.Quant) {
                    Bricks.DOM.on(quant, 'prioritychange', this.$$_onChangeQuant, this);
                }
            }, this);
        }
        Quantum.Combinator.superclass.addEventListener.apply(this, arguments);
    },

    removeEventListener: function() {
        var hasListeners = this._listeners.length > 0;
        Quantum.Combinator.superclass.removeEventListener.apply(this, arguments);
        if (hasListeners && this._listeners.length === 0) {
            this._quants.forEach(function(quant) {
                if (quant instanceof Quantum.Quant) {
                    Bricks.DOM.un(quant, 'prioritychange', this.$$_onChangeQuant, this);
                }
            }, this);
        }
    },

    _obtainScalarValue: function() {
        return this._quants.map(function(quant) {
            return quant instanceof Quantum.Quant ? quant.getValue() : quant;
        });
    },

    _isTheSameValues: function(value1, value2) {
        if (value1.length !== value2.length) {
            return false;
        }
        for (var i = 0; i < value1.length; i++) {
            if (value1[i] !== value2[i]) {
                return false;
            }
        }
        return true;
    },

    $$_onChangeQuant: function(evt) {
        if (evt.touched) {
            this.touch();
        } else {
            this._updateScalarValue();
        }
    }
});
