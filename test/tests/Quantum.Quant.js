(function() {
    //#imports

    describe('Quantum.Quant', function() {
        it('getValue returns initial value', function() {
            var quant = new Quantum.Quant(5);
            chai.assert.equal(quant.getValue(), 5);
        });

        it('getValue returns value of nested quant', function() {
            var quant1 = new Quantum.Quant(5);
            var quant2 = new Quantum.Quant(quant1);
            chai.assert.equal(quant2.getValue(), 5);
        });

        it('dependent quant', function() {
            var quant1 = new Quantum.Quant(5);
            var quant2 = quant1.when(function(value) {
                return value * value;
            });
            chai.assert.equal(quant2.getValue(), 25);
        });

        it('quant changes value when parent quant changes value', function() {
            var quant1 = new Quantum.Quant();
            var quant2 = quant1.when(function(value) {
                return value * value;
            });
            quant1.setValue(5);
            chai.assert.equal(quant2.getValue(), 25);
        });

        it('quant changes value when nested quant changes value', function() {
            var quant1 = new Quantum.Quant();
            var quant2 = new Quantum.Quant();
            var quant3 = quant1.when(function() {
                return quant2;
            });
            quant2.setValue(5);
            chai.assert.equal(quant3.getValue(), 5);
        });
    });
})();
