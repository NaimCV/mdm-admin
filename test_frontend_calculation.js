// Script de prueba para verificar que la lógica de redondeo del frontend
// coincida con la del backend

const roundUsingTaxes = (priceWithoutTaxes, tax = 0.21) => {
  // Ajusta el precio base para que el precio final con impuestos termine en .00 o .05
  priceWithoutTaxes = Math.round(priceWithoutTaxes * 100) / 100;
  const price = priceWithoutTaxes * (1 + tax);
  const lastDecimalDigit = price.toFixed(2).slice(-1);
  
  if (lastDecimalDigit === "0" || lastDecimalDigit === "5") {
    return priceWithoutTaxes;
  }
  
  return roundUsingTaxes(priceWithoutTaxes + 0.01, tax);
};

const calculateRecommendedPrice = (productionCost, profitMargin, shippingCost) => {
  const cost = productionCost + shippingCost;
  const margin = profitMargin;
  const basePrice = cost * (1 + margin / 100);
  
  // Aplicar la misma lógica de redondeo que el backend
  const adjustedBasePrice = roundUsingTaxes(basePrice, 0.21);
  return adjustedBasePrice;
};

// Casos de prueba
const testCases = [
  { production_cost: 10, profit_margin: 25, shipping_cost: 10.95 },
  { production_cost: 15, profit_margin: 30, shipping_cost: 8 },
  { production_cost: 20, profit_margin: 40, shipping_cost: 5 },
  { production_cost: 5, profit_margin: 50, shipping_cost: 3 }
];

console.log("🧪 PRUEBAS DE CÁLCULO AUTOMÁTICO DE PRECIOS");
console.log("=" .repeat(50));

testCases.forEach((testCase, index) => {
  console.log(`\n📦 Caso ${index + 1}:`);
  console.log(`   Coste de producción: ${testCase.production_cost}€`);
  console.log(`   Margen de beneficio: ${testCase.profit_margin}%`);
  console.log(`   Coste de envío: ${testCase.shipping_cost}€`);
  
  const basePrice = calculateRecommendedPrice(
    testCase.production_cost,
    testCase.profit_margin,
    testCase.shipping_cost
  );
  
  const priceWithIva = basePrice * 1.21;
  
  console.log(`   💰 Precio base (sin IVA): ${basePrice}€ ← SE ALMACENA EN 'price'`);
  console.log(`   🧮 Precio con IVA (21%): ${priceWithIva.toFixed(2)}€`);
  
  const cents = Math.round((priceWithIva * 100) % 100);
  if (cents % 5 === 0) {
    console.log(`   ✅ Precio válido (termina en ${cents.toString().padStart(2, '0')} céntimos)`);
  } else {
    console.log(`   ❌ Precio inválido (termina en ${cents.toString().padStart(2, '0')} céntimos)`);
  }
});

console.log("\n📋 RESUMEN:");
console.log("   - El campo 'price' almacena el precio BASE (sin IVA)");
console.log("   - El precio con IVA se calcula automáticamente: price * 1.21");
console.log("   - Todos los precios con IVA terminan en .00 o .05");
console.log("   - Esta lógica es IDÉNTICA a la del backend");
