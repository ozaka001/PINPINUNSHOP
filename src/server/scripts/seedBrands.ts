import { v4 as uuidv4 } from 'uuid';
import { ensureInitialized } from '../database/db.js';

const sampleBrands = [
  {
    name: 'Nike',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Nike_Logo.svg/1200px-Nike_Logo.svg.png',
    description: 'Just Do It'
  },
  {
    name: 'Adidas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png',
    description: 'Impossible is Nothing'
  },
  {
    name: 'Puma',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_Logo.svg/2560px-Puma_Logo.svg.png',
    description: 'Forever Faster'
  },
  {
    name: 'Under Armour',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Under_Armour_logo.svg/2560px-Under_Armour_logo.svg.png',
    description: 'I Will'
  }
];

async function seedBrands() {
  try {
    const realm = await ensureInitialized();
    
    realm.write(() => {
      sampleBrands.forEach(brand => {
        realm.create('Brand', {
          id: uuidv4(),
          name: brand.name,
          slug: brand.name.toLowerCase().replace(/\s+/g, '-'),
          logo: brand.logo,
          description: brand.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    });

    console.log('Brands seeded successfully!');
  } catch (error) {
    console.error('Error seeding brands:', error);
  }
}

seedBrands();
