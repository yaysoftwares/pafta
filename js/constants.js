export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Screenshot Framer';

export const DEVICE_FRAMES = [
  // iOS
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', category: 'ios', os: 'ios', width: 1290, height: 2796 },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', category: 'ios', os: 'ios', width: 1206, height: 2622 },
  { id: 'iphone-16-plus', name: 'iPhone 16 Plus', category: 'ios', os: 'ios', width: 1080, height: 2340 },
  { id: 'iphone-16', name: 'iPhone 16', category: 'ios', os: 'ios', width: 1179, height: 2556 },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', category: 'ios', os: 'ios', width: 1290, height: 2796 },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', category: 'ios', os: 'ios', width: 1179, height: 2556 },
  { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', category: 'ios', os: 'ios', width: 1290, height: 2796 },
  { id: 'iphone-13-pro-max', name: 'iPhone 13 Pro Max', category: 'ios', os: 'ios', width: 1284, height: 2778 },
  { id: 'iphone-12-pro-max', name: 'iPhone 12 Pro Max', category: 'ios', os: 'ios', width: 1284, height: 2778 },

  // Android - Pixel
  { id: 'pixel-9-pro-xl', name: 'Google Pixel 9 Pro XL', category: 'android', os: 'android', width: 1344, height: 2992 },
  { id: 'pixel-9-pro', name: 'Google Pixel 9 Pro', category: 'android', os: 'android', width: 1280, height: 2856 },
  { id: 'pixel-9', name: 'Google Pixel 9', category: 'android', os: 'android', width: 1080, height: 2424 },
  { id: 'pixel-8-pro', name: 'Google Pixel 8 Pro', category: 'android', os: 'android', width: 1344, height: 2992 },
  { id: 'pixel-7-pro', name: 'Google Pixel 7 Pro', category: 'android', os: 'android', width: 1440, height: 3120 },

  // Android - Samsung
  { id: 'galaxy-s25-ultra', name: 'Samsung Galaxy S25 Ultra', category: 'android', os: 'android', width: 1440, height: 3120 },
  { id: 'galaxy-s25-plus', name: 'Samsung Galaxy S25 Plus', category: 'android', os: 'android', width: 1080, height: 2340 },
  { id: 'galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra', category: 'android', os: 'android', width: 1440, height: 3120 },
  { id: 'galaxy-s23-ultra', name: 'Samsung Galaxy S23 Ultra', category: 'android', os: 'android', width: 1440, height: 3088 },
  { id: 'galaxy-z-fold6', name: 'Samsung Galaxy Z Fold6', category: 'android', os: 'android', width: 1856, height: 2160 },
  { id: 'galaxy-z-flip6', name: 'Samsung Galaxy Z Flip6', category: 'android', os: 'android', width: 1080, height: 2640 },

  // Android - Others
  { id: 'oneplus-13', name: 'OnePlus 13', category: 'android', os: 'android', width: 1440, height: 3168 },
  { id: 'oneplus-12', name: 'OnePlus 12', category: 'android', os: 'android', width: 1440, height: 3168 },
  { id: 'xiaomi-15-ultra', name: 'Xiaomi 15 Ultra', category: 'android', os: 'android', width: 1440, height: 3200 },
  { id: 'xiaomi-14-ultra', name: 'Xiaomi 14 Ultra', category: 'android', os: 'android', width: 1440, height: 3200 },
  { id: 'motorola-edge-50-pro', name: 'Motorola Edge 50 Pro', category: 'android', os: 'android', width: 1224, height: 2712 },
  { id: 'nothing-phone-3a-pro', name: 'Nothing Phone (3a) Pro', category: 'android', os: 'android', width: 1080, height: 2392 },
  { id: 'oppo-find-x8-pro', name: 'OPPO Find X8 Pro', category: 'android', os: 'android', width: 1264, height: 2780 },
];

export const APPSTORE_PRESETS = [
  { id: 'iphone-6.9', name: 'iPhone 6.9" (Pro Max)', width: 1290, height: 2796 },
  { id: 'iphone-6.7', name: 'iPhone 6.7"', width: 1290, height: 2796 },
  { id: 'iphone-6.1', name: 'iPhone 6.1"', width: 1179, height: 2556 },
  { id: 'iphone-5.5', name: 'iPhone 5.5"', width: 1242, height: 2208 },
  { id: 'iphone-4.7', name: 'iPhone 4.7"', width: 750, height: 1334 },
];

export const GOOGLEPLAY_PRESETS = [
  { id: 'phone-16-9', name: 'Phone 16:9', width: 1080, height: 1920 },
  { id: 'phone-16-10', name: 'Phone 16:10', width: 1080, height: 2160 },
  { id: 'phone-18-9', name: 'Phone 18:9', width: 1080, height: 2160 },
  { id: 'pixel-standard', name: 'Pixel Standard', width: 1080, height: 2400 },
  { id: 'tablet-7', name: 'Tablet 7"', width: 600, height: 1024 },
  { id: 'tablet-10', name: 'Tablet 10"', width: 1600, height: 2560 },
  { id: 'full-hd', name: 'Full HD', width: 1920, height: 1080 },
];

export const DEFAULT_LANGS = ['EN'];

export const FONT_FAMILIES = [
  {
    group: 'System',
    fonts: [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
      'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS',
    ],
  },
  {
    group: 'Google Fonts (offline)',
    fonts: [
      'Inter', 'Roboto', 'Montserrat', 'Poppins', 'Open Sans', 'Lato', 'Oswald',
      'Raleway', 'Merriweather', 'Playfair Display', 'Nunito', 'Fira Sans',
      'JetBrains Mono', 'Caveat',
    ],
  },
];

export const COMMON_PRESERVE_TERMS = [
  'AI', 'API', 'App', 'Beta', 'Dark Mode', 'GPS', 'ID', 'IoT', 'LAN', 'LTE', 'MAC', 'MFA', 'NFC', 'OAuth', 'OS',
  'Plus', 'Pro', 'QR', 'SMS', 'SSL', 'Sync', 'UI', 'URL', 'UUID', 'VPN', 'WiFi', 'WLAN',
  'iOS', 'Android', 'iPhone', 'iPad', 'Mac', 'MacBook', 'Apple', 'Google', 'Samsung', 'Xiaomi', 'OnePlus',
  'OPPO', 'Pixel', 'GitHub', 'GitLab', 'TypeScript', 'JavaScript', 'React', 'Vue', 'Next.js', 'Node.js'
];