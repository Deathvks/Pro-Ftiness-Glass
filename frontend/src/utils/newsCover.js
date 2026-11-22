export function getNewsCoverUrls(article, apiBase) {
  const api = apiBase.replace(/\/$/, '');
  const fallback = article.slug ? api + '/news/cover/' + encodeURIComponent(article.slug) : undefined;
  const image = article.image_url?.trim();
  if (!image || /(?:^|\/)entrenamiento\.png(?:[?#]|$)|photo-(?:1550572017-edd951aa8f72|1510519138197-06b8628cbf4f)/i.test(image)) {
    return { src: fallback, fallback };
  }
  return { src: image.startsWith('/api/news/cover/') ? api + image.slice(4) : image, fallback };
}
