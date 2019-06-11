# `Quantum.Quant`

Экземпляр класса `Quantum.Quant` это объект с изменяющимся значением. По сути, это просто объект, хранящий в себе некое значение и имеющий методы `getValue()` и `setValue(value)`. Но есть пара важных свойств, делающих кванты удобными и полезными.

Метод `when(fn, ctx)` принимает функцию трансформации значения исходного кванта и возвращает новый квант, который будет меняться синхронно с исходным.
    
    var quant1 = new Quantum.Quant(5);
    var quant2 = quant1.when(funciton(value) {
        return value * value;
    });
    console.log(quant2.getValue()); // 25
    quant1.setValue(6);
    console.log(quant2.getValue()); // 36
    
Если значением кванта установить другой квант, то значением первого будет считаться значение вложенного.

    var quant1 = new Quantum.Quant(5);
    var quant2 = new Quantum.Quant(quant1);
    console.log(quant2.getValue()); // 5

Всё это позволяет строить синхронно обновляемые цепочки квантов.

## Ещё методы кванта

`quant.whenNotNull(fn, ctx)` вызывает `fn` только если значение исходного кванта не `null` и не `undefined`.

`quant.whenNull(fn, ctx)` вызывает `fn` только если значение исходного кванта `null` или `undefined`, остальные значения передаются в новый квант без изменений.  

## Полезные функции

`Quantum.combine(array)` принимает массив квантов и возвращает квант, зависящий от всех квантов из массива.

`Quantum.DOM.getDocumentScroll()` возвращает квант, содержащий позицию скрола документа.

`Quantum.DOM.getViewportSize()` возвращает квант, содержащий размер видимой части страницы.
