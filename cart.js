function addToCart(productName, price, imageUrl) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    let cartItem = { 
        productName: productName, 
        price: price, 
        imageUrl: imageUrl, 
        quantity: 1 
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(productName + " added to cart!");
}

// ২. টেবিল রেন্ডার করা এবং চেকআউট লজিক
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('cart-table-body');
    const subtotalDisplay = document.getElementById('subtotal');
    const totalDisplay = document.getElementById('total-with-delivery');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (tableBody) {
        tableBody.innerHTML = "";
        let subtotal = 0;

        cart.forEach((item, index) => {
            let price = parseFloat(item.price);
            let qty = parseInt(item.quantity) || 1;
            let itemTotal = price * qty;
            subtotal += itemTotal;
            
            tableBody.innerHTML += `
                <tr>
                    <td><img src="${item.imageUrl}" style="width:50px; height:50px; object-fit:cover;"></td>
                    <td>${item.productName}</td>
                    <td>BDT ${price}</td>
                    <td>
                        <button onclick="updateQty(${index}, -1)">-</button>
                        ${qty}
                        <button onclick="updateQty(${index}, 1)">+</button>
                    </td>
                    <td>BDT ${itemTotal}</td>
                    <td><button onclick="removeFromCart(${index})" class="remove-btn">Remove</button></td>
                </tr>
            `;
        });

        if (subtotalDisplay) subtotalDisplay.innerText = "BDT " + subtotal;
        if (totalDisplay) totalDisplay.innerText = "BDT " + (subtotal + 60);
    }

    // চেকআউট বাটনের ইভেন্ট লিসেনার
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (cart.length > 0) {
                window.location.href = 'checkout.html';
            } else {
                alert("Your cart is empty!");
            }
        });
    }
});

// ৩. কোয়ান্টিটি ও রিমুভ ফাংশন
function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity = (parseInt(cart[index].quantity) || 1) + change;
    if(cart[index].quantity < 1) cart[index].quantity = 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    location.reload();
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    location.reload();
}