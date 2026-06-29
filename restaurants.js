// Restaurant copycat recipes — Long Island local-spots section.
//
// These entries used to live ONLY inline in index.html as a const RESTAURANTS
// array. The Long Island modal shows each restaurant's signature dish as a
// full copycat recipe (ingredients + steps), but the grocery integration
// (/api/store, /api/grocery) had no way to look them up — so the Walmart
// cart-load button was absent from the restaurant modal entirely.
//
// Exporting the same data here makes restaurant entries first-class recipes
// for the backend. Looked up via ?restaurant=<slug>; slug derives from
// "<name> <dishTitle>" so the URL stays human-readable and stable.
//
// Keep this file in lock-step with the RESTAURANTS array in index.html (same
// names, same dishTitles, same ingredients). If you add a restaurant card to
// the homepage, add it here too — otherwise the grocery button on that card
// will 404.

export const RESTAURANTS = [
  { name: "Robke's", town: "Northport", cat: "Italian-American", dishTitle: "Pork Chop Martini",
    ing: [
      "2 thin-cut pork chops, pounded thin",
      "1 cup breadcrumbs + 1/2 cup grated Parmesan",
      "2 eggs, beaten",
      "Flour for dredging",
      "2 cups arugula",
      "Chopped cherry peppers + a splash of their vinegar",
      "Olive oil, lemon, salt"
    ]
  },
  { name: "Luca", town: "Stony Brook", cat: "Italian", dishTitle: "Penne alla Vodka",
    ing: [
      "1 lb penne (fresh if you can)",
      "1/4 cup tomato paste",
      "1 onion, minced",
      "3 cloves garlic",
      "1/4 cup vodka",
      "3/4 cup heavy cream",
      "Parmesan, basil, chili flakes",
      "Olive oil"
    ]
  },
  { name: "Ixchel Mexican Cuisine", town: "East Setauket", cat: "Mexican", dishTitle: "Birria Tacos",
    ing: [
      "2 lb chuck roast",
      "3 dried guajillo + 2 ancho chiles",
      "2 tomatoes, 1 onion, 4 garlic cloves",
      "Cumin, oregano, bay, a small cinnamon stick",
      "2 cups beef broth",
      "Corn tortillas",
      "Oaxaca or Jack cheese, cilantro, onion, lime"
    ]
  },
  { name: "Elaine's", town: "East Setauket", cat: "Italian", dishTitle: "Linguine Carbonara",
    ing: [
      "1 lb linguine",
      "4 oz guanciale or pancetta, diced",
      "3 egg yolks + 1 whole egg",
      "3/4 cup grated Pecorino Romano",
      "Lots of black pepper",
      "Salt"
    ]
  },
  { name: "Maria's", town: "Nesconset", cat: "Mexican & Latin", dishTitle: "Tampiqueña al Mar",
    ing: [
      "1 lb skirt steak",
      "1/2 lb shrimp",
      "1/2 lb sea scallops",
      "1/4 lb calamari",
      "2 chipotles in adobo",
      "1/2 cup cream",
      "1 onion, 2 garlic cloves",
      "Lime, cilantro, salt"
    ]
  },
  { name: "Peter Luger Steak House", town: "Great Neck", cat: "Steakhouse", dishTitle: "Dry-Aged Porterhouse",
    ing: [
      "1 porterhouse, 1.5–2 in thick",
      "Kosher salt & coarse pepper",
      "2 tbsp butter, melted",
      "Sauce: ketchup, Worcestershire, prepared horseradish, brown sugar, splash of vinegar"
    ]
  },
  { name: "Bigelow's New England Fried Clams", town: "Rockville Centre", cat: "Seafood", dishTitle: "New England Fried Clams",
    ing: [
      "1 lb shucked whole clams",
      "1 cup buttermilk",
      "1 cup corn flour (fine cornmeal)",
      "1/2 cup flour",
      "Salt, pepper, paprika",
      "Neutral oil for frying",
      "Lemon & tartar sauce"
    ]
  },
  { name: "Zorn's of Bethpage", town: "Bethpage", cat: "Comfort", dishTitle: "Buttermilk Fried Chicken",
    ing: [
      "8 pieces chicken",
      "2 cups buttermilk",
      "1 tbsp hot sauce",
      "2 cups flour",
      "Paprika, garlic powder, salt, pepper",
      "Oil for frying"
    ]
  },
  { name: "All American Hamburger Drive-In", town: "Massapequa", cat: "Burgers", dishTitle: "Smash Cheeseburger & Shake",
    ing: [
      "1/2 lb ground beef (80/20)",
      "2 potato buns",
      "2 slices American cheese",
      "Salt, pepper",
      "Pickles, onion, ketchup, mustard",
      "Shake: vanilla ice cream, milk, frozen strawberries"
    ]
  },
  { name: "Limani", town: "Roslyn", cat: "Mediterranean", dishTitle: "Grilled Octopus",
    ing: [
      "1 octopus (~2 lb), cleaned",
      "1 onion, bay leaf, peppercorns",
      "1/4 cup olive oil",
      "1 lemon",
      "Dried oregano",
      "Salt, pepper"
    ]
  },
  { name: "La Parma", town: "Williston Park", cat: "Italian", dishTitle: "Chicken Scarpariello",
    ing: [
      "2 lb chicken pieces",
      "2 Italian sausages",
      "1 bell pepper + a few cherry peppers",
      "4 cloves garlic",
      "1/2 cup white wine",
      "1/2 cup chicken stock",
      "2 tbsp vinegar, rosemary"
    ]
  },
  { name: "The Lobster Roll — LUNCH", town: "Amagansett", cat: "Seafood", dishTitle: "Classic Cold Lobster Roll",
    ing: [
      "1 lb cooked lobster meat",
      "3 tbsp mayo",
      "1 tbsp lemon juice",
      "1 stalk celery, minced",
      "Chives, salt, pepper",
      "2 split-top buns",
      "Butter"
    ]
  },
  { name: "Umberto's", town: "New Hyde Park", cat: "Pizza", dishTitle: "Grandma Pizza",
    ing: [
      "1 lb pizza dough",
      "2 tbsp olive oil",
      "2 cups low-moisture mozzarella",
      "1 cup crushed tomatoes",
      "2 cloves garlic",
      "Oregano, basil, Parmesan"
    ]
  },
  { name: "Maureen's Kitchen", town: "Smithtown", cat: "Breakfast", dishTitle: "The Big Diner Breakfast",
    ing: [
      "4 eggs",
      "4 strips bacon",
      "2 potatoes, diced",
      "Butter",
      "Pancakes: flour, milk, egg, baking powder, sugar",
      "Maple syrup"
    ]
  },
  { name: "The Clam Bar at Napeague", town: "Amagansett", cat: "Seafood", dishTitle: "Warm Buttered Lobster Roll",
    ing: [
      "1 lb cooked lobster meat",
      "4 tbsp butter",
      "1 tbsp lemon juice",
      "Chives, flaky salt",
      "2 split-top buns"
    ]
  }
];

function restaurantSlugifyLocal(s){
  // Identical algorithm to the client-side slugify in index.html so the slug
  // computed on the restaurant card matches the slug looked up here. Anything
  // not [a-z0-9] (including non-ASCII like ñ, em-dashes, apostrophes) becomes
  // a hyphen.
  return String(s || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Stable slug for a restaurant entry: "<name> <dishTitle>" -> slugified.
// Must match the slug computed on the client (index.html restaurant card).
export function restaurantSlug(r){
  return restaurantSlugifyLocal((r.name || '') + ' ' + (r.dishTitle || ''));
}

export function findRestaurantBySlug(slug){
  if (!slug) return null;
  const target = restaurantSlugifyLocal(slug);
  return RESTAURANTS.find(r => restaurantSlug(r) === target) || null;
}

// Recipe-shaped view of a restaurant entry so the existing
// ingredientsForRecipe / payload helpers can consume it unchanged.
export function restaurantAsRecipe(r){
  return {
    title: r.name + ' — ' + r.dishTitle,
    ing: r.ing || [],
    steps: r.steps || [],
    serves: 2,
    time: '45 min'
  };
}
