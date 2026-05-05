# DevTools

> A privacy-first desktop toolkit for developers — 50 utilities, all running 100% offline on your machine.

![Version](https://img.shields.io/badge/version-1.6.0-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange)

Built with **React**, **TypeScript**, **Tauri 2**, and **Monaco Editor**. No internet connection required — no telemetry, no data leaves your machine.

---

## Table of Contents

- [Features](#features)
- [Tools](#tools)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Desktop App Build](#desktop-app-build)
- [License](#license)

---

## Features

- **100% Offline** — all processing happens locally, no external API calls
- **50 Developer Tools** — organized into focused categories
- **Multi-tab Support** — run multiple instances of the same tool side by side
- **Dark / Light Mode** — system-aware theming with manual override
- **Command Palette** — keyboard-driven navigation across all tools
- **Persistent State** — tabs, notes, and settings are saved between sessions
- **Favorites & Workspaces** — pin tools to the sidebar and save named workspace sets
- **Export / Import** — back up and restore all app state to a JSON file
- **Cross-platform** — native desktop app for macOS, Windows, and Linux via Tauri

---

## Tools

### General
| Tool | Description |
|---|---|
| JSON Formatter | Prettify, minify, validate JSON with inline error detection and jq-style path queries |
| XML Formatter | Format and validate XML documents |
| SQL Formatter | Format SQL queries across multiple dialects |
| Diff Viewer | Side-by-side text comparison with line-level and word-level diff modes |
| String Case Converter | Convert text between camelCase, snake_case, kebab-case, PascalCase, and more |
| Notepad | Quick multi-tab scratchpad for temporary notes |
| Notes | Persistent markdown note-taking with categories and search |

### Encoding & Conversion
| Tool | Description |
|---|---|
| Base64 Converter | Encode/decode strings and files to/from Base64 |
| URL Encoder | Encode and decode strings for safe URL usage |
| HTML Entity Converter | Live encoding and decoding of HTML entities |
| Unix Timestamp | Convert between Unix timestamps and human-readable dates |
| Number Base Converter | Convert numbers between Binary, Octal, Decimal, and Hexadecimal |
| YAML ↔ JSON | Bi-directional conversion with syntax highlighting |
| TOML ↔ JSON | Bi-directional conversion between TOML and JSON |
| CSV ↔ JSON | Convert between CSV and JSON formats |
| Image to Base64 | Convert image files to Base64 data URIs |

### Security & Cryptography
| Tool | Description |
|---|---|
| Hash Generator | MD5, SHA-1, SHA-256, SHA-512 hashing — text input or file drag-and-drop |
| HMAC Generator | Generate HMAC signatures with configurable algorithms |
| JWT Debugger | Decode and inspect JSON Web Tokens |
| JWT Builder | Build and sign JWT tokens with HS256/HS384/HS512 |
| Certificate Inspector | Parse PEM certificates — subject, issuer, expiry, SANs, fingerprints |
| Password Generator | Secure passwords and diceware passphrases with entropy stats |
| RSA Key Generator | Generate RSA public/private key pairs |
| Chmod Calculator | Visual Unix file permission builder — octal ↔ symbolic |

### Web Development
| Tool | Description |
|---|---|
| CSS Unit Converter | Convert between px, rem, em, and percentage units |
| Color Picker | Visual color selection with HEX, RGB, HSL, and colorblindness simulation |
| Color Palette Generator | Generate complementary, triadic, analogous, tints, and shades from a base color |
| CSS Gradient Generator | Visual linear, radial, and conic gradient builder with live preview |
| WCAG Contrast Checker | Check foreground/background contrast ratios against WCAG AA/AAA |
| Box Shadow Generator | Interactive CSS box-shadow builder with live preview |
| SVG Compressor | Minify and optimize SVG files using SVGO |
| Image Optimizer | Client-side compression for PNG, JPG, and WebP |
| Layout Playground | Experiment with CSS Flexbox and Grid layouts visually |
| Markdown Live | Real-time markdown editor with GitHub-style preview |

### API & Network
| Tool | Description |
|---|---|
| API Client | Send HTTP requests with saved history and named collections |
| Curl to Code | Convert curl commands to fetch, axios, Python requests, Go, or PHP |
| HTTP Status Codes | Searchable reference with descriptions and MDN links |
| IP / CIDR Calculator | Calculate subnet, broadcast, host range from an IP/CIDR block |

### Data & Types
| Tool | Description |
|---|---|
| JSON to TypeScript | Generate TypeScript interfaces from JSON objects |
| JSON Schema Validator | Validate JSON data against a schema with per-field error display |
| Dummy Data Generator | Generate mock data for users, products, companies, and more |
| CSV ↔ JSON | Convert between CSV data and JSON arrays |
| YAML ↔ JSON | Bi-directional conversion between YAML and JSON |
| TOML ↔ JSON | Bi-directional conversion between TOML and JSON |

### Analysis
| Tool | Description |
|---|---|
| RegEx Tester | Interactive regex playground with flag toggles and named capture group display |
| Text Analyzer | Character count, word frequency, and estimated reading time |
| Diff Viewer | Side-by-side comparison with line-level and word-level diff |
| ASCII / Unicode Table | Searchable ASCII 0–127 reference with hex, binary, and HTML entities |

### Generators & Productivity
| Tool | Description |
|---|---|
| UUID Generator | Generate UUID v4 identifiers in bulk |
| QR Code Generator | Create and export customizable QR codes as PNG |
| Barcode Generator | Generate barcodes in multiple formats |
| Cron Expression | Build and parse cron expressions into human-readable text |
| Changelog Generator | Generate standardized release notes in Markdown format |

---

## Project Structure

```
dev-tools/
├── src/                          # React frontend
│   ├── components/
│   │   ├── layout/               # App shell (Sidebar, Layout, CommandPalette)
│   │   ├── notes/                # Notes feature components
│   │   └── ui/                   # Shared UI primitives (theme, toggle)
│   ├── hooks/                    # Custom React hooks (favorites, workspaces, history)
│   ├── lib/
│   │   ├── tools.ts              # Tool registry and metadata
│   │   └── utils.ts              # Shared utility functions
│   ├── pages/                    # One file per tool (50 tools)
│   ├── App.tsx                   # Root component and routing
│   └── main.tsx                  # Entry point
│
├── src-tauri/                    # Tauri desktop app wrapper
│   ├── icons/                    # App icons for all platforms
│   ├── src/                      # Rust backend source
│   ├── capabilities/             # Tauri permission definitions
│   └── tauri.conf.json           # Tauri configuration
│
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Desktop Runtime | Tauri 2 (Rust) |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Code Editor | Monaco Editor |
| Icons | Lucide React |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) (recommended)
- [Rust](https://rustup.rs/) (only needed for desktop builds)

### Install dependencies

```bash
pnpm install
```

### Run in the browser (development)

```bash
pnpm dev
```

Opens at `http://localhost:5173`.

### Run as a desktop app (development)

```bash
pnpm tauri:dev
```

`tauri:*` scripts ensure `~/.cargo/bin` is available on `PATH`, which helps avoid Rust/Cargo lookup issues in some IDE terminals (especially on Windows).

---

## Desktop App Build

Builds a native installer for your current platform.

### Prerequisites

Follow the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/) for your OS to install the required system dependencies.

### Build

```bash
pnpm tauri:build
```

Use this script (instead of `pnpm tauri build`) for the same cross-environment PATH handling noted above.

Output is placed in `src-tauri/target/release/bundle/`:

| Platform | Output |
|---|---|
| macOS | `.dmg` and `.app` |
| Windows | `.msi` and `.exe` (NSIS) |
| Linux | `.deb`, `.rpm`, and `.AppImage` |

### Update the app icon

Replace `src-tauri/icons/icon.png` with a 1024×1024 PNG, then regenerate all sizes:

```bash
pnpm tauri icon src-tauri/icons/icon.png
```

---

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
