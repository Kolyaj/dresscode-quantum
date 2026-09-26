Quantum.Array = Bricks.inherit(Quantum.Quant, {
    constructor: function(value, parentArray, transformer, transformerCtx) {
        if (value && !Bricks.Array.isArray(value)) {
            throw new TypeError('Value must be an array.');
        }
        if (parentArray) {
            value = parentArray.getValue().map(transformer, transformerCtx);
        }
        Quantum.Array.superclass.constructor.call(this, value || []);
        this._parentArray = parentArray;
        this._transformer = transformer;
        this._transformerCtx = transformerCtx;
    },

    append: function(items) {
        if (Bricks.Array.isArray(items)) {
            this.splice(this._value.length, 0, items);
        } else {
            throw new TypeError('items must be an array.');
        }
    },

    prepend: function(items) {
        if (Bricks.Array.isArray(items)) {
            this.splice(0, 0, items);
        } else {
            throw new TypeError('items must be an array.');
        }
    },

    push: function() {
        this.splice(this._value.length, 0, [].slice.call(arguments, 0));
        return this._value.length;
    },

    pop: function() {
        return this.splice(this._value.length - 1, 1)[0];
    },

    unshift: function() {
        this.splice(0, 0, [].slice.call(arguments, 0));
        return this._value.length;
    },

    shift: function() {
        return this.splice(0, 1)[0];
    },

    clear: function() {
        this.splice(0, this._value.length);
    },

    splice: function(start, deleteCount, insertItems) {
        start = start || 0;
        deleteCount = deleteCount || 0;
        insertItems = insertItems || [];
        if (!Bricks.Array.isArray(insertItems)) {
            throw new TypeError('insertItems must be an array');
        }
        if (start < 0) {
            start = Math.max(0, this._value.length + start);
        }
        for (var i = 0; i < deleteCount; i++) {
            var index = start + i;
            if (index < this._value.length) {
                this._fireEvent('remove', {
                    index: index,
                    item: this._value[index]
                });
            }
        }
        insertItems.forEach(function(item, i) {
            this._fireEvent('insert', {
                index: start + i,
                item: item,
                nextItem: this._value[start + deleteCount]
            });
        }, this);
        var deletedItems = [];
        if (deleteCount > 0 || (insertItems && insertItems.length > 0)) {
            var newValue = this._value.slice(0);
            deletedItems = newValue.splice.apply(newValue, [start, deleteCount].concat(insertItems));
            this._fireEvent('splice', {
                start: start,
                deleteCount: deleteCount,
                insertItems: insertItems
            });
            this.setValue(newValue);
        }
        return deletedItems;
    },

    isEmpty: function() {
        if (!this.$$_isEmpty) {
            this.$$_isEmpty = this.when(function(value) {
                return value.length === 0;
            });
        }
        return this.$$_isEmpty;
    },

    remove: function(callback, ctx) {
        for (var i = this._value.length - 1; i >= 0; i--) {
            if (callback.call(ctx, this._value[i])) {
                this.splice(i, 1);
            }
        }
    },

    transform: function(transformer, ctx) {
        return new Quantum.Array(null, this, transformer, ctx);
    },

    addEventListener: function() {
        if (this._listeners.length === 0 && this._parentArray) {
            Bricks.DOM.on(this._parentArray, 'splice', this.$$_onSpliceParent, this);
        }
        Quantum.Array.superclass.addEventListener.apply(this, arguments);
    },

    removeEventListener: function() {
        var hasListeners = this._listeners.length > 0;
        Quantum.Array.superclass.removeEventListener.apply(this, arguments);
        if (hasListeners && this._listeners.length === 0 && this._parentArray) {
            Bricks.DOM.un(this._parentArray, 'splice', this.$$_onSpliceParent, this);
        }
    },

    $$_onSpliceParent: function(evt) {
        this.splice(evt.start, evt.deleteCount, evt.insertItems.map(this._transformer, this._transformerCtx));
    }
});
