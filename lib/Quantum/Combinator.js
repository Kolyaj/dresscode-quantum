/**
 * Квант, зависящий от набора исходных квантов: его значение — массив значений источников
 * в заданном порядке.
 *
 * Обычно его не конструируют напрямую, а получают через {@link Quantum.combine}.
 * `setValue` не поддерживается: значение всегда выводится из источников.
 * Если источник сообщил об изменении «на месте» (`touched`), комбинатор
 * сам вызывает `touch()`.
 *
 * @class Quantum.Combinator
 * @augments Quantum.Quant
 */
Quantum.Combinator = Bricks.inherit(Quantum.Quant, {
    /**
     * @constructor
     * @param {Array<(Quantum.Quant|*)>} children - источники: кванты и/или обычные значения; значение кванта — массив их значений в том же порядке.
     */
    constructor: function(children) {
        Quantum.Combinator.superclass.constructor.apply(this);
        this._children = children;
        this._value = children.map(function() {
            return {};
        });
    },

    /**
     * Не поддерживается: значение комбинатора всегда выводится из его источников.
     *
     * @param {*} value
     * @throws {Error}
     */
    setValue: function() {
        throw new Error('Not supported');
    },

    /**
     * Подписывает слушателя; при активации дополнительно подписывает каждый квантовый
     * источник на его `prioritychange`, при деактивации (с последним слушателем) — снимает.
     *
     * @param {string} name - имя события.
     * @param {function} fn - слушатель.
     * @see Quantum.Quant#addEventListener
     */
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

    /**
     * Снимает слушателя; с последним слушателем снимает подписки на источники.
     *
     * @param {string} name - имя события.
     * @param {function} fn - слушатель.
     * @see Quantum.Quant#removeEventListener
     */
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
