'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

interface ItemCardProps {
  id: string
  title: string
  subtitle: string
  metadata?: string
  secondaryMetadata?: string
  icon: string
  iconColor: string
  iconBg?: string
  href?: string
  onClick?: (id: string, e: React.MouseEvent) => void
  onEdit?: (id: string, e: React.MouseEvent) => void
  onDelete?: (id: string, e: React.MouseEvent) => void
  canDelete?: boolean
  canEdit?: boolean
  badge?: string
}

export function ItemCard({
  id,
  title,
  subtitle,
  metadata,
  secondaryMetadata,
  icon,
  iconColor,
  iconBg,
  href = '',
  onClick,
  onEdit,
  onDelete,
  canDelete = true,
  canEdit = true,
  badge,
}: ItemCardProps) {
  const showActions = canEdit || canDelete
  const isLiveBadge = badge?.toUpperCase() === 'LIVE'
  const handleEdit = (e: React.MouseEvent) => {
    if (onClick) onClick(id, e)
  }
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(id, e)
  }
  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) onDelete(id, e)
  }

  const content = (
    <>
      <div
        className='w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0'
        style={{ backgroundColor: iconBg || iconColor + '20' }}
      >
        <Icon name={icon} size={18} color={iconColor} />
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-[14px] font-bold text-white mb-0.5 flex items-center gap-2 min-w-0'>
          {title}
          {badge && (
            <span
              className={
                isLiveBadge
                  ? 'px-2 py-0.5 bg-red-500/10 border border-red-500/40 rounded text-[10px] text-red-400 font-semibold inline-flex items-center gap-1.5'
                  : 'px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-400 font-semibold'
              }
            >
              {isLiveBadge && (
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse' />
              )}
              {badge}
            </span>
          )}
        </div>
        <div className='text-[12px] text-gray-400 truncate'>{subtitle}</div>
        {(metadata || secondaryMetadata) && (
          <div className='sm:hidden mt-1 flex items-center gap-2'>
            {metadata && (
              <div
                className='text-[12px] font-semibold'
                style={{ color: iconColor }}
              >
                {metadata}
              </div>
            )}
            {secondaryMetadata && (
              <div className='text-[11px] text-gray-500 truncate'>
                {secondaryMetadata}
              </div>
            )}
          </div>
        )}
      </div>
      {(metadata || secondaryMetadata) && (
        <div className='text-right hidden sm:block'>
          {metadata && (
            <div
              className='text-[12px] font-semibold'
              style={{ color: iconColor }}
            >
              {metadata}
            </div>
          )}
          {secondaryMetadata && (
            <div className='text-[11px] text-gray-600'>{secondaryMetadata}</div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div
      className='flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 bg-[#131520] border border-white/5 rounded-2xl mb-2.5 hover:border-blue-500/30 transition-colors cursor-pointer'
      onClick={handleClick}
    >
      {href ? (
        <Link
          href={href}
          className='flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0'
          onClick={handleEdit}
        >
          {content}
        </Link>
      ) : (
        <div className='flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0'>
          {content}
        </div>
      )}
      {showActions && (
        <div className='flex gap-1 sm:gap-1.5 flex-shrink-0'>
          {canEdit && (
            <button
              onClick={handleEdit}
              className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition-colors'
            >
              <Icon name='edit' size={14} color='#3B82F6' />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors'
            >
              <Icon name='trash-2' size={14} color='#EF4444' />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
