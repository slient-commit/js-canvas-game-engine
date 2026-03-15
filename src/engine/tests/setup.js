/**
 * Test setup: loads engine source files into globalThis
 * so tests can access classes like Vec2, Collision, etc.
 * Only loads files needed by tests (no DOM/canvas dependencies).
 *
 * Strategy: Transform top-level class/const/var declarations into
 * globalThis assignments, then evaluate with vm.runInThisContext.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineDir = resolve(__dirname, '..');

const files = [
  'util/rgb.js',
  'util/buttons.js',
  'util/vec2.js',
  'util/size.js',
  'animations/easing.js',
  'animations/tween.js',
  'util/eventEmitter.js',
  'physics/collision.js',
  'isometric/isometricUtils.js',
  'isometric/isometricMap.js',
  'isometric/pathFinder.js'
];

for (const file of files) {
  let code = readFileSync(resolve(engineDir, file), 'utf-8');
  // Transform declarations to globalThis assignments so they survive scope boundaries
  code = code
    .replace(/^class\s+(\w+)/gm, 'globalThis.$1 = class $1')
    .replace(/^const\s+(\w+)\s*=/gm, 'globalThis.$1 =')
    .replace(/^var\s+(\w+)\s*=/gm, 'globalThis.$1 =');
  vm.runInThisContext(code, { filename: file });
}
