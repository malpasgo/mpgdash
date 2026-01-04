import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Container3ViewProps {
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
  hasValidationErrors: boolean;
}

const Container3ViewVisualization: React.FC<Container3ViewProps> = ({
  containerDimensions,
  boxDimensions,
  arrangement,
  containerType,
  unit,
  hasValidationErrors
}) => {
  const getContainerColor = (type: string) => {
    switch (type) {
      case '20ft': return '#3B82F6';
      case '40ft': return '#10B981';
      case '40ft-hc': return '#8B5CF6';
      case '45ft-hc': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDimension = (value: number) => {
    return value.toFixed(2);
  };

  // Calculate common visualization properties
  const viewConfig = useMemo(() => {
    const maxViewWidth = 280;
    const maxViewHeight = 200;
    const padding = 40;
    
    return {
      maxViewWidth,
      maxViewHeight,
      padding,
      totalWidth: maxViewWidth + padding * 2,
      totalHeight: maxViewHeight + padding * 2
    };
  }, []);

  // Top View (Length × Width)
  const topView = useMemo(() => {
    if (!containerDimensions) return null;

    const containerAspectRatio = containerDimensions.length / containerDimensions.width;
    let viewWidth, viewHeight;
    
    if (containerAspectRatio > viewConfig.maxViewWidth / viewConfig.maxViewHeight) {
      viewWidth = viewConfig.maxViewWidth;
      viewHeight = viewConfig.maxViewWidth / containerAspectRatio;
    } else {
      viewHeight = viewConfig.maxViewHeight;
      viewWidth = viewConfig.maxViewHeight * containerAspectRatio;
    }

    const scaleX = viewWidth / containerDimensions.length;
    const scaleY = viewHeight / containerDimensions.width;

    const boxes = [];
    if (arrangement && !hasValidationErrors) {
      const boxViewLength = boxDimensions.length * scaleX;
      const boxViewWidth = boxDimensions.width * scaleY;
      
      // Ensure boxes don't exceed container boundaries
      const maxBoxesLength = Math.floor(viewWidth / boxViewLength);
      const maxBoxesWidth = Math.floor(viewHeight / boxViewWidth);
      const actualLengthCount = Math.min(arrangement.lengthCount, maxBoxesLength);
      const actualWidthCount = Math.min(arrangement.widthCount, maxBoxesWidth);
      
      for (let i = 0; i < actualLengthCount; i++) {
        for (let j = 0; j < actualWidthCount; j++) {
          const boxX = viewConfig.padding + (i * boxViewLength);
          const boxY = viewConfig.padding + (j * boxViewWidth);
          
          // Only add box if it fits within container bounds
          if (boxX + boxViewLength <= viewConfig.padding + viewWidth && 
              boxY + boxViewWidth <= viewConfig.padding + viewHeight) {
            boxes.push({
              id: `top-${i}-${j}`,
              x: boxX,
              y: boxY,
              width: boxViewLength,
              height: boxViewWidth,
              color: `hsl(${210 + (i + j) % 3 * 15}, 70%, ${60 + (i + j) % 2 * 8}%)`
            });
          }
        }
      }
    }

    return {
      viewWidth,
      viewHeight,
      scaleX,
      scaleY,
      boxes,
      dimensions: { primary: containerDimensions.length, secondary: containerDimensions.width }
    };
  }, [containerDimensions, boxDimensions, arrangement, hasValidationErrors, viewConfig]);

  // Front View (Width × Height)
  const frontView = useMemo(() => {
    if (!containerDimensions) return null;

    const containerAspectRatio = containerDimensions.width / containerDimensions.height;
    let viewWidth, viewHeight;
    
    if (containerAspectRatio > viewConfig.maxViewWidth / viewConfig.maxViewHeight) {
      viewWidth = viewConfig.maxViewWidth;
      viewHeight = viewConfig.maxViewWidth / containerAspectRatio;
    } else {
      viewHeight = viewConfig.maxViewHeight;
      viewWidth = viewConfig.maxViewHeight * containerAspectRatio;
    }

    const scaleX = viewWidth / containerDimensions.width;
    const scaleY = viewHeight / containerDimensions.height;

    const boxes = [];
    if (arrangement && !hasValidationErrors) {
      const boxViewWidth = boxDimensions.width * scaleX;
      const boxViewHeight = boxDimensions.height * scaleY;
      
      // Ensure boxes don't exceed container boundaries
      const maxBoxesWidth = Math.floor(viewWidth / boxViewWidth);
      const maxBoxesHeight = Math.floor(viewHeight / boxViewHeight);
      const actualWidthCount = Math.min(arrangement.widthCount, maxBoxesWidth);
      const actualHeightCount = Math.min(arrangement.heightCount, maxBoxesHeight);
      
      for (let j = 0; j < actualWidthCount; j++) {
        for (let k = 0; k < actualHeightCount; k++) {
          const boxX = viewConfig.padding + (j * boxViewWidth);
          const boxY = viewConfig.padding + (viewHeight - (k + 1) * boxViewHeight);
          
          // Only add box if it fits within container bounds
          if (boxX + boxViewWidth <= viewConfig.padding + viewWidth && 
              boxY >= viewConfig.padding && 
              boxY + boxViewHeight <= viewConfig.padding + viewHeight) {
            boxes.push({
              id: `front-${j}-${k}`,
              x: boxX,
              y: boxY,
              width: boxViewWidth,
              height: boxViewHeight,
              color: `hsl(${210 + (j + k) % 3 * 15}, 70%, ${60 + (j + k) % 2 * 8}%)`
            });
          }
        }
      }
    }

    return {
      viewWidth,
      viewHeight,
      scaleX,
      scaleY,
      boxes,
      dimensions: { primary: containerDimensions.width, secondary: containerDimensions.height }
    };
  }, [containerDimensions, boxDimensions, arrangement, hasValidationErrors, viewConfig]);

  // Side View (Length × Height)
  const sideView = useMemo(() => {
    if (!containerDimensions) return null;

    const containerAspectRatio = containerDimensions.length / containerDimensions.height;
    let viewWidth, viewHeight;
    
    if (containerAspectRatio > viewConfig.maxViewWidth / viewConfig.maxViewHeight) {
      viewWidth = viewConfig.maxViewWidth;
      viewHeight = viewConfig.maxViewWidth / containerAspectRatio;
    } else {
      viewHeight = viewConfig.maxViewHeight;
      viewWidth = viewConfig.maxViewHeight * containerAspectRatio;
    }

    const scaleX = viewWidth / containerDimensions.length;
    const scaleY = viewHeight / containerDimensions.height;

    const boxes = [];
    if (arrangement && !hasValidationErrors) {
      const boxViewLength = boxDimensions.length * scaleX;
      const boxViewHeight = boxDimensions.height * scaleY;
      
      // Ensure boxes don't exceed container boundaries
      const maxBoxesLength = Math.floor(viewWidth / boxViewLength);
      const maxBoxesHeight = Math.floor(viewHeight / boxViewHeight);
      const actualLengthCount = Math.min(arrangement.lengthCount, maxBoxesLength);
      const actualHeightCount = Math.min(arrangement.heightCount, maxBoxesHeight);
      
      for (let i = 0; i < actualLengthCount; i++) {
        for (let k = 0; k < actualHeightCount; k++) {
          const boxX = viewConfig.padding + (i * boxViewLength);
          const boxY = viewConfig.padding + (viewHeight - (k + 1) * boxViewHeight);
          
          // Only add box if it fits within container bounds
          if (boxX + boxViewLength <= viewConfig.padding + viewWidth && 
              boxY >= viewConfig.padding && 
              boxY + boxViewHeight <= viewConfig.padding + viewHeight) {
            boxes.push({
              id: `side-${i}-${k}`,
              x: boxX,
              y: boxY,
              width: boxViewLength,
              height: boxViewHeight,
              color: `hsl(${210 + (i + k) % 3 * 15}, 70%, ${60 + (i + k) % 2 * 8}%)`
            });
          }
        }
      }
    }

    return {
      viewWidth,
      viewHeight,
      scaleX,
      scaleY,
      boxes,
      dimensions: { primary: containerDimensions.length, secondary: containerDimensions.height }
    };
  }, [containerDimensions, boxDimensions, arrangement, hasValidationErrors, viewConfig]);

  const getStatusMessage = () => {
    if (hasValidationErrors) {
      return {
        title: "Input Validation Required",
        message: "Please correct the highlighted errors above",
        color: "text-red-600"
      };
    }
    if (!arrangement) {
      return {
        title: "Enter Box Dimensions",
        message: "Fill in box dimensions to see optimal arrangement",
        color: "text-gray-500"
      };
    }
    if (arrangement && (arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount) === 0) {
      return {
        title: "Box Too Large",
        message: "Box dimensions exceed container capacity",
        color: "text-orange-600"
      };
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  // Single View Component
  const SingleView: React.FC<{
    title: string;
    view: any;
    primaryLabel: string;
    secondaryLabel: string;
    primaryDim: number;
    secondaryDim: number;
  }> = ({ title, view, primaryLabel, secondaryLabel, primaryDim, secondaryDim }) => {
    if (!view) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
          <div className="text-xs text-gray-500">
            {formatDimension(primaryDim)}m × {formatDimension(secondaryDim)}m
          </div>
        </div>
        
        <div className="flex justify-center">
          <svg 
            width={viewConfig.totalWidth} 
            height={viewConfig.totalHeight}
            className="border border-gray-100 rounded"
          >
            {/* Grid background */}
            <defs>
              <pattern 
                id={`grid-${title.toLowerCase().replace(' ', '-')}`}
                width="15" 
                height="15" 
                patternUnits="userSpaceOnUse"
              >
                <path 
                  d="M 15 0 L 0 0 0 15" 
                  fill="none" 
                  stroke="#f9fafb" 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            
            {/* Grid background */}
            <rect 
              x={viewConfig.padding}
              y={viewConfig.padding}
              width={view.viewWidth}
              height={view.viewHeight}
              fill={`url(#grid-${title.toLowerCase().replace(' ', '-')})`}
            />
            
            {/* Container outline */}
            <rect
              x={viewConfig.padding}
              y={viewConfig.padding}
              width={view.viewWidth}
              height={view.viewHeight}
              fill="none"
              stroke={getContainerColor(containerType)}
              strokeWidth="2"
              rx="2"
            />
            
            {/* Boxes */}
            {view.boxes.map((box: any, index: number) => (
              <rect
                key={box.id}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill={box.color}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.5"
                rx="1"
                opacity="0.8"
              />
            ))}
            
            {/* Status message overlay */}
            {statusMessage && (
              <text
                x={viewConfig.padding + view.viewWidth / 2}
                y={viewConfig.padding + view.viewHeight / 2}
                textAnchor="middle"
                fontSize="10"
                fill="#9CA3AF"
                fontWeight="500"
              >
                {statusMessage.title === "Enter Box Dimensions" ? "Ready" :
                 statusMessage.title === "Input Validation Required" ? "Fix errors" :
                 "Too large"}
              </text>
            )}
            
            {/* Dimension labels */}
            <text
              x={viewConfig.padding + view.viewWidth / 2}
              y={viewConfig.padding + view.viewHeight + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
              fontWeight="500"
            >
              {primaryLabel}: {formatDimension(primaryDim)}m
            </text>
            
            <text
              x={viewConfig.padding - 25}
              y={viewConfig.padding + view.viewHeight / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
              fontWeight="500"
              transform={`rotate(-90, ${viewConfig.padding - 25}, ${viewConfig.padding + view.viewHeight / 2})`}
            >
              {secondaryLabel}: {formatDimension(secondaryDim)}m
            </text>
          </svg>
        </div>
      </div>
    );
  };

  if (!topView || !frontView || !sideView) {
    return (
      <div className="w-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">3-View Technical Drawing</p>
          <p className="text-gray-400 text-xs mt-1">Loading visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full bg-white rounded-lg border border-gray-200 p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">
            {statusMessage ? statusMessage.title : "3-View Technical Drawing"}
          </h4>
          {arrangement && (
            <div className="text-xs text-gray-500">
              {arrangement.lengthCount} × {arrangement.widthCount} × {arrangement.heightCount} arrangement
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {statusMessage ? (
            <span className={statusMessage.color}>{statusMessage.message}</span>
          ) : (
            <>
              Container: {formatDimension(containerDimensions.length)}L × {formatDimension(containerDimensions.width)}W × {formatDimension(containerDimensions.height)}H | 
              Box: {boxDimensions.length} × {boxDimensions.width} × {boxDimensions.height} {unit}
            </>
          )}
        </div>
      </div>

      {/* 3-View Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Top View */}
        <SingleView
          title="Top View"
          view={topView}
          primaryLabel="Length"
          secondaryLabel="Width"
          primaryDim={containerDimensions.length}
          secondaryDim={containerDimensions.width}
        />
        
        {/* Front View */}
        <SingleView
          title="Front View"
          view={frontView}
          primaryLabel="Width"
          secondaryLabel="Height"
          primaryDim={containerDimensions.width}
          secondaryDim={containerDimensions.height}
        />
        
        {/* Side View */}
        <SingleView
          title="Side View"
          view={sideView}
          primaryLabel="Length"
          secondaryLabel="Height"
          primaryDim={containerDimensions.length}
          secondaryDim={containerDimensions.height}
        />
      </div>
      
      {/* Container Info */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="font-semibold text-gray-700">Container Type</div>
            <div className="text-sm font-bold" style={{ color: getContainerColor(containerType) }}>
              {containerType === 'custom' ? 'Custom' : 
               containerType === '20ft' ? '20ft Standard' :
               containerType === '40ft' ? '40ft Standard' :
               containerType === '40ft-hc' ? '40ft High Cube' :
               containerType === '45ft-hc' ? '45ft High Cube' : containerType}
            </div>
          </div>
          
          {arrangement && !hasValidationErrors && (
            <>
              <div>
                <div className="font-semibold text-gray-700">Total Boxes</div>
                <div className="text-lg font-bold text-blue-600">
                  {arrangement.lengthCount * arrangement.widthCount * arrangement.heightCount}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Layers High</div>
                <div className="text-lg font-bold text-green-600">
                  {arrangement.heightCount}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Pattern</div>
                <div className="text-sm font-bold text-purple-600">
                  {arrangement.lengthCount}×{arrangement.widthCount}×{arrangement.heightCount}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Container3ViewVisualization;