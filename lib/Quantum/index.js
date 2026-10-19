/**
 * `Quantum` — объекты с изменяющимся значением («кванты») и синхронно обновляющиеся цепочки из них.
 *
 * Квант хранит значение, которое можно прочитать (`getValue`) и изменить (`setValue`),
 * и извещает об изменении слушателей (события `change` и `prioritychange`).
 * Кванты связываются в when-цепочки ({@link Quantum.Quant#when}), объединяются в
 * комбинаторы (`Quantum.combine`) и превращаются в массивы с событиями состава (`Quantum.Array`).
 *
 * @namespace Quantum
 */
var Quantum = {};

/**
 * Описание объекта события кванта: передаётся слушателю единственным аргументом.
 *
 * @typedef {Object} Quantum.ChangeEvent
 * @property {string} type - имя события.
 * @property {Quantum.Quant} target - квант, на котором событие произошло.
 * @property {*} value - значение после события.
 * @property {*} prevValue - значение до события.
 * @property {boolean} [touched] - для `prioritychange`: true, если событие вызвано {@link Quantum.Quant#touch} (ссылка на значение не менялась).
 */

/**
 * Оборачивает значение в квант.
 *
 * @param {*} value - любое значение, в том числе другой квант.
 * @returns {Quantum.Quant} если `value` уже квант — он сам, иначе — новый квант с этим значением.
 * @example
 * var q = Quantum.quantize(5);          // то же, что new Quantum.Quant(5)
 * var q2 = Quantum.quantize(existing);  // вернёт existing
 */
Quantum.quantize = function(value) {
    return value instanceof Quantum.Quant ? value : new Quantum.Quant(value);
};

/**
 * Возвращает квант, значение которого — текущее время, обновляемый по таймеру.
 *
 * Пригодится для периодического пересчёта того, у чего нет собственного источника изменения
 * (обратный отсчёт, when-цепочка с внутренними часами).
 * Для одного и того же `timeout` возвращается один и тот же квант —
 * он кэшируется и живёт всё время, пока жива страница.
 *
 * @param {number} [timeout=50] - период обновления, в миллисекундах.
 * @returns {Quantum.Quant} квант со значением `Date.now()`, обновляемый каждые `timeout` мс.
 * @example
 * var timer = Quantum.getTimer(1000);
 * var remaining = timer.when(function(now) {
 *     return deadline - now;
 * });
 */
Quantum.getTimer = function(timeout) {
    timeout = timeout || 50;
    if (!this.$$_timers) {
        this.$$_timers = {};
    }
    if (!this.$$_timers[timeout]) {
        var timer = new Quantum.Quant(Date.now());
        setInterval(function() {
            timer.setValue(Date.now());
        }, timeout);
        this.$$_timers[timeout] = timer;
    }
    return this.$$_timers[timeout];
};

/**
 * Возвращает квант, зависящий от набора исходных квантов (комбинатор).
 *
 * Квант-результат (`Quantum.Combinator`) обновляется, когда меняется хотя бы один из источников;
 * его значение — массив значений источников в заданном порядке.
 * Обычные (не-квантовые) значения в массиве проходят в нём без изменений.
 *
 * @param {Array<(Quantum.Quant|*)>} quants - источники: кванты и/или обычные значения.
 * @returns {Quantum.Combinator}
 * @example
 * var total = Quantum.combine([price, quantity]).when(function(values) {
 *     return values[0] * values[1];
 * });
 */
Quantum.combine = function(quants) {
    return new Quantum.Combinator(quants);
};

/**
 * Разворачивает вложенный массив до плоского.
 *
 * Всегда возвращает `Quantum.Quant`, значение которого — плоский массив скаляров
 * (полная глубина вложенности; `null`/`undefined`/`''` сохраняются). Кванты
 * развёртываются до скаляров на любом уровне вложенности — результат никогда
 * не содержит квантов. Квантов во входе нет — квант-результат статичен.
 *
 * Результат полностью динамический: изменение любого отслеживаемого кванта (на любой
 * глубине) пересчитывает значение и шлёт `change`/`prioritychange`; кванты, появившиеся
 * в содержимом, обнаруживаются и отслеживаются, исчезнувшие — отписываются. При снятии
 * последнего слушателя вся цепочка деактивируется, пассивный `getValue` пересчитывает
 * значение по требованию.
 *
 * @param {Array} arr - вложенный массив, элементы — кванты и/или скаляры.
 * @returns {Quantum.Quant} квант с плоским массивом скаляров.
 */
Quantum.flatten = function(arr) {
    var flat = Bricks.Array.flatten(arr);
    var hasQuants = flat.some(function(item) {
        return item instanceof Quantum.Quant;
    });
    return hasQuants ? Quantum.combine(flat).when(Quantum.flatten) : new Quantum.Quant(flat);
};

/**
 * Возвращает «дебаунсенный» квант.
 *
 * Значение результата обновляется через `delay` мс после последнего изменения источника:
 * новое изменение сбрасывает интервал, значение берётся по его окончании.
 *
 * @param {Quantum.Quant} quant - исходный квант.
 * @param {number} delay - интервал, в миллисекундах.
 * @returns {Quantum.Quant}
 */
Quantum.debounce = function(quant, delay) {
    var debounced = new Quantum.Quant(quant.getValue());
    quant.addEventListener('change', Bricks.Function.debounce(function() {
        debounced.setValue(quant.getValue());
    }, delay));
    return debounced;
};

/**
 * Возвращает квант, который последовательно проигрывает значения.
 *
 * Первое значение ставится сразу, затем каждое следующее — через `delay` мс.
 * После последнего значения квант перестаёт меняться.
 *
 * @param {Array<*>} values - последовательность значений.
 * @param {number} [delay=1] - интервал между значениями, в миллисекундах.
 * @returns {Quantum.Quant}
 */
Quantum.series = function(values, delay) {
    var quant = new Quantum.Quant();
    var i = 0;
    (function next() {
        quant.setValue(values[i++]);
        if (i < values.length) {
            setTimeout(next, delay || 1);
        }
    })();
    return quant;
};

/**
 * Возвращает квант с сформатированной строкой.
 *
 * Значение — результат проброса аргументов в шаблон `str` (`Bricks.String.format`);
 * квант обновляется, когда меняется любой из квантовых аргументов.
 * Аргументы, не являющиеся квантами, — постоянные части строки.
 *
 * @param {string} str - шаблон форматирования.
 * @param {(Quantum.Quant|*)} ...args - значения для шаблона: кванты или обычные значения.
 * @returns {Quantum.Quant}
 * @example
 * var label = Quantum.format('Цена: %s, в наличии: %s', price, count);
 * // label.getValue() → «Цена: 100, в наличии: 3»; обновится при изменении price или count
 */
Quantum.format = function(str) {
    var args = [].slice.call(arguments, 1);
    var format = Bricks.String.format;
    return Quantum.combine(args).when(function(args) {
        return format.apply(Bricks.String, [str].concat(args));
    });
};
