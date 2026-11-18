// ===== Data =====
// Each town has a name and a list of goods.
// Each good says whether the town "sells" or "buys" it, and at what price.
const STORAGE_KEY = "trade-ledger-towns";

let towns = load();
let dmMode = false;   // true while the DM is editing

// Read the towns saved in the browser, or start with an example town.
function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return [
    {
      name: "Riverford",
      goods: [
        { name: "Grain", trade: "sells", price: 2 },
        { name: "Iron", trade: "buys", price: 10 },
      ],
    },
  ];
}

// Save the towns in the browser so they survive a reload.
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(towns));
}

// ===== Page elements =====
const townList = document.getElementById("towns");
const dmButton = document.getElementById("dm-button");
const addTownButton = document.getElementById("add-town");

dmButton.addEventListener("click", () => {
  dmMode = !dmMode;   // flip between viewing and editing
  render();
});

addTownButton.addEventListener("click", () => {
  towns.push({ name: "New town", goods: [] });
  save();
  render();
});

// ===== Drawing the page =====
// Rebuild the town cards from the data.
function render() {
  dmButton.textContent = dmMode ? "Done" : "DM setup";
  addTownButton.hidden = !dmMode;

  townList.innerHTML = "";
  towns.forEach((town, i) => {
    townList.appendChild(dmMode ? editCard(town, i) : viewCard(town));
  });
}

// Small helper: el("p", { textContent: "hi" }) creates <p>hi</p>.
// Any extra arguments are added inside the element.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

// --- View mode: a read-only card ---
function viewCard(town) {
  const sells = town.goods.filter((g) => g.trade === "sells");
  const buys = town.goods.filter((g) => g.trade === "buys");

  return el("div", { className: "box" },
    el("h3", { textContent: town.name }),
    goodsList("Sells", sells),
    goodsList("Buys", buys),
  );
}

function goodsList(title, goods) {
  if (goods.length === 0) {
    return el("p", { className: "empty", textContent: `${title}: nothing` });
  }
  return el("div", {},
    el("h4", { textContent: title }),
    el("ul", { className: "goods" },
      ...goods.map((g) =>
        el("li", {},
          el("span", { textContent: g.name }),
          el("span", { textContent: `${g.price} gp` }),
        )
      ),
    ),
  );
}

// --- DM mode: an editable card ---
// Typing changes the data and saves immediately.
// Adding or removing things also calls render() to redraw the cards.
function editCard(town, i) {
  return el("div", { className: "box editing" },
    el("input", {
      className: "town-name",
      value: town.name,
      oninput: (e) => { town.name = e.target.value; save(); },
    }),
    ...town.goods.map((good, j) => goodRow(town, good, j)),
    el("div", { className: "card-actions" },
      el("button", {
        textContent: "+ Add good",
        onclick: () => {
          town.goods.push({ name: "", trade: "sells", price: 0 });
          save();
          render();
        },
      }),
      el("button", {
        className: "danger",
        textContent: "Delete town",
        onclick: () => {
          if (confirm(`Delete ${town.name}?`)) {
            towns.splice(i, 1);
            save();
            render();
          }
        },
      }),
    ),
  );
}

function goodRow(town, good, j) {
  const tradeSelect = el("select", {
    onchange: (e) => { good.trade = e.target.value; save(); },
  },
    el("option", { value: "sells", textContent: "Sells" }),
    el("option", { value: "buys", textContent: "Buys" }),
  );
  tradeSelect.value = good.trade;

  return el("div", { className: "good-row" },
    tradeSelect,
    el("input", {
      placeholder: "Resource",
      value: good.name,
      oninput: (e) => { good.name = e.target.value; save(); },
    }),
    el("input", {
      type: "number",
      min: 0,
      value: good.price,
      oninput: (e) => { good.price = Number(e.target.value); save(); },
    }),
    el("span", { textContent: "gp" }),
    el("button", {
      textContent: "✕",
      title: "Remove this good",
      onclick: () => { town.goods.splice(j, 1); save(); render(); },
    }),
  );
}

render();
