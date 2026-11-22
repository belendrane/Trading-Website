// ===== Data =====
// The goods and their going rates, and each town's funds and prices
// Each town's "prices" list is in the same order as "goods".
// #region Data
const STORAGE_KEY = "trade-ledger-market-v2";

// What the market looks like before the DM has changed anything.
const DEFAULT_MARKET = {
  goods: [
    { name: "Lumber", rate: 10 },
    { name: "Stone", rate: 20 },
    { name: "Food", rate: 30 },
    { name: "Iron", rate: 40 },
    { name: "Leather", rate: 50 },
    { name: "Fabric", rate: 60 }
  ],
  towns: [
    {
      name: "Grovedwood",
      funds: 400,
      // one entry per good, in the same order as goods above
      prices: [
        { percent: 100, selling: true }, // Lumber
        { percent: 100, selling: false }, // Stone
        { percent: 80, selling: true }, // Food
        { percent: 120, selling: false }, // Iron
        { percent: 100, selling: false }, // Leather
        { percent: 100, selling: false }, // Fabric
      ]
    },
    {
      name: "Bronzesire",
      funds: 400,
      // one entry per good, in the same order as goods above
      prices: [
        { percent: 100, selling: false }, // Lumber
        { percent: 100, selling: false }, // Stone
        { percent: 100, selling: false }, // Food
        { percent: 100, selling: false }, // Iron
        { percent: 100, selling: false }, // Leather
        { percent: 100, selling: false }, // Fabric
      ]
    },
    {
      name: "Callyaus",
      funds: 400,
      // one entry per good, in the same order as goods above
      prices: [
        { percent: 100, selling: false }, // Lumber
        { percent: 100, selling: false }, // Stone
        { percent: 100, selling: false }, // Food
        { percent: 100, selling: false }, // Iron
        { percent: 100, selling: false }, // Leather
        { percent: 100, selling: false }, // Fabric
      ]
    }
  ]
};

let market = load();
// The pages the site has. Each name matches a link (#prices) and a div (page-prices).
const PAGES = ["prices", "holdings", "report", "dm"];
let currentPage = "prices";   // which page is showing

// Read the market saved in the browser, or start with the default prices.
function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  // a copy, so editing the market never changes DEFAULT_MARKET itself
  return structuredClone(DEFAULT_MARKET);
}

// Save the market in the browser so it survives a reload.
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(market));
}

// Call after changing the data: store it, then redraw the page.
function update() {
  save();
  render();
}
// #endregion

// ===== Actions =====
// Everything that changes the market. Each one ends with update().
// #region Actions

// A new resource gets a price of 0 in every town.
function addResource() {
  market.goods.push({ name: "New resource", rate: 0 });
  market.towns.forEach((town) => {
    town.prices.push({ percent: 100, selling: false });
  });
  update();
}

function removeResource(g) {
  if (!confirm(`Remove ${market.goods[g].name}?`)) return;
  market.goods.splice(g, 1);   // take out 1 item at position g
  market.towns.forEach((town) => {
    town.prices.splice(g, 1);
  });
  update();
}

// A new town needs a new column: one more price on every good, and its own funds.
// Its prices start at each good's going rate.
function addTown() {
  market.towns.push({
    name: "New town",
    funds: 0,
    prices: market.goods.map(() => ({ percent:100, selling: false }))
  });
  update();
}

// Removing a town removes its column: its price from every good, and its funds.
function removeTown(t) {
  if (!confirm(`Remove ${market.towns[t].name}?`)) return;
  market.towns.splice(t, 1);
  update();
}
//#endregion

// ===== Drawing =====
// #region Drawing
const pricesTable = document.getElementById("prices");
const dmPanel = document.getElementById("page-dm");

// Show the current page, hide the others, and draw the one that's showing.
function render() {
  PAGES.forEach((name) => {
    document.getElementById("page-" + name).hidden = name !== currentPage;
  });

  // highlight the nav link for the page that's showing
  document.querySelectorAll(".page-nav a").forEach((link) => {
    link.classList.toggle("current", link.getAttribute("href") === "#" + currentPage);
  });

  if (currentPage === "prices") renderTable();
  if (currentPage === "dm") renderDmPanel();
}

// The page named after the # in the address, e.g. "#holdings" → "holdings".
// Anything unknown (or no # at all) goes to Prices Current.
function pageFromUrl() {
  const name = location.hash.slice(1);
  return PAGES.includes(name) ? name : "prices";
}

function renderTable() {
  pricesTable.innerHTML = "";   // clear the old table before drawing the new one
  pricesTable.append(
    el("thead", {}, headerRow()),
    el("tbody", {}, ...market.goods.map(goodRow), fundsRow()),
  );
}

function renderDmPanel() {
  dmPanel.innerHTML = "";
  dmPanel.append(
    el("h1", { textContent: "DM Setup" }),
    resourcesSection(),
    ...market.towns.map(townSection),
    el("button", { textContent: "+ Add town", onclick: addTown }),
  );
}

// One town: its name, its funds, then its settings for every resource.
function townSection(town, t) {
  return el("section", { className: "dm-section" },
    el("h2", {},
      textField(town.name, (v) => { town.name = v; }),
      removeButton("Remove this town", () => removeTown(t)),
    ),
    el("div", { className: "funds-row" },
      el("span", { textContent: "Funds" }),
      numberField(town.funds, (v) => { town.funds = v; }),
      el("span", { textContent: "gp" }),
    ),
    ...market.goods.map((good, g) => townPriceRow(town, good, g)),
  );
}

// One resource inside a town's section: its name, the town's percentage,
// and whether the town is selling it
function townPriceRow(town, good, g) {
  const entry = town.prices[g];   // this town's settings for this good

  return el("div", { className: "town-price-row"},
    el("span", { textContent: good.name}),
    numberField(entry.percent, (v) => { entry.percent = v; }),
    el("span", { textContent: "%" }),
    removeButton("Remove this town", () => removeTown(town) ),
    el("label", {},
      el("input", {
        type: "checkbox",
        checked: entry.selling,
        onchange: (e) => { entry.selling = e.target.checked; save(); },
      }),
      " Selling",
    ),
  );
}

// Every resource with its going rate, and a button to add more.
function resourcesSection() {
  return el("section", { className: "dm-section" },
    el("h2", { textContent: "Resources" }),
    ...market.goods.map(resourceRow),
    el("button", { textContent: "+ Add resource", onclick: addResource }),
  );
}

function resourceRow(good, g) {
  return el("div", { className: "resource-row"},
    textField(good.name, (v) => { good.name = v }),
    numberField(good.rate, (v) => { good.rate = v }),
    el("span", { textContent: "gp" }),
    removeButton("Remove this resource", () => removeResource(g) )
  );
}

// One row for a good: its name, its going rate, then its price in each town.
function goodRow(good, g) {
  return el("tr", {},
    el("td", { textContent: good.name }),
    el("td", { textContent: good.rate }),
    ...market.towns.map((town) => {
      const entry = town.prices[g]; // this town's settings for this good
      const price = Math.round( good.rate * (entry.percent/100) );
      return el("td", {
        textContent: price,
        className: entry.selling ? "selling" : "",
      });
    }),
  );
}

// The bottom row: how much money each town has.
function fundsRow() {
  return el("tr", {},
    el("td", { textContent: "Funds" }),
    el("td"),   // no going rate for funds
    ...market.towns.map((town) =>
      el("td", {}, town.funds)
    ),
  );
}

// Small helper: el("p", { textContent: "hi" }) creates <p>hi</p>.
// Any extra arguments are added inside the element.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

// In view mode these return plain text; in DM mode they return an input box.
// setValue is a small function that writes the new value into the data.
// Typing saves straight away but doesn't redraw, so the box keeps focus.
function numberField(value, setValue) {
  return el("input", {
    type: "number",
    min: 0,
    className: "cell-input",
    value: value,
    oninput: (e) => { setValue(Number(e.target.value)); save(); },
  });
}

function textField(value, setValue) {
  return el("input", {
    className: "cell-input name-input",
    value: value,
    oninput: (e) => { setValue(e.target.value); save(); },
  });
}

// The little ✕ button (only shown in DM mode).
function removeButton(title, onclick) {
  return el("button", { className: "remove", textContent: "✕", title, onclick });
}

// The top row: the column titles, then one cell per town.
function headerRow() {
  return el("tr", {},
    el("th", { textContent: "Commodity" }),
    el("th", { textContent: "Going rate" }),
    ...market.towns.map((town) =>
      el("th", {}, town.name )
    ),
  );
}
//#endregion

// ===== Start-up =====
// Connect the buttons to their actions, then draw the page for the first time.
// When a nav link changes the # in the address, switch to that page.
window.addEventListener("hashchange", () => {
  currentPage = pageFromUrl();
  render();
});

// Open whichever page the address names (so refreshing keeps your place).
currentPage = pageFromUrl();
render();