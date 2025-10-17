'use client'

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { SliderConfig } from "@/lib/api"

interface SmartSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  config: SliderConfig & { displayFormat?: string; unit?: string }
  className?: string
}

const SmartSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SmartSliderProps
>(({ className, value, onValueChange, config, ...props }, ref) => {
  const formatValue = (val: number) => {
    const displayFormat = config.displayFormat || 'count'
    const unit = config.unit || ''
    
    switch (displayFormat) {
      case 'percentage':
        return `${val.toFixed(0)}%`
      case 'currency':
        return `$${val.toLocaleString()}${unit}`
      case 'year':
        return Math.round(val).toString()
      case 'population':
        if (val >= 1000000000) {
          return `${(val / 1000000000).toFixed(1)}B`
        } else if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`
        }
        return val.toFixed(0)
      case 'temperature':
        return `${val.toFixed(0)}°${unit}`
      case 'large_number':
        if (val >= 1000000000) {
          return `${(val / 1000000000).toFixed(1)}B`
        } else if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        }
        return val.toLocaleString()
      case 'count':
      default:
        if (unit) {
          return `${Math.round(val)} ${unit}`
        }
        return Math.round(val).toString()
    }
  }

  const currentValue = value[0] || config.min

  return (
    <div className="space-y-2">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={value}
        onValueChange={onValueChange}
        min={config.min}
        max={config.max}
        step={config.step}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{config.labels.min}</span>
        <span className="font-medium">{formatValue(currentValue)}</span>
        <span>{config.labels.max}</span>
      </div>
    </div>
  )
})

SmartSlider.displayName = SliderPrimitive.Root.displayName

export { SmartSlider }
