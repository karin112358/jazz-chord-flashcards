
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    "chunk-JS6WSQFL.js"
  ]
},
  assets: {
    'index.csr.html': {size: 22489, hash: '28e62605d7826ec297479f8c612b1ce7cbe5b3bed923770ef573872746cf4564', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 9686, hash: '9fc9dd470a0cace6fd3fab2b059fce1146b0c678996dfabc61530ce5bbc26406', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-DPQVY2RW.css': {size: 17150, hash: 'c8fxKvV+SQU', text: () => import('./assets-chunks/styles-DPQVY2RW_css.mjs').then(m => m.default)}
  },
};
