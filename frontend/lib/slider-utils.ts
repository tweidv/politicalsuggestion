import { SliderConfig } from './api'

export function getSmartSliderConfig(question: { question: string; category?: string; displayFormat?: string; sliderConfig?: SliderConfig }): SliderConfig {
  // If we already have a proper config from Perplexity, use it
  if (question.sliderConfig) {
    return question.sliderConfig
  }

  // Fallback config generation for legacy data
  const questionText = question.question.toLowerCase()
  const category = question.category?.toLowerCase() || ''

  // Year/Date questions
  if (questionText.includes('year') || questionText.includes('date') || questionText.includes('when') || 
      category.includes('timeline') || category.includes('history') || category.includes('year')) {
    return {
      min: 1900,
      max: 2030,
      step: 1,
      unit: '',
      labels: { min: '1900', max: '2030' }
    }
  }

  // Percentage questions
  if (questionText.includes('percent') || questionText.includes('%') || 
      category.includes('percentage') || category.includes('rate')) {
    return {
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      labels: { min: '0%', max: '100%' }
    }
  }

  // Currency/Money questions
  if (questionText.includes('cost') || questionText.includes('price') || questionText.includes('dollar') || 
      questionText.includes('budget') || questionText.includes('salary') || questionText.includes('wage') ||
      category.includes('economics') || category.includes('finance') || category.includes('cost')) {
    if (questionText.includes('million') || questionText.includes('billion')) {
      return {
        min: 0,
        max: 1000,
        step: 1,
        unit: 'B',
        labels: { min: '$0B', max: '$1000B' }
      }
    } else {
      return {
        min: 0,
        max: 100000,
        step: 1000,
        unit: '$',
        labels: { min: '$0', max: '$100K' }
      }
    }
  }

  // Population questions
  if (questionText.includes('population') || questionText.includes('people') || 
      questionText.includes('inhabitants') || category.includes('demographics') || 
      category.includes('population')) {
    if (questionText.includes('billion')) {
      return {
        min: 0,
        max: 10,
        step: 0.1,
        unit: 'B',
        labels: { min: '0B', max: '10B' }
      }
    } else {
      return {
        min: 0,
        max: 10000000,
        step: 100000,
        unit: '',
        labels: { min: '0', max: '10M' }
      }
    }
  }

  // Default fallback
  return {
    min: 0,
    max: 100,
    step: 1,
    unit: '',
    labels: { min: '0', max: '100' }
  }
}

export function formatSliderValue(value: number, config: SliderConfig, displayFormat?: string): string {
  const format = displayFormat || 'count'
  const unit = config.unit || ''
  
  switch (format) {
    case 'percentage':
      return `${value.toFixed(0)}%`
    case 'currency':
      return `$${value.toLocaleString()}${unit}`
    case 'year':
      return Math.round(value).toString()
    case 'population':
      if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`
      } else if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toFixed(0)
    case 'temperature':
      return `${value.toFixed(0)}°${unit}`
    case 'large_number':
      if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`
      } else if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      }
      return value.toLocaleString()
    case 'count':
    default:
      if (unit) {
        return `${Math.round(value)} ${unit}`
      }
      return Math.round(value).toString()
  }
}

export function formatValueForDisplay(
  value: number, 
  question: { question: string; displayFormat?: string; sliderConfig?: SliderConfig }
): string {
  const config = question.sliderConfig || getSmartSliderConfig(question)
  return formatSliderValue(value, config, question.displayFormat)
}