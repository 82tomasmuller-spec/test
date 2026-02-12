export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `OBJ-${year}-${timestamp}${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `FA-${year}-${random}`;
}

export function generateVariableSymbol(): string {
  return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("cs-CZ")} Kč`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  ORDERED: { label: "Objednáno", color: "bg-blue-100 text-blue-800" },
  PAID: { label: "Zaplaceno", color: "bg-green-100 text-green-800" },
  ISSUED: { label: "Vydáno", color: "bg-purple-100 text-purple-800" },
  CANCELLED: { label: "Stornováno", color: "bg-red-100 text-red-800" },
};
