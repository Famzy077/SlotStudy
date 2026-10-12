import React from 'react';
import { View, Text, Linking, ScrollView } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';

interface MarkdownRendererProps {
  content: string;
  onCitationPress?: (citation: string) => void;
  isStreaming?: boolean;
}

interface ParsedBlock {
  type: 'heading' | 'divider' | 'bullet' | 'ordered' | 'quote' | 'code' | 'paragraph';
  level?: number;
  num?: string;
  lang?: string;
  content: string;
}

/**
 * Tokenizer for inline formatting:
 * - [Source 1], [Sources 1, 2] -> Citation badges
 * - [label](url) -> Clickable links
 * - ***bold-italic***
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 */
const INLINE_TOKEN_REGEX =
  /(\[(?:Source|Sources)\s*[^\]]+\])|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;

function renderInlineContent(
  text: string,
  onCitationPress?: (citation: string) => void,
  isDark?: boolean,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  INLINE_TOKEN_REGEX.lastIndex = 0;

  while ((match = INLINE_TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`txt-${keyIndex++}`}>
          {text.substring(lastIndex, match.index)}
        </Text>,
      );
    }

    if (match[1]) {
      // Citation: e.g. [Source 2]
      const fullCitation = match[1];
      const citationText = fullCitation.slice(1, -1).trim();
      nodes.push(
        <Text
          key={`cit-${keyIndex++}`}
          onPress={() => onCitationPress?.(citationText)}
          className="font-inter-bold text-primary"
          style={{
            backgroundColor: isDark
              ? 'rgba(37, 99, 235, 0.25)'
              : 'rgba(219, 234, 254, 0.75)',
            borderRadius: 4,
            textDecorationLine: 'underline',
          }}
        >
          {` ${fullCitation} `}
        </Text>,
      );
    } else if (match[2]) {
      // Link: [label](url)
      const label = match[3];
      const url = match[4];
      nodes.push(
        <Text
          key={`lnk-${keyIndex++}`}
          onPress={() => Linking.openURL(url).catch(() => {})}
          className="font-inter-semibold text-primary"
          style={{ textDecorationLine: 'underline' }}
        >
          {label}
        </Text>,
      );
    } else if (match[5]) {
      // Bold-Italic: ***text***
      nodes.push(
        <Text
          key={`bi-${keyIndex++}`}
          className="font-inter-bold italic text-slate-900 dark:text-white"
        >
          {match[6]}
        </Text>,
      );
    } else if (match[7] || match[9]) {
      // Bold: **text** or __text__
      const boldText = match[8] || match[10];
      nodes.push(
        <Text
          key={`b-${keyIndex++}`}
          className="font-inter-bold text-slate-900 dark:text-white"
        >
          {boldText}
        </Text>,
      );
    } else if (match[11] || match[13]) {
      // Italic: *text* or _text_
      const italicText = match[12] || match[14];
      nodes.push(
        <Text
          key={`i-${keyIndex++}`}
          className="font-inter-regular italic text-slate-800 dark:text-slate-200"
        >
          {italicText}
        </Text>,
      );
    } else if (match[15]) {
      // Inline code: `text`
      const codeText = match[16];
      nodes.push(
        <Text
          key={`c-${keyIndex++}`}
          className="font-mono text-xs font-inter-semibold text-primary"
          style={{
            backgroundColor: isDark
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(241, 245, 249, 1)',
            borderRadius: 4,
          }}
        >
          {` ${codeText} `}
        </Text>,
      );
    }

    lastIndex = INLINE_TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Text key={`txt-${keyIndex++}`}>{text.substring(lastIndex)}</Text>,
    );
  }

  return nodes;
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          lang: codeLang,
          content: codeBuffer.join('\n'),
        });
        inCodeBlock = false;
        codeLang = '';
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty line
    if (!trimmed) {
      continue;
    }

    // Horizontal Divider
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      blocks.push({ type: 'divider', content: '' });
      continue;
    }

    // Heading (# to ######)
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      continue;
    }

    // Blockquote
    const quoteMatch = rawLine.match(/^\s*>\s*(.+)$/);
    if (quoteMatch) {
      blocks.push({
        type: 'quote',
        content: quoteMatch[1].trim(),
      });
      continue;
    }

    // Numbered list: 1. Item
    const orderedMatch = rawLine.match(/^\s*(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({
        type: 'ordered',
        num: orderedMatch[1],
        content: orderedMatch[2].trim(),
      });
      continue;
    }

    // Unordered bullet list: * Item, - Item, + Item
    const bulletMatch = rawLine.match(/^\s*[*+-]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet',
        content: bulletMatch[1].trim(),
      });
      continue;
    }

    // Regular paragraph
    blocks.push({
      type: 'paragraph',
      content: trimmed,
    });
  }

  // Handle unclosed code block if streaming
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      type: 'code',
      lang: codeLang,
      content: codeBuffer.join('\n'),
    });
  }

  return blocks;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationPress,
  isStreaming = false,
}) => {
  const { isDark } = useTheme();

  if (!content && !isStreaming) {
    return null;
  }

  const blocks = parseMarkdownBlocks(content || '');

  return (
    <View className="w-full">
      {blocks.map((block, idx) => {
        const isLastBlock = idx === blocks.length - 1;

        if (block.type === 'heading') {
          const level = block.level ?? 3;
          const headingClass =
            level === 1
              ? 'text-lg font-inter-bold text-slate-900 dark:text-slate-50 mt-3 mb-1.5'
              : level === 2
                ? 'text-base font-inter-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1'
                : level === 3
                  ? 'text-[15px] font-inter-bold text-slate-900 dark:text-slate-100 mt-2 mb-1'
                  : 'text-sm font-inter-semibold text-slate-800 dark:text-slate-200 mt-1.5 mb-1';

          return (
            <View key={`blk-${idx}`} className="w-full">
              <Text className={headingClass}>
                {renderInlineContent(block.content, onCitationPress, isDark)}
                {isStreaming && isLastBlock && (
                  <Text className="font-inter-bold text-primary"> ▍</Text>
                )}
              </Text>
            </View>
          );
        }

        if (block.type === 'divider') {
          return (
            <View
              key={`blk-${idx}`}
              className="my-2.5 h-[1px] w-full bg-slate-200 dark:bg-slate-700/70"
            />
          );
        }

        if (block.type === 'bullet') {
          return (
            <View key={`blk-${idx}`} className="my-1 flex-row items-start">
              <View className="mr-2.5 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <Text className="flex-1 text-[15px] font-inter-regular leading-relaxed text-slate-800 dark:text-slate-100">
                {renderInlineContent(block.content, onCitationPress, isDark)}
                {isStreaming && isLastBlock && (
                  <Text className="font-inter-bold text-primary"> ▍</Text>
                )}
              </Text>
            </View>
          );
        }

        if (block.type === 'ordered') {
          return (
            <View key={`blk-${idx}`} className="my-1 flex-row items-start">
              <View className="mr-2 mt-0.5 min-w-[20px] items-center justify-center rounded-md bg-blue-50 px-1 py-0.5 dark:bg-blue-900/40">
                <Text className="text-xs font-inter-bold text-primary">
                  {block.num}
                </Text>
              </View>
              <Text className="flex-1 text-[15px] font-inter-regular leading-relaxed text-slate-800 dark:text-slate-100">
                {renderInlineContent(block.content, onCitationPress, isDark)}
                {isStreaming && isLastBlock && (
                  <Text className="font-inter-bold text-primary"> ▍</Text>
                )}
              </Text>
            </View>
          );
        }

        if (block.type === 'quote') {
          return (
            <View
              key={`blk-${idx}`}
              className="my-1.5 rounded-r-xl border-l-4 border-primary bg-blue-50/60 p-2.5 dark:bg-blue-950/25"
            >
              <Text className="text-sm font-inter-medium italic leading-relaxed text-slate-700 dark:text-slate-200">
                {renderInlineContent(block.content, onCitationPress, isDark)}
                {isStreaming && isLastBlock && (
                  <Text className="font-inter-bold text-primary"> ▍</Text>
                )}
              </Text>
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <View
              key={`blk-${idx}`}
              className="my-2 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 p-3"
            >
              {Boolean(block.lang) && (
                <View className="mb-2 border-b border-slate-800 pb-1">
                  <Text className="font-mono text-[10px] uppercase text-slate-400">
                    {block.lang}
                  </Text>
                </View>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text className="font-mono text-xs leading-5 text-emerald-400">
                  {block.content}
                </Text>
              </ScrollView>
            </View>
          );
        }

        // Default: Paragraph
        return (
          <View key={`blk-${idx}`} className="mb-2">
            <Text className="text-[15px] font-inter-regular leading-relaxed text-slate-800 dark:text-slate-100">
              {renderInlineContent(block.content, onCitationPress, isDark)}
              {isStreaming && isLastBlock && (
                <Text className="font-inter-bold text-primary"> ▍</Text>
              )}
            </Text>
          </View>
        );
      })}

      {isStreaming && blocks.length === 0 && (
        <Text className="font-inter-bold text-primary">▍</Text>
      )}
    </View>
  );
};
