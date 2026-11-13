
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-6ACZKZKQ.js"
  ]
},
  assets: {
    'index.csr.html': {size: 36127, hash: 'f715c2e29f102126fd3cf2304c100999ebb2c564bee3e4503b3fe7867df94dd2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 23420, hash: '741de853d93a31eb058c30603f590b2871a6886478fd2a119e92baf6efe39fb1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-4VYJFUPQ.css': {size: 16292, hash: 'dCjo/NAa6z8', text: () => import('./assets-chunks/styles-4VYJFUPQ_css.mjs').then(m => m.default)}
  },
};
