import React from 'react';

interface FlagProps {
  country: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Flag: React.FC<FlagProps> = ({ country, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-8 h-6'
  };

  const renderFlag = () => {
    switch (country) {
      case 'Malaysia':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#CC0001"/>
            <rect width="28" height="1.43" y="0" fill="#CC0001"/>
            <rect width="28" height="1.43" y="2.86" fill="#FEFEFE"/>
            <rect width="28" height="1.43" y="5.72" fill="#CC0001"/>
            <rect width="28" height="1.43" y="8.58" fill="#FEFEFE"/>
            <rect width="28" height="1.43" y="11.44" fill="#CC0001"/>
            <rect width="28" height="1.43" y="14.3" fill="#FEFEFE"/>
            <rect width="28" height="1.43" y="17.16" fill="#CC0001"/>
            <rect width="28" height="1.43" y="20" fill="#FEFEFE"/>
            <rect width="12" height="12" fill="#010066"/>
            <g fill="#FEFEFE">
              <circle cx="6" cy="6" r="3"/>
              <circle cx="7" cy="6" r="2.5" fill="#010066"/>
              <path d="M6 3.5 L6.5 4.5 L7.5 4.5 L6.8 5.1 L7 6 L6 5.4 L5 6 L5.2 5.1 L4.5 4.5 L5.5 4.5 Z"/>
            </g>
          </svg>
        );

      case 'Singapore':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="10" fill="#ED2939"/>
            <rect width="28" height="10" y="10" fill="#FFFFFF"/>
            <g fill="#FFFFFF">
              <circle cx="7" cy="5" r="2.5"/>
              <circle cx="8.2" cy="5" r="2" fill="#ED2939"/>
              <g fill="#FFFFFF">
                <path d="M4 2.5 L4.2 3 L4.7 3 L4.4 3.3 L4.5 3.8 L4 3.5 L3.5 3.8 L3.6 3.3 L3.3 3 L3.8 3 Z"/>
                <path d="M6 1.5 L6.2 2 L6.7 2 L6.4 2.3 L6.5 2.8 L6 2.5 L5.5 2.8 L5.6 2.3 L5.3 2 L5.8 2 Z"/>
                <path d="M8 2.5 L8.2 3 L8.7 3 L8.4 3.3 L8.5 3.8 L8 3.5 L7.5 3.8 L7.6 3.3 L7.3 3 L7.8 3 Z"/>
                <path d="M10 4 L10.2 4.5 L10.7 4.5 L10.4 4.8 L10.5 5.3 L10 5 L9.5 5.3 L9.6 4.8 L9.3 4.5 L9.8 4.5 Z"/>
                <path d="M8 6.5 L8.2 7 L8.7 7 L8.4 7.3 L8.5 7.8 L8 7.5 L7.5 7.8 L7.6 7.3 L7.3 7 L7.8 7 Z"/>
              </g>
            </g>
          </svg>
        );

      case 'Thailand':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#ED1C24"/>
            <rect width="28" height="16" y="2" fill="#FFFFFF"/>
            <rect width="28" height="12" y="4" fill="#241D4F"/>
            <rect width="28" height="8" y="6" fill="#ED1C24"/>
            <rect width="28" height="4" y="8" fill="#FFFFFF"/>
            <rect width="28" height="2" y="9" fill="#241D4F"/>
          </svg>
        );

      case 'United Arab Emirates':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#FF0000"/>
            <rect width="21" height="6.67" x="7" fill="#00732F"/>
            <rect width="21" height="6.67" x="7" y="6.67" fill="#FFFFFF"/>
            <rect width="21" height="6.67" x="7" y="13.33" fill="#000000"/>
          </svg>
        );

      case 'Vietnam':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#DA020E"/>
            <g fill="#FFFF00">
              <path d="M14 4 L15.5 8.5 L20 8.5 L16.5 11.5 L18 16 L14 13 L10 16 L11.5 11.5 L8 8.5 L12.5 8.5 Z"/>
            </g>
          </svg>
        );

      case 'Philippines':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="10" fill="#0038A8"/>
            <rect width="28" height="10" y="10" fill="#CE1126"/>
            <polygon points="0,0 0,20 14,10" fill="#FFFFFF"/>
            <g fill="#FCD116">
              <circle cx="6" cy="7" r="1.5"/>
              <path d="M6 12 L6.5 13 L7.5 13 L6.8 13.6 L7 14.5 L6 13.9 L5 14.5 L5.2 13.6 L4.5 13 L5.5 13 Z"/>
              <path d="M3 10 L3.3 10.5 L3.8 10.5 L3.5 10.8 L3.6 11.3 L3 11 L2.4 11.3 L2.5 10.8 L2.2 10.5 L2.7 10.5 Z"/>
              <path d="M9 10 L9.3 10.5 L9.8 10.5 L9.5 10.8 L9.6 11.3 L9 11 L8.4 11.3 L8.5 10.8 L8.2 10.5 L8.7 10.5 Z"/>
            </g>
          </svg>
        );

      case 'Saudi Arabia':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#006C35"/>
            <g fill="#FFFFFF">
              <text x="14" y="12" textAnchor="middle" fontSize="6" fontFamily="Arial">المملكة العربية السعودية</text>
              <path d="M8 14 L12 14 L12 15 L10 17 L8 15 Z"/>
            </g>
          </svg>
        );

      case 'Qatar':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#8D1B3D"/>
            <polygon points="0,0 8,0 10,2 8,4 10,6 8,8 10,10 8,12 10,14 8,16 10,18 8,20 0,20" fill="#FFFFFF"/>
          </svg>
        );

      case 'Kuwait':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="6.67" fill="#00A04F"/>
            <rect width="28" height="6.67" y="6.67" fill="#FFFFFF"/>
            <rect width="28" height="6.67" y="13.33" fill="#E4002B"/>
            <polygon points="0,0 0,20 8,13.33 8,6.67" fill="#000000"/>
          </svg>
        );

      case 'Japan':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#FFFFFF"/>
            <circle cx="14" cy="10" r="6" fill="#BC002D"/>
          </svg>
        );

      case 'South Korea':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#FFFFFF"/>
            <circle cx="14" cy="10" r="5" fill="none" stroke="#CD2E3A" strokeWidth="0.5"/>
            <path d="M14 5 A5 5 0 0 1 14 15 A2.5 2.5 0 0 1 14 10 A2.5 2.5 0 0 0 14 5" fill="#CD2E3A"/>
            <path d="M14 5 A5 5 0 0 0 14 15 A2.5 2.5 0 0 0 14 10 A2.5 2.5 0 0 1 14 5" fill="#0047A0"/>
          </svg>
        );

      case 'China':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#EE1C25"/>
            <g fill="#FFFF00">
              <path d="M6 4 L7.5 6.5 L10.5 6.5 L8 8.5 L9 11.5 L6 9.5 L3 11.5 L4 8.5 L1.5 6.5 L4.5 6.5 Z"/>
              <path d="M11 2 L11.3 2.7 L12 2.7 L11.5 3.1 L11.7 3.8 L11 3.4 L10.3 3.8 L10.5 3.1 L10 2.7 L10.7 2.7 Z"/>
              <path d="M13 4 L13.3 4.7 L14 4.7 L13.5 5.1 L13.7 5.8 L13 5.4 L12.3 5.8 L12.5 5.1 L12 4.7 L12.7 4.7 Z"/>
              <path d="M13 7 L13.3 7.7 L14 7.7 L13.5 8.1 L13.7 8.8 L13 8.4 L12.3 8.8 L12.5 8.1 L12 7.7 L12.7 7.7 Z"/>
              <path d="M11 9 L11.3 9.7 L12 9.7 L11.5 10.1 L11.7 10.8 L11 10.4 L10.3 10.8 L10.5 10.1 L10 9.7 L10.7 9.7 Z"/>
            </g>
          </svg>
        );

      case 'Taiwan':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#FE0000"/>
            <rect width="14" height="10" fill="#000095"/>
            <circle cx="7" cy="5" r="3.5" fill="#FFFFFF"/>
            <circle cx="7" cy="5" r="2.5" fill="#000095"/>
            <g fill="#FFFFFF" transform="translate(7,5)">
              <circle r="1"/>
              <g>
                <rect x="-0.2" y="-2.5" width="0.4" height="1" />
                <rect x="-0.2" y="1.5" width="0.4" height="1" />
                <rect x="-2.5" y="-0.2" width="1" height="0.4" />
                <rect x="1.5" y="-0.2" width="1" height="0.4" />
              </g>
            </g>
          </svg>
        );

      case 'Hong Kong':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#DE2910"/>
            <g fill="#FFFFFF">
              <path d="M14 6 L16 8 L18 6 L20 8 L18 10 L20 12 L18 14 L16 12 L14 14 L12 12 L10 14 L8 12 L10 10 L8 8 L10 6 L12 8 Z"/>
              <circle cx="14" cy="10" r="2" fill="#DE2910"/>
            </g>
          </svg>
        );

      case 'United States':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#B22234"/>
            <rect width="28" height="1.54" y="1.54" fill="#FFFFFF"/>
            <rect width="28" height="1.54" y="4.62" fill="#FFFFFF"/>
            <rect width="28" height="1.54" y="7.69" fill="#FFFFFF"/>
            <rect width="28" height="1.54" y="10.77" fill="#FFFFFF"/>
            <rect width="28" height="1.54" y="13.85" fill="#FFFFFF"/>
            <rect width="28" height="1.54" y="16.92" fill="#FFFFFF"/>
            <rect width="11.2" height="10.77" fill="#3C3B6E"/>
            <g fill="#FFFFFF" fontSize="0.8">
              <text x="1.5" y="1.8">★</text><text x="3" y="1.8">★</text><text x="4.5" y="1.8">★</text><text x="6" y="1.8">★</text><text x="7.5" y="1.8">★</text><text x="9" y="1.8">★</text>
              <text x="2.25" y="3">★</text><text x="3.75" y="3">★</text><text x="5.25" y="3">★</text><text x="6.75" y="3">★</text><text x="8.25" y="3">★</text>
              <text x="1.5" y="4.2">★</text><text x="3" y="4.2">★</text><text x="4.5" y="4.2">★</text><text x="6" y="4.2">★</text><text x="7.5" y="4.2">★</text><text x="9" y="4.2">★</text>
              <text x="2.25" y="5.4">★</text><text x="3.75" y="5.4">★</text><text x="5.25" y="5.4">★</text><text x="6.75" y="5.4">★</text><text x="8.25" y="5.4">★</text>
              <text x="1.5" y="6.6">★</text><text x="3" y="6.6">★</text><text x="4.5" y="6.6">★</text><text x="6" y="6.6">★</text><text x="7.5" y="6.6">★</text><text x="9" y="6.6">★</text>
              <text x="2.25" y="7.8">★</text><text x="3.75" y="7.8">★</text><text x="5.25" y="7.8">★</text><text x="6.75" y="7.8">★</text><text x="8.25" y="7.8">★</text>
              <text x="1.5" y="9">★</text><text x="3" y="9">★</text><text x="4.5" y="9">★</text><text x="6" y="9">★</text><text x="7.5" y="9">★</text><text x="9" y="9">★</text>
              <text x="2.25" y="10.2">★</text><text x="3.75" y="10.2">★</text><text x="5.25" y="10.2">★</text><text x="6.75" y="10.2">★</text><text x="8.25" y="10.2">★</text>
              <text x="4.5" y="11.4">★</text><text x="6" y="11.4">★</text>
            </g>
          </svg>
        );

      case 'United Kingdom':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#012169"/>
            <g fill="#FFFFFF">
              <polygon points="0,0 28,20 28,16 4,0"/>
              <polygon points="0,20 28,0 28,4 4,20"/>
              <polygon points="0,4 28,0 0,0"/>
              <polygon points="0,16 28,20 0,20"/>
              <rect width="28" height="3.33" y="8.33"/>
              <rect width="1.87" height="20" x="13.07"/>
            </g>
            <g fill="#C8102E">
              <polygon points="0,0 28,20 28,16 4,0" transform="scale(0.6) translate(5.6,3.3)"/>
              <polygon points="0,20 28,0 28,4 4,20" transform="scale(0.6) translate(5.6,3.3)"/>
              <rect width="28" height="2" y="9"/>
              <rect width="1.33" height="20" x="13.33"/>
            </g>
          </svg>
        );

      case 'Germany':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="6.67" fill="#000000"/>
            <rect width="28" height="6.67" y="6.67" fill="#DD0000"/>
            <rect width="28" height="6.67" y="13.33" fill="#FFCE00"/>
          </svg>
        );

      case 'Netherlands':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="6.67" fill="#AE1C28"/>
            <rect width="28" height="6.67" y="6.67" fill="#FFFFFF"/>
            <rect width="28" height="6.67" y="13.33" fill="#21468B"/>
          </svg>
        );

      case 'Australia':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#012169"/>
            <rect width="14" height="10" fill="#012169"/>
            <g fill="#FFFFFF">
              <rect width="14" height="2" y="4"/>
              <rect width="2" height="10" x="6"/>
              <rect width="8" height="1" x="3" y="2"/>
              <rect width="8" height="1" x="3" y="7"/>
              <rect width="1" height="6" x="2" y="2"/>
              <rect width="1" height="6" x="11" y="2"/>
            </g>
            <g fill="#FFFFFF" transform="translate(20, 14)">
              <path d="M0 0 L1 1 L2 0 L3 1 L2 2 L3 3 L2 4 L1 3 L0 4 L-1 3 L0 2 L-1 1 Z"/>
            </g>
          </svg>
        );

      case 'New Zealand':
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#012169"/>
            <rect width="14" height="10" fill="#012169"/>
            <g fill="#FFFFFF">
              <rect width="14" height="2" y="4"/>
              <rect width="2" height="10" x="6"/>
              <rect width="8" height="1" x="3" y="2"/>
              <rect width="8" height="1" x="3" y="7"/>
              <rect width="1" height="6" x="2" y="2"/>
              <rect width="1" height="6" x="11" y="2"/>
            </g>
            <g fill="#FFFFFF">
              <path d="M18 4 L18.5 5 L19.5 5 L18.8 5.6 L19 6.5 L18 5.9 L17 6.5 L17.2 5.6 L16.5 5 L17.5 5 Z"/>
              <path d="M22 6 L22.3 6.7 L23 6.7 L22.5 7.1 L22.7 7.8 L22 7.4 L21.3 7.8 L21.5 7.1 L21 6.7 L21.7 6.7 Z"/>
              <path d="M22 10 L22.3 10.7 L23 10.7 L22.5 11.1 L22.7 11.8 L22 11.4 L21.3 11.8 L21.5 11.1 L21 10.7 L21.7 10.7 Z"/>
              <path d="M18 12 L18.3 12.7 L19 12.7 L18.5 13.1 L18.7 13.8 L18 13.4 L17.3 13.8 L17.5 13.1 L17 12.7 L17.7 12.7 Z"/>
            </g>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 28 20" className={`${sizeClasses[size]} ${className}`}>
            <rect width="28" height="20" fill="#CCCCCC" stroke="#999999" strokeWidth="1"/>
            <text x="14" y="12" textAnchor="middle" fontSize="8" fill="#666666">?</text>
          </svg>
        );
    }
  };

  return (
    <div className={`inline-flex items-center justify-center overflow-hidden rounded-sm border border-gray-200 ${className}`}>
      {renderFlag()}
    </div>
  );
};

export default Flag;