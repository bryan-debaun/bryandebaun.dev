import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

export const Post = defineDocumentType(() => ({
    name: 'Post',
    filePathPattern: `posts/**/*.mdx`,
    contentType: 'mdx',
    fields: {
        title: { type: 'string', required: true },
        published: { type: 'boolean', default: true },
        private: { type: 'boolean', default: false },
        date: { type: 'date', required: false },
        tags: { type: 'list', of: { type: 'string' }, required: false },
        summary: { type: 'string', required: false },
        reading: { type: 'json', required: false },
        ogImage: { type: 'string', required: false },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.flattenedPath,
        },
    },
}));

export const Philosophy = defineDocumentType(() => ({
    name: 'Philosophy',
    filePathPattern: `philosophy/**/*.mdx`,
    contentType: 'mdx',
    fields: {
        title: { type: 'string', required: true },
        date: { type: 'date', required: false },
        private: { type: 'boolean', default: false },
        tags: { type: 'list', of: { type: 'string' }, required: false },
        summary: { type: 'string', required: false },
        reading: { type: 'json', required: false },
        ogImage: { type: 'string', required: false },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.flattenedPath,
        },
    },
}));

export default makeSource({
    contentDirPath: 'src/content',
    documentTypes: [Post, Philosophy],
    disableImportAliasWarning: true,
});
