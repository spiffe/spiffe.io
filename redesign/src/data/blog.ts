import { getCollection } from 'astro:content';

export async function getPosts() {
  return (await getCollection('docs', ({ id, data }) =>
    id.startsWith('blog/') && Boolean(data.date) && !data.draft
  )).sort((a, b) => b.data.date!.getTime() - a.data.date!.getTime());
}
