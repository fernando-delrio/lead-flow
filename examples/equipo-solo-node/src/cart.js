const STANDARD_SHIPPING = 4.99

export const calculateSubtotal = (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0)

export const calculateShipping = (items) => {
  if (items.length === 0) return 0
  return STANDARD_SHIPPING
}

export const calculateTotal = (items) =>
  calculateSubtotal(items) + calculateShipping(items)
