const clean = (value: unknown): string => String(value || '').trim()

export interface ProductLike {
  productId?: string;
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  variants?: unknown[];
  [key: string]: unknown;
}

export interface ProductFamily {
  identity: string;
  productId?: string;
  productIds: string[];
  name?: string;
  parentSku: string;
  legacyFlatFamily: boolean;
}

function legacyParentSku(product: ProductLike): string {
  if (!clean(product.size) || !clean(product.color) || product.variants?.length) return ''
  const parts = clean(product.sku).toUpperCase().split('-').filter(Boolean)
  return parts.length >= 3 ? parts.slice(0, -2).join('-') : ''
}

/** Builds selector entries without merging or mutating the underlying products. */
export function buildProductFamilies(products: ProductLike[] = []): ProductFamily[] {
  const uniqueProducts = [...new Map(products.filter((product) => product?.productId).map((product) => [product.productId!, product])).values()]
  const families = new Map<string, ProductFamily>()
  for (const product of uniqueProducts) {
    const inferredParentSku = legacyParentSku(product)
    const identity = inferredParentSku
      ? `legacy:${clean(product.name).toLocaleLowerCase('en-US')}:${clean(product.category).toLocaleLowerCase('en-US')}:${clean(product.brand).toLocaleLowerCase('en-US')}:${inferredParentSku}`
      : `product:${product.productId}`
    const family = families.get(identity)
    if (family) {
      if (product.productId) family.productIds.push(product.productId)
    } else {
      families.set(identity, {
        identity,
        productId: product.productId,
        productIds: product.productId ? [product.productId] : [],
        name: product.name,
        parentSku: inferredParentSku || product.sku || '',
        legacyFlatFamily: Boolean(inferredParentSku),
      })
    }
  }
  return [...families.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)) || String(a.parentSku).localeCompare(String(b.parentSku)))
}
