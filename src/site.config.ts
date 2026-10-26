// Global site details. Change these once and they update everywhere
// (header, footer and page titles).
export const site = {
  siteName: 'Working Title',
  siteDescription: "A fan site that tells Jon Batiste's story through a New Orleans second line.",
  // His official site already handles the store, newsletter and tour.
  officialSite: 'https://www.jonbatiste.com',
  nav: [
    { label: 'The line', href: '/#line' },
    { label: 'Listen', href: '/#listen' },
    { label: 'Transcript', href: '/transcript' },
    { label: 'Credits', href: '/credits' },
  ],
} as const;
