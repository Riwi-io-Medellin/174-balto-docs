// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  technicalSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Technical Documentation',
      collapsed: false,
      items: [
        'technical/architecture',
        'technical/project-structure',
        'technical/state-management',
        'technical/api-integration',
        'technical/realtime-tracking',
        'technical/di-setup',
        'technical/background-location',
      ],
    },
  ],

  userGuideSidebar: [
    {
      type: 'doc',
      id: 'user-guide/overview',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Dog Owner',
      collapsed: false,
      items: [
        'user-guide/owner/getting-started',
        'user-guide/owner/booking-walks',
        'user-guide/owner/live-tracking',
        'user-guide/owner/walk-history',
      ],
    },
    {
      type: 'category',
      label: 'Walker',
      collapsed: false,
      items: [
        'user-guide/walker/getting-started',
        'user-guide/walker/managing-bookings',
        'user-guide/walker/conducting-walk',
      ],
    },
  ],
};

module.exports = sidebars;
