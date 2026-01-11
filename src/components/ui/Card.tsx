import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

interface CardTitleProps {
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

const Card = React.memo<CardProps>(({ className, children, onClick }) => (
  <div className={cn('card', className)} onClick={onClick}>
    {children}
  </div>
))

const CardHeader = React.memo<CardHeaderProps>(({ className, children }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
))

const CardTitle = React.memo<CardTitleProps>(({ className, children }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
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
CardTitle.displayName = 'CardTitle'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardFooter }