import type { Category } from '@/types/cms'

type CategoryFlag = 'showInNav' | 'showInFooter' | 'showInSidebar'

function byDisplayOrder(a: Category, b: Category) {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0)
  if (orderDiff !== 0) return orderDiff
  return a.name.localeCompare(b.name)
}

export function flattenCategories(categories: Category[] = []): Category[] {
  const flattened: Category[] = []
  const seen = new Set<string>()

  const visit = (items: Category[]) => {
    items.sort(byDisplayOrder).forEach((category) => {
      if (seen.has(category.id)) return
      seen.add(category.id)
      flattened.push(category)
      if (category.subcategories?.length) visit([...category.subcategories])
    })
  }

  visit([...categories])
  return flattened
}

export function getActiveCategories(categories: Category[]) {
  return flattenCategories(categories).filter((category) => category.isActive !== false)
}

export function getCategoryBySlug(categories: Category[], slug: string) {
  return getActiveCategories(categories).find((category) => category.slug === slug)
}

export function getCategoryChildren(categories: Category[], parentId?: string | null) {
  if (!parentId) return []
  return getActiveCategories(categories)
    .filter((category) => category.parentId === parentId)
    .sort(byDisplayOrder)
}

export function getCategoryPath(categories: Category[], category: Category) {
  const all = flattenCategories(categories)
  const path: Category[] = [category]
  let parentId = category.parentId

  while (parentId) {
    const parent = all.find((item) => item.id === parentId)
    if (!parent || path.some((item) => item.id === parent.id)) break
    path.unshift(parent)
    parentId = parent.parentId
  }

  return path
}

export function getCategoriesForFlag(categories: Category[], flag: CategoryFlag) {
  return getActiveCategories(categories)
    .filter((category) => category[flag] === true)
    .sort(byDisplayOrder)
}

export function getNavigationCategories(categories: Category[]) {
  return getCategoriesForFlag(categories, 'showInNav')
}

export function getFooterCategories(categories: Category[]) {
  return getCategoriesForFlag(categories, 'showInFooter')
}

export function getSidebarCategories(categories: Category[]) {
  return getCategoriesForFlag(categories, 'showInSidebar')
}
