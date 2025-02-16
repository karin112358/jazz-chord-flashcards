
export default {
  basePath: '/',
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
