Quantum.DOM = {};

Quantum.DOM.getDocumentScroll = function(doc) {
    if (!Quantum.DOM.$$_documentScroll) {
        Quantum.DOM.$$_documentScroll = Quantum.DOM.createWatcher(doc, 'scroll', function() {
            return Bricks.DOM.getDocumentScroll(doc);
        });
    }
    return Quantum.DOM.$$_documentScroll;
};

Quantum.DOM.getViewportSize = function(doc) {
    if (!Quantum.DOM.$$_viewportSize) {
        Quantum.DOM.$$_viewportSize = Quantum.DOM.createWatcher(doc, 'resize', function() {
            return Bricks.DOM.getViewportSize(doc);
        });
    }
    return Quantum.DOM.$$_viewportSize;
};

Quantum.DOM.createWatcher = function(doc, event, getValue) {
    var quant = new Quantum.Quant();
    Bricks.DOM.on(Bricks.DOM.getWindow(doc), event, function() {
        quant.setValue(Math.random());
    });
    return quant.when(getValue);
};
