'use strict';

// Node-харнес тестового сьюта (34 теста). Браузерный сьют (test/index.html,
// test/external/, .yaxy) — источник тестов; здесь прогоняется тот же сьют.
//
// Собранный тестовый файл — один IIFE: var Bricks / var Quantum локальны ему,
// а тестовый код берёт mocha/chai/sinon из глобального скоупа — харнес обязан
// выставить их сам. Точно так же нужны заглушки document/window/location:
// Bricks.DOM.getEl жадно вычисляет `doc || document`, samsam (sinon) требует
// document.createElement.
//
// process.exit — страховка: тест, создающий реальный таймер (напр. getTimer),
// не должен держать node-процесс живым.

var fs = require('fs');
var os = require('os');
var path = require('path');
var { execFileSync } = require('child_process');

// 1. Сборка dresscodejs'ом (собирающий бинарник обязателен в PATH).

var input = path.resolve(__dirname, '..', 'tests', 'Quantum.Quant.js');
var built = path.join(os.tmpdir(), 'dresscode-quantum-test-' + process.pid + '.js');

try {
    fs.writeFileSync(built, execFileSync('dresscodejs', ['-i', input], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    }));
} catch (err) {
    if (err.code === 'ENOENT') {
        console.error('dresscodejs not found in PATH. Install: npm install -g dresscodejs');
    } else {
        console.error((err.stderr && err.stderr.toString()) || err.message);
    }
    process.exit(2);
}

// 2. DOM-заглушки (до запуска собранного файла).

global.document = {
    getElementById: function() { return null; },
    createElement: function() { return {}; }
};
global.window = global;
global.location = { href: '' };

// 3. Библиотеки, которые тестовый код берёт из глобального скоупа.

global.chai = require('chai');
global.sinon = require('sinon');

// 4. Запуск.

var Mocha = require('mocha');
var mocha = new Mocha({ ui: 'bdd', color: true });
mocha.addFile(built);

mocha.run(function(failures) {
    fs.unlink(built, function() {});
    process.exit(failures ? 1 : 0);
});
