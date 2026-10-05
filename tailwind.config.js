/* eslint-disable */
const colors = require('tailwindcss/colors')
const {iconsPlugin, getIconCollections} = require('@egoist/tailwindcss-icons')

delete colors.lightBlue
delete colors.warmGray
delete colors.trueGray
delete colors.coolGray
delete colors.blueGray

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ...colors,
        // ============================================================
        // 工作旅途 DS · Design Tokens v1（2026-10-05 前端重设计一期）
        // 品牌主色：暖橙系（承接 TabBar 爱马仕橙 #FF6600）
        // 用法：text-primary-600 / bg-primary-50 / border-primary-200 ...
        // ============================================================
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6600', // 品牌橙（TabBar selectedColor 同源）
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        success: { 50: '#F0FDF4', 500: '#22C55E', 600: '#16A34A', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C' },
        info: { 50: '#EFF6FF', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
      },
      fontSize: {
        // DS 字阶：2xs=11px 用于角标/辅助说明
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        // 在原有基础上增加字体大小
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],     // 13px (原 12px)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],    // 15px (原 14px)
        'base': ['1rem', { lineHeight: '1.5rem' }],         // 16px (原 16px，保持不变)
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],     // 19px (原 18px)
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }],    // 21px (原 20px)
        '2xl': ['1.5625rem', { lineHeight: '2rem' }],       // 25px (原 24px)
        '3xl': ['1.9375rem', { lineHeight: '2.375rem' }],   // 31px (原 30px)
        '4xl': ['2.3125rem', { lineHeight: '2.75rem' }],    // 37px (原 36px)
      }
    }
  },
  plugins: [
    iconsPlugin({
      collections: getIconCollections(['mdi', 'lucide'])
    }),
    function ({ addUtilities }) {
      addUtilities(
        {
          '.border-t-solid': { 'border-top-style': 'solid' },
          '.border-r-solid': { 'border-right-style': 'solid' },
          '.border-b-solid': { 'border-bottom-style': 'solid' },
          '.border-l-solid': { 'border-left-style': 'solid' },
          '.border-t-dashed': { 'border-top-style': 'dashed' },
          '.border-r-dashed': { 'border-right-style': 'dashed' },
          '.border-b-dashed': { 'border-bottom-style': 'dashed' },
          '.border-l-dashed': { 'border-left-style': 'dashed' },
          '.border-t-dotted': { 'border-top-style': 'dotted' },
          '.border-r-dotted': { 'border-right-style': 'dotted' },
          '.border-b-dotted': { 'border-bottom-style': 'dotted' },
          '.border-l-dotted': { 'border-left-style': 'dotted' },
        },
        ['responsive']
      );
    }
  ]
}
