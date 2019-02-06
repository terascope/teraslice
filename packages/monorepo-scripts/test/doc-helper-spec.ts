import 'jest-extended';
import path from 'path';
import * as index from '../src';

describe('Docs Helper', () => {
    const docsDir = path.join(__dirname, 'fixtures/docs');

    it('should export getDocs', async () => {
        const doc = await index.getDocs(docsDir);
        expect(doc).toHaveProperty('title', 'Docs');
        expect(doc).toHaveProperty('path', '');
        expect(doc).toHaveProperty('body');

        expect(doc.docs).toBeArrayOfSize(1);
        expect(doc.docs[0]).toMatchObject({
            path: 'section.md',
            title: 'Section'
        });

        expect(doc.children).toBeArrayOfSize(1);
        expect(doc.children[0]).toMatchObject({
            path: 'sub',
            title: 'Sub',
        });

        expect(doc.children[0].docs).toBeArrayOfSize(1);
        expect(doc.children[0].docs[0]).toMatchObject({
            path: 'sub/other-section.md',
            title: 'Other Section',
        });
    });
});
