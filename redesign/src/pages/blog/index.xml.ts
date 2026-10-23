import { getPosts } from '../../data/blog';

const escape = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));

export async function GET() {
  const posts = await getPosts();
  const items = posts.map(({id, data}) => {
    const url = `https://spiffe.io/${id}/`;
    return `<item><title>${escape(data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escape(data.description || '')}</description><pubDate>${data.date!.toUTCString()}</pubDate><dc:creator>${escape(data.author || '')}</dc:creator>${data.tags.map(tag => `<category>${escape(tag)}</category>`).join('')}</item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>SPIFFE blog</title><link>https://spiffe.io/blog/</link><description>News from the SPIFFE and SPIRE community.</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
