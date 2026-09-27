/**
 * Кванты для браузерных величин: прокрутка документа и размер окна.
 *
 * @namespace Quantum.DOM
 */
Quantum.DOM = {};

/**
 * Возвращает квант с позицией прокрутки документа.
 *
 * Значение — массив `[left, top]`; обновляется по событию `scroll`.
 * Квант кэшируется один на всё: слушатель и вычисление значения ссылаются на `doc`
 * первого вызова (или глобальный `document`), последующие вызовы — сколько бы разных `doc`
 * ни передали — возвращают тот же квант.
 *
 * @param {Document} [doc=document]
 * @returns {Quantum.Quant}
 * @example
 * var scroll = Quantum.DOM.getDocumentScroll();
 * var pastHeader = scroll.when(function(pos) {
 *     return pos[1] > 500;
 * });
 */
Quantum.DOM.getDocumentScroll = function(doc) {
    if (!Quantum.DOM.$$_documentScroll) {
        Quantum.DOM.$$_documentScroll = Quantum.DOM.createWatcher(doc, 'scroll', function() {
            return Bricks.DOM.getDocumentScroll(doc);
        });
    }
    return Quantum.DOM.$$_documentScroll;
};

/**
 * Возвращает квант с размером видимой части страницы.
 *
 * Значение — массив `[width, height]`; обновляется по событию `resize`.
 * Кэширование — как у {@link Quantum.DOM.getDocumentScroll}: один квант на всё,
 * окно определяется первым вызовом.
 *
 * @param {Document} [doc=document]
 * @returns {Quantum.Quant}
 */
Quantum.DOM.getViewportSize = function(doc) {
    if (!Quantum.DOM.$$_viewportSize) {
        Quantum.DOM.$$_viewportSize = Quantum.DOM.createWatcher(doc, 'resize', function() {
            return Bricks.DOM.getViewportSize(doc);
        });
    }
    return Quantum.DOM.$$_viewportSize;
};

/**
 * Возвращает квант, который обновляется при событии окна.
 *
 * Значением служит результат `getValue()` — он вычисляется заново при каждом событии.
 * Основной потребитель — внутренние {@link Quantum.DOM#getDocumentScroll} и {@link Quantum.DOM#getViewportSize}.
 *
 * @param {Document} [doc=document] - документ, окно которого принимает слушателя.
 * @param {string} event - имя события на окне.
 * @param {function(): *} getValue - возвращает текущее значение.
 * @returns {Quantum.Quant}
 */
Quantum.DOM.createWatcher = function(doc, event, getValue) {
    var quant = new Quantum.Quant();
    Bricks.DOM.on(Bricks.DOM.getWindow(doc), event, function() {
        quant.setValue(Math.random());
    });
    return quant.when(getValue);
};
