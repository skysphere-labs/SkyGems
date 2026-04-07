import React, { useEffect, useRef } from 'react';

interface PipelineConnectionsProps {
  columnCount: number;
  columnHeight: number;
  gapBetweenColumns: number;
  isActive?: boolean;
}

/**
 * SVG component for drawing connecting lines between pipeline columns
 * Creates a visual flow from left to right with curved connections
 */
export const PipelineConnections: React.FC<PipelineConnectionsProps> = ({
  columnCount,
  columnHeight = 200,
  gapBetweenColumns = 40,
  isActive = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate total width needed
  const connectionWidth = gapBetweenColumns * (columnCount - 1);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const strokeDasharray = 8;
    const strokeDashoffset = 0;

    if (isActive && svg) {
      // Animate dashes flowing from left to right
      let currentOffset = 0;
      let animationId: number;

      const animate = () => {
        currentOffset = (currentOffset + 0.5) % (strokeDasharray * 2);
        svg.style.strokeDashoffset = `-${currentOffset}`;
        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => cancelAnimationFrame(animationId);
    }
  }, [isActive]);

  return (
    <svg
      ref={svgRef}
      width={connectionWidth}
      height={columnHeight}
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        strokeDasharray: isActive ? '8, 8' : 'none',
        transition: 'stroke-dashoffset 0.3s linear',
      }}
    >
      {/* Draw connection paths between columns */}
      {Array.from({ length: columnCount - 1 }).map((_, idx) => {
        const startX = idx * gapBetweenColumns + gapBetweenColumns / 2;
        const endX = (idx + 1) * gapBetweenColumns + gapBetweenColumns / 2;
        const midY = columnHeight / 2;

        // Curved path with quadratic bezier
        const pathD = `
          M ${startX} ${midY}
          Q ${(startX + endX) / 2} ${midY - 30},
            ${endX} ${midY}
        `;

        return (
          <g key={idx}>
            {/* Main connection line */}
            <path
              d={pathD}
              stroke={isActive ? '#3B82F6' : '#D1D5DB'}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="transition-colors duration-300"
            />

            {/* Arrow head */}
            <defs>
              <marker
                id={`arrowhead-${idx}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={isActive ? '#3B82F6' : '#D1D5DB'}
                  className="transition-colors duration-300"
                />
              </marker>
            </defs>

            {/* Arrow on path end */}
            <circle
              cx={endX}
              cy={midY}
              r="3.5"
              fill={isActive ? '#3B82F6' : '#E5E7EB'}
              className="transition-all duration-300"
            />
          </g>
        );
      })}
    </svg>
  );
};
