// lib/dataset-detector.ts
export function detectDatasetTypes(columns: string[]) {
  const normalized = columns.map(c => c.toLowerCase());

  const salesKeywords = [
    "sale",
    "sales",
    "revenue",
    "profit",
    "order",
    "amount"
  ];

  const inventoryKeywords = [
    "stock",
    "inventory",
    "quantity",
    "warehouse",
    "reorder"
  ];

  const customerKeywords = [
    "customer",
    "customerid",
    "customer_name",
    "email",
    "phone",
    "segment"
  ];

  return {
    sales: normalized.some(col =>
      salesKeywords.some(keyword => col.includes(keyword))
    ),

    inventory: normalized.some(col =>
      inventoryKeywords.some(keyword => col.includes(keyword))
    ),

    customer: normalized.some(col =>
      customerKeywords.some(keyword => col.includes(keyword))
    ),
  };
}