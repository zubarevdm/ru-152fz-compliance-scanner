import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

// Преобразует структуру шаблона { blocks } в DOCX-буфер.
export async function buildDocx(tpl) {
  const children = [];

  for (const b of tpl.blocks) {
    switch (b.type) {
      case 'h1':
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 120 },
            children: [new TextRun({ text: b.text, bold: true, size: 30 })],
          })
        );
        break;
      case 'h2':
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120, before: 200 },
            children: [new TextRun({ text: b.text, bold: true, size: 26 })],
          })
        );
        break;
      case 'p':
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 276 },
            children: [new TextRun({ text: b.text, size: 24 })],
          })
        );
        break;
      case 'list':
        for (const item of b.items) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60 },
              children: [new TextRun({ text: item, size: 24 })],
            })
          );
        }
        break;
      case 'spacer':
        children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
        break;
      default:
        break;
    }
  }

  const doc = new Document({
    creator: '152-проверка',
    title: tpl.title,
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1700, right: 850 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
