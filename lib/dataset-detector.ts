export function detectDatasetTypes(columns: string[]) {
  const normalized = columns.map((c) =>
    c.toLowerCase().replace(/\s+/g, "")
  );

  const salesSignals = [
    "invoice",
    "order",
    "date",
    "quantity",
    "price",
    "revenue",
    "sales",
    "amount",
  ];

  const inventorySignals = [
    "stocklevel",
    "inventory",
    "reorder",
    "reorderthreshold",
    "availablestock",
    "warehouse",
    "stock",
  ];

  const customerSignals = [
    "customer",
    "customerid",
    "customername",
    "email",
    "phone",
    "segment",
    "country",
  ];

  const salesScore = normalized.filter((col) =>
    salesSignals.some((signal) => col.includes(signal))
  ).length;

  const inventoryScore = normalized.filter((col) =>
    inventorySignals.some((signal) => col.includes(signal))
  ).length;

  const customerScore = normalized.filter((col) =>
    customerSignals.some((signal) => col.includes(signal))
  ).length;

  const scores = {
    sales: salesScore,
    inventory: inventoryScore,
    customer: customerScore,
  };

  const primaryType = Object.entries(scores).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  return {
    sales: primaryType === "sales",
    inventory: primaryType === "inventory",
    customer: primaryType === "customer",

    salesScore,
    inventoryScore,
    customerScore,

    primaryType,
  };
}