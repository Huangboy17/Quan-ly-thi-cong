const express = require('express');
const path = require('path');
const { JSDOM } = require('jsdom');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

const server = app.listen(3001, () => {
  console.log('Server running on 3001');
  
  const htmlPath = path.join(__dirname, 'dist', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const dom = new JSDOM(html, {
    url: 'http://localhost:3001/',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  dom.window.matchMedia = () => ({ matches: false });
  dom.window.localStorage = { getItem: () => null, setItem: () => {} };

  dom.window.console.error = (...args) => {
    console.log('REACT_ERROR:', args.map(a => String(a?.message || a)).join(' '));
  };
  dom.window.console.warn = () => {};
  dom.window.console.log = () => {};

  dom.window.addEventListener('error', (event) => {
    console.log('JSDOM_ERROR:', event.message, event.error ? event.error.stack : '');
  });

  dom.window.addEventListener('unhandledrejection', (event) => {
    console.log('JSDOM_UNHANDLED_REJECTION:', event.reason);
  });

  setTimeout(() => {
    console.log('Test finished.');
    server.close();
    process.exit(0);
  }, 5000);
});
