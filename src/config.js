// Centralized config. Vite injects values at build-time from .env files.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/pwa';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// 8 audit sections — must match backend constants.js. Kept here so the
// auditor UI can iterate without an extra round-trip.
export const SECTIONS = [
  { key: 'entrance', label: 'Entrance & Facade', required: true, hint: 'Building front, signage, gate.' },
  { key: 'reception', label: 'Reception & Common Area', required: true, hint: 'Lobby, seating, welcome desk.' },
  { key: 'rooms', label: 'Rooms & Washrooms', required: true, hint: 'Cover more than 50% of rooms — bed, bath, lighting.' },
  { key: 'kitchen', label: 'Kitchen & Food', required: true, hint: 'Kitchen hygiene, served meals.' },
  { key: 'cctv', label: 'CCTV', required: false, hint: 'Monitor screens, camera coverage. Skip if not installed.' },
  { key: 'facilities', label: 'Facilities', required: true, hint: 'Pool, gym, Wi-Fi, parking.' },
  { key: 'garden', label: 'Garden Area', required: false, hint: 'Open space, plants. Skip if not present.' },
  { key: 'meditation', label: 'Meditation / Activity Room', required: true, hint: 'Practice space, mats, props.' },
  { key: 'trainer', label: 'Trainer & Certificate', required: true, hint: 'Trainer headshot + visible certificate.' },
];

// Phase 4 deep-dive fields, now captured INSIDE each Phase 3 section.
// Mirrors backend pwa/constants.PHASE4_SCHEMA exactly. The rooms section
// is special — its per-room photos + fields are managed by the dedicated
// rooms UI; what's listed here is the section-level (top-of-rooms) bits.
export const DEEP_DIVE_SCHEMA = {
  entrance: [
    { key: 'hasGate',         label: 'Property has a gate',         type: 'bool' },
    { key: 'parkingSpaces',   label: 'Parking space',               type: 'bool' },
    { key: 'parkingType',     label: 'Parking type',                type: 'select', options: ['Outdoor', 'Covered', 'Basement', 'Street'] },
    { key: 'entranceLighting',label: 'Entrance lighting',           type: 'bool' },
  ],
  reception: [
    { key: 'seatingCapacity',     label: 'Reception seating capacity',      type: 'number' },
    { key: 'waitingArea',         label: 'Has dedicated waiting area',      type: 'bool' },
    { key: 'refreshmentsAvailable', label: 'Refreshments at reception',     type: 'bool' },
    { key: 'hoursOpen',           label: 'Reception hours',                 type: 'text' },
    { key: 'languagesSpoken',     label: 'Languages spoken',                type: 'multi', options: ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Punjabi', 'French', 'Spanish', 'German'] },
    { key: 'checkInTime',         label: 'Check-in time',                   type: 'time' },
    { key: 'checkOutTime',        label: 'Check-out time',                  type: 'time' },
  ],
  rooms: [
    { key: 'housekeepingFrequency', label: 'Housekeeping frequency',        type: 'select', options: ['Daily', 'Alternate', 'On request', 'None'] },
  ],
  kitchen: [
    { key: 'cuisineTypes',        label: 'Cuisine types',                   type: 'multi', options: ['Indian', 'Continental', 'Sattvic', 'Vegan', 'Ayurvedic', 'Chinese', 'Italian', 'South Indian', 'North Indian'] },
    { key: 'mealPlansOffered',    label: 'Meal plans offered',              type: 'multi', options: ['Breakfast only', 'Half board', 'Full board', 'All inclusive'] },
    { key: 'capacityPerSitting',  label: 'Dining capacity per sitting',     type: 'number' },
    { key: 'prepStaffCount',      label: '# of kitchen staff',              type: 'number' },
    { key: 'hygieneCertificateNo',label: 'Hygiene certificate / FSSAI #',   type: 'text' },
    { key: 'specialDietsServed',  label: 'Special diets served',            type: 'multi', options: ['Vegan', 'Gluten-free', 'Jain', 'Nut-free', 'Diabetic-friendly', 'Low-sodium'] },
    { key: 'waterSource',         label: 'Drinking water source',           type: 'text' },
    { key: 'kitchenSizeSqft',     label: 'Kitchen size (sq ft)',            type: 'number' },
  ],
  cctv: [
    { key: 'totalCameras',        label: 'Total cameras installed',         type: 'number' },
    { key: 'coverageAreas',       label: 'Coverage areas',                  type: 'multi', options: ['Entrance', 'Reception', 'Parking', 'Corridors', 'Garden', 'Kitchen', 'Common areas'] },
    { key: 'recordingRetentionDays', label: 'Recording retention (days)',   type: 'number' },
    { key: 'monitoringCenterPresent', label: 'Live monitoring center',      type: 'bool' },
    { key: 'nightVision',         label: 'Night vision capable',            type: 'bool' },
  ],
  facilities: [
    { key: 'poolPresent',         label: 'Swimming pool',                   type: 'bool' },
    { key: 'poolType',            label: 'Pool type',                       type: 'select', options: ['Outdoor', 'Indoor', 'Heated', 'Children only', 'Infinity'] },
    { key: 'poolLengthM',         label: 'Pool length (m)',                 type: 'number' },
    { key: 'spaPresent',          label: 'Spa',                             type: 'bool' },
    { key: 'gymPresent',          label: 'Gym',                             type: 'bool' },
    { key: 'gymAreaSqft',         label: 'Gym area (sq ft)',                type: 'number' },
    { key: 'yogaShalaPresent',    label: 'Yoga shala / deck',               type: 'bool' },
    { key: 'yogaShalaCapacity',   label: 'Yoga shala capacity (people)',    type: 'number' },
    { key: 'wifiPresent',         label: 'Wi-Fi in common areas',           type: 'bool' },
    { key: 'wifiSpeedMbps',       label: 'Wi-Fi speed (Mbps)',              type: 'number' },
  ],
  garden: [
    { key: 'gardenType',          label: 'Garden type',                     type: 'select', options: ['Meditation Garden', 'Herbal Garden', 'Zen Garden', 'Lawn Garden', 'Forest Area', 'Terrace Garden'] },
    { key: 'gardenAreaSqft',      label: 'Garden area (sq ft)',             type: 'number' },
    { key: 'plantTypes',          label: 'Plant types',                     type: 'textarea' },
    { key: 'walkingPathAvailable',label: 'Walking path available',          type: 'bool' },
    { key: 'waterFeature',        label: 'Water feature',                   type: 'bool' },
    { key: 'waterFeatureType',    label: 'Water feature type',              type: 'select', options: ['Fountain', 'Pond', 'Waterfall'] },
    { key: 'maintenanceFrequency',label: 'Maintenance frequency',           type: 'select', options: ['Daily', 'Weekly', 'Monthly'] },
    { key: 'outdoorYoga',         label: 'Outdoor yoga',                    type: 'bool' },
    { key: 'nightLighting',       label: 'Night lighting',                  type: 'bool' },
    { key: 'organicGarden',       label: 'Organic garden',                  type: 'bool' },
    { key: 'sittingZones',        label: '# of sitting zones',              type: 'number' },
    { key: 'kidsPlayArea',        label: 'Kids play area',                  type: 'bool' },
    { key: 'gardenerOnStaff',     label: 'Gardener on staff',               type: 'bool' },
  ],
  meditation: [
    { key: 'roomType',            label: 'Room type',                       type: 'multi', options: ['Meditation Hall', 'Yoga Studio', 'Activity Room', 'Sound Healing Room', 'Dance Studio', 'Breathwork Room', 'Multi-purpose Hall'] },
    { key: 'roomCapacity',        label: 'Capacity (people)',               type: 'number' },
    { key: 'roomSizeSqft',        label: 'Room size (sq ft)',               type: 'number' },
    { key: 'matsProvided',        label: 'Yoga mats provided',              type: 'bool' },
    { key: 'soundSystem',         label: 'Sound system available',          type: 'bool' },
    { key: 'ambianceType',        label: 'Ambiance type',                   type: 'multi', options: ['Calm', 'Spiritual', 'Minimal', 'Luxury', 'Traditional', 'Nature-facing'] },
    { key: 'flooringType',        label: 'Flooring type',                   type: 'select', options: ['Wooden', 'Marble', 'Vinyl', 'Grass', 'Tatami', 'Rubber'] },
    { key: 'naturalLight',        label: 'Natural light',                   type: 'bool' },
    { key: 'ceilingHeightFt',     label: 'Ceiling height (ft)',             type: 'number' },
  ],
  trainer: [
    { key: 'yearsOfExperience',   label: 'Years of experience',             type: 'number' },
    { key: 'certificationBody',   label: 'Certification body',              type: 'text' },
    { key: 'certificationNumber', label: 'Certification number',            type: 'text' },
    { key: 'specialties',         label: 'Specialties',                     type: 'multi', options: ['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Iyengar', 'Pranayama', 'Meditation', 'Reiki', 'Sound healing', 'Naturopathy', 'Ayurveda'] },
    { key: 'maxClassSize',        label: 'Maximum class size',              type: 'number' },
    { key: 'languagesTaught',     label: 'Languages taught',                type: 'multi', options: ['English', 'Hindi', 'Sanskrit', 'Tamil', 'Telugu', 'Marathi', 'Bengali'] },
  ],
};

// Mandatory photo categories per individual room record. The rooms editor
// requires at least one photo for each "mandatory" entry. Extra (non-
// mandatory) categories let the auditor capture optional shots.
export const ROOM_PHOTO_CATEGORIES = [
  { key: 'entrance',  label: 'Room entrance',  mandatory: true },
  { key: 'washroom',  label: 'Washroom',       mandatory: true },
  { key: 'bedsheet',  label: 'Bedsheet',       mandatory: true },
  { key: 'tv',        label: 'TV',             mandatory: true },
  { key: 'almirah',   label: 'Almirah',        mandatory: true },
];

export const ROOM_CATEGORY_OPTIONS = ['Standard', 'Deluxe', 'Premium', 'Suite', 'Family', 'Dorm'];

export const SECTION_PHOTO_CATEGORIES = {
  entrance: [
    { key: 'entranceImage', label: 'Entrance image upload / live capture', mandatory: true },
    { key: 'parkingSpace', label: 'Parking space upload / live capture', mandatory: true },
    { key: 'areaImage', label: 'Area image upload / live capture', mandatory: true },
  ],
  reception: [
    { key: 'frontView', label: 'Reception Front View', hint: 'Full desk visible, branding/logo visible', mandatory: true },
    { key: 'seatingArea', label: 'Reception Seating Area', hint: 'Chairs/sofa, overall seating capacity', mandatory: true },
    { key: 'commonAreaWide', label: 'Wide Angle Common Area', hint: 'Lobby, walking space, decor', mandatory: true },
  ],
  kitchen: [
    { key: 'kitchenHygiene', label: 'Kitchen Hygiene', mandatory: true },
    { key: 'foodServingArea', label: 'Dining / Food Serving Area', mandatory: true },
    { key: 'foodSample', label: 'Prepared Meal / Food Sample', mandatory: true },
  ],
  meditation: [
    { key: 'roomWideView', label: 'Room Wide View', hint: 'Full usable space visible', mandatory: true },
    { key: 'flooringSetup', label: 'Flooring / Setup View', hint: 'Mats, flooring, props, and activity setup', mandatory: true },
    { key: 'ambianceView', label: 'Ambiance / Natural Light View', hint: 'Lighting, decor, ventilation, or nature-facing side', mandatory: true },
  ],
  trainer: [
    { key: 'trainerImage', label: 'Trainer Image', mandatory: true },
    { key: 'certificateUpload', label: 'Certificate Upload', mandatory: true },
  ],
};

// Per-individual-room structured fields.
export const ROOM_DETAIL_FIELDS = [
  { key: 'category',    label: 'Room category',           type: 'text', required: true },
  { key: 'bedType',     label: 'Bed type',                type: 'select', options: ['Single', 'Twin', 'Double', 'Queen', 'King'] },
  { key: 'isWindow',    label: 'Has window',              type: 'bool' },
  { key: 'sizeSqft',    label: 'Room size (sq ft)',       type: 'number' },
  { key: 'washroomType',label: 'Washroom type',           type: 'select', options: ['En-suite', 'Shared', 'Mixed'] },
  { key: 'hotWater',    label: 'Hot water 24/7',          type: 'bool' },
  { key: 'ac',          label: 'A/C available',           type: 'bool' },
  { key: 'heater',      label: 'Heater available',        type: 'bool' },
  { key: 'wifi',        label: 'Wi-Fi in room',           type: 'bool' },
];

// Phase 3 + Phase 4 were collapsed (Jun 2026). The status enum still lists
// the old phase4_* states for backward compat with existing rows, but new
// approvals jump directly from `in_review` → `final_approved`.
export const STATUS_LABEL = {
  draft: 'Draft',
  phase1_done: 'Phase 1 done',
  phase3_submitted: 'Submitted',
  in_review: 'Under review',
  in_revision: 'Following up',
  approved: 'Approved',
  phase4_submitted: 'Under review',
  phase4_in_revision: 'Following up',
  final_approved: 'Final approved',
  rejected: 'Final rejected',
  contract_sent: 'Contract sent',
  contract_signed: 'Contract signed',
  completed: 'Completed',
};

export const STATUS_COLOR = {
  draft: 'bg-slate-100 text-slate-700',
  phase1_done: 'bg-blue-50 text-blue-700',
  phase3_submitted: 'bg-blue-50 text-blue-700',
  in_review: 'bg-amber-50 text-amber-700',
  in_revision: 'bg-rose-50 text-rose-700',
  approved: 'bg-amber-50 text-amber-700',
  phase4_submitted: 'bg-violet-50 text-violet-700',
  phase4_in_revision: 'bg-rose-50 text-rose-700',
  final_approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-800',
  contract_sent: 'bg-teal-50 text-teal-700',
  contract_signed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
};
