
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
    'index.csr.html': {size: 24209, hash: 'a7496f517fd36d82e7d6f71c4bd81e74cdda8f45a11f8d0cdf2fe4cebb450dd2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: '49b7d6bb5d6a133030fe68427cae7c92290625d9e683246e60a20562e78d429c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-D2UHHBDQ.css': {size: 8418, hash: '2EN7LDCHl2U', text: () => import('./assets-chunks/styles-D2UHHBDQ_css.mjs').then(m => m.default)}
  },
};
