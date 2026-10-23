import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({
    loader: {
      name: 'site-docs',
      load: (context) => docsLoader().load({
        ...context,
        // Re-evaluate scheduled publication even when content is unchanged.
        generateDigest: (data) => context.generateDigest([new Date().toISOString().slice(0, 10), data]),
      }),
    },
    schema: (context) => docsSchema({ extend: z.object({
      date: z.coerce.date().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
    }) })(context).transform(data => ({
      ...data,
      draft: data.draft || Boolean(data.date && data.date > new Date()),
    })),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
