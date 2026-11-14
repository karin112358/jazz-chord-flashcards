
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-5D7WOLYB.js"
  ]
},
  assets: {
    'index.csr.html': {size: 22489, hash: 'c56cad07b3ca5c8789f79ee38efbf398d7d5b6d2f80020af7421180b5d7d1893', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 9686, hash: 'f3afa5fb677c26136663ddd82fafd3f9924961a4a4c5a155fc07f477f822e440', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-DPQVY2RW.css': {size: 17150, hash: 'c8fxKvV+SQU', text: () => import('./assets-chunks/styles-DPQVY2RW_css.mjs').then(m => m.default)}
  },
};
