import { useEffect } from 'react'

export const PRODUCT_NAME = 'Clearsite'

/** Sets the browser tab title to "<page> · Clearsite" so each tab says where it is. */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · ${PRODUCT_NAME}` : PRODUCT_NAME
  }, [page])
}
