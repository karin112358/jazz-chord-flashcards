
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-PPPY5GKI.js"
  ]
},
  assets: {
    'index.csr.html': {size: 36946, hash: 'ca48de213beb4e8f8f1aa76e8e198e4090c13406d2cc831dd60f1d08f722641c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 24239, hash: 'b43cc1047c70b06c29ff467e9d470933b806a4ac35a0adeeee92bd3313f49367', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-IGBIE23H.css': {size: 16345, hash: 'tXr+rnOf2mI', text: () => import('./assets-chunks/styles-IGBIE23H_css.mjs').then(m => m.default)}
  },
};
