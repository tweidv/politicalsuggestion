import { SliderConfig } from './api'

export function getSmartSliderConfig(question: { question: string; category?: string; expectedDataType?: string; sliderConfig?: SliderConfig }): SliderConfig {
  // If we already have a proper config, use it
  if (question.sliderConfig && question.expectedDataType) {
    return question.sliderConfig
  }

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
      category.includes('percentage') || category.includes('rate') || 
      questionText.includes('how many') && questionText.includes('out of')) {
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
    // Determine appropriate range based on context
    if (questionText.includes('million') || questionText.includes('billion')) {
      return {
        min: 0,
        max: 1000,
        step: 1,
        unit: 'B',
        labels: { min: '$0B', max: '$1000B' }
      }
    } else if (questionText.includes('thousand') || questionText.includes('k')) {
      return {
        min: 0,
        max: 1000,
        step: 1,
        unit: 'K',
        labels: { min: '$0K', max: '$1000K' }
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
    } else if (questionText.includes('million')) {
      return {
        min: 0,
        max: 1000,
        step: 1,
        unit: 'M',
        labels: { min: '0M', max: '1000M' }
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

  // Temperature questions
  if (questionText.includes('temperature') || questionText.includes('degrees') || 
      questionText.includes('celsius') || questionText.includes('fahrenheit') ||
      category.includes('weather') || category.includes('temperature')) {
    if (questionText.includes('fahrenheit') || questionText.includes('f')) {
      return {
        min: -40,
        max: 120,
        step: 1,
        unit: '°F',
        labels: { min: '-40°F', max: '120°F' }
      }
    } else {
      return {
        min: -40,
        max: 50,
        step: 1,
        unit: '°C',
        labels: { min: '-40°C', max: '50°C' }
      }
    }
  }

  // Age questions
  if (questionText.includes('age') || questionText.includes('old') || 
      category.includes('age') || category.includes('demographics')) {
    return {
      min: 0,
      max: 120,
      step: 1,
      unit: ' years',
      labels: { min: '0', max: '120' }
    }
  }

  // Speed/Velocity questions
  if (questionText.includes('speed') || questionText.includes('mph') || questionText.includes('km/h') ||
      category.includes('speed') || category.includes('velocity')) {
    if (questionText.includes('mph')) {
      return {
        min: 0,
        max: 200,
        step: 1,
        unit: ' mph',
        labels: { min: '0', max: '200' }
      }
    } else {
      return {
        min: 0,
        max: 320,
        step: 1,
        unit: ' km/h',
        labels: { min: '0', max: '320' }
      }
    }
  }

  // Distance questions
  if (questionText.includes('distance') || questionText.includes('mile') || questionText.includes('kilometer') ||
      category.includes('distance') || category.includes('geography')) {
    if (questionText.includes('mile')) {
      return {
        min: 0,
        max: 10000,
        step: 100,
        unit: ' miles',
        labels: { min: '0', max: '10K' }
      }
    } else {
      return {
        min: 0,
        max: 16000,
        step: 100,
        unit: ' km',
        labels: { min: '0', max: '16K' }
      }
    }
  }

  // Large number questions (millions/billions)
  if (questionText.includes('billion')) {
    return {
      min: 0,
      max: 1000,
      step: 1,
      unit: 'B',
      labels: { min: '0B', max: '1000B' }
    }
  }

  if (questionText.includes('million')) {
    return {
      min: 0,
      max: 1000,
      step: 1,
      unit: 'M',
      labels: { min: '0M', max: '1000M' }
    }
  }

  // Count/quantity questions
  if (questionText.includes('how many') || questionText.includes('number of') || 
      category.includes('count') || category.includes('quantity')) {
    return {
      min: 0,
      max: 1000,
      step: 1,
      unit: '',
      labels: { min: '0', max: '1000' }
    }
  }

  // Default fallback - try to be smarter about it
  return {
    min: 0,
    max: 100,
    step: 1,
    unit: '',
    labels: { min: '0', max: '100' }
  }
}

export function formatSliderValue(value: number, config: SliderConfig, expectedDataType?: string): string {
  const dataType = expectedDataType || 'number'
  
  if (dataType === 'date' || dataType === 'year') {
    return Math.round(value).toString()
  } else if (dataType === 'percentage') {
    return `${value.toFixed(0)}%`
  } else if (dataType === 'currency') {
    return `$${value.toFixed(0)}`
  } else if (dataType === 'temperature') {
    return `${value.toFixed(0)}°${config.unit || 'C'}`
  } else if (dataType === 'population') {
    if (value >= 1000000000) {
      return `${Math.round(value / 1000000000)} B`
    } else if (value >= 1000000) {
      return `${Math.round(value / 1000000)} M`
    } else if (value >= 1000) {
      return `${Math.round(value / 1000)} K`
    }
    return value.toFixed(0)
  }
  
  // Use the config's unit if available
  if (config.unit) {
    return `${Math.round(value)} ${config.unit}`
  }
  
  return Math.round(value).toString()
}
