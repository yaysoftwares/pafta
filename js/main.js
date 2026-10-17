// Single entry point.
//
// CSS import order matters:
//   1. official Bootstrap 5 (base + reboot + components)
//   2. bootstrap-icons (self-hosted via npm, no CDN)
//   3. app design system — wins over Bootstrap at equal specificity
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../css/variables.css';
import '../css/base.css';
import '../css/layout.css';
import '../css/components.css';
import '../css/theme.css';
import '../css/fonts.css';
import '../css/design.css';
import '../css/ui.css';

// App (side-effect module: boots the UI on DOMContentLoaded)
import './app.js';
