# dresscode-quantum

npm-библиотека: `Quantum` — кванты, объекты с изменяющимся значением (лексика — в CONTEXT.md). Корень npm-пакета = корень репозитория; библиотека — в `lib/` (объявлена `lib/.dresscode`).

## Знания

- `lib/.dresscode` объявляет Bricks двумя альтернативными путями: `../node_modules/dresscode-bricks/lib` (этот проект) и `../../../node_modules/dresscode-bricks/lib` (npm-hoisting в потребителе); в каждом layout существует ровно один, другой молча пропускается.
- dresscodejs — НЕ devDependency проекта: для сборки используется глобальный бинарник (`~/.nvm/.../bin/dresscodejs`); `.yaxy` для тестов вызывает `bin: dresscodejs ~/test/...` (хост `quantum.tests`, браузерный mocha в test/index.html).
- npm-скриптов нет; сьют (23 теста) прогоняется и в Node: собрать `test/tests/Quantum.Quant.js` dresscodejs'ом, заглушить `document`/`window`/`location`, reporter — `mocha.reporter(fn)`, в конце `process.exit(0)` (getTimer держит node-процесс живым интервалом).
- Кванты пассивны, пока нет ни одного слушателя: активность = `this._listeners.length > 0` (guard-проверки в ~10 местах в трёх классах); первый слушатель активирует квант, последний деактивирует. Модель введена 28c2587 (2023, «утечки памяти») взамен навечных `_dependents`; в том же коммите удалён `ifNotNull`.
- Внутренние подписки между квантами идут через `Bricks.DOM.on` — шов осознанный, внутрисемейный (Bricks — наша библиотека): ctx-привязка поверх `addEventListener`, которая намеренно без `this` (единообразие с платформой). `Bricks.DOM.un`/`unAll` согласованы с cascade-деактивацией квантов (проверено репро 18/18: без осиротевших ссылок и skips); единственное ограничение: `unAll()` не видит прямые user-слушатели — квант, переживший `unAll()`, остаётся с устаревшим значением до remove/add-цикла.
- 51e84eb (2025): dispatch в `_fireEvent` идёт по снапшоту `this._listeners.slice(0)` — иначе снятие слушателя из собственного обработчика пропускало следующего.
- c586975 (2024): кэш `_parentValue` гарантирует один вызов modifier на каждое значение родителя (без него пассивный getValue переопрашивал бы modifier на каждый вызов).
- node_modules/dresscode-bricks — настоящий npm-пакет 0.2.10 (не symlink на соседний проект).
