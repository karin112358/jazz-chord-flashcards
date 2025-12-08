
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-6KZ7ZPM6.js"
  ]
},
  assets: {
    'index.csr.html': {size: 24209, hash: '69e0491dabbbb6e92eb5c69f5836586af02249e5db5cf7469f3960f5ab568fab', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: '0fe7560731ca53c6316299ee3c8b191a9f7d6656911500319019aa7cc3f4d122', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-D2UHHBDQ.css': {size: 8418, hash: '2EN7LDCHl2U', text: () => import('./assets-chunks/styles-D2UHHBDQ_css.mjs').then(m => m.default)}
  },
};
