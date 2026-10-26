// Serve images through the Netlify Image CDN so pages never ship the
// full-resolution originals. Works for local `/img/...` paths; remote CMS
// images need their domain allow-listed under [images] in netlify.toml.
export function cdn(src: string, width: number, opts: { height?: number; quality?: number } = {}) {
  const params = new URLSearchParams({ url: src, w: String(width), fm: 'webp' });
  if (opts.height) {
    params.set('h', String(opts.height));
    params.set('fit', 'cover');
  }
  if (opts.quality) params.set('q', String(opts.quality));
  return `/.netlify/images?${params.toString()}`;
}

export function cdnSrcset(src: string, widths: number[], opts: { aspect?: number } = {}) {
  return widths
    .map((w) => `${cdn(src, w, opts.aspect ? { height: Math.round(w / opts.aspect) } : {})} ${w}w`)
    .join(', ');
}
