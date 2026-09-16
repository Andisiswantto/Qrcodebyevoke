# PRD — ANTT QR Generator

> QR Code Generator & QR Design Platform

Version: 1.0.0
Status: Development
Project: ANTT QR Generator
URL: https://antt-qr-generator.pages.dev/

---

# 1. Product Vision

ANTT QR Generator adalah platform pembuatan dan desain QR Code yang memungkinkan pengguna membuat QR dengan cepat, memilih frame, mengatur bentuk, warna, logo, teks, dan level error correction, kemudian mengunduh hasilnya dalam kualitas tinggi.

Produk mengambil inspirasi dari pengalaman penggunaan QR generator modern seperti ME-QR, tetapi seluruh sistem, branding, UI, template, dan aset visual ANTT harus dikembangkan sebagai produk sendiri.

Fokus awal:

> "Buat QR → pilih frame → customize → download."

Target jangka panjang:

> Menjadi QR Design Platform yang memiliki QR generator, template library, dynamic QR, bulk generation, dan QR management.

---

# 2. Product Goals

## Primary Goals

1. Membuat QR Code dengan cepat.
2. Menyediakan minimal 50–100 frame pada initial release.
3. QR selalu proporsional dan dapat dipindai.
4. Frame dapat diterapkan secara realtime.
5. Pengguna dapat mengubah warna QR.
6. Pengguna dapat menambahkan logo.
7. Pengguna dapat mengatur bentuk QR.
8. Pengguna dapat menambahkan teks.
9. Export PNG dan SVG.
10. UI sederhana dan cepat.
11. Tidak membutuhkan login untuk basic QR generation.
12. Struktur aplikasi siap dikembangkan menjadi Dynamic QR.

---

# 3. Product Positioning

ANTT bukan sekadar:

> QR Code Generator.

ANTT diposisikan sebagai:

> QR Code Generator + QR Design Tool.

Perbedaan utama:

```text
QR Generator biasa
        ↓
Generate QR
        ↓
Download

ANTT
        ↓
Generate QR
        ↓
Choose Frame
        ↓
Customize
        ↓
Preview
        ↓
Export
4. Inspiration

Referensi utama untuk UX dan feature discovery:

ME-QR.

Fitur yang dapat dijadikan referensi:

QR content types
Frames
Shapes
Logo
Error correction level
Frame background
Background color
Additional text
Font
Font size
Text color
Templates
Export
Dynamic QR
Bulk QR
Analytics

ME-QR saat ini menampilkan Frames, Shapes, Logo, Level, template, frame background, additional text, serta koleksi 1000+ frame.

ANTT tidak boleh bergantung pada aset proprietary ME-QR.

5. Initial Product Scope

Initial release harus fokus pada:

QR Generator
+
Frame Library
+
QR Customization
+
Export

Jangan memasukkan semua fitur advanced sekaligus.

6. Initial Feature Set
P0 — Required
URL QR
Text QR
Email QR
Phone QR
Frame
QR color
Background color
Transparent background
Error correction
Logo
Additional text
Font
Font size
Text color
PNG export
SVG export
Realtime preview
Frame search
Frame category
50–100 frames
7. QR Content Types

Initial:

URL
Text
Email
Phone

Future:

WiFi
WhatsApp
Instagram
YouTube
Google Maps
Contact
vCard
SMS
PDF
Image
File
App Link
Event
8. QR Architecture

QR rendering harus dipisahkan dari frame.

QR DATA
   ↓
QR MATRIX
   ↓
QR SVG
   ↓
FRAME
   ↓
COMPOSER
   ↓
FINAL SVG
   ↓
PNG / SVG

QR tidak boleh dibuat sebagai gambar biasa yang dipaksa masuk ke frame menggunakan CSS transform.

9. Frame Architecture

Setiap frame adalah template SVG.

Contoh:

10. QR Area

Setiap frame wajib memiliki QR Area.

QR Area menentukan:

x
y
width
height
padding

Contoh:

{
  "x": 150,
  "y": 150,
  "width": 700,
  "height": 700,
  "padding": 20
}
11. QR Proportion Rule

QR Code wajib:

width === height

Tidak boleh:

width != height

QR harus selalu menggunakan uniform scaling.

Algorithm:

const size = Math.min(
  availableWidth,
  availableHeight
)

Kemudian:

const x =
  area.x +
  (area.width - size) / 2

const y =
  area.y +
  (area.height - size) / 2
12. Frame Library

Initial target:

100 frames.

Minimum release:

50 frames.

Target:

100 frames.

Future:

100
↓
250
↓
500
↓
1000+
13. Frame Categories

Initial library:

Minimal
Modern
Creative
Elegant
Business
Event
Sport
Badge
Social
Seasonal

Target distribution:

Category    Frames
Minimal    10
Modern    10
Creative    10
Elegant    10
Business    10
Event    10
Sport    10
Badge    10
Social    10
Seasonal    10
TOTAL    100
14. Frame Design Direction

Frame harus dibuat original untuk ANTT.

Frame dapat menggunakan konsep:

Border
Badge
Ribbon
Speech Bubble
Sticker
Rounded
Circle
Ticket
Label
Corner Decoration
Arrow
Call-to-action
Pattern
Geometric
Organic
15. Frame Variants

Satu konsep dapat memiliki beberapa variasi.

Contoh:

Badge
├── Badge Black
├── Badge Gold
├── Badge Red
├── Badge Blue
└── Badge Minimal

Namun variasi harus tetap dianggap sebagai template berbeda hanya jika memiliki nilai desain yang jelas.

16. Frame Visual Rules

Setiap frame harus:

memiliki area QR yang jelas
memiliki kontras yang cukup
tidak menutupi finder pattern
tidak menutupi quiet zone
tidak membuat QR sulit dipindai
memiliki ukuran SVG yang valid
memiliki viewBox
dapat dirender tanpa error
17. Frame Metadata

Setiap frame memiliki:

{
  "id": "frame-001",
  "name": "Modern Corner",
  "category": "modern",
  "tags": [
    "modern",
    "minimal",
    "business"
  ],
  "src": "/frames/frame-001.svg",
  "thumbnail": "/frames/thumb/frame-001.webp",
  "width": 1000,
  "height": 1000,
  "qrArea": {
    "x": 150,
    "y": 150,
    "width": 700,
    "height": 700,
    "padding": 20
  }
}
18. Frame Manifest

Gunakan:

manifest.json

Contoh:

[
  {
    "id": "frame-001",
    "name": "Modern Corner",
    "category": "modern",
    "thumbnail": "/frames/thumb/frame-001.webp",
    "src": "/frames/frame-001.svg"
  }
]

Browser tidak perlu membaca semua SVG ketika halaman pertama kali dibuka.

19. Frame Thumbnail

Setiap frame memiliki thumbnail.

Format:

WebP

Ukuran:

300 × 300

Struktur:

public/
└── frames/
    ├── frame-001.svg
    ├── frame-002.svg
    ├── frame-003.svg
    │
    └── thumb/
        ├── frame-001.webp
        ├── frame-002.webp
        └── frame-003.webp
20. Frame Loading

Initial page:

manifest
   ↓
thumbnails

Ketika user memilih:

thumbnail
   ↓
load SVG
   ↓
render QR

Jangan load 100 SVG sekaligus.

21. Frame Search

Search:

Search frames...

Search berdasarkan:

name
category
tags

Contoh:

modern
gold
sport
minimal
event
22. Frame Filter

Filter:

All
Minimal
Modern
Creative
Elegant
Business
Event
Sport
Badge
Social
Seasonal
23. Featured Frames

Beberapa frame dapat ditandai:

featured: true

Tampilkan:

Featured

di bagian awal.

24. New Frames

Frame baru:

isNew: true

Tampilkan badge:

NEW
25. QR Customization

Panel customization:

Frames
Shapes
Logo
Level
Colors
Text
26. Shapes

Initial:

Square
Rounded
Dots

Future:

Circle
Diamond
Star
Soft
Custom
27. QR Eye Style

Initial:

Square
Rounded

Future:

Circle
Dot
Rounded
28. Logo

User dapat:

Upload Logo

Support:

PNG
JPG
WEBP
SVG

Maximum:

5 MB
29. Logo Placement

Default:

center

Logo size:

10%
15%
20%

Maximum recommendation:

25%

Jika error correction tidak cukup:

WARNING:
Logo terlalu besar untuk QR ini.
30. Error Correction

Options:

L
M
Q
H

Default:

M

Jika menggunakan logo:

H

dapat direkomendasikan.

31. Colors

Support:

QR Color
Background Color

Preset:

Black
White
Red
Blue
Green
Purple
Gold

Custom:

HEX
RGB
32. Contrast Validation

Sistem harus memeriksa kontras.

Contoh:

QR:
#AAAAAA

Background:
#FFFFFF

Jika terlalu rendah:

Low contrast.
QR may be difficult to scan.
33. Transparent Background

Support:

Transparent

Jika transparent:

background="none"
34. Additional Text

User dapat menambahkan:

SCAN ME
SCAN TO VIEW
OPEN WEBSITE
SCAN HERE

atau custom text.

35. Text Settings

Support:

Font
Font Size
Font Weight
Text Color
Alignment

Initial:

Center
36. QR Preview

Preview harus realtime.

Ketika user mengubah:

URL
Frame
Color
Logo
Shape
Text
Error Correction

preview langsung berubah.

Tidak perlu reload.

37. Preview Structure
┌─────────────────────────────┐
│                             │
│                             │
│        QR PREVIEW           │
│                             │
│                             │
└─────────────────────────────┘

[ Download PNG ]

[ Download SVG ]
38. Export

Initial:

PNG
SVG

Future:

JPG
WEBP
PDF
39. PNG Export

Preset:

512
1024
2000
3000
4000

Default:

2000 × 2000
40. SVG Export

SVG harus:

vector
tidak blur
mempertahankan frame
mempertahankan QR
mempertahankan text
mempertahankan logo
41. Download Flow
Generate
   ↓
Preview
   ↓
Download

Jangan memaksa user login.

42. Basic QR Types

URL:

https://example.com

Text:

Hello World

Email:

mailto:user@example.com

Phone:

tel:+628123456789
43. Dynamic QR

Future feature.

Static:

QR
 ↓
Direct destination

Dynamic:

QR
 ↓
ANTT Redirect
 ↓
Destination

Keuntungan:

Destination dapat diubah tanpa mencetak QR baru.

44. Dynamic QR Database

Future:

qr_codes

Fields:

id
userId
slug
type
destination
status
scanCount
createdAt
updatedAt
45. Dynamic QR URL

Contoh:

https://antt-qr-generator.pages.dev/q/abc123

Redirect:

/q/abc123
      ↓
destination
46. QR Analytics

Future:

Total Scans
Unique Scans
Last Scan
Date
Country
Device
Browser

Privacy rules harus diterapkan.

47. QR Management

Future setelah login:

My QR Codes

User dapat:

Create
Edit
Duplicate
Delete
Pause
Activate
View Analytics
48. Bulk QR

Future.

Input:

name,url
Product A,https://example.com/a
Product B,https://example.com/b
Product C,https://example.com/c

Output:

QR-Product-A.png
QR-Product-B.png
QR-Product-C.png
49. Bulk Frame Generation

Future:

CSV
+
Frame
+
QR Data
        ↓
Batch Renderer
        ↓
ZIP

Contoh:

100 peserta
+
1 frame
        ↓
100 QR
50. Template System

Future.

Template terdiri dari:

Background
Frame
QR
Logo
Text
Shape
51. Template Placeholder

Support:

{{name}}
{{company}}
{{event}}
{{url}}
{{phone}}
{{email}}
52. Template Example
{
  "width": 1080,
  "height": 1080,
  "elements": [
    {
      "type": "qr",
      "x": 290,
      "y": 200,
      "width": 500,
      "height": 500
    },
    {
      "type": "text",
      "x": 540,
      "y": 760,
      "text": "{{name}}"
    }
  ]
}
53. Template Library

Future categories:

Business
Restaurant
Event
Wedding
Education
Social Media
Product
Marketing
Personal
Sport
54. User Accounts

MVP:

NO LOGIN REQUIRED

Future:

Google Login
Email Login
55. Guest Mode

User dapat membuat QR tanpa account.

Browser menyimpan temporary settings:

localStorage
56. User Saved Projects

Future:

My Designs

User dapat menyimpan:

QR Data
Frame
Colors
Logo
Text
Shape
57. QR Presets

Future.

User dapat menyimpan:

Brand QR

Contoh:

ANTT Brand QR
QR Color: #111111
Background: #FFFFFF
Frame: Modern 01
Logo: ANTT
58. Frame Admin System

Future admin page:

/admin/frames

Actions:

Upload
Edit
Delete
Duplicate
Preview
Activate
Deactivate
Set Category
Set Tags
Set Featured
59. Frame Upload

Admin upload:

SVG

System:

Upload
 ↓
Validate SVG
 ↓
Find QR Area
 ↓
Generate thumbnail
 ↓
Save metadata
 ↓
Publish
60. Frame Validation

Required:

viewBox
data-qr-area="true"

QR Area:

width > 0
height > 0

QR Area harus berada di dalam viewBox.

61. SVG Security

Trusted ANTT templates:

Allowed

User uploaded SVG:

Sanitize

Hapus:

script
event handlers
foreignObject
javascript URLs
unsafe external resources
62. Performance

Target:

Initial load < 2.5 sec

Frame library:

100 frames

tidak boleh menyebabkan:

100 SVG files loaded

Gunakan:

manifest
+
thumbnail
+
lazy SVG
63. Mobile

Mobile UI:

Preview
 ↓
QR Type
 ↓
Customization
 ↓
Frames
 ↓
Export

Frame grid:

2 columns

Desktop:

4–6 columns
64. Desktop Layout
┌──────────────────────────────────────────────┐
│ ANTT QR GENERATOR                            │
├──────────────────┬───────────────────────────┤
│                  │                           │
│ SETTINGS         │                           │
│                  │       QR PREVIEW          │
│ QR Type          │                           │
│ URL              │                           │
│                  │                           │
│ Frames           │                           │
│ Shapes           │                           │
│ Logo             │                           │
│ Colors           │                           │
│ Level            │                           │
│ Text             │                           │
│                  │                           │
│                  │                           │
│                  │                           │
├──────────────────┴───────────────────────────┤
│ PNG                     SVG                  │
└──────────────────────────────────────────────┘
65. Frame Selector UX

Frame selector harus memiliki:

Search
Category
Featured
New

Frame card:

┌──────────────┐
│              │
│   QR FRAME   │
│              │
├──────────────┤
│ Modern 01    │
└──────────────┘

Selected:

✓ Selected
66. Frame Preview

Thumbnail sebaiknya menampilkan:

contoh QR

bukan hanya frame kosong.

Hal ini membantu user memahami hasil akhir.

67. Frame Data Model
interface QRFrame {
  id: string
  name: string
  category: string
  tags: string[]
  src: string
  thumbnail: string
  width: number
  height: number

  qrArea: {
    x: number
    y: number
    width: number
    height: number
    padding: number
  }

  featured?: boolean
  isNew?: boolean
  isActive?: boolean
}
68. Rendering Engine

Core:

generateQR()
      ↓
parseFrame()
      ↓
getQRArea()
      ↓
calculateLayout()
      ↓
composeSVG()
      ↓
render()
69. Rendering Rule

Jangan:

CSS transform

sebagai solusi utama untuk QR scaling.

Gunakan koordinat SVG:

x
y
width
height

dengan uniform scaling.

70. QR Quiet Zone

QR harus memiliki quiet zone.

Frame decoration tidak boleh masuk ke area QR.

Default:

4 modules

atau mengikuti kebutuhan renderer.

71. Scan Validation

Setiap frame baru harus diuji.

Test:

URL pendek
URL panjang
Text
Email
Phone

Scan menggunakan:

mobile camera
Google Lens
QR scanner
72. Frame Quality Criteria

Frame diterima jika:

QR mudah dipindai
tidak stretched
tidak terpotong
tidak tertutup dekorasi
SVG valid
thumbnail benar
responsive
export benar
73. Initial 100 Frame Strategy

Jangan membuat 100 desain random.

Gunakan sistem:

10 design concepts
        ×
10 visual variations
        =
100 frames

Contoh concept:

01 Corner
02 Badge
03 Ribbon
04 Circle
05 Rounded
06 Sticker
07 Ticket
08 Speech
09 Geometric
10 CTA

Variasi:

Minimal
Bold
Elegant
Modern
Colorful
Dark
Light
Sport
Business
Creative
74. Original Design Rule

ANTT boleh:

mempelajari kategori
mempelajari UX
mempelajari konsep frame
membuat konsep serupa
membuat variasi sendiri

ANTT tidak boleh menjadikan:

file SVG ME-QR
gambar ME-QR
template proprietary ME-QR
kode proprietary ME-QR

sebagai aset ANTT tanpa izin.

75. Design Language ANTT

ANTT harus memiliki identitas sendiri.

Karakter visual:

Clean
Modern
Simple
Fast
Creative
Useful

Target:

User melihat QR ANTT dan merasa desainnya profesional, bukan clone dari website lain.

76. Branding

Nama:

ANTT QR Generator

Primary CTA:

Create QR

Secondary:

Customize
Download
77. Homepage

Hero:

Create Beautiful QR Codes
Fast, Free & Customizable

Input:

Paste your URL...

CTA:

Create QR
78. Homepage Sections
Hero
 ↓
QR Generator
 ↓
Popular Frames
 ↓
How It Works
 ↓
QR Features
 ↓
Template Gallery
 ↓
FAQ
79. How It Works
1. Enter your content
2. Customize your QR
3. Download

Konsep tiga langkah seperti ini juga digunakan oleh ME-QR.

80. SEO

Pages:

/qr-code-generator
/qr-code-generator-url
/qr-code-generator-text
/qr-code-generator-email
/qr-code-generator-phone
/qr-frames

Future:

/qr-code-generator-wifi
/qr-code-generator-whatsapp
/qr-code-generator-instagram
81. Frame Gallery SEO

Create:

/qr-frames

Category:

/qr-frames/modern
/qr-frames/minimal
/qr-frames/business
/qr-frames/event
/qr-frames/sport
82. Analytics

Initial:

Page views
QR generations
Downloads
Frame selection

Future:

Dynamic QR scans
83. Error Handling

Jika QR gagal:

Unable to generate QR.
Please check your input.

Jika frame gagal:

This frame could not be loaded.
Please choose another frame.
84. Empty State

Frame:

No frames found.
Try another keyword.
85. Loading State

Frame loading:

Skeleton

QR loading:

Generating QR...
86. Accessibility

Support:

keyboard navigation
focus states
readable contrast
accessible buttons
labels
screen reader friendly controls
87. Browser Support

Target:

Chrome
Edge
Safari
Firefox

Desktop:

Windows
macOS
Linux

Mobile:

Android
iOS
88. Cloudflare Deployment

Current:

https://antt-qr-generator.pages.dev/

Production target:

Custom domain

Cloudflare:

Pages / Workers

Static frame assets:

Cloudflare

Future large assets:

R2
89. Storage Strategy

Initial:

/public/frames

Future:

Cloudflare R2

Database:

PostgreSQL / Supabase
90. Initial File Structure
public/
├── frames/
│   ├── frame-001.svg
│   ├── frame-002.svg
│   ├── ...
│   └── thumb/
│       ├── frame-001.webp
│       ├── frame-002.webp
│       └── ...
│
└── frames-manifest.json

src/
├── components/
│   ├── QRGenerator/
│   ├── FrameSelector/
│   ├── QRPreview/
│   └── CustomizationPanel/
│
├── lib/
│   ├── qr/
│   │   ├── generator.ts
│   │   ├── layout.ts
│   │   ├── renderer.ts
│   │   └── composer.ts
│   │
│   └── frames/
│       ├── parser.ts
│       ├── registry.ts
│       └── validator.ts
│
└── app/
    ├── page.tsx
    ├── qr-frames/
    └── api/
91. Development Phase
Phase 1 — Stabilize Existing Generator

Tasks:

 Audit current QR generator
 Audit current frame implementation
 Fix QR scaling
 Separate QR renderer from frame
 Implement QR Area metadata
 Implement SVG composer
 Ensure PNG/SVG consistency
92. Phase 2 — Frame Library

Tasks:

 Create frame specification
 Create 10 base designs
 Create 50 frames
 Create 100 frames
 Generate thumbnails
 Create manifest
 Add categories
 Add search
 Add filters
93. Phase 3 — Customization

Tasks:

 Shapes
 Colors
 Logo
 Error correction
 Additional text
 Font
 Background
 Transparent background
94. Phase 4 — Export

Tasks:

 SVG export
 PNG export
 High resolution
 Export validation
 Download filename system

Example:

antt-qr-modern-corner.png
95. Phase 5 — Dynamic QR

Tasks:

 Authentication
 QR database
 Short URL
 Redirect
 Edit destination
 Activate/deactivate
 Scan analytics
96. Phase 6 — Bulk QR

Tasks:

 CSV upload
 Column mapping
 Template selection
 Batch rendering
 ZIP export
 Progress indicator
97. Phase 7 — Template Platform

Tasks:

 Template JSON
 Template editor
 Text
 Image
 QR
 Logo
 Shapes
 Layers
 Alignment
 Placeholders
98. Future Feature — AI

Potential:

Describe your QR design
        ↓
AI generates design concept
        ↓
Template engine
        ↓
QR

Example:

"Create a luxury black and gold QR
for a wedding invitation."

AI output must be converted into ANTT template format.

99. Monetization

Future:

Free
Basic QR
Basic frames
PNG
SVG
Pro
Premium frames
Dynamic QR
Analytics
Bulk generation
No ads
Premium templates
Business
Team
Brand kit
Bulk
API
Advanced analytics
100. Future Frame Marketplace

Future:

ANTT Frame Marketplace

Creators could submit:

Frame
Template
QR Design

Potential monetization:

Free
Premium
Bundle

This is future scope and should not block initial launch.

101. Success Metrics

Initial:

QR generations
Downloads
Frame selections
Return visitors

Important metric:

% users who select a frame

Target:

Increase frame usage
102. Performance KPIs

Target:

First Load < 2.5s
Frame thumbnail load < 1s
QR generation < 300ms
Preview update < 300ms

Targets can be adjusted after real-world measurement.

103. Definition of Done — MVP

MVP selesai jika:

 Existing QR generation works
 URL QR works
 Text QR works
 Email QR works
 Phone QR works
 50 frames available
 Target 100 frames
 Frame categories
 Frame search
 Frame thumbnails
 QR Area metadata
 QR always square
 Realtime preview
 Logo
 Shapes
 Colors
 Error correction
 Additional text
 PNG export
 SVG export
 Mobile responsive
 Desktop responsive
 No major console errors
 All frames tested
 QR scanning tested
104. Most Important Technical Rule

DO NOT implement:

Frame Image
     +
QR Image
     +
CSS object-fit

as the primary architecture.

Use:

SVG Frame
     ↓
QR Area
     ↓
QR Renderer
     ↓
SVG Composer

This prevents:

stretched QR
incorrect ratio
wrong positioning
inconsistent export
different preview vs download
105. Most Important Product Rule

Do not attempt to become ME-QR on day one.

Initial goal:

ANTT
=
Fast QR Generator
+
100 Beautiful Frames
+
Excellent Customization
+
Excellent Export

Then:

ANTT
↓
Dynamic QR
↓
Analytics
↓
Bulk
↓
Templates
↓
QR Design Platform
106. Initial Frame Production Plan

Week / Sprint 1:

10 base concepts

Week / Sprint 2:

50 frames

Week / Sprint 3:

100 frames

Every frame:

SVG
+
QR Area
+
Thumbnail
+
Metadata
+
Category
+
Tags
107. Frame Naming Convention

Use:

{category}-{number}

Examples:

minimal-001
minimal-002

modern-001
modern-002

event-001
event-002

sport-001
sport-002
108. Asset Naming

Never use:

new-final.svg
new-final-2.svg
new-final-benar.svg

Use:

modern-corner-001.svg
modern-corner-002.svg
109. Final Product Architecture
                    ANTT QR GENERATOR
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
       QR GENERATOR                FRAME LIBRARY
             │                           │
             │                    ┌──────┴──────┐
             │                    │             │
             ▼                    ▼             ▼
        QR MATRIX              SVG FRAME    THUMBNAIL
             │                    │
             └──────────┬─────────┘
                        ▼
                  LAYOUT ENGINE
                        │
                        ▼
                  SVG COMPOSER
                        │
               ┌────────┴────────┐
               ▼                 ▼
             PREVIEW           EXPORT
                                 │
                         ┌───────┴───────┐
                         ▼               ▼
                        PNG             SVG
110. Long Term Vision

ANTT QR Generator akhirnya menjadi:

                 ANTT
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
      QR       Templates   Dynamic
   Generator   & Designs      QR
       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
             Bulk Creator
                  │
                  ▼
              Analytics
                  │
                  ▼
             API Platform
