// Restaurant + recipe-collection copycats (backend mirror).
// Flattened to ONE entry per (card, dish) so every dish resolves for the grocery
// integration (/api/store, /api/grocery), looked up via ?restaurant=<slug>.
// Keep in lock-step with the RESTAURANTS array in index.html.

export const RESTAURANTS = [
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "Baked Chicken Cutlet with Penne Vodka",
    "ing": [
      "2 chicken breasts, pounded thin",
      "1/2 cup flour",
      "2 eggs, beaten",
      "1 cup seasoned breadcrumbs",
      "1/2 cup grated Parmesan",
      "12 oz penne",
      "3 tbsp olive oil",
      "3 tbsp butter",
      "4 cloves garlic, minced",
      "3 tbsp tomato paste",
      "1/3 cup vodka",
      "1 cup heavy cream",
      "1/2 cup crushed tomatoes",
      "1/2 tsp red pepper flakes",
      "Fresh basil",
      "Salt, pepper"
    ],
    "steps": [
      "Heat oven to 425°F. Dredge the cutlets in flour, then egg, then breadcrumbs mixed with half the Parmesan.",
      "Brown the cutlets in olive oil 2 min per side, then finish on a rack in the oven 10–12 min until cooked through and crisp.",
      "Boil the penne until al dente; reserve 1/2 cup pasta water.",
      "Make the vodka sauce: melt butter with the garlic and red pepper flakes; stir in tomato paste 2 min; add vodka and simmer 1 min; add crushed tomatoes and cream and simmer to a blush sauce.",
      "Toss the penne in the sauce with the remaining Parmesan, loosening with pasta water. Plate the penne, slice a baked cutlet over the top, and finish with basil."
    ]
  },
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "Skirt Steak Mac & Cheese",
    "ing": [
      "1.5 lb skirt steak",
      "12 oz elbow macaroni",
      "4 tbsp butter",
      "1/4 cup flour",
      "3 cups whole milk",
      "2 cups sharp cheddar, shredded",
      "1 cup gruyere, shredded",
      "1 onion, sliced",
      "4 strips bacon, chopped",
      "2 tbsp olive oil",
      "Salt, pepper, paprika"
    ],
    "steps": [
      "Season the skirt steak with salt, pepper and paprika; sear in olive oil 3 min per side; rest 8 min and slice thinly across the grain.",
      "In the same pan, cook the bacon until crisp; remove. Soften the sliced onion in the bacon fat 10 min until deeply caramelized.",
      "Boil the elbow macaroni until al dente; drain. Melt the butter in a saucepan, whisk in the flour 1 min, then the milk; simmer until thickened. Off heat, stir in the cheddar and gruyere.",
      "Toss the pasta with the cheese sauce; pile into bowls, top with the sliced skirt steak, caramelized onions and bacon crumble; finish with cracked pepper."
    ]
  },
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "Pork Chops with Cherry Peppers",
    "ing": [
      "2 thin-cut pork chops, pounded thin",
      "1 cup breadcrumbs + 1/2 cup grated Parmesan",
      "2 eggs, beaten",
      "Flour for dredging",
      "2 cups arugula",
      "Chopped cherry peppers + a splash of their vinegar",
      "Olive oil, lemon, salt"
    ],
    "steps": [
      "Dredge the pounded chops in flour, then egg, then the Parmesan breadcrumbs.",
      "Fry in olive oil until golden and cooked through; drain.",
      "Toss the arugula with cherry peppers, a splash of the vinegar, olive oil and lemon.",
      "Pile the peppery salad on the hot chops and serve."
    ]
  },
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "The \"Finger Tip\" — Sliced Steak & Potatoes",
    "ing": [
      "1.5 lb skirt or shell steak",
      "1.5 lb baby potatoes, halved",
      "3 tbsp olive oil",
      "3 cloves garlic, minced",
      "2 tbsp butter",
      "1 tsp rosemary, chopped",
      "Salt, coarse pepper",
      "Optional: chopped cherry peppers"
    ],
    "steps": [
      "Roast the halved potatoes tossed in olive oil, salt and pepper at 425°F for 25–30 min until crisp; toss with the garlic and rosemary for the last 5 min.",
      "Season the steak well and rest at room temp 30 min; pat dry.",
      "Sear in a screaming-hot pan 3–4 min per side for medium-rare; rest 8 min, then slice thin across the grain.",
      "Pile the sliced steak over the potatoes, spoon over the resting juices and butter, and finish with coarse pepper (and cherry peppers if you like)."
    ]
  },
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "Fried Mozzarella",
    "ing": [
      "1 lb fresh mozzarella, cut into thick sticks",
      "1 cup flour",
      "3 eggs, beaten",
      "2 cups seasoned breadcrumbs",
      "1/2 cup grated Parmesan",
      "Oil for frying",
      "2 cups marinara, warmed",
      "Fresh basil"
    ],
    "steps": [
      "Freeze the mozzarella sticks 20 min so they hold their shape.",
      "Dredge each in flour, then egg, then breadcrumbs mixed with the Parmesan — then dip in egg and crumbs again for a sturdy double coat.",
      "Heat oil to 360°F; fry in batches 1–2 min until golden, turning once; drain.",
      "Serve hot with warm marinara and torn basil."
    ]
  },
  {
    "name": "Robke's",
    "town": "Northport",
    "cat": "Italian-American",
    "dishTitle": "Eggplant Rollatini",
    "ing": [
      "2 large eggplant, sliced lengthwise 1/4-inch thick",
      "1 cup flour",
      "3 eggs",
      "2 cups breadcrumbs",
      "1/3 cup parmesan, grated",
      "2 cups ricotta",
      "1 egg",
      "2 cups shredded mozzarella",
      "1/4 cup parsley, chopped",
      "3 cups marinara",
      "Olive oil",
      "Fresh basil",
      "Salt, pepper"
    ],
    "steps": [
      "Salt the eggplant slices 15 min; pat dry. Dredge in flour, egg, then breadcrumbs mixed with half the parmesan.",
      "Pan-fry in olive oil until golden on both sides; drain.",
      "Stir the ricotta with 1 egg, parsley, half the mozzarella, the rest of the parmesan, salt and pepper.",
      "Spoon filling on each slice; roll up. Spread 1 cup marinara in a baking dish, arrange the rolls seam-side down, top with the remaining marinara and mozzarella.",
      "Bake at 400°F for 25 min until bubbly; finish with basil."
    ]
  },
  {
    "name": "Luca",
    "town": "Stony Brook",
    "cat": "Italian",
    "dishTitle": "Penne alla Vodka",
    "ing": [
      "1 lb penne (fresh if you can)",
      "1/4 cup tomato paste",
      "1 onion, minced",
      "3 cloves garlic",
      "1/4 cup vodka",
      "3/4 cup heavy cream",
      "Parmesan, basil, chili flakes",
      "Olive oil"
    ],
    "steps": [
      "Sauté onion and garlic in olive oil; add tomato paste and cook until brick-red.",
      "Deglaze with vodka and cook off the alcohol.",
      "Stir in cream and simmer to a blush sauce.",
      "Toss with cooked pasta, Parmesan and basil; loosen with pasta water."
    ]
  },
  {
    "name": "Ixchel Mexican Cuisine",
    "town": "East Setauket",
    "cat": "Mexican",
    "dishTitle": "Birria Tacos",
    "ing": [
      "2 lb chuck roast",
      "3 dried guajillo + 2 ancho chiles",
      "2 tomatoes, 1 onion, 4 garlic cloves",
      "Cumin, oregano, bay, a small cinnamon stick",
      "2 cups beef broth",
      "Corn tortillas",
      "Oaxaca or Jack cheese, cilantro, onion, lime"
    ],
    "steps": [
      "Toast and soak the chiles; blend with tomato, onion, garlic and spices.",
      "Braise the beef in the chile sauce + broth until it shreds, ~3 hours.",
      "Shred the beef; skim the red consommé into a bowl.",
      "Dip tortillas in the fat, fill with beef and cheese, crisp on a griddle, and serve with consommé."
    ]
  },
  {
    "name": "Elaine's",
    "town": "East Setauket",
    "cat": "Italian",
    "dishTitle": "Linguine Carbonara",
    "ing": [
      "1 lb linguine",
      "4 oz guanciale or pancetta, diced",
      "3 egg yolks + 1 whole egg",
      "3/4 cup grated Pecorino Romano",
      "Lots of black pepper",
      "Salt"
    ],
    "steps": [
      "Crisp the guanciale; reserve the rendered fat.",
      "Whisk yolks, egg, Pecorino and black pepper.",
      "Cook linguine; toss with the guanciale off the heat.",
      "Add a splash of pasta water, then the egg mixture, tossing fast into a silky sauce."
    ]
  },
  {
    "name": "Maria's",
    "town": "Nesconset",
    "cat": "Mexican & Latin",
    "dishTitle": "Tampiqueña al Mar",
    "ing": [
      "1 lb skirt steak",
      "1/2 lb shrimp",
      "1/2 lb sea scallops",
      "1/4 lb calamari",
      "2 chipotles in adobo",
      "1/2 cup cream",
      "1 onion, 2 garlic cloves",
      "Lime, cilantro, salt"
    ],
    "steps": [
      "Season and grill the skirt steak to medium-rare; rest and slice.",
      "Sauté onion and garlic; blend with chipotle and cream into a sauce.",
      "Sear the shrimp, scallops and calamari, then simmer in the chipotle cream.",
      "Spoon the seafood over the steak; finish with lime and cilantro."
    ]
  },
  {
    "name": "Peter Luger Steak House",
    "town": "Great Neck",
    "cat": "Steakhouse",
    "dishTitle": "Dry-Aged Porterhouse",
    "ing": [
      "1 porterhouse, 1.5–2 in thick",
      "Kosher salt & coarse pepper",
      "2 tbsp butter, melted",
      "Sauce: ketchup, Worcestershire, prepared horseradish, brown sugar, splash of vinegar"
    ],
    "steps": [
      "Salt the steak and rest at room temp 45 min; pat very dry.",
      "Heat the broiler (or cast iron) screaming hot.",
      "Sear/broil ~4 min per side for medium-rare (130–135°F); rest 8 min.",
      "Brush with melted butter, slice off the bone, serve with the whisked sauce."
    ]
  },
  {
    "name": "Bigelow's New England Fried Clams",
    "town": "Rockville Centre",
    "cat": "Seafood",
    "dishTitle": "New England Fried Clams",
    "ing": [
      "1 lb shucked whole clams",
      "1 cup buttermilk",
      "1 cup corn flour (fine cornmeal)",
      "1/2 cup flour",
      "Salt, pepper, paprika",
      "Neutral oil for frying",
      "Lemon & tartar sauce"
    ],
    "steps": [
      "Soak clams in buttermilk 15 min.",
      "Mix corn flour, flour and seasoning.",
      "Heat oil to 375°F.",
      "Dredge and fry clams 1–2 min until golden; drain. Serve with lemon and tartar."
    ]
  },
  {
    "name": "Zorn's of Bethpage",
    "town": "Bethpage",
    "cat": "Comfort",
    "dishTitle": "Buttermilk Fried Chicken",
    "ing": [
      "8 pieces chicken",
      "2 cups buttermilk",
      "1 tbsp hot sauce",
      "2 cups flour",
      "Paprika, garlic powder, salt, pepper",
      "Oil for frying"
    ],
    "steps": [
      "Brine chicken in buttermilk + hot sauce 2+ hours.",
      "Dredge in seasoned flour, pressing to coat.",
      "Fry at 325–350°F 12–15 min, turning, until 165°F.",
      "Rest on a rack and salt right away."
    ]
  },
  {
    "name": "All American Hamburger Drive-In",
    "town": "Massapequa",
    "cat": "Burgers",
    "dishTitle": "Smash Cheeseburger & Shake",
    "ing": [
      "1/2 lb ground beef (80/20)",
      "2 potato buns",
      "2 slices American cheese",
      "Salt, pepper",
      "Pickles, onion, ketchup, mustard",
      "Shake: vanilla ice cream, milk, frozen strawberries"
    ],
    "steps": [
      "Form loose beef balls; smash hard on a screaming-hot griddle.",
      "Season, flip at 2 min, add cheese.",
      "Toast buns; build with pickles, onion and sauce.",
      "Blend ice cream, milk and strawberries for the shake."
    ]
  },
  {
    "name": "Limani",
    "town": "Roslyn",
    "cat": "Mediterranean",
    "dishTitle": "Grilled Octopus",
    "ing": [
      "1 octopus (~2 lb), cleaned",
      "1 onion, bay leaf, peppercorns",
      "1/4 cup olive oil",
      "1 lemon",
      "Dried oregano",
      "Salt, pepper"
    ],
    "steps": [
      "Simmer octopus with onion, bay and peppercorns 45–60 min until tender; cool.",
      "Cut into tentacles; toss with olive oil.",
      "Grill over high heat until charred, 2–3 min per side.",
      "Finish with lemon, oregano, salt and olive oil."
    ]
  },
  {
    "name": "La Parma",
    "town": "Williston Park",
    "cat": "Italian",
    "dishTitle": "Chicken Scarpariello",
    "ing": [
      "2 lb chicken pieces",
      "2 Italian sausages",
      "1 bell pepper + a few cherry peppers",
      "4 cloves garlic",
      "1/2 cup white wine",
      "1/2 cup chicken stock",
      "2 tbsp vinegar, rosemary"
    ],
    "steps": [
      "Brown chicken and sausage; set aside.",
      "Sauté garlic and peppers.",
      "Deglaze with wine, vinegar and stock; add rosemary.",
      "Return the meat; simmer until cooked and saucy."
    ]
  },
  {
    "name": "The Lobster Roll — LUNCH",
    "town": "Amagansett",
    "cat": "Seafood",
    "dishTitle": "Classic Cold Lobster Roll",
    "ing": [
      "1 lb cooked lobster meat",
      "3 tbsp mayo",
      "1 tbsp lemon juice",
      "1 stalk celery, minced",
      "Chives, salt, pepper",
      "2 split-top buns",
      "Butter"
    ],
    "steps": [
      "Toss lobster with mayo, lemon, celery, chives, salt and pepper.",
      "Butter and griddle the buns until golden.",
      "Pile in the lobster salad.",
      "Top with extra chives; serve cold."
    ]
  },
  {
    "name": "Umberto's",
    "town": "New Hyde Park",
    "cat": "Pizza",
    "dishTitle": "Grandma Pizza",
    "ing": [
      "1 lb pizza dough",
      "2 tbsp olive oil",
      "2 cups low-moisture mozzarella",
      "1 cup crushed tomatoes",
      "2 cloves garlic",
      "Oregano, basil, Parmesan"
    ],
    "steps": [
      "Stretch dough into an oiled sheet pan; rest 20 min.",
      "Top with mozzarella, then spoon over crushed tomato mixed with garlic.",
      "Bake at 500°F 15–18 min until the bottom is crisp.",
      "Finish with oregano, basil and Parmesan."
    ]
  },
  {
    "name": "Maureen's Kitchen",
    "town": "Smithtown",
    "cat": "Breakfast",
    "dishTitle": "The Big Diner Breakfast",
    "ing": [
      "4 eggs",
      "4 strips bacon",
      "2 potatoes, diced",
      "Butter",
      "Pancakes: flour, milk, egg, baking powder, sugar",
      "Maple syrup"
    ],
    "steps": [
      "Crisp the bacon; fry the home fries in the drippings until golden.",
      "Whisk pancake batter; cook on a buttered griddle.",
      "Fry the eggs to your liking.",
      "Plate it all with butter and syrup."
    ]
  },
  {
    "name": "The Clam Bar at Napeague",
    "town": "Amagansett",
    "cat": "Seafood",
    "dishTitle": "Warm Buttered Lobster Roll",
    "ing": [
      "1 lb cooked lobster meat",
      "4 tbsp butter",
      "1 tbsp lemon juice",
      "Chives, flaky salt",
      "2 split-top buns"
    ],
    "steps": [
      "Warm the lobster gently in melted butter with lemon.",
      "Butter and griddle the buns.",
      "Fill with the warm buttered lobster.",
      "Finish with chives and flaky salt."
    ]
  },
  {
    "name": "Se-Port Deli",
    "town": "East Setauket",
    "cat": "Deli",
    "dishTitle": "The Snider Hero",
    "ing": [
      "1 long hero roll",
      "1 cup chicken salad",
      "4 slices bacon, cooked crisp",
      "1/2 cup shredded mozzarella",
      "2 tbsp honey mustard",
      "Lettuce & tomato",
      "Garlic butter for the roll"
    ],
    "steps": [
      "Split the hero, spread the cut sides with garlic butter and toast until golden.",
      "Pile on the chicken salad and top with the crisp bacon.",
      "Cover with the mozzarella and melt under the broiler 1–2 min.",
      "Drizzle with honey mustard, add lettuce and tomato, and close the hero."
    ]
  },
  {
    "name": "Tara Inn",
    "town": "Port Jefferson",
    "cat": "Pub & Burgers",
    "dishTitle": "The Famous Bar Burger",
    "ing": [
      "1/4 lb ground beef (80/20) per burger",
      "Soft potato burger buns",
      "American cheese",
      "Salt, pepper",
      "Butter for the buns",
      "Pickles, onion, ketchup, mustard"
    ],
    "steps": [
      "Loosely form thin patties; season with salt and pepper.",
      "Griddle hard on high heat 2 min per side for crispy edges; add cheese to melt.",
      "Butter and toast the buns on the griddle.",
      "Build with pickles, onion and your sauces — keep it simple and classic."
    ]
  },
  {
    "name": "Crazy Beans",
    "town": "Stony Brook",
    "cat": "Brunch",
    "dishTitle": "Pancake Quesadilla",
    "ing": [
      "1 cup pancake batter",
      "2 tbsp shredded cheddar",
      "2 strips bacon, cooked and chopped (or sausage)",
      "1 egg, scrambled",
      "Butter",
      "Powdered sugar",
      "Maple syrup for serving"
    ],
    "steps": [
      "Pour the pancake batter into a buttered nonstick pan to make one large pancake; cook until the bubbles set.",
      "On one half, scatter the cheddar, bacon and scrambled egg.",
      "Fold the pancake over like a quesadilla; press and cook until the cheese melts and both sides are golden.",
      "Cut into wedges, dust with powdered sugar and serve with warm maple syrup."
    ]
  },
  {
    "name": "Pasta Pasta",
    "town": "Port Jefferson",
    "cat": "Italian",
    "dishTitle": "Squid-Ink Lobster Ravioli",
    "ing": [
      "1 package lobster ravioli (squid-ink if you can find it)",
      "1 cup cooked lobster meat, chopped",
      "2 tbsp butter",
      "2 cloves garlic, minced",
      "1/4 cup white wine",
      "3/4 cup cream",
      "1/2 cup crushed tomatoes",
      "Pinch chili flakes",
      "Fresh chives, salt, pepper"
    ],
    "steps": [
      "Boil the ravioli gently until they float; drain.",
      "Melt the butter with the garlic and chili flakes; add the white wine and reduce 1 min.",
      "Stir in the crushed tomatoes and cream; simmer to a light blush sauce.",
      "Warm the lobster in the sauce, fold in the ravioli, and finish with chives."
    ]
  },
  {
    "name": "Eddie's Pizza",
    "town": "New Hyde Park",
    "cat": "Pizza",
    "dishTitle": "Thin-Crust Bar Pie",
    "ing": [
      "1 (10-inch) thin pizza shell or 8 oz dough",
      "1/3 cup pizza sauce",
      "1 cup low-moisture mozzarella",
      "2 tbsp grated Parmesan",
      "Olive oil",
      "Oregano",
      "Optional: thin-sliced pepperoni"
    ],
    "steps": [
      "Heat the oven as hot as it goes (500°F+) with a pizza stone or steel inside.",
      "Stretch the dough super thin into a 10-inch round; brush the rim with olive oil.",
      "Top almost edge-to-edge with a thin layer of sauce, then the mozzarella and Parmesan.",
      "Bake 8–10 min until the crust is crackery and browned; finish with oregano and cut into squares."
    ]
  },
  {
    "name": "Thomas's Ham & Eggery",
    "town": "Carle Place",
    "cat": "Breakfast",
    "dishTitle": "Lemon Ricotta Pancakes",
    "ing": [
      "1 cup flour",
      "1 tbsp sugar",
      "1 tsp baking powder",
      "1/2 tsp salt",
      "3/4 cup ricotta",
      "3/4 cup milk",
      "2 eggs, separated",
      "Zest of 1 lemon + 1 tbsp juice",
      "Butter",
      "Powdered sugar & syrup"
    ],
    "steps": [
      "Whisk the flour, sugar, baking powder and salt.",
      "In another bowl, mix the ricotta, milk, egg yolks, lemon zest and juice; stir into the dry ingredients.",
      "Whip the egg whites to soft peaks and fold them in for fluffiness.",
      "Cook on a buttered griddle until golden; dust with powdered sugar and serve with syrup."
    ]
  },
  {
    "name": "The Cull House",
    "town": "Sayville",
    "cat": "Seafood",
    "dishTitle": "Baked Clams",
    "ing": [
      "18 littleneck clams on the half shell",
      "1.5 cups breadcrumbs",
      "1/2 cup grated Parmesan",
      "4 cloves garlic, minced",
      "1/4 cup parsley, chopped",
      "2 tsp oregano",
      "1/3 cup olive oil",
      "2 tbsp lemon juice",
      "Pinch chili flakes",
      "Lemon wedges"
    ],
    "steps": [
      "Heat the oven to 425°F.",
      "Mix the breadcrumbs, Parmesan, garlic, parsley, oregano, lemon juice, chili and olive oil into a moist crumb.",
      "Top each clam with a generous spoonful and set on a sheet pan.",
      "Bake 10–12 min until golden and the clams are just cooked; serve with lemon."
    ]
  },
  {
    "name": "Ralph's Famous Italian Ices",
    "town": "Long Island",
    "cat": "Italian Ices",
    "dishTitle": "Cherry Italian Ice",
    "ing": [
      "2 cups water",
      "3/4 cup sugar",
      "2 cups pitted cherries (fresh or frozen)",
      "1 tbsp lemon juice",
      "Pinch of salt"
    ],
    "steps": [
      "Make a simple syrup: heat the water and sugar until dissolved, then cool.",
      "Blend the cherries with the syrup, lemon juice and salt until smooth.",
      "Pour into a shallow pan and freeze, scraping with a fork every 30 min for 3–4 hours until fluffy and granular.",
      "Scoop into cups (or churn in an ice-cream maker for an ultra-smooth ice)."
    ]
  },
  {
    "name": "Starbucks",
    "town": "Café favorite",
    "cat": "Coffee Shop",
    "dishTitle": "Spinach, Feta & Egg White Wrap",
    "ing": [
      "1 cup egg whites",
      "2 cups baby spinach",
      "1/4 cup crumbled feta cheese",
      "2 tbsp sun-dried tomatoes, chopped",
      "1 spinach tortilla",
      "1 tsp olive oil",
      "1/4 tsp garlic powder",
      "Salt, pepper"
    ],
    "steps": [
      "Heat 1 tsp olive oil in a nonstick skillet; add the baby spinach and a pinch of salt and wilt 1 min; push to one side.",
      "Pour the egg whites into the pan and scramble gently 2–3 min until just set; season with garlic powder, salt and pepper.",
      "Sprinkle the feta and chopped sun-dried tomatoes over the eggs and fold the spinach in.",
      "Warm the spinach tortilla 15 sec; pile the filling in the center, fold the sides over the top and bottom, then toast seam-side down in the dry skillet 1–2 min for the signature golden seal."
    ]
  },
  {
    "name": "Starbucks",
    "town": "Café favorite",
    "cat": "Coffee Shop",
    "dishTitle": "Bacon, Gouda & Egg Sandwich",
    "ing": [
      "2 ciabatta or artisan rolls",
      "2 eggs",
      "2 slices smoked gouda",
      "4 slices bacon",
      "1 tbsp butter",
      "Salt, pepper"
    ],
    "steps": [
      "Cook the bacon until crisp; drain.",
      "Whisk the eggs with salt and pepper; cook in a small buttered pan (or ring mold) into two folded rounds.",
      "Split and toast the rolls; lay the gouda on the warm bottom so it starts to melt.",
      "Stack the egg and bacon, close the sandwich, and press in the warm pan 1 min to melt the cheese."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Classic Hummus",
    "ing": [
      "1 can (15 oz) chickpeas, drained (save the liquid)",
      "1/4 cup tahini",
      "2 tbsp lemon juice",
      "1 clove garlic",
      "3 tbsp olive oil",
      "1/2 tsp ground cumin",
      "1/2 tsp salt",
      "2–3 tbsp ice water or reserved chickpea liquid",
      "Paprika + olive oil to finish"
    ],
    "steps": [
      "Blend the tahini and lemon juice alone for 1 min until pale and whipped.",
      "Add the garlic, olive oil, cumin and salt; blend.",
      "Add the chickpeas and blend, drizzling in ice water until silky-smooth.",
      "Spread in a bowl, swirl the top, and finish with olive oil and a dusting of paprika."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Roasted Red Pepper Hummus",
    "ing": [
      "1 can chickpeas, drained",
      "1/2 cup roasted red peppers, patted dry",
      "1/4 cup tahini",
      "2 tbsp lemon juice",
      "1 clove garlic",
      "2 tbsp olive oil",
      "1/2 tsp smoked paprika",
      "1/2 tsp salt"
    ],
    "steps": [
      "Blend the tahini and lemon until whipped.",
      "Add the roasted peppers, garlic, olive oil, smoked paprika and salt; blend smooth.",
      "Add the chickpeas and blend, loosening with a little water as needed.",
      "Finish with a swirl of olive oil and an extra pinch of smoked paprika."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Roasted Garlic Hummus",
    "ing": [
      "1 head garlic",
      "1 can chickpeas, drained",
      "1/4 cup tahini",
      "2 tbsp lemon juice",
      "3 tbsp olive oil",
      "1/2 tsp salt",
      "Ice water to loosen"
    ],
    "steps": [
      "Drizzle the garlic head with oil, wrap in foil, and roast at 400°F for 35–40 min until soft; squeeze out the cloves.",
      "Blend the tahini and lemon until pale.",
      "Add the roasted garlic, olive oil and salt; blend.",
      "Add the chickpeas and blend with ice water until creamy; finish with olive oil."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Spicy Sriracha Hummus",
    "ing": [
      "1 can chickpeas, drained",
      "1/4 cup tahini",
      "2 tbsp lemon juice",
      "2–3 tbsp sriracha",
      "1 clove garlic",
      "2 tbsp olive oil",
      "1/2 tsp cumin",
      "1/2 tsp salt"
    ],
    "steps": [
      "Blend the tahini and lemon until whipped.",
      "Add the sriracha, garlic, olive oil, cumin and salt; blend.",
      "Add the chickpeas and blend smooth, loosening with water.",
      "Swirl extra sriracha on top with a drizzle of olive oil."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Avocado Hummus",
    "ing": [
      "1 can chickpeas, drained",
      "1 ripe avocado",
      "3 tbsp tahini",
      "2 tbsp lime juice",
      "1 clove garlic",
      "2 tbsp olive oil",
      "1/4 cup cilantro",
      "1/2 tsp salt"
    ],
    "steps": [
      "Blend the tahini and lime until pale.",
      "Add the avocado, garlic, cilantro, olive oil and salt; blend.",
      "Add the chickpeas and blend until smooth.",
      "Serve right away with a squeeze of lime (press wrap onto the surface if storing)."
    ]
  },
  {
    "name": "Hummus",
    "town": "High-protein dips & bowls",
    "cat": "Fit recipes",
    "dishTitle": "Edamame Hummus",
    "ing": [
      "1.5 cups shelled edamame, cooked",
      "1/2 cup chickpeas, drained",
      "3 tbsp tahini",
      "2 tbsp lemon juice",
      "1 clove garlic",
      "3 tbsp olive oil",
      "1/4 tsp cumin",
      "1/2 tsp salt",
      "Ice water to loosen"
    ],
    "steps": [
      "Blend the edamame, tahini and lemon until broken down.",
      "Add the chickpeas, garlic, olive oil, cumin and salt; blend.",
      "Drizzle in ice water and blend until smooth and bright.",
      "Finish with olive oil and a scatter of whole edamame."
    ]
  }
];

function restaurantSlugifyLocal(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
export function restaurantSlug(r){ return restaurantSlugifyLocal((r.name||'')+' '+(r.dishTitle||'')); }
export function findRestaurantBySlug(slug){ if(!slug) return null; const t=restaurantSlugifyLocal(slug); return RESTAURANTS.find(r=>restaurantSlug(r)===t)||null; }
export function restaurantAsRecipe(r){ return { title: r.name+' — '+r.dishTitle, ing: r.ing||[], steps: r.steps||[], serves: 2, time: '45 min' }; }
