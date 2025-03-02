
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  assets: {
    'index.csr.html': {size: 24254, hash: 'dff3c0f0f25844bedd90c950e849c0c1bda23aa472aa2d60883882df361d2d4e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: '45cc6f4daeed8174986365ac8b807a6fe038843e1dd086c17414217ab598f722', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-PXWVFPAJ.css': {size: 8463, hash: 'UXFK1atAmBE', text: () => import('./assets-chunks/styles-PXWVFPAJ_css.mjs').then(m => m.default)}
  },
};
