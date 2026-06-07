/**
 * Universal Recharts styling — import on any page with charts.
 */
import { arcticMuted } from './glassTokens'

export const chartTickStyle = { fill: arcticMuted, fontSize: 11 }

export const chartAxisLineStyle = { stroke: 'rgba(255, 255, 255, 0.12)' }

export const chartGridStroke = 'rgba(255, 255, 255, 0.07)'

export const chartGridProps = {
  strokeDasharray: '4 6',
  stroke: chartGridStroke,
  vertical: false
}

export const chartLegendWrapperStyle = {
  color: arcticMuted,
  fontWeight: 600,
  fontSize: 12,
  paddingTop: 6,
  paddingBottom: 4
}
