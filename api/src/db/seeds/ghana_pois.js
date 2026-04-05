require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const db = require('../index');

const POIS = [
  { name: 'Kwame Nkrumah Memorial Park', lat: 5.5502, lng: -0.2012, city: 'Accra', category: 'landmark', description: 'Mausoleum and museum dedicated to Ghana\'s first president.', avg_stop_time_mins: 60 },
  { name: 'Kakum National Park', lat: 5.3500, lng: -1.3833, city: 'Cape Coast', category: 'wildlife', description: 'Tropical rainforest park famous for its canopy walkway.', avg_stop_time_mins: 180 },
  { name: 'Cape Coast Castle', lat: 5.1037, lng: -1.2424, city: 'Cape Coast', category: 'landmark', description: 'UNESCO World Heritage Site and former slave trade post.', avg_stop_time_mins: 90 },
  { name: 'Elmina Castle', lat: 5.0836, lng: -1.3499, city: 'Elmina', category: 'cultural', description: 'Oldest European building in Sub-Saharan Africa.', avg_stop_time_mins: 90 },
  { name: 'Mole National Park', lat: 9.2611, lng: -1.8544, city: 'Damongo', category: 'wildlife', description: 'Ghana\'s largest wildlife refuge, home to elephants and antelopes.', avg_stop_time_mins: 240 },
  { name: 'Larabanga Mosque', lat: 9.2228, lng: -1.8572, city: 'Larabanga', category: 'religious', description: 'One of the oldest mosques in West Africa (13th century).', avg_stop_time_mins: 45 },
  { name: 'Paga Crocodile Pond', lat: 10.9833, lng: -1.1167, city: 'Paga', category: 'wildlife', description: 'Sacred pond where visitors interact with tame crocodiles.', avg_stop_time_mins: 60 },
  { name: 'Boti Falls', lat: 6.2167, lng: -0.0833, city: 'Koforidua', category: 'scenic', description: 'Twin waterfalls surrounded by lush tropical forest.', avg_stop_time_mins: 120 },
  { name: 'Wli Waterfalls', lat: 7.0833, lng: 0.6167, city: 'Hohoe', category: 'scenic', description: 'Highest waterfall in West Africa at 80m.', avg_stop_time_mins: 150 },
  { name: 'Aburi Botanical Gardens', lat: 5.8500, lng: -0.1833, city: 'Aburi', category: 'scenic', description: 'Historic botanical gardens established in 1890.', avg_stop_time_mins: 90 },
  { name: 'Manhyia Palace Museum', lat: 6.7000, lng: -1.6167, city: 'Kumasi', category: 'cultural', description: 'Seat of the Asante Kingdom and royal museum.', avg_stop_time_mins: 75 },
  { name: 'Kejetia Market', lat: 6.6953, lng: -1.6226, city: 'Kumasi', category: 'shopping', description: 'Largest market in West Africa with over 10,000 stalls.', avg_stop_time_mins: 120 },
  { name: 'Lake Bosomtwe', lat: 6.5000, lng: -1.4167, city: 'Kumasi', category: 'scenic', description: 'Ghana\'s only natural lake, formed by a meteor impact.', avg_stop_time_mins: 180 },
  { name: 'Nzulezo Stilt Village', lat: 4.9500, lng: -2.3000, city: 'Beyin', category: 'cultural', description: 'Unique village built entirely on stilts over a lagoon.', avg_stop_time_mins: 120 },
  { name: 'Volta River Estuary', lat: 5.7833, lng: 0.6333, city: 'Ada', category: 'scenic', description: 'Beautiful estuary where the Volta River meets the Atlantic Ocean.', avg_stop_time_mins: 180 },
];

async function seed() {
  console.log('Seeding Ghana POIs...');

  for (const poi of POIS) {
    const catResult = await db.query('SELECT id FROM categories WHERE slug = $1', [poi.category]);
    const categoryId = catResult.rows[0]?.id;

    await db.query(`
      INSERT INTO pois (name, description, category_id, location, city, country_code, avg_stop_time_mins)
      VALUES ($1, $2, $3, ST_GeogFromText('SRID=4326;POINT(' || $4 || ' ' || $5 || ')'), $6, 'GH', $7)
      ON CONFLICT DO NOTHING
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
