/**
 * Квант — объект с изменяющимся значением. Базовая единица библиотеки.
 *
 * Хранит значение, которое можно прочитать (`getValue`) и изменить (`setValue`),
 * и извещает об изменении слушателей (события `change` и `prioritychange`).
 * Если значением кванта служит другой квант, значением считается значение вложенного
 * (рекурсивно, до «листовой» величины). Кванты связываются в when-цепочки —
 * тогда вся цепочка пересчитывается синхронно при каждом изменении источника.
 *
 * Активность: квант пассивен, пока у него нет слушателей, — источникам зависимости
 * (родителю в when-цепочке, вложенному кванту) он не следует, а `getValue` пересчитывает
 * значение при каждом обращении. Первый слушатель активирует квант (он начинает следовать
 * источникам и держать кэш значения), последний — деактивирует.
 *
 * @class Quantum.Quant
 *
 * @example
 * var source = new Quantum.Quant(5);
 * var squared = source.when(function(value) {
 *     return value * value;
 * });
 * squared.getValue();  // 25
 * source.setValue(6);
 * squared.getValue();  // 36
 *
 * @event Quantum.Quant#change
 * Возникает, когда развёрнутое значение фактически изменилось (новое отличается от старого, `!==`).
 * Аргумент — объект события: `type`, `target`, `value` — новое значение, `prevValue` — предыдущее.
 *
 * @event Quantum.Quant#prioritychange
 * Возникает вместе с `change`, а также при `touch()` (тогда `touched: true`, `value === prevValue`).
 * Это «техническое» событие библиотеки: на нём построены внутренние подписки между квантами
 * (when-цепочки, `Quantum.Array`, `Quantum.Combinator`). Для внешнего слушателя аргумент
 * тот же, что у `change`, плюс флаг `touched`.
 */
Quantum.Quant = Bricks.inherit({
    /**
     * @constructor
     * @param {*} [value] - начальное значение; если это квант, он «разворачивается»: значение берётся из него.
     * @param {Quantum.Quant} [parentQuant] - исходный квант, значение которого передаётся в `modifier` (используется `when`).
     * @param {function(*): *} [modifier] - функция, преобразующая значение `parentQuant` в значение этого кванта.
     * @param {*} [modifierCtx] - `this` для функции-модификатора.
     *
     * В пользовательском коде передается только `value`; остальные параметры — детали реализации `when`.
     */
    constructor: function(value, parentQuant, modifier, modifierCtx) {
        Quantum.Quant.superclass.constructor.apply(this, arguments);
        this._value = value;
        this._scalarValue = null;

        this._parentQuant = parentQuant;
        this._parentValue = {};
        this._modifier = modifier;
        this._modifierCtx = modifierCtx;

        this._listeners = [];
    },

    /**
     * Изменяет значение.
     *
     * Если новое значение — та же ссылка (`===`), ничего не происходит; в том числе, если значение —
     * объект или массив, чьи внутренности изменились на месте. Для таких случаев есть
     * {@link Quantum.Quant#touch}. Если новое значение — квант, квант подписывается на его изменения.
     * События `change`/`prioritychange` возникают, только если развёрнутое значение фактически изменилось.
     *
     * @param {*} value - новое значение.
     * @returns {undefined}
     * @fires Quantum.Quant#change
     * @fires Quantum.Quant#prioritychange
     */
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

    /**
     * Возвращает значение кванта.
     *
     * Если значением служит другой квант, возвращается значение вложенного
     * (рекурсивно, до «листовой» величины). Пассивный квант (без слушателей) пересчитывает
     * значение в момент обращения — при этом модификатор when-цепочки вызывается не чаще одного
     * раза на каждое значение родителя; активный возвращает кэшированное значение.
     *
     * @returns {*}
     */
    getValue: function() {
        if (this._listeners.length === 0) {
            return this._obtainScalarValue(true);
        } else {
            return this._scalarValue;
        }
    },

    /**
     * Принудительно извещает об изменении, чья ссылка не изменилась.
     *
     * Возникает `change` и `prioritychange` (с флагом `touched`) с текущим значением.
     * Пригодится, если значением служит объект или массив, изменившийся «на месте»:
     * активные дети when-цепочек синхронно повторно вызывают свои модификаторы.
     *
     * @returns {undefined}
     * @fires Quantum.Quant#change
     * @fires Quantum.Quant#prioritychange
     */
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

    /**
     * Возвращает новый квант, зависящий от этого и меняющийся синхронно с ним.
     *
     * `callback` — модификатор: преобразует значение исходного кванта в значение нового.
     * При изменении значения источника модификатор вызывается заново (не чаще одного раза
     * на каждое значение родителя), и если результат отличен от прежнего, новый квант
     * извещает слушателей. Также новый квант реагирует на `touch()` источника.
     *
     * @param {function(*): *} callback - модификатор; получает значение исходного кванта.
     * @param {*} [ctx] - `this` для модификатора.
     * @returns {Quantum.Quant}
     * @example
     * var squared = source.when(function(value) {
     *     return value * value;
     * });
     */
    when: function(callback, ctx) {
        return new Quantum.Quant(null, this, callback, ctx);
    },

    /**
     * Как {@link Quantum.Quant#when}, но `fn` вызывается только для значений `null`/`undefined`
     * остальные значения проходят в новый квант без изменений.
     *
     * @param {function(*): *} fn - преобразование null-значений.
     * @param {*} [ctx] - `this` для `fn`.
     * @returns {Quantum.Quant}
     */
    whenNull: function(fn, ctx) {
        return this.when(function(value) {
            return value === null || value === undefined ? fn.call(ctx, value) : value;
        }, this);
    },

    /**
     * Как {@link Quantum.Quant#when}, но `fn` вызывается только для значений, отличных
     * от `null`/`undefined`; `null`/`undefined` проходят в новый квант без изменений.
     *
     * @param {function(*): *} fn - преобразование ненулевых значений.
     * @param {*} [ctx] - `this` для `fn`.
     * @returns {Quantum.Quant}
     */
    whenNotNull: function(fn, ctx) {
        return this.when(function(value) {
            return value === null || value === undefined ? value : fn.call(ctx, value);
        }, this);
    },

    /**
     * Как {@link Quantum.Quant#when}, но элементы значения-массива передаются `fn` раздельными аргументами.
     *
     * @param {function} fn - модификатор; вызывается как `fn(value[0], value[1], …)`.
     * @param {*} [ctx] - `this` для `fn`.
     * @returns {Quantum.Quant}
     */
    spread: function(fn, ctx) {
        return this.when(function(value) {
            return fn.apply(ctx, value);
        }, this);
    },

    /**
     * Подписывает слушателя на события кванта.
     *
     * Квант извещает слушателей на `change` и `prioritychange` (разница — в описании класса);
     * слушатель получает объект события единственным аргументом, а `this` в нём — квант.
     * Первый слушатель активирует квант: он начинает следовать источникам зависимости
     * (родителю в when-цепочке, вложенному кванту) и поддерживать кэш значения.
     *
     * @param {string} name - имя события.
     * @param {function(Quantum.ChangeEvent): void} fn - слушатель.
     * @returns {undefined}
     */
    addEventListener: function(name, fn) {
        if (this._listeners.length === 0) {
            if (this._parentQuant) {
                Bricks.DOM.on(this._parentQuant, 'prioritychange', this.$$_onChangeParentValue, this);
                var parentValue = this._parentQuant.getValue();
                if (this._parentValue !== parentValue) {
                    this._value = this._modifier.call(this._modifierCtx, parentValue);
                    this._parentValue = parentValue;
                }
            }
            if (this._value instanceof Quantum.Quant) {
                Bricks.DOM.on(this._value, 'prioritychange', this.$$_onChangeNestedValue, this);
            }
            this._scalarValue = this._obtainScalarValue(false);
        }
        this._listeners.push({name: name, fn: fn});
    },

    /**
     * Снимает слушателя, подписанного через {@link Quantum.Quant#addEventListener}.
     *
     * Когда последний слушатель снят, квант деактивируется: перестаёт следовать
     * источникам зависимости, а `getValue` снова пересчитывает значение по требованию.
     *
     * @param {string} name - имя события.
     * @param {function} fn - тот же слушатель, что и в `addEventListener`.
     * @returns {undefined}
     */
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
        var listeners = this._listeners.slice(0);
        for (var i = 0; i < listeners.length; i++) {
            if (listeners[i].name === name) {
                listeners[i].fn.call(this, evt);
            }
        }
    },

    _updateScalarValue: function() {
        var scalarValue = this._obtainScalarValue(false);
        if (this._scalarValue !== scalarValue) {
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
        if (checkParent && this._parentQuant) {
            var parentValue = this._parentQuant.getValue();
            if (this._parentValue !== parentValue) {
                this._value = this._modifier.call(this._modifierCtx, parentValue);
                this._parentValue = parentValue;
            }
        }
        return this._value instanceof Quantum.Quant ? this._value.getValue() : this._value;
    },

    $$_onChangeNestedValue: function() {
        this._updateScalarValue();
    },

    $$_onChangeParentValue: function(evt) {
        this.setValue(this._modifier.call(this._modifierCtx, evt.value));
        this._parentValue = evt.value;
    }
});
