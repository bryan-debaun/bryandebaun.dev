import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    published: { type: 'string', required: false },
    date: { type: 'date', required: false },
    description: { type: 'string', required: false },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath,
    },
  },
}))

export default makeSource({
  contentDirPath: 'src/content',
  documentTypes: [Post],
})
