import React, { useState } from 'react';
import { Eye, RotateCcw, Maximize2, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrangementResult, BoxDimensions } from './KalkulatorKontainerNew';

interface ContainerVisualizationProps {
  containerDimensions: {
    length: number;
    width: number;
    height: number;
  };
  boxDimensions: {
    length: number;
    width: number;
    height: number;
  };
  arrangement: {
    lengthCount: number;
    widthCount: number;
    heightCount: number;
  } | null;
  containerType: string;
  unit: string;
  hasValidationErrors?: boolean;
  quantity?: number;
}

type ViewType = 'side' | 'front' | 'top';

export const ContainerVisualization: React.FC<ContainerVisualizationProps> = ({
  containerDimensions,
  boxDimensions,
  arrangement,
  containerType,
  unit,
  hasValidationErrors = false,
  quantity = 1
}) => {
  const [activeView, setActiveView] = useState<ViewType>('side');
  const [showDimensions, setShowDimensions] = useState(true);

  // Convert dimensions for display scaling
  const convertToDisplayUnit = (value: number) => {
    if (unit === 'cm') return value;
    if (unit === 'mm') return value / 10;
    if (unit === 'inches') return value * 2.54;
    return value * 100; // meters to cm
  };

  // Scale factors for SVG rendering
  const scaleX = 400 / Math.max(containerDimensions.length * 100, 300); // Scale to fit 400px width
  const scaleY = 300 / Math.max(containerDimensions.height * 100, 200); // Scale to fit 300px height
  const scaleZ = 300 / Math.max(containerDimensions.width * 100, 200); // Scale to fit depth

  // Box colors based on loading efficiency
  const getBoxColor = () => {
    if (!arrangement) return '#E5E7EB';
    const efficiency = arrangement ? ((arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount) / 
      ((containerDimensions.length / boxDimensions.length) * 
       (containerDimensions.width / boxDimensions.width) * 
       (containerDimensions.height / boxDimensions.height))) * 100 : 0;
    
    if (efficiency >= 85) return '#10B981'; // Green - Excellent
    if (efficiency >= 70) return '#3B82F6'; // Blue - Good  
    if (efficiency >= 50) return '#F59E0B'; // Orange - Fair
    return '#EF4444'; // Red - Poor
  };

  // Side View (Length x Height)
  const renderSideView = () => {
    if (!arrangement || hasValidationErrors) {
      return (
        <div className="flex items-center justify-center w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Masukkan dimensi box untuk melihat visualisasi</p>
          </div>
        </div>
      );
    }

    const containerWidth = containerDimensions.length * scaleX * 100;
    const containerHeight = containerDimensions.height * scaleY * 100;
    const boxWidth = boxDimensions.length * scaleX * 100;
    const boxHeight = boxDimensions.height * scaleY * 100;
    
    return (
      <div className="relative bg-white border rounded-lg p-4 overflow-hidden">
        <svg width="100%" height="300" viewBox={`0 0 ${containerWidth + 40} ${containerHeight + 40}`} className="mx-auto">
          {/* Container outline */}
          <rect
            x={20}
            y={20}
            width={containerWidth}
            height={containerHeight}
            fill="none"
            stroke="#374151"
            strokeWidth={3}
            rx={4}
          />
          
          {/* Container label */}
          <text x={containerWidth/2 + 20} y={15} textAnchor="middle" className="fill-gray-600 text-sm font-medium">
            Side View - {containerType.toUpperCase()}
          </text>
          
          {/* Boxes arranged in grid - Side View (grounded from bottom with boundary check) */}
          {Array.from({ length: Math.min(arrangement.lengthCount, Math.floor(containerWidth / boxWidth)) }).map((_, lengthIndex) =>
            Array.from({ length: Math.min(arrangement.heightCount, Math.floor(containerHeight / boxHeight)) }).map((_, heightIndex) => {
              const boxCount = lengthIndex * arrangement.heightCount + heightIndex + 1;
              const isWithinQuantity = boxCount <= Math.min(arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount, quantity);
              const boxX = 20 + lengthIndex * boxWidth;
              const boxY = 20 + containerHeight - (heightIndex + 1) * boxHeight;
              
              // Only render box if it fits within container bounds
              if (boxX + boxWidth <= 20 + containerWidth && boxY >= 20) {
                return (
                  <rect
                    key={`${lengthIndex}-${heightIndex}`}
                    x={boxX}
                    y={boxY}
                    width={boxWidth - 1}
                    height={boxHeight - 1}
                    fill={isWithinQuantity ? getBoxColor() : '#F3F4F6'}
                    fillOpacity={isWithinQuantity ? 0.8 : 0.3}
                    stroke={isWithinQuantity ? '#1F2937' : '#9CA3AF'}
                    strokeWidth={0.5}
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Dimensions */}
          {showDimensions && (
            <g className="text-xs fill-blue-600">
              {/* Length dimension */}
              <line x1={20} y1={containerHeight + 35} x2={containerWidth + 20} y2={containerHeight + 35} stroke="#2563EB" strokeWidth={1} />
              <text x={containerWidth/2 + 20} y={containerHeight + 50} textAnchor="middle">
                L: {containerDimensions.length.toFixed(2)}m
              </text>
              
              {/* Height dimension */}
              <line x1={10} y1={20} x2={10} y2={containerHeight + 20} stroke="#2563EB" strokeWidth={1} />
              <text x={8} y={containerHeight/2 + 20} textAnchor="middle" transform={`rotate(-90, 8, ${containerHeight/2 + 20})`}>
                H: {containerDimensions.height.toFixed(2)}m
              </text>
            </g>
          )}
        </svg>
        
        {/* Grid info overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="text-gray-700">
            <div>Grid: {arrangement.lengthCount} × {arrangement.heightCount}</div>
            <div>Per Layer: {arrangement.lengthCount * arrangement.heightCount} boxes</div>
          </div>
        </div>
      </div>
    );
  };

  // Front View (Width x Height)
  const renderFrontView = () => {
    if (!arrangement || hasValidationErrors) {
      return (
        <div className="flex items-center justify-center w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Masukkan dimensi box untuk melihat visualisasi</p>
          </div>
        </div>
      );
    }

    const containerWidth = containerDimensions.width * scaleZ * 100;
    const containerHeight = containerDimensions.height * scaleY * 100;
    const boxWidth = boxDimensions.width * scaleZ * 100;
    const boxHeight = boxDimensions.height * scaleY * 100;
    
    return (
      <div className="relative bg-white border rounded-lg p-4 overflow-hidden">
        <svg width="100%" height="300" viewBox={`0 0 ${containerWidth + 40} ${containerHeight + 40}`} className="mx-auto">
          {/* Container outline */}
          <rect
            x={20}
            y={20}
            width={containerWidth}
            height={containerHeight}
            fill="none"
            stroke="#374151"
            strokeWidth={3}
            rx={4}
          />
          
          {/* Container label */}
          <text x={containerWidth/2 + 20} y={15} textAnchor="middle" className="fill-gray-600 text-sm font-medium">
            Front View - {containerType.toUpperCase()}
          </text>
          
          {/* Boxes arranged in grid - Front View (grounded from bottom with boundary check) */}
          {Array.from({ length: Math.min(arrangement.widthCount, Math.floor(containerWidth / boxWidth)) }).map((_, widthIndex) =>
            Array.from({ length: Math.min(arrangement.heightCount, Math.floor(containerHeight / boxHeight)) }).map((_, heightIndex) => {
              const boxCount = widthIndex * arrangement.heightCount + heightIndex + 1;
              const isWithinQuantity = boxCount <= Math.min(arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount, quantity);
              const boxX = 20 + widthIndex * boxWidth;
              const boxY = 20 + containerHeight - (heightIndex + 1) * boxHeight;
              
              // Only render box if it fits within container bounds
              if (boxX + boxWidth <= 20 + containerWidth && boxY >= 20) {
                return (
                  <rect
                    key={`${widthIndex}-${heightIndex}`}
                    x={boxX}
                    y={boxY}
                    width={boxWidth - 1}
                    height={boxHeight - 1}
                    fill={isWithinQuantity ? getBoxColor() : '#F3F4F6'}
                    fillOpacity={isWithinQuantity ? 0.8 : 0.3}
                    stroke={isWithinQuantity ? '#1F2937' : '#9CA3AF'}
                    strokeWidth={0.5}
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Dimensions */}
          {showDimensions && (
            <g className="text-xs fill-blue-600">
              {/* Width dimension */}
              <line x1={20} y1={containerHeight + 35} x2={containerWidth + 20} y2={containerHeight + 35} stroke="#2563EB" strokeWidth={1} />
              <text x={containerWidth/2 + 20} y={containerHeight + 50} textAnchor="middle">
                W: {containerDimensions.width.toFixed(2)}m
              </text>
              
              {/* Height dimension */}
              <line x1={10} y1={20} x2={10} y2={containerHeight + 20} stroke="#2563EB" strokeWidth={1} />
              <text x={8} y={containerHeight/2 + 20} textAnchor="middle" transform={`rotate(-90, 8, ${containerHeight/2 + 20})`}>
                H: {containerDimensions.height.toFixed(2)}m
              </text>
            </g>
          )}
        </svg>
        
        {/* Grid info overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="text-gray-700">
            <div>Grid: {arrangement.widthCount} × {arrangement.heightCount}</div>
            <div>Per Layer: {arrangement.widthCount * arrangement.heightCount} boxes</div>
          </div>
        </div>
      </div>
    );
  };

  // Top View (Length x Width)
  const renderTopView = () => {
    if (!arrangement || hasValidationErrors) {
      return (
        <div className="flex items-center justify-center w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Masukkan dimensi box untuk melihat visualisasi</p>
          </div>
        </div>
      );
    }

    const containerLength = containerDimensions.length * scaleX * 100;
    const containerWidth = containerDimensions.width * scaleZ * 100;
    const boxLength = boxDimensions.length * scaleX * 100;
    const boxWidth = boxDimensions.width * scaleZ * 100;
    
    return (
      <div className="relative bg-white border rounded-lg p-4 overflow-hidden">
        <svg width="100%" height="300" viewBox={`0 0 ${containerLength + 40} ${containerWidth + 40}`} className="mx-auto">
          {/* Container outline */}
          <rect
            x={20}
            y={20}
            width={containerLength}
            height={containerWidth}
            fill="none"
            stroke="#374151"
            strokeWidth={3}
            rx={4}
          />
          
          {/* Container label */}
          <text x={containerLength/2 + 20} y={15} textAnchor="middle" className="fill-gray-600 text-sm font-medium">
            Top View - {containerType.toUpperCase()}
          </text>
          
          {/* Boxes arranged in grid - Top View with boundary check */}
          {Array.from({ length: Math.min(arrangement.lengthCount, Math.floor(containerLength / boxLength)) }).map((_, lengthIndex) =>
            Array.from({ length: Math.min(arrangement.widthCount, Math.floor(containerWidth / boxWidth)) }).map((_, widthIndex) => {
              const boxCount = lengthIndex * arrangement.widthCount + widthIndex + 1;
              const isWithinQuantity = boxCount <= Math.min(arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount, quantity);
              const boxX = 20 + lengthIndex * boxLength;
              const boxY = 20 + widthIndex * boxWidth;
              
              // Only render box if it fits within container bounds
              if (boxX + boxLength <= 20 + containerLength && boxY + boxWidth <= 20 + containerWidth) {
                return (
                  <rect
                    key={`${lengthIndex}-${widthIndex}`}
                    x={boxX}
                    y={boxY}
                    width={boxLength - 1}
                    height={boxWidth - 1}
                    fill={isWithinQuantity ? getBoxColor() : '#F3F4F6'}
                    fillOpacity={isWithinQuantity ? 0.8 : 0.3}
                    stroke={isWithinQuantity ? '#1F2937' : '#9CA3AF'}
                    strokeWidth={0.5}
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Dimensions */}
          {showDimensions && (
            <g className="text-xs fill-blue-600">
              {/* Length dimension */}
              <line x1={20} y1={containerWidth + 35} x2={containerLength + 20} y2={containerWidth + 35} stroke="#2563EB" strokeWidth={1} />
              <text x={containerLength/2 + 20} y={containerWidth + 50} textAnchor="middle">
                L: {containerDimensions.length.toFixed(2)}m
              </text>
              
              {/* Width dimension */}
              <line x1={10} y1={20} x2={10} y2={containerWidth + 20} stroke="#2563EB" strokeWidth={1} />
              <text x={8} y={containerWidth/2 + 20} textAnchor="middle" transform={`rotate(-90, 8, ${containerWidth/2 + 20})`}>
                W: {containerDimensions.width.toFixed(2)}m
              </text>
            </g>
          )}
        </svg>
        
        {/* Grid info overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="text-gray-700">
            <div>Grid: {arrangement.lengthCount} × {arrangement.widthCount}</div>
            <div>Base Layer: {arrangement.lengthCount * arrangement.widthCount} boxes</div>
          </div>
        </div>
      </div>
    );
  };

  const viewButtons = [
    { key: 'side', label: 'Side View', icon: '⬅️' },
    { key: 'front', label: 'Front View', icon: '⬆️' },
    { key: 'top', label: 'Top View', icon: '⬇️' }
  ] as const;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Multi-View Container Visualization</h2>
            <p className="text-sm text-gray-500">Professional technical drawing dengan 3 perspektif</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDimensions(!showDimensions)}
            className="flex items-center space-x-1"
          >
            <Info className="w-4 h-4" />
            <span>{showDimensions ? 'Hide' : 'Show'} Dimensions</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('side')}
            className="flex items-center space-x-1"
            title="Reset to Side View"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
      
      {/* View Selection Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {viewButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as ViewType)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeView === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      
      {/* Active View Content */}
      <div className="relative">
        {activeView === 'side' && renderSideView()}
        {activeView === 'front' && renderFrontView()}
        {activeView === 'top' && renderTopView()}
      </div>
      
      {/* Legend & Summary */}
      {arrangement && !hasValidationErrors && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Loading Pattern</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Length: {arrangement.lengthCount} boxes</div>
              <div>Width: {arrangement.widthCount} boxes</div>
              <div>Height: {arrangement.heightCount} layers</div>
              <div className="font-semibold text-green-700">
                Total: {arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount} boxes
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Color Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Excellent (≥85%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Good (≥70%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Fair (≥50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Poor (&lt;50%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Box Details</h4>
            <div className="text-sm text-purple-800 space-y-1">
              <div>Size: {boxDimensions.length.toFixed(2)} × {boxDimensions.width.toFixed(2)} × {boxDimensions.height.toFixed(2)} m</div>
              <div>Quantity: {quantity} {quantity === 1 ? 'unit' : 'units'}</div>
              <div>Color: <span className="inline-block w-3 h-3 rounded" style={{backgroundColor: getBoxColor()}}></span></div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContainerVisualization;