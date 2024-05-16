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

        it('quant changes value when parent quant changes value when quant has listeners', function() {
            var quant1 = new Quantum.Quant();
            var quant2 = quant1.when(function(value) {
                return value * value;
            });
            quant2.addEventListener('change', function() {

            });
            quant1.setValue(5);
            chai.assert.equal(quant2.getValue(), 25);
        });

        it('quant changes value when parent quant changes value when quant has listeners (more deep)', function() {
            var quant1 = new Quantum.Quant();
            var quant2 = new Quantum.Quant();
            var quant3 = new Quantum.Quant(false);
            quant1.setValue(quant3.when(function(value) {
                return value && quant2;
            }));
            quant3.setValue(true);
            quant1.addEventListener('change', function() {

            });
            quant2.setValue(5);
            chai.assert.equal(quant1.getValue(), 5);
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
            var quant1 = new Quantum.Quant(new Quantum.Quant(5));
            var callback = sinon.spy();
            var quant2 = quant1.when(callback);
            quant2.getValue();
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

        it('quant.spread', function() {
            var quant1 = new Quantum.Quant([1, 2]);
            var callback = sinon.spy();
            var quant2 = quant1.spread(callback);
            quant2.getValue();
            chai.assert.equal(callback.firstCall.args[0], 1);
            chai.assert.equal(callback.firstCall.args[1], 2);
        });

        it('Quantum.combine with getValue', function() {
            var quant1 = new Quantum.Quant(1);
            var quant2 = new Quantum.Quant(2);
            var quant3 = Quantum.combine([quant1, quant2]).spread(function(q1, q2) {
                return q1 + q2;
            });
            chai.assert.equal(quant3.getValue(), 3);
            quant1.setValue(3);
            quant2.setValue(4);
            chai.assert.equal(quant3.getValue(), 7);
        });

        it('Quantum.combine with onChange', function() {
            var quant1 = new Quantum.Quant();
            var quant2 = new Quantum.Quant();
            var quant3 = Quantum.combine([quant1, quant2]).spread(function(q1, q2) {
                if (q1 && q2) {
                    return q1 + q2;
                }
            });
            var result;
            quant3.addEventListener('change', function(evt) {
                result = evt.value;
            });
            quant1.setValue(3);
            quant2.setValue(4);
            chai.assert.equal(result, 7);
        });

        it('Forced change of quant in Combinator', function() {
            var q1 = new Quantum.Quant([1]);
            var q2 = Quantum.combine([q1]).spread(function(ar) {
                return ar.length;
            });
            var length = q2.getValue();
            q2.addEventListener('change', function(evt) {
                length = evt.value;
            });
            chai.assert.equal(length, 1);
            q1.getValue().push(2);
            chai.assert.equal(length, 1);
            q1.touch();
            chai.assert.equal(length, 2);
        });

        it('Several calls of getValue return the same value', function() {
            var q1 = new Quantum.Quant(1);
            var q2 = q1.when(function() {
                return {};
            });
            chai.assert.equal(q2.getValue(), q2.getValue());
        });

        it('Several calls of getValue of combine return the same value', function() {
            var q1 = new Quantum.Quant(1);
            var q2 = Quantum.combine([q1]);
            chai.assert.equal(q2.getValue(), q2.getValue());
        });

        it('Long chain of quants', function() {
            var q1 = new Quantum.Quant(1);
            var q2 = q1.when(function(value) {
                return value + 1;
            });
            var q3 = q2.when(function(value) {
                return value + 1;
            });
            q1.setValue(5);
            chai.assert.equal(q3.getValue(), 7);
        });

        it('Several calls of getValue of long when-chain quant', function() {
            var q1 = new Quantum.Quant();
            var q2 = q1.when(function() {
                return 1;
            }).when(function() {
                return {};
            });
            chai.assert.equal(q2.getValue(), q2.getValue());
        });

        it('Long chain of when', function() {
            var q1 = new Quantum.Quant(1);
            var q2 = q1.when(function(q) {
                return q + 1;
            });
            var q3 = q2.when(function(q) {
                return q + 1;
            });
            chai.assert.equal(q3.getValue(), 3);
            q1.setValue(5);
            chai.assert.equal(q3.getValue(), 7);
        });

        it('Quantum.Array with getValue', function() {
            var array = new Quantum.Array();
            var length = array.when(function(a) {
                return a.length;
            });
            chai.assert.equal(length.getValue(), 0);
            array.push(5);
            chai.assert.equal(length.getValue(), 1);
        });
    });
})();
