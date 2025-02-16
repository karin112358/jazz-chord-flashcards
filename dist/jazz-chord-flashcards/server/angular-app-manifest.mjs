
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  assets: {
    'index.csr.html': {size: 24254, hash: '0075fc934b2eff3360f2688d0d83cab6778196dfbe6fc1e6ba33df3d56f9d9ab', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17617, hash: '5a15a7517a6dc214789e0963accf0d8e599f645d0381fbda79061cb3319ca52d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-N5NDWKTV.css': {size: 7914, hash: 'd6ocpzdEhGI', text: () => import('./assets-chunks/styles-N5NDWKTV_css.mjs').then(m => m.default)}
  },
};
