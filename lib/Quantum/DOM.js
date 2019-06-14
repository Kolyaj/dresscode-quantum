Quantum.DOM = {};

Quantum.DOM.getDocumentScroll = function(doc) {
    if (!Quantum.DOM.$$_documentScroll) {
        Quantum.DOM.$$_documentScroll = new Quantum.Quant(Bricks.DOM.getDocumentScroll(doc));
        Bricks.DOM.on(Bricks.DOM.getWindow(doc), 'scroll', function() {
            Quantum.DOM.$$_documentScroll.setValue(Bricks.DOM.getDocumentScroll(doc));
        });
    }
    return Quantum.DOM.$$_documentScroll;
};

Quantum.DOM.getViewportSize = function(doc) {
    if (!Quantum.DOM.$$_viewportSize) {
        Quantum.DOM.$$_viewportSize = new Quantum.Quant(Bricks.DOM.getViewportSize(doc));
        Bricks.DOM.on(Bricks.DOM.getWindow(doc), 'resize', function() {
            Quantum.DOM.$$_viewportSize.setValue(Bricks.DOM.getViewportSize(doc));
        });
    }
    return Quantum.DOM.$$_viewportSize;
};
