// The ways to get in touch, as the Laravel views wrote them: a mailto: link
// whose subject names the page, a wa.me link whose message does, and prices
// with thousands separators (PHP's number_format).
import type { SiteConfig } from '@garden/lib/types.ts';

/** PHP's rawurlencode: encodeURIComponent, with !'()* escaped too. */
export const rawUrlEncode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

const setting = (site: SiteConfig, key: string): string => String(site.settings[key] ?? '');

/** A mailto: link with the subject `Enquiry: {about}`, else `Enquiry from cothink.ing`; `subject` overrides both. */
export function emailHref(site: SiteConfig, about: string | null = null, subject?: string): string {
  const s = subject ?? (about ? `Enquiry: ${about}` : 'Enquiry from cothink.ing');
  return `mailto:${setting(site, 'email')}?subject=${rawUrlEncode(s)}`;
}

/** A wa.me link whose message names the page (`about`), else the site. */
export function whatsappHref(site: SiteConfig, about: string | null = null): string {
  const message = about
    ? `Hi Jotham, I read your page on ${about} on cothink.ing.`
    : 'Hi Jotham, I found you on cothink.ing.';
  return `https://wa.me/${setting(site, 'whatsapp_number')}?text=${rawUrlEncode(message)}`;
}

/** A price from the settings global, as `3,900`. */
export const price = (site: SiteConfig, key: string): string => Number(site.settings[key]).toLocaleString('en-US');
