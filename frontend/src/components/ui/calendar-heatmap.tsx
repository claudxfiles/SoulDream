'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HeatmapData {
  date: string;
  value: number;
}

interface CalendarHeatmapProps {
  data: HeatmapData[];
  colorScale?: string[];
}

export function CalendarHeatmap({ 
  data,
  colorScale = [
    '#f1f5f9', // Sin actividad
    '#c7d2fe', // Baja actividad
    '#818cf8', // Media actividad
    '#4f46e5', // Alta actividad
  ]
}: CalendarHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Limpiar SVG existente
    d3.select(svgRef.current).selectAll("*").remove();

    // Configuración
    const cellSize = 10;
    const cellPadding = 2;
    const weekWidth = cellSize + cellPadding;
    const width = weekWidth * 53; // 53 semanas en un año
    const height = weekWidth * 7; // 7 días en una semana

    // Crear escala de colores
    const maxValue = Math.max(...data.map(d => d.value));
    const colorScaleD3 = d3.scaleQuantize<string>()
      .domain([0, maxValue])
      .range(colorScale);

    // Crear SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10);

    // Procesar datos
    const dataMap = new Map(data.map(d => [d.date, d.value]));
    const dates = d3.timeDay.range(
      d3.timeYear.offset(new Date(), -1),
      new Date()
    );

    // Dibujar celdas
    svg.selectAll('rect')
      .data(dates)
      .join('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', (d: Date) => {
        const week = d3.timeWeek.count(d3.timeYear(d), d);
        return week * weekWidth;
      })
      .attr('y', (d: Date) => d.getDay() * weekWidth)
      .attr('fill', (d: Date) => {
        const dateStr = d.toISOString().split('T')[0];
        return colorScaleD3(dataMap.get(dateStr) || 0);
      })
      .append('title')
      .text((d: Date) => {
        const dateStr = d.toISOString().split('T')[0];
        const value = dataMap.get(dateStr) || 0;
        return `${d.toLocaleDateString('es-ES')}: ${value} actividades`;
      });

    // Añadir etiquetas de días
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    svg.selectAll('.weekday-label')
      .data(weekDays)
      .join('text')
      .attr('class', 'weekday-label')
      .attr('x', -5)
      .attr('y', (_: string, i: number) => i * weekWidth + cellSize)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'currentColor')
      .text((d: string) => d);

  }, [data, colorScale]);

  return (
    <div className="overflow-x-auto">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
} 