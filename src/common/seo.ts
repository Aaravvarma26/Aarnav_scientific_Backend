/**
 * Structured data (JSON-LD) helpers for blog posts.
 *
 * Blog content is authored as Markdown in the admin panel. Rather than
 * requiring authors to fill in a separate FAQ field, we detect a
 * conventional "## Frequently Asked Questions" section in the post body
 * and turn it into FAQPage structured data automatically — this keeps the
 * structured data in sync with what's actually visible on the page, which
 * is what search engines expect.
 */

export type Faq = { question: string; answer: string };

/** Strips common Markdown syntax down to plain text for use in JSON-LD. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> text
    .replace(/[*_`]{1,3}/g, "") // bold/italic/code markers
    .replace(/^-{3,}\s*$/gm, "") // horizontal rules
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds a "Frequently Asked Questions" (or "FAQ"/"FAQs") heading in the
 * Markdown body and extracts Q&A pairs formatted as:
 *
 *   **1. Question text?**
 *   Answer paragraph.
 *
 * Returns an empty array if no FAQ section is found, so posts without one
 * simply don't get FAQPage structured data.
 */
export function extractFaqsFromMarkdown(markdown: string): Faq[] {
  const headingMatch = markdown.match(/^#{1,3}\s*(frequently asked questions|faqs?)\s*$/im);
  if (!headingMatch || headingMatch.index === undefined) return [];

  const afterHeading = markdown.slice(headingMatch.index + headingMatch[0].length);
  const nextHeadingMatch = afterHeading.match(/\n#{1,3}\s+\S/);
  const section = nextHeadingMatch ? afterHeading.slice(0, nextHeadingMatch.index) : afterHeading;

  const qaRegex = /\*\*\s*(?:\d+\.\s*)?(.+?\?)\s*\*\*\s*\n+([\s\S]*?)(?=\n\*\*|\n#{1,3}\s|$)/g;
  const faqs: Faq[] = [];
  let match: RegExpExecArray | null;
  while ((match = qaRegex.exec(section)) !== null) {
    const question = stripMarkdown(match[1]);
    const answer = stripMarkdown(match[2]);
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

/** Serializes a JSON-LD object safely for inlining in a <script> tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
