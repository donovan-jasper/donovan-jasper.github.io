export const techSidebar = [
  {
    label: 'Tech',
    href: '/tech/',
    children: [
      {
        label: 'Cybersecurity',
        href: '/tech/cybersecurity/',
        children: [
          {
            label: 'Research',
            href: '/tech/cybersecurity/research/',
            children: [
              { label: 'ARTEMIS', href: '/tech/cybersecurity/research/artemis/' },
              { label: 'Cybench', href: '/tech/cybersecurity/research/cybench/' },
              { label: 'HotelDruid RCE', href: '/tech/cybersecurity/research/hoteldruid-vulnerability/' },
            ],
          },
          {
            label: 'HackTheBox',
            href: '/tech/cybersecurity/hackthebox/',
            children: [
              { label: 'Resource', href: '/tech/cybersecurity/hackthebox/resource/' },
              { label: 'Compiled', href: '/tech/cybersecurity/hackthebox/compiled/' },
            ],
          },
        ],
      },
    ],
  },
];

export const artsSidebar = [
  {
    label: 'Arts',
    href: '/arts/',
    children: [
      {
        label: 'Voice',
        href: '/arts/voice/',
        children: [
          { label: 'Friends on the Other Side', href: '/arts/voice/friends-on-the-other-side/' },
          { label: 'The Roadside Fire', href: '/arts/voice/roadsidefire/' },
          { label: 'Der Wanderer', href: '/arts/voice/derwanderer/' },
          { label: 'Non Piu Andrai', href: '/arts/voice/figaro/' },
          { label: 'Stars', href: '/arts/voice/stars/' },
          { label: 'Flohlied', href: '/arts/voice/flohlied/' },
        ],
      },
      {
        label: 'Dance',
        href: '/arts/dance/',
        children: [
          { label: 'Grand Pas de Deux 2024', href: '/arts/dance/gp2024/' },
          { label: 'Grand Pas de Deux 2023', href: '/arts/dance/gp2023/' },
          { label: 'Cross Step Waltz', href: '/arts/dance/waltzcomp/' },
          { label: 'Opening Performances', href: '/arts/dance/openingperformances/' },
          { label: 'Are You Going?', href: '/arts/dance/california-dance-classics/' },
        ],
      },
    ],
  },
];
