Quantum.Quant = Bricks.inherit({
    constructor: function(value, parentQuant, modifier, modifierCtx) {
        Quantum.Quant.superclass.constructor.apply(this, arguments);
        this._value = value;
        this._scalarValue = null;

        this._parentQuant = parentQuant;
        this._modifier = modifier;
        this._modifierCtx = modifierCtx;

        this._listeners = [];
    },

    setValue: function(value) {
        if (this._value !== value) {
            if (this._value instanceof Quantum.Quant && this._listeners.length > 0) {
                Bricks.DOM.un(this._value, 'prioritychange', this.$$_onChangeNestedValue, this);
            }
            this._value = value;
            if (this._value instanceof Quantum.Quant && this._listeners.length > 0) {
                Bricks.DOM.on(this._value, 'prioritychange', this.$$_onChangeNestedValue, this);
            }
            if (this._listeners.length > 0) {
                this._updateScalarValue();
            }
        }
    },

    getValue: function() {
        if (this._listeners.length === 0) {
            return this._obtainScalarValue(true);
        } else {
            return this._scalarValue;
        }
    },

    touch: function() {
        this._fireEvent('prioritychange', {
            value: this._scalarValue,
            prevValue: this._scalarValue,
            touched: true
        });
        this._fireEvent('change', {
            value: this._scalarValue,
            prevValue: this._scalarValue
        });
    },

    when: function(callback, ctx) {
        return new Quantum.Quant(null, this, callback, ctx);
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

    spread: function(fn, ctx) {
        return this.when(function(value) {
            return fn.apply(ctx, value);
        }, this);
    },

    addEventListener: function(name, fn) {
        if (this._listeners.length === 0) {
            if (this._parentQuant) {
                Bricks.DOM.on(this._parentQuant, 'prioritychange', this.$$_onChangeParentValue, this);
                this._value = this._modifier.call(this._modifierCtx, this._parentQuant.getValue());
            }
            if (this._value instanceof Quantum.Quant) {
                Bricks.DOM.on(this._value, 'prioritychange', this.$$_onChangeNestedValue, this);
            }
            this._scalarValue = this._obtainScalarValue(false);
        }
        this._listeners.push({name: name, fn: fn});
    },

    removeEventListener: function(name, fn) {
        if (this._listeners.length > 0) {
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].name === name && this._listeners[i].fn === fn) {
                    this._listeners.splice(i, 1);
                    break;
                }
            }
            if (this._listeners.length === 0) {
                if (this._parentQuant) {
                    Bricks.DOM.un(this._parentQuant, 'prioritychange', this.$$_onChangeParentValue, this);
                }
                if (this._value instanceof Quantum.Quant) {
                    Bricks.DOM.un(this._value, 'prioritychange', this.$$_onChangeNestedValue, this);
                }
            }
        }
    },

    _fireEvent: function(name, data) {
        var evt = Bricks.mixin({}, data, {
            type: name,
            target: this
        });
        for (var i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i].name === name) {
                this._listeners[i].fn.call(this, evt);
            }
        }
    },

    _updateScalarValue: function() {
        var scalarValue = this._obtainScalarValue(false);
        if (!this._isTheSameValues(this._scalarValue, scalarValue)) {
            var prevValue = this._scalarValue;
            this._scalarValue = scalarValue;
            this._fireEvent('prioritychange', {
                value: scalarValue,
                prevValue: prevValue
            });
            this._fireEvent('change', {
                value: scalarValue,
                prevValue: prevValue
            });
        }
    },

    _obtainScalarValue: function(checkParent) {
        var value = checkParent && this._parentQuant ? this._modifier.call(this._modifierCtx, this._parentQuant.getValue()) : this._value;
        return value instanceof Quantum.Quant ? value.getValue() : value;
    },

    _isTheSameValues: function(value1, value2) {
        return value1 === value2;
    },

    $$_onChangeNestedValue: function() {
        this._updateScalarValue();
    },

    $$_onChangeParentValue: function(evt) {
        this.setValue(this._modifier.call(this._modifierCtx, evt.value));
    }
});
