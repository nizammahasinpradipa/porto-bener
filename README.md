# MyPorto

Black monochrome personal portfolio for **Dippa** — UI/UX designer and frontend developer.

## Features

- **Monochrome Glass System:** Single reusable glass recipe (`rgba(255, 255, 255, 0.055)`, `20px` backdrop blur, `1px` soft white hairline) shared across the floating navigation bar, project cards, and contact card.
- **Interactive 3D Lanyard:** Real-time physics lanyard built with Three.js, React Three Fiber, and Rapier — drag, throw, and click to flip the custom monochrome `MyPorto` ID pass. Gracefully falls back to an interactive static monochrome badge on reduced motion or low-power devices.
- **Skill Focus Animation:** Stacked disciplines (`UI/UX`, `Design`, `Frontend`) cycling sharpness and blur every 3 seconds with interactive click/hover pause.
- **Staggered Project Collage + Tilted Flip Cards:** Uncropped portrait posters (`3:4`) and wide website previews (`16:9`) with cursor-tracking tilt, specular glare, 180° flip details, smooth category filtering (`All`, `Posters`, `Websites`), and full-view lightbox.
- **Minimal Contact Card:** Three fields (`Name`, `Email`, `Message`), hidden spam trap, inline validation, and a magnetic Send button with `idle`, `sending`, `sent`, and `error` states.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Projects

Edit [`src/data/projects.ts`](./src/data/projects.ts) and add new poster or website entries. Place images inside `public/projects/`.

## Connecting the Contact Form

Copy `.env.example` to `.env.local` and set your Formspree or Resend endpoint:

```env
NEXT_PUBLIC_CONTACT_ENDPOINT=https://formspree.io/f/your-form-id
```

## Static Export & Deployment

```bash
npm run build
```

Generates a static production bundle in `out/` ready for Vercel or Netlify.
