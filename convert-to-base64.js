import { readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function convertToBase64(filePath) {
    try {
        const fullPath = join(__dirname, filePath);
        const imageBuffer = readFileSync(fullPath);
        const base64String = imageBuffer.toString('base64');
        const extension = extname(filePath).toLowerCase().substring(1);
        return `data:image/${extension};base64,${base64String}`;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return null;
    }
}

const slides = [
    {
        path: 'uploads/images/Banner 1.jpg',
        title: "Summer Collection 2024",
        description: "Discover the latest trends in fashion and explore our new collection.",
        buttonText: "Shop Now",
    },
    {
        path: 'uploads/images/Banner 2.jpg',
        title: "Spring Essentials",
        description: "Refresh your wardrobe with our curated selection of spring must-haves.",
        buttonText: "Explore More",
    }
];

const updatedSlides = slides.map(slide => {
    const base64 = convertToBase64(slide.path);
    return {
        ...slide,
        image: base64,
    };
});

const output = `// This file is auto-generated. Do not edit manually.
export const slides = ${JSON.stringify(updatedSlides, null, 2)};
`;

writeFileSync(join(__dirname, 'src', 'data', 'slides.ts'), output);
console.log('Slides data has been generated successfully!');
