import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

interface CardContentProps {
  className?: string
  children: React.ReactNode
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

const Card = React.memo<CardProps>(({ className, children }) => (
  <div className={cn('card', className)}>
    {children}
  </div>
))

const CardHeader = React.memo<CardHeaderProps>(({ className, children }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
))

const CardContent = React.memo<CardContentProps>(({ className, children }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
))

const CardFooter = React.memo<CardFooterProps>(({ className, children }) => (
  <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}>
    {children}
  </div>
))

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter }