Quantum.Array = Bricks.inherit(Quantum.Quant, {
    constructor: function(value) {
        Quantum.Array.superclass.constructor.call(this, value || []);
        this._transformDependents = [];
    },

    append: function(items) {
        this.splice(this._value.length, 0, items);
    },

    prepend: function(items) {
        this.splice(0, 0, items);
    },

    push: function() {
        this.splice(this._value.length, 0, [].slice.call(arguments, 0));
    },

    pop: function() {
        return this.splice(this._value.length - 1, 1)[0];
    },

    unshift: function() {
        this.splice(0, 0, [].slice.call(arguments, 0));
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
        var deletedItems = this._value.splice.apply(this._value, [start, deleteCount].concat(insertItems));
        this._transformDependents.forEach(function(dependent) {
            dependent.dependent.splice(start, deleteCount, insertItems.map(dependent.callback, dependent.ctx));
        }, this);
        this.touch();
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

    transform: function(callback, ctx) {
        var dependent = new Quantum.Array(this._value.map(function(item) {
            return callback.call(ctx, item);
        }, this));
        this._transformDependents.push({
            dependent: dependent,
            callback: callback,
            ctx: ctx
        });
        return dependent;
    }
});
