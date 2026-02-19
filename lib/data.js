// data.js
export const categories = [
  { id: "groceries", name: "Groceries" },
  { id: "phones", name: "Phones" },
  { id: "currencies", name: "Currencies" },
  { id: "fuels", name: "Fuels" },
];

export const items = [
  // Groceries
  {
    id: 1,
    name: "Rice (1kg)",
    price: 1.2,
    change: 0.02,
    category: "groceries",
    image: "/products/rice.svg",
  },
  {
    id: 2,
    name: "Beans (1kg)",
    price: 1.8,
    change: -0.05,
    category: "groceries",
    image: "/products/beans.svg",
  },
  {
    id: 3,
    name: "Sugar (1kg)",
    price: 0.95,
    change: 0.01,
    category: "groceries",
    image: "/products/sugar.svg",
  },
  // Phones (used)
  {
    id: 4,
    name: "iPhone 16 Pro Max (Used)",
    price: 899,
    change: -10,
    category: "phones",
    image: "/products/iphone-16-pro-max.svg",
  },
  {
    id: 5,
    name: "iPhone 15 Pro (Used)",
    price: 699,
    change: -5,
    category: "phones",
    image: "/products/iphone-15-pro.svg",
  },
  // Currencies (against AFN)
  {
    id: 6,
    name: "USD/AFN",
    price: 86.5,
    change: 0.3,
    category: "currencies",
    image: "/products/usd-afn.svg",
  },
  {
    id: 7,
    name: "EUR/AFN",
    price: 93.2,
    change: -0.1,
    category: "currencies",
    image: "/products/eur-afn.svg",
  },
  // Fuels
  {
    id: 8,
    name: "Petrol (per liter)",
    price: 0.85,
    change: 0.0,
    category: "fuels",
    image: "/products/petrol.svg",
  },
  {
    id: 9,
    name: "Liquid Gas (per kg)",
    price: 1.1,
    change: 0.05,
    category: "fuels",
    image: "/products/liquid-gas.svg",
  },
];
