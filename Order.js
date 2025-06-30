const navbar = document.querySelector('.navbar');
const sideMenu = document.querySelector('.side-menu');
const menuIcon = document.querySelector('.menu-icon');
const overlay = document.querySelector('.overlay');
const main = document.querySelector('main');
const logout = document.getElementById('logout');
const notificationContainer = document.getElementById('notification-container');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmLogoutButton = document.getElementById('confirm-logout');
const cancelLogoutButton = document.getElementById('cancel-logout');

const tableContainer = document.getElementById('table-container');
const orderForm = document.getElementById('order-form');
const orderDetailsForm = document.getElementById('order-details-form');
const messageDiv = document.getElementById('message');

let selectedTable = null;
const ownerId = localStorage.getItem('ownerId');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

let menuItems = [];
let order = {};

let customerDetails = {};

let menuFetched = false;

// Role-based access control (same as before)
if (role === 'employee') {
    Array.from(navbar.children).forEach(link => {
        if (
            link.textContent !== 'Home' &&
            link.textContent !== 'Take Order' &&
            !link.classList.contains('menu-icon')
        ) {
            link.style.display = 'none';
        }
    });

    Array.from(sideMenu.children).forEach(item => {
        if (item.textContent !== 'Profile' && item.textContent !== 'Logout') {
            item.style.display = 'none';
        }
    });
}

// --- PREVENT BACK NAVIGATION --- (same as before)
function preventBackHistory() {
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', function(event) {
        window.history.pushState(null, document.title, window.location.href);
    });
}

window.onload = function() {
    preventBackHistory();
    fetchTables();
    orderForm.style.display = 'none';
};

setTimeout(preventBackHistory, 0);

// showAlert, showNotification (same as before)
function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert');
    alertBox.classList.add(type);
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.style.opacity = 1;
        alertBox.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        alertBox.style.opacity = 0;
        alertBox.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            alertBox.remove();
        }, 500);
    }, 3000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.classList.add(type);
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Sidebar menu functionality (same as before)
menuIcon.addEventListener('click', () => {
    sideMenu.style.width = '250px';
    overlay.classList.add('active');
    main.classList.add('blur');
});

overlay.addEventListener('click', () => {
    sideMenu.style.width = '0';
    overlay.classList.remove('active');
    main.classList.remove('blur');
});

logout.addEventListener('click', () => {
    confirmationModal.style.display = 'flex';
});

confirmLogoutButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    showNotification('You have been logged out!', 'success');
    setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        // window.history.replaceState(null, '', 'login.html');
        window.location.href = 'login.html';
    });
});

cancelLogoutButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
});

// fetchTables, displayTables, selectTable (same as before)
async function fetchTables() {
    try {
        const response = await fetch(`http://localhost:5000/api/tables/${ownerId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Could not fetch tables');
        }
        const tables = await response.json();
        displayTables(tables);
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = error.message;
    }
}

function displayTables(tables) {
    tableContainer.innerHTML = '';
    for (const tableNumber in tables) {
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table');
        tableDiv.textContent = tableNumber;
        tableDiv.addEventListener('click', () => selectTable(tableNumber));
        tableContainer.appendChild(tableDiv);
    }
}

function selectTable(tableNumber) {
    if (menuFetched) {
        messageDiv.textContent =
            'Cannot select another table until the current order is submitted.';
        return;
    }
    selectedTable = tableNumber;
    orderForm.style.display = 'flex';
    orderDetailsForm.style.display = 'block';
    orderForm.innerHTML = '<h2>Enter Customer Details</h2>';
    orderForm.appendChild(orderDetailsForm);
    orderDetailsForm.reset();
    messageDiv.textContent = `Table ${tableNumber} selected. Enter customer details.`;

}

// fetchMenu (same as before)
async function fetchMenu() {
    try {
        const response = await fetch(`http://localhost:5000/api/menu/${ownerId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            throw new Error('Could not fetch menu');
        }
        menuItems = await response.json();
        if (Object.keys(customerDetails).length > 0) {
            displayMenu();
            menuFetched = true;
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = error.message;
    }
}

// displayMenu - MODIFIED
function displayMenu() {
    orderDetailsForm.style.display = 'none';
    orderForm.innerHTML = '<h2>Select Items and Quantity</h2>';

    //  --- ADD SEARCH BAR ---
    const searchContainer = document.createElement('div');
    searchContainer.id = 'menu-search-container'; //  For styling
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'menu-search';
    searchInput.placeholder = 'Search items...';
    searchInput.addEventListener('input', filterMenuItems); //  Filter on input
    searchContainer.appendChild(searchInput);
    orderForm.appendChild(searchContainer);

    const menuContainer = document.createElement('div');
    menuContainer.id = 'menu-container';
    menuContainer.style.height = '200px'; //  Fixed height for the menu container
    menuContainer.style.overflowY = 'scroll'; //  Enable vertical scrolling
    orderForm.appendChild(menuContainer);

    menuItems.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.classList.add('menu-item');
        menuItemDiv.setAttribute('data-name', item.name.toLowerCase()); //  For search

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${item._id}`;
        checkbox.value = item._id;
        checkbox.addEventListener('change', () => updateOrder(item)); //  Update on change

        const label = document.createElement('label');
        label.textContent = `${item.name} - ₹${item.price}`;
        label.setAttribute('for', `item-${item._id}`);

        const quantityContainer = document.createElement('div');
        quantityContainer.classList.add('quantity-container');

        const decreaseButton = document.createElement('button');
        decreaseButton.textContent = '-';
        decreaseButton.addEventListener('click', () => changeQuantity(item._id, -1));

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.id = `quantity-${item._id}`;
        quantityInput.value = 0;
        quantityInput.min = 0;
        quantityInput.addEventListener('change', () =>
            updateQuantity(item._id, parseInt(quantityInput.value))
        );

        const increaseButton = document.createElement('button');
        increaseButton.textContent = '+';
        increaseButton.addEventListener('click', () => changeQuantity(item._id, 1));

        quantityContainer.appendChild(decreaseButton);
        quantityContainer.appendChild(quantityInput);
        quantityContainer.appendChild(increaseButton);

        menuItemDiv.appendChild(checkbox);
        menuItemDiv.appendChild(label);
        menuItemDiv.appendChild(quantityContainer);

        menuContainer.appendChild(menuItemDiv);
    });

    //  Order Summary Container
    const orderSummary = document.createElement('div');
    orderSummary.id = 'order-summary';
    orderForm.appendChild(orderSummary);

    updateOrder(); //  Initial update to show empty order

    //  --- CSS STYLING ---
    const style = document.createElement('style');
    style.textContent = `
    #menu-search-container {
      margin-bottom: 10px;
      padding: 5px;
      border-bottom: 1px solid #ccc;
    }
    #menu-search {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
    #menu-container {
      height: 200px; /* Fixed height for the menu container */
      overflow-y: scroll; /* Enable vertical scrolling */
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    #menu-container::-webkit-scrollbar {
      display: none;
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    #menu-container {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `;
    document.head.appendChild(style);
}

//  --- FILTER MENU ITEMS ---
function filterMenuItems() {
    const searchTerm = document.getElementById('menu-search').value.toLowerCase();
    const menuItemDivs = document.querySelectorAll('.menu-item');

    menuItemDivs.forEach(div => {
        const itemName = div.getAttribute('data-name');
        if (itemName.includes(searchTerm)) {
            div.style.display = 'flex'; //  Or 'grid', or whatever your default is
        } else {
            div.style.display = 'none';
        }
    });
}

// changeQuantity, updateQuantity (same as before)
function changeQuantity(itemId, change) {
    const quantityInput = document.getElementById(`quantity-${itemId}`);
    let newQuantity = parseInt(quantityInput.value) + change;
    if (newQuantity < 0) newQuantity = 0;
    quantityInput.value = newQuantity;
    updateQuantity(itemId, newQuantity);
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity > 0) {
        order[itemId] = newQuantity;
        document.getElementById(`item-${itemId}`).checked = true;
    } else {
        delete order[itemId];
        document.getElementById(`item-${itemId}`).checked = false;
    }
    updateOrder(); //  Update summary on quantity change
}

// updateOrder - MODIFIED
function updateOrder(changedItem) {
    const orderSummary = document.getElementById('order-summary');
    orderSummary.innerHTML = '<h3>Order Summary</h3>';

    let totalAmount = 0;
    const orderItems = [];

    if (Object.keys(order).length === 0) {
        orderSummary.innerHTML = '<p>No items selected</p>';
        return;
    }

    //  --- ADD INVOICE HEADING AND CUSTOMER/TABLE INFO ---
    const currentTime = new Date().toLocaleTimeString();
    orderSummary.innerHTML = `
        <h3>Bill</h3> 
        <p>Time: ${currentTime}</p>
        <p>Table Number: ${selectedTable}</p>
        <p>Customer Name: ${customerDetails.customerName}</p>
        <p>Customer Mobile: ${customerDetails.customerMobile}</p>
    `;

    let tableHTML = `
    <table style="width: 100%; border-collapse: collapse;">  <thead style="background-color: #f2f2f2;">        <tr>
          <th style="padding: 8px; border: 1px solid #ddd;">Item</th>  <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
  `;

    for (const itemId in order) {
        const quantity = order[itemId];
        const menuItem = menuItems.find(item => item._id === itemId);
        if (menuItem) {
            const itemTotal = menuItem.price * quantity;
            totalAmount += itemTotal;
            tableHTML += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${menuItem.name}</td>  <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${menuItem.price}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${itemTotal}</td>
        </tr>
      `;
        }
    }

    tableHTML += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Total:</strong></td>  <td style="padding: 8px; border: 1px solid #ddd;">₹${totalAmount}</td>
        </tr>
      </tfoot>
    </table>
  `;

    orderSummary.innerHTML += tableHTML; //  Append table to heading

    //  Confirm Order Button (Now after invoice)
    const confirmOrderButton = document.createElement('button');
    confirmOrderButton.textContent = 'Confirm Order';
    confirmOrderButton.id = 'confirm-order-button';
    confirmOrderButton.addEventListener('click', () => processOrder());

    //  --- ADD/MODIFY THESE STYLES ---
    confirmOrderButton.style.backgroundColor = '#4CAF50';
    confirmOrderButton.style.color = 'white';
    confirmOrderButton.style.padding = '10px 20px';
    confirmOrderButton.style.border = '2px solid #45a049'; //  Added border
    confirmOrderButton.style.borderRadius = '5px';
    confirmOrderButton.style.cursor = 'pointer';
    confirmOrderButton.style.fontSize = '16px';
    confirmOrderButton.style.marginTop = '10px';
    confirmOrderButton.style.transition = 'background-color 0.3s ease, border-color 0.3s ease'; //  Smooth transition for border too

    confirmOrderButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#3e8e41';
        this.style.borderColor = '#3e8e41'; //  Darker border on hover
    });

    confirmOrderButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#4CAF50';
        this.style.borderColor = '#45a049';
    });

    orderSummary.appendChild(confirmOrderButton);

    //  --- ADD PRINT BUTTON ---
    const printButton = document.createElement('button');
    printButton.textContent = 'Print Bill';
    printButton.id = 'print-button';
    printButton.addEventListener('click', () => printInvoice());

    //  Apply same styles as Confirm Order button
    for (const styleProp of Object.keys(confirmOrderButton.style)) {
        printButton.style[styleProp] = confirmOrderButton.style[styleProp];
    }
    printButton.style.marginLeft = '10px'; // Add some spacing
    orderSummary.appendChild(printButton);
}

//  --- PRINT INVOICE FUNCTION ---
function printInvoice() {
    const printContents = document.getElementById('order-summary').innerHTML;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <html>
            <head>
                <title>Bill</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; border: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                ${printContents}
                <script>
                    // Function to close the window
                    function closeWindow() {
                        window.close();
                    }

                    // Try to print and close immediately
                    try {
                        window.print();
                        closeWindow();
                    } catch (e) {
                        closeWindow();
                    }
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
}

// processOrder - MODIFIED to save directly to OrderHistory (same as before)
async function processOrder() {
    if (Object.keys(order).length === 0) {
        messageDiv.textContent = 'No items selected.';
        return;
    }

    const orderItems = [];
    let totalAmount = 0;
    for (const itemId in order) {
        const quantity = order[itemId];
        const menuItem = menuItems.find(item => item._id === itemId);
        if (menuItem) {
            orderItems.push({
                itemId: menuItem._id,
                quantity: quantity,
                name: menuItem.name,
                price: menuItem.price
            });
            totalAmount += menuItem.price * quantity;
        }
    }

    const orderData = {
        tableNumber: selectedTable,
        customerName: customerDetails.customerName,
        customerMobile: customerDetails.customerMobile,
        items: orderItems
    };

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            //  Create OrderHistory directly
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Could not save order');
        }

        const responseData = await response.json();
        console.log('Order saved to OrderHistory:', responseData);

        order = {};
        customerDetails = {};
        orderForm.innerHTML = '';
        orderDetailsForm.style.display = 'flex';
        fetchTables();
        menuFetched = false;
        selectedTable = null;

        messageDiv.innerHTML =
            '<p style="margin-top: 20px; font-style: italic;">Order confirmed and saved. Select another table to start a new order.</p>';
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = error.message;
    }
}

// orderDetailsForm.addEventListener (same as before)
orderDetailsForm.addEventListener('submit', async event => {
    event.preventDefault();
    customerDetails.customerName = document.getElementById('customerName').value;
    customerDetails.customerMobile = document.getElementById('customerMobile').value;

    if (!selectedTable) {
        messageDiv.textContent = 'Please select a table first.';
        return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(customerDetails.customerMobile)) {
        messageDiv.textContent =
            'Invalid mobile number. Please enter a 10-digit number.';
        return;
    }

    orderForm.innerHTML = '';
    fetchMenu();

    messageDiv.textContent =
        'Menu fetched. Select items and quantities, then confirm the order.';
})