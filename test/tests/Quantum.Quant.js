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

        it('Quantum.format', function() {
            var foo = 5;
            var bar = new Quantum.Quant(6);
            var str = Quantum.format('foo: ${0}, bar: ${1}', foo, bar);
            chai.assert.equal(str.getValue(), 'foo: 5, bar: 6');
            bar.setValue(7);
            chai.assert.equal(str.getValue(), 'foo: 5, bar: 7');
        });

        it('removeEventListener', function() {
            var quant = new Quantum.Quant();
            var listener1 = sinon.spy();
            var listener2 = sinon.spy(function() {
                quant.removeEventListener('change', listener2);
            });
            var listener3 = sinon.spy();
            quant.addEventListener('change', listener1);
            quant.addEventListener('change', listener2);
            quant.addEventListener('change', listener3);

            quant.setValue(1);
            chai.assert.isOk(listener1.calledOnce);
            chai.assert.isOk(listener2.calledOnce);
            chai.assert.isOk(listener3.calledOnce);

            quant.setValue(2);
            chai.assert.isOk(listener1.calledTwice);
            chai.assert.isOk(listener2.calledOnce);
            chai.assert.isOk(listener3.calledTwice);
        });

        it('whenNull applies modifier only for null/undefined values', function() {
            var q = new Quantum.Quant(null);
            var fn = sinon.spy(function(value) {
                return 'replaced: ' + value;
            });
            var w = q.whenNull(fn);
            chai.assert.equal(w.getValue(), 'replaced: null');
            q.setValue(5);
            chai.assert.equal(w.getValue(), 5);
            chai.assert.equal(fn.callCount, 1);
            var change = sinon.spy();
            w.addEventListener('change', change);
            q.setValue(null);
            chai.assert.isOk(change.calledOnce);
            chai.assert.equal(change.firstCall.args[0].value, 'replaced: null');
            chai.assert.equal(change.firstCall.args[0].prevValue, 5);
            q.setValue(3);
            chai.assert.equal(change.lastCall.args[0].value, 3);
        });

        it('whenNotNull applies modifier only for non-null values', function() {
            var q = new Quantum.Quant(5);
            var fn = sinon.spy(function(value) {
                return value * 2;
            });
            var w = q.whenNotNull(fn);
            chai.assert.equal(w.getValue(), 10);
            q.setValue(null);
            chai.assert.equal(w.getValue(), null);
            chai.assert.equal(fn.callCount, 1);
            q.setValue(7);
            chai.assert.equal(w.getValue(), 14);
            chai.assert.equal(fn.callCount, 2);
        });

        it('touch fires change and prioritychange with unchanged value', function() {
            var q = new Quantum.Quant(5);
            var change = sinon.spy();
            var priority = sinon.spy();
            q.addEventListener('change', change);
            q.addEventListener('prioritychange', priority);
            q.touch();
            chai.assert.isOk(change.calledOnce);
            chai.assert.isOk(priority.calledOnce);
            chai.assert.equal(change.firstCall.args[0].value, 5);
            chai.assert.equal(change.firstCall.args[0].prevValue, 5);
            chai.assert.isTrue(priority.firstCall.args[0].touched);
        });

        it('touch propagates recomputation to when-child', function() {
            var obj = { a: 1 };
            var q = new Quantum.Quant(obj);
            var child = q.when(function(value) {
                return value.a;
            });
            var change = sinon.spy();
            child.addEventListener('change', change);
            q.getValue().a = 2;
            q.touch();
            chai.assert.isOk(change.calledOnce);
            chai.assert.equal(change.firstCall.args[0].value, 2);
            chai.assert.equal(change.firstCall.args[0].prevValue, 1);
        });

        it('Quantum.series', function() {
            var q = Quantum.series([1, 2, 3], 100);
            chai.assert.equal(q.getValue(), 1);
            var change = sinon.spy();
            q.addEventListener('change', change);
            clock.tick(100);
            chai.assert.equal(q.getValue(), 2);
            clock.tick(100);
            chai.assert.equal(q.getValue(), 3);
            clock.tick(100);
            chai.assert.equal(q.getValue(), 3);
            chai.assert.equal(change.callCount, 2);
        });

        it('Quantum.getTimer', function() {
            var timer = Quantum.getTimer(100);
            chai.assert.equal(timer.getValue(), Date.now());
            chai.assert.strictEqual(Quantum.getTimer(100), timer);
            var change = sinon.spy();
            timer.addEventListener('change', change);
            clock.tick(100);
            chai.assert.equal(timer.getValue(), Date.now());
            chai.assert.isOk(change.calledOnce);
            clock.tick(100);
            chai.assert.isOk(change.calledTwice);
        });

        it('Quantum.Array.push fires insert and splice events', function() {
            var a = new Quantum.Array([1]);
            var insert = sinon.spy();
            var remove = sinon.spy();
            var splice = sinon.spy();
            var change = sinon.spy();
            a.addEventListener('insert', insert);
            a.addEventListener('remove', remove);
            a.addEventListener('splice', splice);
            a.addEventListener('change', change);
            a.push(2);
            chai.assert.isOk(insert.calledOnce);
            var insertEvt = insert.firstCall.args[0];
            chai.assert.equal(insertEvt.index, 1);
            chai.assert.equal(insertEvt.item, 2);
            chai.assert.isUndefined(insertEvt.nextItem);
            chai.assert.isOk(remove.notCalled);
            var spliceEvt = splice.firstCall.args[0];
            chai.assert.equal(spliceEvt.start, 1);
            chai.assert.equal(spliceEvt.deleteCount, 0);
            chai.assert.deepEqual(spliceEvt.insertItems, [2]);
            chai.assert.isOk(change.calledOnce);
            chai.assert.deepEqual(change.firstCall.args[0].value, [1, 2]);
            chai.assert.deepEqual(change.firstCall.args[0].prevValue, [1]);
        });

        it('Quantum.Array.pop and shift fire remove events', function() {
            var a = new Quantum.Array([1, 2, 3]);
            var remove = sinon.spy();
            var change = sinon.spy();
            a.addEventListener('remove', remove);
            a.addEventListener('change', change);
            chai.assert.equal(a.pop(), 3);
            chai.assert.deepEqual(a.getValue(), [1, 2]);
            chai.assert.equal(remove.firstCall.args[0].index, 2);
            chai.assert.equal(remove.firstCall.args[0].item, 3);
            chai.assert.equal(a.shift(), 1);
            chai.assert.deepEqual(a.getValue(), [2]);
            chai.assert.equal(remove.secondCall.args[0].index, 0);
            chai.assert.equal(remove.secondCall.args[0].item, 1);
            chai.assert.equal(change.callCount, 2);
        });

        it('Quantum.Array.splice returns removed items and fires events', function() {
            var a = new Quantum.Array([1, 2, 3, 4]);
            var remove = sinon.spy();
            var insert = sinon.spy();
            var change = sinon.spy();
            a.addEventListener('remove', remove);
            a.addEventListener('insert', insert);
            a.addEventListener('change', change);
            var removed = a.splice(1, 2, [9]);
            chai.assert.deepEqual(removed, [2, 3]);
            chai.assert.deepEqual(a.getValue(), [1, 9, 4]);
            chai.assert.equal(remove.callCount, 2);
            chai.assert.equal(remove.firstCall.args[0].index, 1);
            chai.assert.equal(remove.firstCall.args[0].item, 2);
            chai.assert.equal(remove.secondCall.args[0].index, 2);
            chai.assert.equal(remove.secondCall.args[0].item, 3);
            chai.assert.isOk(insert.calledOnce);
            chai.assert.equal(insert.firstCall.args[0].index, 1);
            chai.assert.equal(insert.firstCall.args[0].item, 9);
            chai.assert.equal(insert.firstCall.args[0].nextItem, 4);
            chai.assert.isOk(change.calledOnce);
            chai.assert.deepEqual(change.firstCall.args[0].value, [1, 9, 4]);
        });

        it('Quantum.Array.transform', function() {
            var a = new Quantum.Array([1, 2, 3]);
            var t = a.transform(function(x) {
                return x * 10;
            });
            chai.assert.deepEqual(t.getValue(), [10, 20, 30]);
            var change = sinon.spy();
            t.addEventListener('change', change);
            a.push(4);
            chai.assert.isOk(change.calledOnce);
            chai.assert.deepEqual(change.firstCall.args[0].value, [10, 20, 30, 40]);
            a.pop();
            chai.assert.deepEqual(t.getValue(), [10, 20, 30]);
        });

        it('Quantum.Array.isEmpty', function() {
            var a = new Quantum.Array([1, 2]);
            var e = a.isEmpty();
            chai.assert.strictEqual(a.isEmpty(), e);
            chai.assert.isFalse(e.getValue());
            a.push(3);
            chai.assert.isFalse(e.getValue());
            a.clear();
            chai.assert.isTrue(e.getValue());
            a.push(1);
            chai.assert.isFalse(e.getValue());
        });
    });
})();
