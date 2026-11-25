'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { ArrowUpRight, Check, Loader2 } from 'lucide-react';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    href: 'https://github.com/nizampradipa',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.98 10.98 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/nizam-pradipa-522565442',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/imdippaa',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
      </svg>
    ),
  },
  {
    name: 'Dribbble',
    href: 'https://dribbble.com/dipapradipa',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2Zm6.6 4.61a8.54 8.54 0 0 1 1.93 5.31 12.7 12.7 0 0 0-5.43-.26 25.4 25.4 0 0 0-.89-2.06 11.4 11.4 0 0 0 4.39-2.99ZM12 3.47a8.49 8.49 0 0 1 5.6 2.1 10.1 10.1 0 0 1-3.98 2.71A38.5 38.5 0 0 0 10.35 3.63a8.6 8.6 0 0 1 1.65-.16ZM8.73 4.13a37.1 37.1 0 0 1 3.3 4.65 26.2 26.2 0 0 1-8.49 1.07 8.54 8.54 0 0 1 5.19-5.72ZM3.47 12v-.26a27.9 27.9 0 0 0 9.31-1.24c.26.52.51 1.05.74 1.59l-.35.1a14.4 14.4 0 0 0-7.24 5.91A8.48 8.48 0 0 1 3.47 12Zm8.53 8.53a8.47 8.47 0 0 1-5.05-1.66 13.1 13.1 0 0 1 6.72-5.49l.18-.06a29.7 29.7 0 0 1 1.64 6.53 8.48 8.48 0 0 1-3.49.68Zm4.91-1.45a31.2 31.2 0 0 0-1.51-6.11 11.3 11.3 0 0 1 5.04.38 8.55 8.55 0 0 1-3.53 5.73Z" />
      </svg>
    ),
  },
];

function MagneticSubmitButton({
  status,
}: {
  status: FormStatus;
}) {
  const prefersReducedMotion = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.6 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion || !btnRef.current || status === 'sending') return;
    const rect = btnRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.22);
    y.set(dy * 0.22);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const label =
    status === 'sending'
      ? 'Sending...'
      : status === 'sent'
        ? 'Message sent'
        : 'Send message';

  return (
    <motion.button
      ref={btnRef}
      type="submit"
      disabled={status === 'sending'}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={prefersReducedMotion ? undefined : { x, y }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#f5f5f5] px-7 text-[15px] font-medium text-[#0a0a0a] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
    >
      {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {status === 'sent' && <Check className="h-4 w-4" aria-hidden="true" />}
      <span>{label}</span>
      {status === 'idle' || status === 'error' ? (
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      ) : null}
    </motion.button>
  );
}

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [gotcha, setGotcha] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) {
      next.name = 'Enter your name.';
    }
    if (!email.trim()) {
      next.email = 'Enter an email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address with an @.';
    }
    if (!message.trim()) {
      next.message = 'Write a short message.';
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Spam-trap honeypot check
    if (gotcha.trim()) {
      setStatus('sent');
      setStatusMessage('Message received. Thank you.');
      return;
    }

    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      const firstInvalidId = fieldErrors.name
        ? 'contact-name'
        : fieldErrors.email
          ? 'contact-email'
          : 'contact-message';
      document.getElementById(firstInvalidId)?.focus();
      setStatus('error');
      setStatusMessage('Fix the highlighted fields before sending.');
      return;
    }

    setStatus('sending');
    setStatusMessage('Sending your message...');

    const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
          }),
        });
        if (!res.ok) throw new Error('Form endpoint error');
      } else {
        // Clean local preview delay until Formspree / Resend endpoint is configured in .env.local
        await new Promise((resolve) => window.setTimeout(resolve, 650));
      }

      setStatus('sent');
      setStatusMessage('Message sent. Dippa will reply soon.');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setStatusMessage('Could not send right now. Please try again.');
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative min-h-[100svh] flex flex-col justify-center py-24 sm:py-28"
    >
      <div className="page-wrap">
        <div className="mx-auto max-w-[640px]">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#a3a3a3]">
            Reach out
          </p>
          <h2
            id="contact-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-[clamp(40px,6vw,64px)] leading-[1.02] tracking-[-0.025em] font-normal text-[#f5f5f5]"
          >
            Contact
          </h2>

          {/* Shared Glass Card */}
          <div className="glass-surface mt-8 rounded-[22px] p-6 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Hidden spam-trap field */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="contact-gotcha">Leave this field empty</label>
                <input
                  id="contact-gotcha"
                  name="_gotcha"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={gotcha}
                  onChange={(e) => setGotcha(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-[14px] font-medium text-[#d4d4d4]"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  className="mt-2 block h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-[16px] text-[#f5f5f5] placeholder:text-[#737373] transition-colors focus:border-white/50 focus:bg-white/[0.07] focus:outline-none"
                />
                {errors.name && (
                  <p id="contact-name-error" className="mt-1.5 text-[13px] text-[#f5f5f5]">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[14px] font-medium text-[#d4d4d4]"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  className="mt-2 block h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-[16px] text-[#f5f5f5] placeholder:text-[#737373] transition-colors focus:border-white/50 focus:bg-white/[0.07] focus:outline-none"
                />
                {errors.email && (
                  <p id="contact-email-error" className="mt-1.5 text-[13px] text-[#f5f5f5]">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-[14px] font-medium text-[#d4d4d4]"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className="mt-2 block w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[16px] text-[#f5f5f5] placeholder:text-[#737373] transition-colors focus:border-white/50 focus:bg-white/[0.07] focus:outline-none"
                />
                {errors.message && (
                  <p id="contact-message-error" className="mt-1.5 text-[13px] text-[#f5f5f5]">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <MagneticSubmitButton status={status} />

                <p
                  role="status"
                  aria-live="polite"
                  className="min-h-[20px] text-[14px] text-[#b5b5b5]"
                >
                  {statusMessage}
                </p>
              </div>
            </form>
          </div>

          {/* Minimal Row of Monochrome Social Icon Links */}
          <ul
            aria-label="Social links"
            className="mt-8 flex items-center justify-center gap-3"
          >
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="glass-surface glass-surface-interactive inline-flex h-11 w-11 items-center justify-center rounded-full text-[#b5b5b5] hover:text-[#f5f5f5]"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
