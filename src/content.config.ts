import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";
import { latestSpireRelease } from "../scripts/markdown.mjs";

const event = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  venue: z.string().optional(),
  online: z.string().optional(),
  register: z.string().optional(),
  note: z.string().optional(),
  links: z
    .array(
      z.object({
        text: z.string(),
        url: z.string(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
});
const agenda = z.object({
  note: z.string().optional(),
  items: z.array(
    z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      label: z.string().optional(),
      title: z.string().optional(),
      abstract: z.string().optional(),
      speakers: z
        .array(z.object({ name: z.string(), org: z.string().optional() }))
        .optional(),
    }),
  ),
});

export const collections = {
  docs: defineCollection({
    loader: {
      name: "site-docs",
      load: (context) =>
        docsLoader().load({
          ...context,
          // Re-render when the day (scheduled posts) or the latest SPIRE release
          // (SPIRE_LATEST_* placeholders) changes, even if the file did not.
          generateDigest: (data) =>
            context.generateDigest([
              new Date().toISOString().slice(0, 10),
              latestSpireRelease().tag_name || "",
              data,
            ]),
        }),
    },
    schema: (context) =>
      docsSchema({
        extend: z.object({
          date: z.coerce.date().optional(),
          lastmod: z.coerce.date().optional(),
          author: z.string().optional(),
          tags: z.array(z.string()).default([]),
          image: context.image().optional(),
          imageAlt: z.string().optional(),
          scarf: z
            .enum(["high-interest", "medium-interest", "low-interest"])
            .optional(),
          // Hugo _index pages without child pages: own feed, left out of parent feeds.
          section: z.boolean().default(false),
          hideTitle: z.boolean().default(false),
          hideDescription: z.boolean().default(false),
          tagline: z.string().optional(),
          event: event.optional(),
          agenda: agenda.optional(),
        }),
      })(context).transform((data) => ({
        ...data,
        draft: data.draft || Boolean(data.date && data.date > new Date()),
      })),
  }),
};
