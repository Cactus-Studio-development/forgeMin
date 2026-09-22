import { Injectable } from '@nestjs/common';

export interface ScrapedPageResult {
  url: string;
  normalizedDomain: string;
  title: string;
  description: string;
  metaTags: Record<string, string>;
  rawText: string;
  cleanedText: string;
  detectedTechnologies: string[];
  links: string[];
  socialLinks: Record<string, string>;
  contactMethods: Array<{ type: string; value: string; label?: string }>;
  careersUrl?: string;
  contactUrl?: string;
  jsonLdData: any[];
  status: number;
}

@Injectable()
export class CrawlerService {
  normalizeUrl(rawUrl: string): { normalizedUrl: string; domain: string } {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    try {
      const parsed = new URL(clean);
      const domain = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      return {
        normalizedUrl: parsed.origin + parsed.pathname,
        domain,
      };
    } catch {
      const fallbackDomain = rawUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
      return {
        normalizedUrl: `https://${fallbackDomain}`,
        domain: fallbackDomain,
      };
    }
  }

  async scrapeUrl(targetUrl: string): Promise<ScrapedPageResult> {
    const { normalizedUrl, domain } = this.normalizeUrl(targetUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 RAS3OpportunityEngine/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const status = response.status;
      const html = await response.text();

      return this.parseHtml(normalizedUrl, domain, html, status);
    } catch (err: any) {
      return {
        url: normalizedUrl,
        normalizedDomain: domain,
        title: domain,
        description: `No se pudo acceder a la página directamente (${err.message || 'Error de red'}).`,
        metaTags: {},
        rawText: '',
        cleanedText: '',
        detectedTechnologies: [],
        links: [],
        socialLinks: {},
        contactMethods: [],
        jsonLdData: [],
        status: 0,
      };
    }
  }

  private parseHtml(url: string, domain: string, html: string, status: number): ScrapedPageResult {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? this.decodeHtml(titleMatch[1].trim()) : domain;

    const metaDescriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
    const description = metaDescriptionMatch ? this.decodeHtml(metaDescriptionMatch[1].trim()) : '';

    const metaTags: Record<string, string> = {};
    const metaRegex = /<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = this.decodeHtml(match[2]);
    }

    const jsonLdData: any[] = [];
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonMatch;
    while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsedJson = JSON.parse(jsonMatch[1]);
        jsonLdData.push(parsedJson);
      } catch {}
    }

    const detectedTechnologies = this.detectTechnologies(html);
    const socialLinks = this.extractSocialLinks(html);
    const links = this.extractLinks(html, url);

    const careersUrl = links.find((l) => /careers|jobs|empleo|unete|vacantes|work-with-us/i.test(l));
    const contactUrl = links.find((l) => /contact|contacto|contact-us|soporte/i.test(l));

    // Extract visible body text and sanitize
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const rawBody = bodyMatch ? bodyMatch[1] : html;
    const cleanWithoutScripts = rawBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');

    const strippedText = cleanWithoutScripts
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      url,
      normalizedDomain: domain,
      title,
      description,
      metaTags,
      rawText: strippedText.slice(0, 8000),
      cleanedText: strippedText.slice(0, 6000),
      detectedTechnologies,
      links: links.slice(0, 25),
      socialLinks,
      contactMethods: [],
      careersUrl,
      contactUrl,
      jsonLdData,
      status,
    };
  }

  private detectTechnologies(html: string): string[] {
    const techs = new Set<string>();
    const lower = html.toLowerCase();

    if (lower.includes('wp-content') || lower.includes('wordpress')) techs.add('WordPress');
    if (lower.includes('__next') || lower.includes('_next/static')) techs.add('Next.js');
    if (lower.includes('react') || lower.includes('react-dom') || lower.includes('_react')) techs.add('React');
    if (lower.includes('vue') || lower.includes('vue.js') || lower.includes('data-v-')) techs.add('Vue.js');
    if (lower.includes('angular') || lower.includes('ng-version')) techs.add('Angular');
    if (lower.includes('shopify') || lower.includes('cdn.shopify.com')) techs.add('Shopify');
    if (lower.includes('woocommerce')) techs.add('WooCommerce');
    if (lower.includes('webflow')) techs.add('Webflow');
    if (lower.includes('wix.com')) techs.add('Wix');
    if (lower.includes('tailwind') || lower.includes('tailwindcss')) techs.add('TailwindCSS');
    if (lower.includes('bootstrap')) techs.add('Bootstrap');
    if (lower.includes('google-analytics') || lower.includes('gtag') || lower.includes('analytics.js') || lower.includes('googletagmanager')) techs.add('Google Analytics');
    if (lower.includes('hubspot') || lower.includes('hs-scripts')) techs.add('HubSpot');
    if (lower.includes('stripe.com/v3')) techs.add('Stripe');
    if (lower.includes('intercom') || lower.includes('widget.intercom.io')) techs.add('Intercom Chat');
    if (lower.includes('crisp.chat')) techs.add('Crisp Chat');
    if (lower.includes('zendesk') || lower.includes('zopim')) techs.add('Zendesk');
    if (lower.includes('salesforce') || lower.includes('pardot')) techs.add('Salesforce');
    if (lower.includes('hotjar')) techs.add('Hotjar');
    if (lower.includes('segment.com') || lower.includes('cdn.segment.com')) techs.add('Segment');
    if (lower.includes('cloudflare')) techs.add('Cloudflare');

    return Array.from(techs);
  }

  private extractSocialLinks(html: string): Record<string, string> {
    const socials: Record<string, string> = {};
    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (/linkedin\.com\/(company|in)\//i.test(url) && !socials.linkedin) socials.linkedin = url;
      if (/twitter\.com\/|x\.com\//i.test(url) && !socials.twitter) socials.twitter = url;
      if (/github\.com\/[a-zA-Z0-9_-]+/i.test(url) && !socials.github) socials.github = url;
      if (/facebook\.com\/[a-zA-Z0-9._-]+/i.test(url) && !socials.facebook) socials.facebook = url;
      if (/instagram\.com\/[a-zA-Z0-9._-]+/i.test(url) && !socials.instagram) socials.instagram = url;
      if (/youtube\.com\/(c|channel|user)\//i.test(url) && !socials.youtube) socials.youtube = url;
    }
    return socials;
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1].trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      try {
        const absolute = new URL(href, baseUrl).toString();
        if (absolute.startsWith('http') && !links.includes(absolute)) {
          links.push(absolute);
        }
      } catch {}
    }
    return links;
  }

  private decodeHtml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }
}
