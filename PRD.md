# Planning Guide

A customizable CMS tool for engineering teams to upload, manage, and organize technical specifications with a flexible schema system that adapts to different job categories.

**Experience Qualities**:
1. **Efficient** - Minimal clicks to view, edit, or create specifications with clear navigation paths
2. **Structured** - Hierarchical organization (Category → Job → Page) that scales with team needs
3. **Flexible** - Schema customization allows teams to define their own page structures and field types

**Complexity Level**: Light Application (multiple features with basic state)
This is a data management tool with CRUD operations, dropdown navigation, and schema editing. It has multiple views but straightforward state management centered around Firebase integration.

## Essential Features

### View Specifications
- **Functionality**: Display specification data for a selected job and page number
- **Purpose**: Primary read access to stored specifications
- **Trigger**: User selects Job ID and Page Number, then clicks "View Page"
- **Progression**: Select dropdowns → Click view → Display fields and values → Optional edit mode
- **Success criteria**: Correct data loads, edit button appears, fields are readable

### Edit Specification Page
- **Functionality**: Modify values in existing specification fields without changing the schema
- **Purpose**: Update specification data while maintaining structure
- **Trigger**: Click "Edit" button on a viewed page
- **Progression**: View mode → Click edit → Fields become editable → Save changes → Return to view mode
- **Success criteria**: Changes persist to Firebase, file uploads work, validation prevents invalid data

### Create New Job
- **Functionality**: Initialize a new job with an ID and category
- **Purpose**: Start a new specification collection under a defined schema
- **Trigger**: Click "Create Job" button
- **Progression**: Click create job → Enter Job ID → Select category → Submit → Redirected to create first page
- **Success criteria**: Job stored in Firebase, category schema applied, page creation dialogue opens with Job ID pre-filled

### Create New Page
- **Functionality**: Add a new specification page to an existing job
- **Purpose**: Expand job specifications with additional structured data
- **Trigger**: Click "Create Page" button or after job creation
- **Progression**: Select job ID and page type → Submit → Empty page with schema fields appears → Fill and save
- **Success criteria**: Page follows category schema, stores to correct Firebase path, appears in page number dropdown

### Schema Management
- **Functionality**: Define and modify job category schemas and page types
- **Purpose**: Customize the CMS structure to team needs
- **Trigger**: Navigate to "Schema Editor" from menu
- **Progression**: Select category → View pages → Edit page → Reorder/add/delete blocks → Save schema
- **Success criteria**: Schema changes reflect immediately in page creation, existing data remains intact, block types (file/markdown/checkbox) work correctly

### Search and Filter
- **Functionality**: Real-time search across jobs and pages to quickly locate specific items
- **Purpose**: Rapidly find jobs or pages in large specification sets
- **Trigger**: Type in search fields above Job ID or Page Number dropdowns
- **Progression**: Type query → List filters instantly → Select from filtered results → Clear search to reset
- **Success criteria**: Searches match job IDs, category names, and page numbers; filtering is immediate; clear button removes filter

## Edge Case Handling

- **Empty Dropdowns**: Show placeholder text when no jobs or pages exist, with quick links to create
- **Duplicate IDs**: Validate job IDs and page numbers to prevent overwrites
- **Missing Schema**: Default to basic schema if category metadata is corrupted
- **File Upload Failures**: Show error toast and allow retry without losing form data
- **Concurrent Edits**: Last write wins (acceptable for team tool)
- **Invalid Schema**: Validate block types and show errors during schema editing

## Design Direction

The design should feel precise and technical - evoking engineering documentation systems with clear hierarchy, monospaced elements for IDs/codes, and strong visual separation between navigation controls and content areas. It should project reliability and organization.

## Color Selection

A technical, high-contrast palette with engineering blueprint inspiration - deep navy backgrounds with crisp cyan accents and warm amber highlights for actions.

- **Primary Color**: Deep Navy `oklch(0.22 0.04 250)` - Professional, technical foundation
- **Secondary Colors**: 
  - Slate Gray `oklch(0.35 0.02 250)` - Subdued panels and cards
  - Cool White `oklch(0.98 0.005 250)` - Clean backgrounds for content
- **Accent Color**: Electric Cyan `oklch(0.7 0.15 195)` - Technical precision for interactive elements and focus states
- **Action Color**: Amber `oklch(0.75 0.15 65)` - Warm highlight for primary actions (create, save)
- **Foreground/Background Pairings**:
  - Primary Navy `oklch(0.22 0.04 250)`: White text `oklch(0.98 0.005 250)` - Ratio 11.2:1 ✓
  - Slate panels `oklch(0.35 0.02 250)`: White text `oklch(0.98 0.005 250)` - Ratio 8.1:1 ✓
  - Accent Cyan `oklch(0.7 0.15 195)`: Navy text `oklch(0.22 0.04 250)` - Ratio 5.8:1 ✓
  - Action Amber `oklch(0.75 0.15 65)`: Navy text `oklch(0.22 0.04 250)` - Ratio 6.2:1 ✓

## Font Selection

Typography should blend readability with technical precision - a modern sans-serif for content paired with a monospaced font for IDs, codes, and technical labels.

- **Primary**: IBM Plex Sans - Technical yet approachable, excellent readability
- **Monospace**: JetBrains Mono - For Job IDs, page numbers, and field labels

- **Typographic Hierarchy**:
  - H1 (Page Title): IBM Plex Sans Semibold/32px/tight letter-spacing: -0.02em
  - H2 (Section Headers): IBM Plex Sans Medium/24px/normal
  - H3 (Field Labels): JetBrains Mono Medium/14px/letter-spacing: 0.01em
  - Body Text: IBM Plex Sans Regular/16px/line-height: 1.6
  - Dropdown/Form: IBM Plex Sans Regular/15px
  - Code/IDs: JetBrains Mono Regular/14px

## Animations

Animations should feel precise and quick - snappy state changes that communicate data updates without delay. Use subtle fades for content loading and micro-interactions on buttons.

- Modal/Dialog entrances: Quick fade + slight scale (150ms)
- Button hover states: Instant color shift with subtle glow effect
- Page transitions: Fast crossfade (200ms)
- Field edit mode: Smooth border color transition (100ms)
- File upload progress: Linear progress bar animation
- Schema drag-and-drop: Real-time position updates with spring physics

## Component Selection

- **Components**:
  - `Select` for Job ID and Page Number dropdowns
  - `Dialog` for Create Job, Create Page, and Schema Editor modals
  - `Button` with variants (default for view, primary for create/save, destructive for delete)
  - `Card` for specification content containers
  - `Input` for text fields
  - `Textarea` for markdown blocks
  - `Checkbox` for boolean fields
  - `Label` for field labels (styled with monospace font)
  - `Separator` for visual section breaks
  - `ScrollArea` for long specification pages
  - `Toast` (Sonner) for save confirmations and errors
  
- **Customizations**:
  - Custom file upload component with drag-drop zone and preview
  - Custom markdown editor with live preview toggle
  - Custom schema block reorder component with drag handles using framer-motion
  - Navigation header with logo area and schema editor link

- **States**:
  - Buttons: Distinct hover with cyan glow, active with slight scale-down, disabled with reduced opacity
  - Inputs: Focused state with cyan ring, error state with red border
  - Dropdowns: Highlighted selection with accent background
  - Cards: Elevated shadow on hover for interactive cards
  
- **Icon Selection**:
  - `Eye` for view action
  - `PencilSimple` for edit mode
  - `Plus` for create actions
  - `FloppyDisk` for save
  - `Trash` for delete blocks
  - `ArrowsOutCardinal` for drag handles
  - `FileArrowUp` for file upload
  - `TextAa` for markdown block
  - `CheckSquare` for checkbox block
  - `Gear` for schema settings
  - `MagnifyingGlass` for search fields
  - `X` for clear search
  
- **Spacing**:
  - Page margins: `px-8 py-6`
  - Card padding: `p-6`
  - Form gaps: `gap-4`
  - Section spacing: `space-y-6`
  - Button padding: `px-4 py-2`
  
- **Mobile**:
  - Stack dropdowns vertically on small screens
  - Full-width buttons below 640px
  - Reduce page padding to `px-4 py-4`
  - Schema editor becomes full-screen modal
  - Simplify drag-drop to up/down buttons on mobile
