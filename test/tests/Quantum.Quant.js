(function() {
    //#imports

    var clock;

    beforeEach(function() {
        clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        clock.restore();
    });

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

        it('change event passes value and prevValue', function() {
            var quant = new Quantum.Quant(5);
            var callback = sinon.spy();
            quant.addEventListener('change', callback);
            quant.setValue(6);
            chai.assert.isOk(callback.called);
            chai.assert.equal(callback.firstCall.args[0].value, 6);
            chai.assert.equal(callback.firstCall.args[0].prevValue, 5);
        });

        it('change does not fire when nested quant replaced by another quant with the same value', function() {
            var quant = new Quantum.Quant(new Quantum.Quant(5));
            var callback = sinon.spy();
            quant.addEventListener('change', callback);
            quant.setValue(new Quantum.Quant(5));
            chai.assert.isOk(callback.notCalled);
        });

        it('to when callback passes scalarValue, not direct value', function() {
            var quant = new Quantum.Quant(new Quantum.Quant(5));
            var callback = sinon.spy();
            quant.when(callback);
            chai.assert.isOk(callback.calledOnce);
            chai.assert.equal(callback.firstCall.args[0], 5);
        });

        it('debounced quant changed once', function() {
            var quant = new Quantum.Quant(1);
            var debounced = Quantum.debounce(quant, 1000);
            chai.expect(debounced.getValue()).to.equal(1);
            quant.setValue(2);
            quant.setValue(3);
            quant.setValue(4);
            quant.setValue(5);
            chai.expect(debounced.getValue()).to.equal(1);
            clock.tick(1000);
            chai.expect(debounced.getValue()).to.equal(5);
        });
    });
})();
