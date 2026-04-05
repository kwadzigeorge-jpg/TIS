const POI_CATEGORIES = [
  { slug: 'landmark',   label: 'Landmarks',    icon: 'landmark' },
  { slug: 'cultural',   label: 'Cultural',     icon: 'museum' },
  { slug: 'scenic',     label: 'Scenic',       icon: 'mountain' },
  { slug: 'restaurant', label: 'Food & Drink', icon: 'utensils' },
  { slug: 'beach',      label: 'Beaches',      icon: 'umbrella-beach' },
  { slug: 'wildlife',   label: 'Wildlife',     icon: 'paw' },
  { slug: 'religious',  label: 'Religious',    icon: 'place-of-worship' },
  { slug: 'shopping',   label: 'Shopping',     icon: 'shopping-bag' },
];

const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 50;
const GEOFENCE_TRIGGER_RADIUS_M = 2000;

const SUPPORTED_COUNTRIES = [
  { code: 'GH', name: 'Ghana' },
  // Expand here as the app scales globally
];

module.exports = { POI_CATEGORIES, DEFAULT_RADIUS_KM, MAX_RADIUS_KM, GEOFENCE_TRIGGER_RADIUS_M, SUPPORTED_COUNTRIES };
