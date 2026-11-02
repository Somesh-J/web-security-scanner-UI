/**
 * Callback ref that focuses an element once, when it mounts. It is a stable module-level function,
 * so React does not call it again on re-renders (an inline arrow would steal focus on every render).
 */
export function focusOnMount(el: HTMLElement | null) {
  el?.focus()
}
