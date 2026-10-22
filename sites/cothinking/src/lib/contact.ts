// The ways to get in touch: a mailto: link whose subject names the page, a
// wa.me link whose message does, and prices with thousands separators.
import { contact } from '@site/site.config.ts';

/** PHP's rawurlencode: encodeURIComponent, with !'()* escaped too. */
export const rawUrlEncode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** A mailto: link with the subject `Enquiry: {about}`, else `Enquiry from cothink.ing`; `subject` overrides both. */
export function emailHref(about: string | null = null, subject?: string): string {
  const s = subject ?? (about ? `Enquiry: ${about}` : 'Enquiry from cothink.ing');
  return `mailto:${contact.email}?subject=${rawUrlEncode(s)}`;
}

/** A wa.me link whose message names the page (`about`), else the site. */
export function whatsappHref(about: string | null = null): string {
  const message = about
    ? `Hi Jotham, I read your page on ${about} on cothink.ing.`
    : 'Hi Jotham, I found you on cothink.ing.';
  return `https://wa.me/${contact.whatsappNumber}?text=${rawUrlEncode(message)}`;
}

/** A price as `3,900`. */
export const price = (amount: number): string => amount.toLocaleString('en-US');
