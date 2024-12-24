import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';

interface ColorSelectorProps {
  colors: { name: string; value: string }[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function ColorSelector({ colors, selectedColor, onColorSelect, className }: ColorSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onColorSelect(color.name)}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
            selectedColor === color.name
              ? "border-black"
              : "border-transparent hover:border-gray-300"
          )}
          title={color.name}
          type="button"
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color.value }}
          >
            {selectedColor === color.name && (
              <Check 
                className={cn(
                  "w-4 h-4",
                  // Use white check for dark colors, black for light colors
                  isLightColor(color.value) ? "text-black" : "text-white"
                )} 
              />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness (perceived luminance)
  // Using the formula: (R * 299 + G * 587 + B * 114) / 1000
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if the color is light (brightness > 128)
  return brightness > 128;
}