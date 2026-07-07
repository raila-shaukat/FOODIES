// ================= CART =================

let cart = [];

const cartCount = document.getElementById("cart-count");
const addButtons = document.querySelectorAll(".add-cart");


// ================= CREATE CART BOX =================

const cartBox = document.createElement("div");
cartBox.classList.add("cart-box");

cartBox.innerHTML = `
    <div class="cart-header">
        <h2>Your Cart</h2>
        <span id="close-cart">✖</span>
    </div>

    <div id="cart-items"></div>

    <div class="cart-footer">
        <h3>Total: $<span id="cart-total">0</span></h3>
        <button id="place-order-btn">Place Order</button>
    </div>
`;

document.body.appendChild(cartBox);


// ================= CART OPEN/CLOSE =================

document.querySelector(".cart-icon").addEventListener("click", () => {
    cartBox.classList.add("show-cart");
});

document.addEventListener("click", (e) => {
    if (e.target.id === "close-cart") {
        cartBox.classList.remove("show-cart");
    }
});


// ================= ADD TO CART =================

addButtons.forEach(button => {
    button.addEventListener("click", () => {

        const foodCard = button.closest(".food-card");

        const name = foodCard.querySelector("h3").innerText;
        const price = foodCard.querySelector("span").innerText;
        const image = foodCard.querySelector("img").src;

        cart.push({ name, price, image });

        updateCart();

        button.innerText = "Added";
        button.style.background = "green";

        setTimeout(() => {
            button.innerText = "Add";
            button.style.background = "#ff5722";
        }, 800);
    });
});


// ================= UPDATE CART =================

function updateCart() {

    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {

        total += Number(item.price.replace("$", ""));

        cartItems.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price}</p>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">
                    Remove
                </button>
            </div>
        `;
    });

    cartCount.innerText = cart.length;
    cartTotal.innerText = total;
}


// ================= REMOVE ITEM =================

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}


// ================= CATEGORY FILTER =================

document.querySelectorAll(".category-card").forEach(card => {

    card.addEventListener("click", () => {

        const category = card.getAttribute("data-category");

        document.querySelectorAll(".food-card").forEach(food => {
            food.style.display =
                food.getAttribute("data-category") === category
                ? "block"
                : "none";
        });

        document.getElementById("menu")
        .scrollIntoView({ behavior: "smooth" });
    });

});


// ================= HERO BUTTON =================

document.querySelector(".hero-btn").addEventListener("click", () => {
    document.getElementById("menu")
    .scrollIntoView({ behavior: "smooth" });
});


// ================= CONTACT FORM =================

document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Message Sent Successfully!");
});


// ================= ORDER MODAL =================

const orderModal = document.createElement("div");
orderModal.classList.add("order-popup");

orderModal.innerHTML = `
    <div class="order-box">

        <h2>Place Your Order</h2>

        <input type="text" id="cust-name" placeholder="Your Name">
        <input type="text" id="cust-phone" placeholder="Phone Number">
        <textarea id="cust-address" placeholder="Delivery Address"></textarea>

        <button id="confirm-order-btn">Confirm Order</button>
        <button id="close-order-btn">Cancel</button>

    </div>
`;

document.body.appendChild(orderModal);


// ================= OPEN ORDER MODAL =================

document.addEventListener("click", (e) => {

    if (e.target.id === "place-order-btn") {

        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        orderModal.classList.add("show-popup");
    }
});


// ================= CLOSE MODAL =================

document.addEventListener("click", (e) => {

    if (e.target.id === "close-order-btn") {
        orderModal.classList.remove("show-popup");
    }
});


// ================= CONFIRM ORDER =================

document.addEventListener("click", async (e) => {

    if (e.target.id === "confirm-order-btn") {

        const name = document.getElementById("cust-name").value;
        const phone = document.getElementById("cust-phone").value;
        const address = document.getElementById("cust-address").value;

        if (!name || !phone || !address) {
            alert("Please fill all fields!");
            return;
        }

        const orderData = {
            customer: { name, phone, address },
            items: cart,
            total: document.getElementById("cart-total").innerText,
            date: new Date()
        };

        try {

            const response = await fetch('http://localhost:5000/api/orders', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(orderData)

            });

            const data = await response.json();

            if (!data.success) {

                alert(data.errors[0]);
                return;

            }

            alert('Order Placed Successfully!');

            cart = [];
            updateCart();

            orderModal.classList.remove('show-popup');
            cartBox.classList.remove('show-cart');

        }
        catch (err) {

            alert('Server Error: ' + err.message);

        }
    }
});