# DCL Wearable Validator

A production-ready TypeScript web application for validating Decentraland wearables against technical constraints. Built with React, Three.js, and Vite.

## Features

- **Drag & Drop GLB/GLTF Support**: Upload 3D models directly in the browser
- **Interactive 3D Viewer**: Built with react-three-fiber and drei
- **Dynamic Budget Calculation**: Supports hidden slot combining and helmet special rules
- **Comprehensive Validation**: Checks triangles, materials, textures, normals, skin weights, and dimensions
- **Real-time Analysis**: All processing happens client-side for privacy and speed
- **Detailed Reports**: Download JSON reports with fix tips
- **Debug Tools**: Wireframe toggle, material view modes, and problem highlighting
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Framework**: React 18 + TypeScript (strict mode)
- **Build Tool**: Vite
- **3D Graphics**: Three.js + @react-three/fiber + @react-three/drei
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Testing**: Vitest + @testing-library/react
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd DCLWearableValidator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
```

## Usage

1. **Upload Model**: Drag and drop a GLB/GLTF file or click to browse
2. **Select Target Slot**: Choose the primary wearable slot (hat, helmet, upper_body, etc.)
3. **Configure Hidden Slots**: Multi-select slots that this wearable hides
4. **Special Options**: For hand accessories, toggle "hides base hand" if applicable
5. **Analyze**: Click the analyze button to run validation
6. **Review Results**: Check the detailed report with pass/warn/fail status
7. **Download Report**: Export results as JSON for sharing or documentation

## DCL Validation Rules

### Triangle Budgets
- **1.5k max**: hat, helmet, upper_body, lower_body, feet, hair
- **500 max**: mask, eyewear, earring, tiara, top_head, facial_hair
- **1k max**: hands (1.5k if hides base hand)
- **5k max**: skin wearable

### Hidden Slot Combining
- Triangle budgets can be combined when a wearable hides other slots
- Example: jumpsuit (upper_body + lower_body) = 3k triangles
- Helmet special rule: if hides ALL head slots → 4k triangles max

### Material & Texture Limits
- **Materials**: ≤ 2 per wearable (excluding "AvatarSkin_MAT")
- **Textures**: ≤ 2 per wearable (≤ 5 for skin)
- **Texture Size**: ≤ 1024×1024, square preferred
- **Maps**: Base color, emission, alpha allowed; normal/roughness maps discouraged

### Quality Checks
- **Normals**: Flag inverted faces (>1% = WARN, >10% = FAIL)
- **Skin Weights**: Validate weight sums and joint indices
- **Dimensions**: ≤ 2.42m × 2.42m × 1.4m bounding box
- **Alpha Mode**: Prefer MASK over BLEND for performance

## Project Structure

```
src/
├── components/          # React components
│   ├── App.tsx         # Main app component
│   ├── Viewer.tsx      # 3D viewer container
│   ├── ModelViewer.tsx # Model rendering
│   ├── FileDrop.tsx    # File upload
│   ├── ControlsPanel.tsx # Validation settings
│   ├── ResultsPanel.tsx  # Results display
│   └── BudgetCard.tsx  # Budget display
├── lib/                # Core logic
│   ├── types.ts        # TypeScript interfaces
│   ├── budgets.ts      # Budget calculations
│   ├── gltfUtils.ts    # 3D model analysis
│   ├── runValidation.ts # Validation rules
│   └── report.ts       # Report generation
├── state/              # State management
│   └── useStore.ts     # Zustand store
├── styles/             # Styling
│   └── index.css       # Tailwind + custom styles
└── tests/              # Unit tests
    ├── budgets.test.ts
    ├── runValidation.test.ts
    └── computeBudget.test.ts
```

## Testing

The project includes comprehensive unit tests for the validation engine:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test budgets.test.ts
```

### Test Coverage

- **Budget Calculations**: Triangle budget combining, helmet special rules
- **Validation Rules**: All DCL constraint checks
- **Edge Cases**: Zero triangles, missing materials, invalid skin weights
- **Error Handling**: Invalid files, malformed models

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL 2.0 support for 3D rendering.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Decentraland for the wearable specifications
- Three.js community for excellent 3D tools
- React Three Fiber for seamless React integration
