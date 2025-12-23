import { parser } from './src/lib/language/parser.js';
import { highlightTree } from '@lezer/highlight';
import { m68kHighlightStyle } from './src/lib/language/language.js';

const code = `    ORG $1000
    MOVE.W #1, D0`;

const tree = parser.parse(code);

console.log("Tree structure:");
console.log(tree.toString());

console.log("\nHighlighting:");
highlightTree(tree, m68kHighlightStyle, (from, to, classes) => {
    console.log(`${from}-${to}: ${classes}`);
});
