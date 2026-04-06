require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const db = require('../index');

const POIS = [
  // Accra
  { name: 'Kwame Nkrumah Memorial Park', lat: 5.5502, lng: -0.2012, city: 'Accra', category: 'landmark', description: 'Mausoleum and museum dedicated to Ghana\'s first president, set in beautifully manicured gardens.', avg_stop_time_mins: 60 },
  { name: 'National Museum of Ghana', lat: 5.5600, lng: -0.2069, city: 'Accra', category: 'cultural', description: 'Ghana\'s premier museum showcasing over 2,500 years of history, art and culture.', avg_stop_time_mins: 90 },
  { name: 'Labadi Beach', lat: 5.5546, lng: -0.1386, city: 'Accra', category: 'scenic', description: 'Accra\'s most popular beach with live music, food stalls, and stunning Atlantic views.', avg_stop_time_mins: 180 },
  { name: 'Osu Castle (Christiansborg)', lat: 5.5401, lng: -0.1765, city: 'Accra', category: 'landmark', description: 'Historic castle that served as the seat of government, dating back to 1661.', avg_stop_time_mins: 75 },
  { name: 'Accra Arts Centre', lat: 5.5468, lng: -0.2056, city: 'Accra', category: 'shopping', description: 'The largest arts and crafts market in Ghana with over 800 traders selling authentic Ghanaian crafts.', avg_stop_time_mins: 90 },
  { name: 'Jamestown Lighthouse', lat: 5.5381, lng: -0.2175, city: 'Accra', category: 'landmark', description: 'Iconic lighthouse in historic Jamestown offering panoramic views of the Atlantic coastline.', avg_stop_time_mins: 45 },
  { name: 'Independence Square', lat: 5.5440, lng: -0.1895, city: 'Accra', category: 'landmark', description: 'Massive open square commemorating Ghana\'s independence, with the Black Star Gate.', avg_stop_time_mins: 45 },

  // Cape Coast & Elmina
  { name: 'Cape Coast Castle', lat: 5.1037, lng: -1.2424, city: 'Cape Coast', category: 'landmark', description: 'UNESCO World Heritage Site and former slave trade post with powerful "Door of No Return".', avg_stop_time_mins: 90 },
  { name: 'Kakum National Park', lat: 5.3500, lng: -1.3833, city: 'Cape Coast', category: 'wildlife', description: 'Tropical rainforest park famous for its canopy walkway 30m above the forest floor.', avg_stop_time_mins: 180 },
  { name: 'Elmina Castle', lat: 5.0836, lng: -1.3499, city: 'Elmina', category: 'landmark', description: 'Oldest European building in Sub-Saharan Africa, built by the Portuguese in 1482.', avg_stop_time_mins: 90 },
  { name: 'Cape Coast Harbour', lat: 5.1000, lng: -1.2400, city: 'Cape Coast', category: 'scenic', description: 'Colourful fishing harbour where traditional canoes set out at dawn each day.', avg_stop_time_mins: 60 },
  { name: 'Assin Manso Ancestral Slave River', lat: 5.6400, lng: -1.2083, city: 'Assin Manso', category: 'cultural', description: 'Sacred site where enslaved Africans took their final bath before being shipped abroad.', avg_stop_time_mins: 60 },

  // Kumasi & Ashanti Region
  { name: 'Manhyia Palace Museum', lat: 6.7000, lng: -1.6167, city: 'Kumasi', category: 'cultural', description: 'Seat of the Asante Kingdom with royal regalia and exhibits on Ashanti history.', avg_stop_time_mins: 75 },
  { name: 'Kejetia Market', lat: 6.6953, lng: -1.6226, city: 'Kumasi', category: 'shopping', description: 'Largest market in West Africa with over 10,000 stalls selling everything imaginable.', avg_stop_time_mins: 120 },
  { name: 'Lake Bosomtwe', lat: 6.5000, lng: -1.4167, city: 'Kumasi', category: 'scenic', description: 'Ghana\'s only natural lake, formed by a meteor impact 1.07 million years ago.', avg_stop_time_mins: 180 },
  { name: 'Kumasi Cultural Centre', lat: 6.6880, lng: -1.6237, city: 'Kumasi', category: 'cultural', description: 'Hub of Ashanti arts and crafts including kente weaving, pottery and wood carving.', avg_stop_time_mins: 90 },
  { name: 'Okomfo Anokye Sword Site', lat: 6.6883, lng: -1.6163, city: 'Kumasi', category: 'landmark', description: 'Legendary site where the Okomfo Anokye sword is said to be embedded in the earth.', avg_stop_time_mins: 45 },
  { name: 'Bonwire Kente Village', lat: 6.7500, lng: -1.5167, city: 'Bonwire', category: 'cultural', description: 'Traditional weaving village where authentic kente cloth has been made for centuries.', avg_stop_time_mins: 120 },

  // Northern Ghana
  { name: 'Mole National Park', lat: 9.2611, lng: -1.8544, city: 'Damongo', category: 'wildlife', description: 'Ghana\'s largest wildlife refuge, home to elephants, buffaloes, and over 300 bird species.', avg_stop_time_mins: 240 },
  { name: 'Larabanga Mosque', lat: 9.2228, lng: -1.8572, city: 'Larabanga', category: 'landmark', description: 'One of the oldest mosques in West Africa, built in the 13th century in Sudanese-Sahelian style.', avg_stop_time_mins: 45 },
  { name: 'Paga Crocodile Pond', lat: 10.9833, lng: -1.1167, city: 'Paga', category: 'wildlife', description: 'Sacred pond where visitors can interact safely with tame Nile crocodiles.', avg_stop_time_mins: 60 },
  { name: 'Tongo Hills', lat: 10.7333, lng: -0.9167, city: 'Tongo', category: 'scenic', description: 'Ancient granite hills dotted with baobab trees and traditional Tallensi shrines.', avg_stop_time_mins: 120 },
  { name: 'Gambaga Escarpment', lat: 10.5289, lng: -0.4411, city: 'Gambaga', category: 'scenic', description: 'Dramatic escarpment with sweeping views over the Volta Basin and surrounding plains.', avg_stop_time_mins: 90 },
  { name: 'Tamale Central Mosque', lat: 9.4008, lng: -0.8393, city: 'Tamale', category: 'landmark', description: 'The grand mosque at the heart of Ghana\'s largest northern city, an architectural landmark.', avg_stop_time_mins: 30 },

  // Volta Region
  { name: 'Wli Waterfalls', lat: 7.0833, lng: 0.6167, city: 'Hohoe', category: 'scenic', description: 'Highest waterfall in West Africa at 80m, accessible by a scenic 45-minute forest hike.', avg_stop_time_mins: 150 },
  { name: 'Tafi Atome Monkey Sanctuary', lat: 7.2167, lng: 0.4333, city: 'Tafi Atome', category: 'wildlife', description: 'Community-run sanctuary home to sacred Mona monkeys that live freely in the village.', avg_stop_time_mins: 90 },
  { name: 'Kpando Pottery Village', lat: 7.0167, lng: 0.3000, city: 'Kpando', category: 'cultural', description: 'Traditional pottery village where women craft beautiful terracotta pots using age-old techniques.', avg_stop_time_mins: 60 },
  { name: 'Volta Lake', lat: 7.5000, lng: -0.5000, city: 'Kete Krachi', category: 'scenic', description: 'The world\'s largest man-made lake by surface area, stretching across much of eastern Ghana.', avg_stop_time_mins: 180 },
  { name: 'Xavi Hills', lat: 7.6333, lng: 0.5167, city: 'Hohoe', category: 'scenic', description: 'Breathtaking mountain scenery in the Agumatsa Wildlife Sanctuary near the Togo border.', avg_stop_time_mins: 180 },

  // Eastern Region
  { name: 'Boti Falls', lat: 6.2167, lng: -0.0833, city: 'Koforidua', category: 'scenic', description: 'Twin waterfalls that unite into one during the rainy season, surrounded by lush tropical forest.', avg_stop_time_mins: 120 },
  { name: 'Aburi Botanical Gardens', lat: 5.8500, lng: -0.1833, city: 'Aburi', category: 'scenic', description: 'Historic botanical gardens established in 1890, offering cool mountain air and exotic plants.', avg_stop_time_mins: 90 },
  { name: 'Begoro Mountain', lat: 6.3833, lng: -0.3833, city: 'Begoro', category: 'scenic', description: 'Scenic mountain town in the Kwahu range offering panoramic views of the Afram Plains.', avg_stop_time_mins: 120 },
  { name: 'Kwahu Easter Festival Site', lat: 6.6167, lng: -0.4667, city: 'Kwahu', category: 'cultural', description: 'Scenic Kwahu plateau famous for Ghana\'s biggest Easter festival and paragliding activities.', avg_stop_time_mins: 120 },

  // Western Region
  { name: 'Nzulezo Stilt Village', lat: 4.9500, lng: -2.3000, city: 'Beyin', category: 'cultural', description: 'Unique UNESCO-listed village built entirely on stilts over a lagoon, accessible only by canoe.', avg_stop_time_mins: 150 },
  { name: 'Ankasa Conservation Area', lat: 5.2667, lng: -2.6833, city: 'Ankasa', category: 'wildlife', description: 'Ghana\'s wettest forest reserve, home to chimpanzees, forest elephants and 700+ plant species.', avg_stop_time_mins: 240 },
  { name: 'Butre Beach', lat: 4.9167, lng: -1.9333, city: 'Butre', category: 'scenic', description: 'Secluded pristine beach with a historic Dutch fort, perfect for swimming and relaxation.', avg_stop_time_mins: 180 },
  { name: 'Busua Beach', lat: 4.7667, lng: -1.9500, city: 'Busua', category: 'scenic', description: 'Ghana\'s best surfing beach with golden sands, warm water and a laid-back village atmosphere.', avg_stop_time_mins: 180 },

  // Greater Accra - More
  { name: 'Volta River Estuary (Ada)', lat: 5.7833, lng: 0.6333, city: 'Ada', category: 'scenic', description: 'Spectacular estuary where the mighty Volta River meets the Atlantic Ocean at Ada Foah.', avg_stop_time_mins: 180 },
  { name: 'Shai Hills Resource Reserve', lat: 5.9333, lng: -0.0833, city: 'Shai Hills', category: 'wildlife', description: 'Close to Accra, this reserve offers baboon sightings, ancient caves and grassland wildlife.', avg_stop_time_mins: 150 },
  { name: 'Tema Harbour', lat: 5.6333, lng: -0.0167, city: 'Tema', category: 'landmark', description: 'West Africa\'s largest artificial harbour and Ghana\'s main industrial port city.', avg_stop_time_mins: 60 },
];

async function seed() {
  console.log(`Seeding ${POIS.length} Ghana POIs...`);

  for (const poi of POIS) {
    const catResult = await db.query('SELECT id FROM categories WHERE slug = $1', [poi.category]);
    const categoryId = catResult.rows[0]?.id;

    const existing = await db.query('SELECT id FROM pois WHERE name = $1', [poi.name]);
    if (existing.rows.length) {
      console.log(`  ~ skipped (exists): ${poi.name}`);
      continue;
    }

    await db.query(`
      INSERT INTO pois (name, description, category_id, location, city, country_code, avg_stop_time_mins)
      VALUES ($1, $2, $3, ST_GeogFromText('SRID=4326;POINT(' || $4 || ' ' || $5 || ')'), $6, 'GH', $7)
    `, [poi.name, poi.description, categoryId, poi.lng, poi.lat, poi.city, poi.avg_stop_time_mins]);

    console.log(`  ✓ ${poi.name}`);
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
