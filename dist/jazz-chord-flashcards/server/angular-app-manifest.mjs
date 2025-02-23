
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  assets: {
    'index.csr.html': {size: 24254, hash: 'f27b0fd594c2dda425ab9dd234d4d18aed1ddfb422a1e6aebacd0fee270b571f', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: 'f04fc2e0298fe5ca38646f10bf745090740cf3d044b4687aadc9fc0e79828235', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-N5NDWKTV.css': {size: 7914, hash: 'd6ocpzdEhGI', text: () => import('./assets-chunks/styles-N5NDWKTV_css.mjs').then(m => m.default)}
  },
};
