
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-CHSZWYP2.js"
  ]
},
  assets: {
    'index.csr.html': {size: 24209, hash: 'e1fb83ed76a54c7750cc0453b07f2ad64525b5dd37102f338473d4f348e4a418', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: '742ebd1ad58e215ba00b4168d1cbb791fc8c23351f5a1757fc1f4944744ebbf0', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-D2UHHBDQ.css': {size: 8418, hash: '2EN7LDCHl2U', text: () => import('./assets-chunks/styles-D2UHHBDQ_css.mjs').then(m => m.default)}
  },
};
