// How to get in touch, written once: the email address and the phone number,
// and the links built from them. site.config.ts imports this for the
// navigation, the footer and the JSON-LD, and the views for their buttons, so
// it imports nothing from the site.

/** The address, and the number as written in Malaysia (WhatsApp is on it). */
export const contact = { email: 'jotham@cothink.ing', phone: '017-642 1337' };

/** The number as written abroad: Malaysia's 60 for the leading 0 (`+60 17-642 1337`). */
export const telephone = `+60 ${contact.phone.slice(1)}`;

/** PHP's rawurlencode: encodeURIComponent, with !'()* escaped too. */
const rawUrlEncode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** A mailto: link with the subject `Enquiry: {about}`, else `Enquiry from cothink.ing`; `subject` overrides both. */
export function emailHref(about: string | null = null, subject?: string): string {
  const s = subject ?? (about ? `Enquiry: ${about}` : 'Enquiry from cothink.ing');
  return `mailto:${contact.email}?subject=${rawUrlEncode(s)}`;
}

/** A wa.me link (the number in digits, with 60) whose message names the page (`about`), else the site. */
export function whatsappHref(about: string | null = null): string {
  const message = about
    ? `Hi Jotham, I read your page on ${about} on cothink.ing.`
    : 'Hi Jotham, I found you on cothink.ing.';
  return `https://wa.me/${telephone.replace(/\D/g, '')}?text=${rawUrlEncode(message)}`;
}

/** A price as `3,900`. */
export const price = (amount: number): string => amount.toLocaleString('en-US');
