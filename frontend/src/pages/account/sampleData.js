export const SAMPLE_GUEST_USER = {
  id: "guest-sample-01",
  name: "Alex Taylor",
  email: "alex.taylor@example.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  address: "742 Evergreen Terrace",
  city: "Springfield",
  zipCode: "97477",
  country: "United States",
  roles: ["user"],
  phone: "+1 (555) 019-2834",
  bio: "Lead developer exploring the modern boilerplate template architecture.",
  createdAt: "2026-01-15T09:30:00.000Z",
};

export const SAMPLE_SECURITY_DATA = {
  twoFactorEnabled: false,
  lastPasswordChange: "14 days ago",
  sessions: [
    {
      id: "sess-1",
      device: "Chrome on macOS Sonoma",
      location: "San Francisco, CA, US",
      current: true,
      lastActive: "Active right now",
    },
    {
      id: "sess-2",
      device: "Mobile App on iPhone 16 Pro",
      location: "San Francisco, CA, US",
      current: false,
      lastActive: "2 hours ago",
    },
    {
      id: "sess-3",
      device: "Firefox on Ubuntu Linux",
      location: "New York, NY, US",
      current: false,
      lastActive: "3 days ago",
    },
  ],
};

export const SAMPLE_PREFERENCES_DATA = {
  emailNotifications: true,
  marketingEmails: false,
  securityAlerts: true,
  weeklyDigest: true,
  themeMode: "system",
  compactView: false,
};
