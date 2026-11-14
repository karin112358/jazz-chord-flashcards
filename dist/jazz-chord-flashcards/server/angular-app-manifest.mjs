
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
    'index.csr.html': {size: 22071, hash: '69dea89c09a591b2a967baeaef5c474edfe74e535eafe3fc2eecf152b40f8a80', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 9268, hash: '22b16974629725782a387039c3e28f2c8a212ccd1eedba46cc5d43f13dbfcb68', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-DPQVY2RW.css': {size: 17150, hash: 'c8fxKvV+SQU', text: () => import('./assets-chunks/styles-DPQVY2RW_css.mjs').then(m => m.default)}
  },
};
