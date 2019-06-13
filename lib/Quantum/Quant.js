Quantum.Quant = Bricks.inherit(Bricks.Observer, {
    constructor: function(value) {
        Quantum.Quant.superclass.constructor.apply(this, arguments);
        this._value = undefined;
        this._scalarValue = undefined;
        this._dependents = [];
        this.setValue(value);
    },

    setValue: function(value) {
        if (this._value !== value) {
            if (this._value instanceof Quantum.Quant) {
                Bricks.DOM.un(this._value, 'change', this.$$_onChangeNestedValue, this);
            }
            this._value = value;
            if (this._value instanceof Quantum.Quant) {
                Bricks.DOM.on(this._value, 'change', this.$$_onChangeNestedValue, this);
            }
            this._updateScalarValue();
        }
    },

    getValue: function() {
        return this._scalarValue;
    },

    getRealValue: function() {
        return this._value;
    },

    touch: function() {
        this._updateScalarValue(true);
    },

    when: function(callback, ctx) {
        var dependent = new Quantum.Quant(callback.call(ctx, this._scalarValue));
        this._dependents.push({
            dependent: dependent,
            callback: callback,
            ctx: ctx
        });
        return dependent;
    },

    whenNull: function(fn, ctx) {
        return this.when(function(value) {
            return value === null || value === undefined ? fn.call(ctx, value) : value;
        }, this);
    },

    whenNotNull: function(fn, ctx) {
        return this.when(function(value) {
            return value === null || value === undefined ? value : fn.call(ctx, value);
        }, this);
    },

    ifNotNull: function(fn, ctx) {
        if (this._scalarValue !== null && this._scalarValue !== undefined) {
            fn.call(ctx, this._scalarValue);
        }
    },


    _updateScalarValue: function(force) {
        var scalarValue = this._value instanceof Quantum.Quant ? this._value.getValue() : this._value;
        if (force || this._scalarValue !== scalarValue) {
            var prevScalarValue = this._scalarValue;
            this._scalarValue = scalarValue;
            this._dependents.forEach(function(item) {
                item.dependent.setValue(item.callback.call(item.ctx, this._scalarValue));
            }, this);
            this._fireEvent('change', {
                value: this._scalarValue,
                prevValue: prevScalarValue
            });
        }
    },


    $$_onChangeNestedValue: function() {
        this._updateScalarValue();
    }
});
