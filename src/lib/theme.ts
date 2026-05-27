import { AppSettings } from '../types';

export function getThemeClasses(color: string) {
  switch (color) {
    case 'blue':
      return {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        hoverBg: 'hover:bg-blue-700',
        lightBg: 'bg-blue-50',
        textOnLight: 'text-blue-800',
        border: 'border-blue-200',
        focusRing: 'focus:ring-blue-500',
        borderAccent: 'border-blue-500',
        fromGradient: 'from-blue-500',
        toGradient: 'to-indigo-600',
      };
    case 'indigo':
      return {
        bg: 'bg-indigo-600',
        text: 'text-indigo-600',
        hoverBg: 'hover:bg-indigo-700',
        lightBg: 'bg-indigo-50',
        textOnLight: 'text-indigo-800',
        border: 'border-indigo-200',
        focusRing: 'focus:ring-indigo-500',
        borderAccent: 'border-indigo-500',
        fromGradient: 'from-indigo-500',
        toGradient: 'to-purple-600',
      };
    case 'orange':
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        hoverBg: 'hover:bg-orange-600',
        lightBg: 'bg-orange-50',
        textOnLight: 'text-orange-850',
        border: 'border-orange-200',
        focusRing: 'focus:ring-orange-500',
        borderAccent: 'border-orange-500',
        fromGradient: 'from-orange-500',
        toGradient: 'to-red-600',
      };
    case 'rose':
      return {
        bg: 'bg-rose-650 bg-rose-600',
        text: 'text-rose-600',
        hoverBg: 'hover:bg-rose-700',
        lightBg: 'bg-rose-50',
        textOnLight: 'text-rose-800',
        border: 'border-rose-200',
        focusRing: 'focus:ring-rose-500',
        borderAccent: 'border-rose-500',
        fromGradient: 'from-rose-500',
        toGradient: 'to-red-600',
      };
    case 'amber':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-600',
        hoverBg: 'hover:bg-amber-600',
        lightBg: 'bg-amber-50',
        textOnLight: 'text-amber-850',
        border: 'border-amber-200',
        focusRing: 'focus:ring-amber-500',
        borderAccent: 'border-amber-500',
        fromGradient: 'from-amber-500',
        toGradient: 'to-orange-500',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-600',
        text: 'text-cyan-600',
        hoverBg: 'hover:bg-cyan-700',
        lightBg: 'bg-cyan-50',
        textOnLight: 'text-cyan-800',
        border: 'border-cyan-200',
        focusRing: 'focus:ring-cyan-500',
        borderAccent: 'border-cyan-500',
        fromGradient: 'from-cyan-500',
        toGradient: 'to-blue-600',
      };
    case 'emerald':
    default:
      return {
        bg: 'bg-emerald-600',
        text: 'text-emerald-600',
        hoverBg: 'hover:bg-emerald-700',
        lightBg: 'bg-emerald-50',
        textOnLight: 'text-emerald-800',
        border: 'border-emerald-200',
        focusRing: 'focus:ring-emerald-500',
        borderAccent: 'border-emerald-500',
        fromGradient: 'from-emerald-500',
        toGradient: 'to-teal-600',
      };
  }
}
