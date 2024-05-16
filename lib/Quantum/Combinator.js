Quantum.Combinator = Bricks.inherit(Quantum.Quant, {
    constructor: function(children) {
        Quantum.Combinator.superclass.constructor.apply(this);
        this._children = children;
        this._value = children.map(function() {
            return {};
        });
    },

    setValue: function() {
        throw new Error('Not supported');
    },

    addEventListener: function() {
        if (this._listeners.length === 0) {
            this._children.forEach(function(quant) {
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
            this._children.forEach(function(quant) {
                if (quant instanceof Quantum.Quant) {
                    Bricks.DOM.un(quant, 'prioritychange', this.$$_onChangeQuant, this);
                }
            }, this);
        }
    },

    _obtainScalarValue: function() {
        var childValues = this._children.map(function(child) {
            return child instanceof Quantum.Quant ? child.getValue() : child;
        });
        var someChildChanged = childValues.some(function(value, i) {
            return value !== this._value[i];
        }, this);
        if (someChildChanged) {
            this._value = childValues;
        }
        return this._value;
    },

    $$_onChangeQuant: function(evt) {
        if (evt.touched) {
            this.touch();
        } else {
            this._updateScalarValue();
        }
    }
});
