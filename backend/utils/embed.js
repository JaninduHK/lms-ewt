// Extract embed IDs from YouTube / Vimeo URLs
const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const extractVimeoId = (url) => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

const detectVideo = (url) => {
  if (!url) return null;
  const yt = extractYouTubeId(url);
  if (yt) return { platform: 'youtube', embedId: yt };
  const vm = extractVimeoId(url);
  if (vm) return { platform: 'vimeo', embedId: vm };
  return null;
};

module.exports = { detectVideo, extractYouTubeId, extractVimeoId };
