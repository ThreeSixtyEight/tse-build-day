// Global studio details. Change these once and they update everywhere
// (header, footer, page titles and share cards).
export const site = {
  siteName: 'Three Sixty Eight',
  shortName: '368°',
  siteDescription:
    'Three Sixty Eight is an independent creative agency shaping brands, campaigns and digital products — a full turn, and then a little further.',
  email: 'hello@threesixtyeight.studio',
  location: 'Working worldwide',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Dribbble', href: 'https://dribbble.com' },
  ],
  nav: [
    { label: 'Work', href: '/work' },
    { label: 'Studio', href: '/studio' },
    { label: 'Journal', href: '/journal' },
  ],
} as const;
