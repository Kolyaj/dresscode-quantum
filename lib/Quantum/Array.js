/**
 * Квант со значением-массивом.
 *
 * Наследует всё, что умеет {@link Quantum.Quant} (`getValue`/`setValue`, `when`,
 * события `change` и `prioritychange` — здесь значение — новая ссылка на массив),
 * и добавляет методы массива (`push`, `pop`, `splice`, …) и события изменения состава:
 * `insert`, `remove`, `splice`. Все три возникают до того, как изменится значение, —
 * сама мутация применяется после всех событий.
 *
 * @class Quantum.Array
 * @augments Quantum.Quant
 *
 * @event Quantum.Array#insert
 * Возникает для каждого добавляемого элемента.
 * Аргумент: `index` — позиция вставки, `item` — вставляемый элемент, `nextItem` — элемент,
 * который окажется после вставленного блока, или `undefined`.
 *
 * @event Quantum.Array#remove
 * Возникает для каждого удаляемого элемента.
 * Аргумент: `index` — позиция, `item` — удаляемый элемент.
 *
 * @event Quantum.Array#splice
 * Возникает один раз, после всех `insert`/`remove` одной операции `splice`.
 * Аргумент: `start`, `deleteCount`, `insertItems` — параметры операции.
 */
Quantum.Array = Bricks.inherit(Quantum.Quant, {
    /**
     * @constructor
     * @param {Array<*>} [value] - начальный массив; `null`/`undefined` — пустой массив, значение, не являющееся массивом, — `TypeError`.
     * @param {Quantum.Array} [parentArray] - исходный массив, из которого строится этот (вместе с `transformer`).
     * @param {function(*, number): *} [transformer] - сопоставляет элементы исходного массива: `transformer(item, index)`.
     * @param {*} [transformerCtx] - `this` для трансформера.
     *
     * В пользовательском коде передаётся только `value`; остальные параметры — детали реализации
     * {@link Quantum.Array#transform}.
     * @throws {TypeError} если `value` не `null`/`undefined` и не массив.
     */
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

    /**
     * Добавляет элементы в конец массива.
     *
     * @param {Array<*>} items - массив элементов; что-то другое — `TypeError`.
     * @returns {undefined}
     * @throws {TypeError} если `items` не массив.
     * @fires Quantum.Array#insert
     * @fires Quantum.Array#change
     */
    append: function(items) {
        if (Bricks.Array.isArray(items)) {
            this.splice(this._value.length, 0, items);
        } else {
            throw new TypeError('items must be an array.');
        }
    },

    /**
     * Добавляет элементы в начало массива.
     *
     * @param {Array<*>} items - массив элементов; что-то другое — `TypeError`.
     * @returns {undefined}
     * @throws {TypeError} если `items` не массив.
     * @fires Quantum.Array#insert
     * @fires Quantum.Array#change
     */
    prepend: function(items) {
        if (Bricks.Array.isArray(items)) {
            this.splice(0, 0, items);
        } else {
            throw new TypeError('items must be an array.');
        }
    },

    /**
     * Добавляет элементы в конец массива.
     *
     * @param {...*} ...items - элементы (каждый аргумент — отдельный элемент).
     * @returns {number} новая длина массива.
     * @fires Quantum.Array#insert
     * @fires Quantum.Array#change
     */
    push: function() {
        this.splice(this._value.length, 0, [].slice.call(arguments, 0));
        return this._value.length;
    },

    /**
     * Убирает последний элемент массива.
     *
     * @returns {*} удалённый элемент, `undefined`, если массив был пуст.
     * @fires Quantum.Array#remove
     * @fires Quantum.Array#change
     */
    pop: function() {
        return this.splice(this._value.length - 1, 1)[0];
    },

    /**
     * Добавляет элементы в начало массива.
     *
     * @param {...*} ...items - элементы (каждый аргумент — отдельный элемент).
     * @returns {number} новая длина массива.
     * @fires Quantum.Array#insert
     * @fires Quantum.Array#change
     */
    unshift: function() {
        this.splice(0, 0, [].slice.call(arguments, 0));
        return this._value.length;
    },

    /**
     * Убирает первый элемент массива.
     *
     * @returns {*} удалённый элемент, `undefined`, если массив был пуст.
     * @fires Quantum.Array#remove
     * @fires Quantum.Array#change
     */
    shift: function() {
        return this.splice(0, 1)[0];
    },

    /**
     * Убирает все элементы массива.
     *
     * @returns {undefined}
     * @fires Quantum.Array#remove
     * @fires Quantum.Array#change
     */
    clear: function() {
        this.splice(0, this._value.length);
    },

    /**
     * Удаляет `deleteCount` элементов с позиции `start` и вставляет на их место `insertItems`.
     *
     * Возникает `remove` для каждого удаляемого, `insert` для каждого вставляемого и `splice`;
     * затем значение кванта обновляется (новая ссылка на массив), что порождает `change`/`prioritychange`.
     * Отрицательный `start` нормализуется от конца массива.
     * Если ничего не удаляется и не вставляется, метод ничего не делает
     * (ни событий, ни изменения значения).
     *
     * @param {number} [start=0] - позиция; отрицательная считается от конца.
     * @param {number} [deleteCount=0] - сколько элементов удалить с позиции `start`.
     * @param {Array<*>} [insertItems=[]] - элементы для вставки; не массив — `TypeError`.
     * @returns {Array<*>} удалённые элементы (пустой массив, если ничего не удалялось).
     * @throws {TypeError} если `insertItems` не массив.
     * @fires Quantum.Array#remove
     * @fires Quantum.Array#insert
     * @fires Quantum.Array#splice
     * @fires Quantum.Array#change
     */
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

    /**
     * Возвращает квант, значение которого — булево: пуст ли массив.
     *
     * Один и тот же квант возвращается при каждом обращении.
     *
     * @returns {Quantum.Quant}
     */
    isEmpty: function() {
        if (!this.$$_isEmpty) {
            this.$$_isEmpty = this.when(function(value) {
                return value.length === 0;
            });
        }
        return this.$$_isEmpty;
    },

    /**
     * Удаляет все элементы, для которых `callback(item)` возвращает истинное значение.
     *
     * Каждый удаляемый элемент убирается отдельным вызовом `splice`,
     * поэтому события (`remove`, `splice`, `change`) возникают на каждый элемент.
     *
     * @param {function(*): boolean} callback - условие удаления; получает элемент; `this` — `ctx`.
     * @param {*} [ctx] - `this` для `callback`.
     * @returns {undefined}
     * @fires Quantum.Array#remove
     * @fires Quantum.Array#splice
     * @fires Quantum.Array#change
     */
    remove: function(callback, ctx) {
        for (var i = this._value.length - 1; i >= 0; i--) {
            if (callback.call(ctx, this._value[i])) {
                this.splice(i, 1);
            }
        }
    },

    /**
     * Возвращает новый массив-квант, зависящий от этого.
     *
     * Значение нового кванта — элементы этого массива, обработанные `transformer`;
     * он следует за изменениями состава источника (его `splice`): вставляемые элементы
     * сопоставляются трансформером, удалённые — убираются.
     *
     * @param {function(*, number): *} transformer - сопоставляет элемент исходного массива: `transformer(item, index)`.
     * @param {*} [ctx] - `this` для трансформера.
     * @returns {Quantum.Array}
     */
    transform: function(transformer, ctx) {
        return new Quantum.Array(null, this, transformer, ctx);
    },

    /**
     * Подписывает слушателя; сверх базового поведения подписывает (при активации)
     * исходный массив на его `splice`, чтобы повторять изменения состава через `transformer`.
     *
     * @param {string} name - имя события.
     * @param {function} fn - слушатель.
     * @see Quantum.Quant#addEventListener
     */
    addEventListener: function() {
        if (this._listeners.length === 0 && this._parentArray) {
            Bricks.DOM.on(this._parentArray, 'splice', this.$$_onSpliceParent, this);
        }
        Quantum.Array.superclass.addEventListener.apply(this, arguments);
    },

    /**
     * Снимает слушателя; с последним слушателем снимает подписку на `splice` исходного массива.
     *
     * @param {string} name - имя события.
     * @param {function} fn - слушатель.
     * @see Quantum.Quant#removeEventListener
     */
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
