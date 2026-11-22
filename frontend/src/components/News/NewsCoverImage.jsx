import React, { useState } from 'react';
import { getNewsCover } from '../../services/newsService';

export default function NewsCoverImage({ article, ...props }) {
  const { src, fallback } = getNewsCover(article);
  return <CoverImage key={JSON.stringify([src, fallback])} src={src} fallback={fallback} {...props} />;
}

function CoverImage({ src, fallback, ...props }) {
  const [failed, setFailed] = useState(0);
  const source = failed === 0 ? src : failed === 1 && fallback !== src ? fallback : undefined;
  if (!source) return null;
  return <img key={source} {...props} src={source} onError={() => setFailed(count => count + 1)} />;
}
