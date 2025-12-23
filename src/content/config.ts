import { defineCollection, z } from "astro:content";

export const collections = {
  blog: defineCollection({
    type: "content",
    schema: z.object({
      // YAMLを書かせないので、最低限だけ
      title: z.string().optional(),
      category: z.string().optional(),
    }),
  }),
};
