import Image from 'next/image'

interface PublicImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
}

const NEXT_IMAGE_HOSTS = new Set([
  'localhost',
  'pulsetoob-cms.onrender.com',
  'pulsetoob.com',
  'www.pulsetoob.com',
  'res.cloudinary.com',
])

function canUseNextImage(src: string) {
  if (src.startsWith('/')) return true

  try {
    return NEXT_IMAGE_HOSTS.has(new URL(src).hostname)
  } catch {
    return false
  }
}

export default function PublicImage({
  src,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  fill = true,
  width = 1200,
  height = 675,
}: PublicImageProps) {
  if (!canUseNextImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={className}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  )
}
