import { useMemo, type ReactNode } from 'react';
import { Image } from 'expo-image';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';
import { resolveNewsImage } from '@/services/newsService';

const markdown = new MarkdownIt({ html: false, linkify: true });
const callouts: Record<string, string> = {
  IMPORTANT: 'Evidencia científica', TIP: 'Consejo práctico', WARNING: 'Atención', NOTE: 'Nota', CAUTION: 'Precaución',
};

function normalizeContent(value: string) {
  return value
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/^>[ \t]*\[!(IMPORTANT|TIP|WARNING|NOTE|CAUTION)\][ \t]*/gim, (_, type: string) => `> **${callouts[type.toUpperCase()]}**\n>\n> `)
    .replace(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => `\n\n${'#'.repeat(Number(level))} ${text.trim()}\n\n`)
    .replace(/<\/?(?:strong|b)(?:\s[^>]*)?>/gi, '**')
    .replace(/<\/?(?:em|i)(?:\s[^>]*)?>/gi, '*')
    .replace(/<li(?:\s[^>]*)?>/gi, '\n- ')
    .replace(/<\/(?:li|ul|ol|p|div)>/gi, '\n')
    .replace(/<(?:ul|ol|p|div)(?:\s[^>]*)?>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

type NewsNode = { token: Token; children: NewsNode[] };

function buildTree(tokens: Token[]) {
  const root: NewsNode[] = [];
  const stack = [root];
  for (const token of tokens) {
    if (token.nesting === -1) {
      stack.pop();
      continue;
    }
    const node = { token, children: token.children ? buildTree(token.children) : [] };
    stack[stack.length - 1].push(node);
    if (token.nesting === 1) stack.push(node.children);
  }
  return root;
}

export default function NewsMarkdown({ content, fontSize, onOpenLink }: {
  content: string; fontSize: number; onOpenLink: (url: string) => void;
}) {
  const colors = useAppColors();
  const nodes = useMemo(() => buildTree(markdown.parse(normalizeContent(content), {})), [content]);
  const body = { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.65) };

  function inline(children: NewsNode[]): ReactNode[] {
    return children.map(({ token, children: nested }, index) => {
      switch (token.type) {
        case 'text': return token.content;
        case 'softbreak': return ' ';
        case 'hardbreak': return '\n';
        case 'strong_open': return <Text key={index} style={{ fontWeight: '800' }}>{inline(nested)}</Text>;
        case 'em_open': return <Text key={index} style={{ fontStyle: 'italic' }}>{inline(nested)}</Text>;
        case 's_open': return <Text key={index} style={{ textDecorationLine: 'line-through' }}>{inline(nested)}</Text>;
        case 'code_inline': return <Text key={index} style={{ backgroundColor: colors.card, fontFamily: 'monospace' }}>{token.content}</Text>;
        case 'link_open': {
          const href = token.attrGet('href');
          return <Text key={index} accessibilityRole="link" onPress={() => { if (href) onOpenLink(href); }}
            style={{ textDecorationLine: 'underline', fontWeight: '700' }}>{inline(nested)}</Text>;
        }
        case 'image': return token.content;
        default: return nested.length ? inline(nested) : token.content;
      }
    });
  }

  function paragraph(children: NewsNode[], key: number) {
    const items = children.flatMap(node => node.token.type === 'inline' ? node.children : [node]);
    if (!items.some(node => node.token.type === 'image')) return <Text key={key} style={body}>{inline(items)}</Text>;
    const parts: NewsNode[][] = [];
    for (const node of items) {
      const previous = parts[parts.length - 1];
      if (node.token.type === 'image' || !previous || previous[0].token.type === 'image') parts.push([node]);
      else previous.push(node);
    }
    return <View key={key} style={styles.blocks}>{parts.map((part, index) => {
      const { token } = part[0];
      const source = token.type === 'image' ? resolveNewsImage(token.attrGet('src') ?? undefined) : undefined;
      return source ? <Image key={index} source={{ uri: source }} accessibilityLabel={token.content || 'Imagen del artículo'}
        contentFit="contain" style={[styles.image, { backgroundColor: colors.card }]} /> : <Text key={index} style={body}>{inline(part)}</Text>;
    })}</View>;
  }

  function blocks(children: NewsNode[]): ReactNode[] {
    return children.map(({ token, children: nested }, index) => {
      switch (token.type) {
        case 'paragraph_open': return paragraph(nested, index);
        case 'heading_open': {
          const size = fontSize + (token.tag === 'h1' || token.tag === 'h2' ? 7 : 3);
          return <Text key={index} accessibilityRole="header" style={{ color: colors.text, fontWeight: '900', fontSize: size, lineHeight: size * 1.28 }}>{inline(nested)}</Text>;
        }
        case 'blockquote_open': return <View key={index} style={[styles.quote, { backgroundColor: colors.card, borderLeftColor: colors.tint }]}>{blocks(nested)}</View>;
        case 'bullet_list_open':
        case 'ordered_list_open': {
          const start = Number(token.attrGet('start') || '1');
          return <View key={index} style={styles.list}>{nested.map((item, position) => (
            <View key={position} style={styles.listRow}>
              <Text style={[body, styles.marker]}>{token.type === 'ordered_list_open' ? `${start + position}.` : '•'}</Text>
              <View style={styles.listContent}>{blocks(item.children)}</View>
            </View>
          ))}</View>;
        }
        case 'table_open': return <ScrollView key={index} horizontal contentContainerStyle={[styles.table, { borderColor: colors.border }]}>
          <View>{nested.map((section, part) => section.children.map((row, rowIndex) => (
            <View key={`${part}:${rowIndex}`} style={[styles.tableRow, { borderColor: colors.border, backgroundColor: section.token.type === 'thead_open' ? colors.card : undefined }]}>
              {row.children.map((cell, cellIndex) => <Text key={cellIndex} style={[body, styles.cell, cell.token.type === 'th_open' && { fontWeight: '800' }]}>{inline(cell.children)}</Text>)}
            </View>
          )))}</View>
        </ScrollView>;
        case 'hr': return <View key={index} style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
        case 'fence':
        case 'code_block': return <Text key={index} selectable style={[body, styles.code, { backgroundColor: colors.card }]}>{token.content.trimEnd()}</Text>;
        default: return nested.length ? <View key={index} style={styles.blocks}>{blocks(nested)}</View> : null;
      }
    });
  }

  return <View style={styles.blocks}>{blocks(nodes)}</View>;
}

const styles = StyleSheet.create({
  blocks: { gap: 16 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14 },
  quote: { borderLeftWidth: 4, borderRadius: 12, padding: 14, gap: 8 },
  list: { gap: 6 },
  listRow: { flexDirection: 'row', gap: 7, paddingLeft: 4 },
  listContent: { flex: 1, minWidth: 0, gap: 5 },
  marker: { minWidth: 18, fontWeight: '800' },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { width: 138, paddingHorizontal: 10, paddingVertical: 6 },
  code: { padding: 12, borderRadius: 10, fontFamily: 'monospace' },
});
