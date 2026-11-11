import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: {
      name: "site-docs",
      load: (context) =>
        docsLoader().load({
          ...context,
          // Re-evaluate scheduled publication even when content is unchanged.
          generateDigest: (data) =>
            context.generateDigest([
              new Date().toISOString().slice(0, 10),
              data,
            ]),
        }),
    },
    schema: (context) =>
      docsSchema({
        extend: z.object({
          date: z.coerce.date().optional(),
          modifiedDate: z.coerce.date().optional(),
          summary: z.string().optional(),
          author: z.string().optional(),
          tags: z.array(z.string()).default([]),
          image: z.string().optional(),
          imageAlt: z.string().optional(),
          source: z.string().optional(),
          readingTime: z.number().optional(),
          externalSource: z.string().optional(),
          hideTitle: z.boolean().default(false),
          hideDescription: z.boolean().default(false),
        }),
      })(context).transform((data) => ({
        ...data,
        draft: data.draft || Boolean(data.date && data.date > new Date()),
      })),
  }),
};
