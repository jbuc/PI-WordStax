#!/usr/bin/env node
// Build script: assembles index.html with SOWPODS dictionary embedded
const fs = require('fs');

const dictBlock = fs.readFileSync('_dict_block.js', 'utf-8');

// Read the template that has DICT_PLACEHOLDER
const template = fs.readFileSync('_template.html', 'utf-8');
const html = template.replace('/* DICT_PLACEHOLDER */', dictBlock);

fs.writeFileSync('index.html', html);
console.log('Built index.html:', (html.length / 1024).toFixed(0), 'KB');
console.log('Lines:', html.split('\n').length);
