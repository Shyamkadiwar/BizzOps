import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || 'billing@bizzops.shyamkadiwar.site';

export { resend, FROM_EMAIL };
