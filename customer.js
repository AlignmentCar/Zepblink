/**
 * ==========================================
 * CUSTOMER.JS - CUSTOMER-SPECIFIC FEATURES
 * ==========================================
 * For Urban Estate 2 Local Shop
 * Handles: My Orders, Order Tracking, Customer Profile
 */

console.log('✅ Customer Module Loaded');

// Global variables

let ordersCache = [];
let ordersLoaded = false;

/**
 * ==========================================
 * NAVIGATION - MY ORDERS PAGE
 * ==========================================
 */

/**
 * Navigate to My Orders Page
 */
function navigateToCustomerOrders() {
  console.log('📦 Navigating to My Orders');
  
  // Check if user is customer
  if (!window.currentUser || window.currentUser.role !== 'customer') {
    alert('⚠️ This page is only for customers.');
    return;
  }
  
  currentPage = 'myOrders';
  
  // Get all page elements
  const mainApp = document.getElementById('mainApp');
  const myOrdersPage = document.getElementById('myOrdersPage');
  const shopProductsPage = document.getElementById('shopProductsPage');
  const cartPage = document.getElementById('cartPage');
  
  // Hide all pages
  if (mainApp) {
    mainApp.style.display = 'none';
    mainApp.classList.remove('active');
  }
  
  if (shopProductsPage) {
    shopProductsPage.classList.remove('active');
    shopProductsPage.style.display = 'none';
  }
  
  if (cartPage) {
    cartPage.classList.remove('active');
    cartPage.style.display = 'none';
  }
  
  // Hide main navbar
  const mainNavbar = document.getElementById('mainAppNavbar');
  if (mainNavbar) {
    mainNavbar.style.display = 'none';
    console.log('✅ Hidden main app navbar');
  }
  
  const stickyNavbar = document.querySelector('.navbar.sticky-top');
  if (stickyNavbar) {
    stickyNavbar.style.display = 'none';
  }
  
  // Show My Orders page
  if (myOrdersPage) {
    myOrdersPage.classList.add('active');
    myOrdersPage.style.display = 'block';
    myOrdersPage.style.marginTop = '0';
    myOrdersPage.style.paddingTop = '0';
    console.log('✅ My Orders page displayed');
  } else {
    console.error('❌ myOrdersPage element not found!');
    return;
  }
  
  // Load orders
  loadCustomerOrders();
  
  // Close sidebar and scroll
  if (typeof closeSidebar === 'function') {
    closeSidebar();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Update hash
  window.location.hash = '#my-orders';
}

/**
 * Navigate back to Home from My Orders
 */
function goBackFromOrders() {
  console.log('🏠 Going back to home');
  
  const myOrdersPage = document.getElementById('myOrdersPage');
  if (myOrdersPage) {
    myOrdersPage.classList.remove('active');
    myOrdersPage.style.display = 'none';
  }
  
  // Show main app
  const mainApp = document.getElementById('mainApp');
  if (mainApp) {
    mainApp.style.display = 'block';
    mainApp.classList.add('active');
  }
  
  // Show navbar
  const mainNavbar = document.getElementById('mainAppNavbar');
  if (mainNavbar) {
    mainNavbar.style.display = 'flex';
  }
  
  const stickyNavbar = document.querySelector('.navbar.sticky-top');
  if (stickyNavbar) {
    stickyNavbar.style.display = 'flex';
  }
  
  currentPage = 'home';
  window.location.hash = '#home';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * ==========================================
 * LOAD CUSTOMER ORDERS
 * ==========================================
 */
/**
 * Load Customer Orders from Firestore (FIXED)
 */
/**
 * Load Customer Orders from Firestore (FIXED - Fallback Method Only)
 */
async function loadCustomerOrders() {
    console.log('📦 Loading customer orders...');
    
    const ordersContainer = document.getElementById('ordersListContainer');
    const emptyState = document.getElementById('ordersEmptyState');
    const orderStats = document.getElementById('orderStats');
    
    if (!ordersContainer) {
      console.error('❌ Orders container not found');
      return;
    }
    
    // Show loading
    ordersContainer.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Loading your orders...</p>
      </div>
    `;
    
    try {
      console.log('📦 Using fallback method: querying each shop individually');
      const { collection, getDocs, query, where } = window.firebaseImports;
      
      let allOrders = [];
      
      // Step 1: Get all shops
      const shopsRef = collection(window.db, 'shops');
      const shopsSnapshot = await getDocs(shopsRef);
      
      console.log(`✅ Found ${shopsSnapshot.size} shops`);
      
      if (shopsSnapshot.size === 0) {
        console.log('⚠️ No shops found');
        ordersCache = [];
        
        if (ordersContainer) ordersContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (orderStats) orderStats.style.display = 'none';
        return;
      }
      
      // Step 2: Query orders from each shop
      const orderPromises = [];
      
      shopsSnapshot.forEach((shopDoc) => {
        const ordersRef = collection(window.db, 'shops', shopDoc.id, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('customerId', '==', window.currentUser.uid)
        );
        
        console.log(`🔍 Querying orders from shop: ${shopDoc.id}`);
        orderPromises.push(getDocs(ordersQuery));
      });
      
      // Step 3: Wait for all queries to complete
      console.log(`⏳ Waiting for ${orderPromises.length} shop queries...`);
      const orderSnapshots = await Promise.all(orderPromises);
      
      // Step 4: Collect all orders
      let orderCount = 0;
      orderSnapshots.forEach((snapshot, index) => {
        console.log(`📦 Shop ${index + 1}: Found ${snapshot.size} orders`);
        
        snapshot.forEach((doc) => {
          allOrders.push({
            id: doc.id,
            ...doc.data()
          });
          orderCount++;
        });
      });
      
      console.log(`✅ Total orders collected: ${orderCount}`);
      
      // Step 5: Sort by date (newest first)
      allOrders.sort((a, b) => {
        const dateA = new Date(a.placedAt || 0);
        const dateB = new Date(b.placedAt || 0);
        return dateB - dateA;
      });
      
      ordersCache = allOrders;
      ordersLoaded = true;
      
      console.log(`✅ Loaded ${ordersCache.length} orders successfully`);
      
      // Render orders
      if (ordersCache.length > 0) {
        renderOrders(ordersCache);
        updateOrderStats(ordersCache);
        
        if (ordersContainer) ordersContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (orderStats) orderStats.style.display = 'flex';
      } else {
        // No orders found
        console.log('ℹ️ No orders found for this customer');
        
        if (ordersContainer) ordersContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (orderStats) orderStats.style.display = 'none';
      }
      
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      ordersContainer.innerHTML = `
        <div class="alert alert-danger" style="text-align:center; margin:20px;">
          <i class="bi bi-exclamation-triangle"></i>
          <strong>Error loading orders</strong><br>
          ${error.message}
          <br><br>
          <button class="btn btn-primary mt-2" onclick="loadCustomerOrders()">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
          <br><br>
          <small class="text-muted">Error Code: ${error.code || 'Unknown'}</small>
        </div>
      `;
    }
  }
  
  
/**
 * Render Orders List
 */
function renderOrders(orders) {
  const ordersContainer = document.getElementById('ordersListContainer');
  
  if (!ordersContainer || !orders || orders.length === 0) {
    return;
  }
  
  let html = '';
  
  orders.forEach(order => {
    const statusBadge = getOrderStatusBadge(order.status);
    const orderDate = formatOrderDate(order.placedAt);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    html += `
      <div class="order-card" onclick="viewOrderDetails('${order.id}')">
        <div class="order-header">
          <div>
            <div class="order-id">${order.orderId}</div>
            <div class="order-shop">
              <i class="bi bi-shop"></i> ${escapeHtml(order.shopName)}
            </div>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>
        
        <div class="order-body">
          <div class="order-items-summary">
            <i class="bi bi-box-seam"></i> ${totalItems} item${totalItems > 1 ? 's' : ''}
          </div>
          <div class="order-date">
            <i class="bi bi-calendar"></i> ${orderDate}
          </div>
          ${order.deliveryTime ? `
            <div class="order-delivery-time">
              <i class="bi bi-clock"></i> Delivery: ${order.deliveryTime}
            </div>
          ` : ''}
        </div>
        
        <div class="order-footer">
          <div class="order-total">
            <span>Total:</span>
            <strong>₹${order.total.toFixed(2)}</strong>
          </div>
          <div class="order-payment">
            <span class="badge bg-warning text-dark">
              <i class="bi bi-cash"></i> COD
            </span>
          </div>
        </div>
      </div>
    `;
  });
  
  ordersContainer.innerHTML = html;
}

/**
 * Get Order Status Badge HTML
 */
function getOrderStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history"></i> Pending</span>',
    'accepted': '<span class="badge bg-info"><i class="bi bi-check-circle"></i> Accepted</span>',
    'preparing': '<span class="badge bg-primary"><i class="bi bi-gear"></i> Preparing</span>',
    'ready': '<span class="badge bg-success"><i class="bi bi-bag-check"></i> Ready</span>',
    'out_for_delivery': '<span class="badge bg-primary"><i class="bi bi-truck"></i> Out for Delivery</span>',
    'delivered': '<span class="badge bg-success"><i class="bi bi-check-circle-fill"></i> Delivered</span>',
    'cancelled': '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Cancelled</span>',
    'rejected': '<span class="badge bg-danger"><i class="bi bi-x-circle-fill"></i> Rejected</span>'
  };
  
  return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

/**
 * Format Order Date
 */
function formatOrderDate(timestamp) {
  if (!timestamp) return 'Unknown date';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

/**
 * Update Order Statistics
 */
function updateOrderStats(orders) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Update stat cards
  const totalOrdersEl = document.getElementById('totalOrdersCount');
  const pendingOrdersEl = document.getElementById('pendingOrdersCount');
  const deliveredOrdersEl = document.getElementById('deliveredOrdersCount');
  const totalSpentEl = document.getElementById('totalSpentAmount');
  
  if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
  if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
  if (deliveredOrdersEl) deliveredOrdersEl.textContent = deliveredOrders;
  if (totalSpentEl) totalSpentEl.textContent = `₹${totalSpent.toFixed(2)}`;
}

/**
 * ==========================================
 * FILTER & SEARCH ORDERS
 * ==========================================
 */

/**
 * Filter Orders by Status
 */
function filterOrdersByStatus(status) {
  console.log('🔍 Filtering orders by status:', status);
  
  let filteredOrders = ordersCache;
  
  if (status !== 'all') {
    filteredOrders = ordersCache.filter(order => order.status === status);
  }
  
  renderOrders(filteredOrders);
  
  // Update active filter button
  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`[data-status="${status}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

/**
 * Sort Orders
 */
function sortOrders(sortBy) {
  console.log('🔄 Sorting orders by:', sortBy);
  
  let sortedOrders = [...ordersCache];
  
  if (sortBy === 'newest') {
    sortedOrders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  } else if (sortBy === 'oldest') {
    sortedOrders.sort((a, b) => new Date(a.placedAt) - new Date(b.placedAt));
  } else if (sortBy === 'highest') {
    sortedOrders.sort((a, b) => b.total - a.total);
  } else if (sortBy === 'lowest') {
    sortedOrders.sort((a, b) => a.total - b.total);
  }
  
  renderOrders(sortedOrders);
}

/**
 * Search Orders
 */
function searchOrders(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) {
    renderOrders(ordersCache);
    return;
  }
  
  const filteredOrders = ordersCache.filter(order => {
    return (
      order.orderId.toLowerCase().includes(term) ||
      order.shopName.toLowerCase().includes(term) ||
      order.items.some(item => item.name.toLowerCase().includes(term))
    );
  });
  
  renderOrders(filteredOrders);
  
  console.log(`🔍 Search results: ${filteredOrders.length} orders found`);
}

/**
 * ==========================================
 * VIEW ORDER DETAILS
 * ==========================================
 */

/**
 * View Order Details (Show modal with full order info)
 */
function viewOrderDetails(orderId) {
  console.log('👁️ Viewing order details:', orderId);
  
  const order = ordersCache.find(o => o.id === orderId);
  
  if (!order) {
    console.error('❌ Order not found');
    return;
  }
  
  // Populate modal with order details
  const modalBody = document.getElementById('orderDetailsModalBody');
  
  if (!modalBody) {
    console.error('❌ Order details modal not found');
    return;
  }
  
  const statusBadge = getOrderStatusBadge(order.status);
  const orderDate = new Date(order.placedAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let itemsHtml = '';
  order.items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    itemsHtml += `
      <tr>
        <td>${escapeHtml(item.name)}${item.brand ? `<br><small class="text-muted">${escapeHtml(item.brand)}</small>` : ''}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">₹${item.price.toFixed(2)}</td>
        <td class="text-end"><strong>₹${itemTotal.toFixed(2)}</strong></td>
      </tr>
    `;
  });
  
  modalBody.innerHTML = `
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h5 class="mb-1">${order.orderId}</h5>
          <p class="text-muted mb-0">
            <i class="bi bi-calendar"></i> ${orderDate}
          </p>
        </div>
        <div>
          ${statusBadge}
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-title"><i class="bi bi-shop"></i> Shop Details</h6>
          <p class="mb-0"><strong>${escapeHtml(order.shopName)}</strong></p>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-title"><i class="bi bi-geo-alt"></i> Delivery Address</h6>
          <p class="mb-0">
            <strong>${escapeHtml(order.deliveryAddress.name)}</strong><br>
            ${escapeHtml(order.deliveryAddress.fullAddress)}<br>
            <i class="bi bi-phone"></i> ${escapeHtml(order.deliveryAddress.phone)}
          </p>
        </div>
      </div>
      
      ${order.deliveryTime ? `
        <div class="alert alert-info">
          <i class="bi bi-clock"></i> <strong>Estimated Delivery:</strong> ${order.deliveryTime}
        </div>
      ` : ''}
      
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-title"><i class="bi bi-box-seam"></i> Order Items</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-end">Price</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <strong>₹${order.subtotal.toFixed(2)}</strong>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Delivery Fee:</span>
            <strong class="text-success">FREE</strong>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Tax (GST):</span>
            <strong>₹0</strong>
          </div>
          <hr>
          <div class="d-flex justify-content-between">
            <h5>Total Amount:</h5>
            <h5 class="text-success">₹${order.total.toFixed(2)}</h5>
          </div>
          <div class="mt-2">
            <span class="badge bg-warning text-dark">
              <i class="bi bi-cash"></i> Cash on Delivery
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Show modal
  const orderDetailsModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
  orderDetailsModal.show();
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions global
window.navigateToCustomerOrders = navigateToCustomerOrders;
window.goBackFromOrders = goBackFromOrders;
window.loadCustomerOrders = loadCustomerOrders;
window.filterOrdersByStatus = filterOrdersByStatus;
window.sortOrders = sortOrders;
window.searchOrders = searchOrders;
window.viewOrderDetails = viewOrderDetails;

console.log('✅ Customer.js ready');



/**
 * Proceed to Checkout (UPDATED with saved address integration)
 */
async function proceedToCheckout() {
    console.log('🛒 Proceeding to checkout');
    
    // Validate cart
    if (!cart.items || cart.items.length === 0) {
      alert('⚠️ Your cart is empty!');
      return;
    }
    
    // Validate user
    if (!window.currentUser) {
      alert('⚠️ Please sign in to continue!');
      return;
    }
    
    // ✅ Hide mini-cart footer during checkout
    if (typeof hideMiniCartFooter === 'function') {
      hideMiniCartFooter();
    } else {
      const miniCartFooter = document.getElementById('miniCartFooter');
      if (miniCartFooter) {
        miniCartFooter.style.display = 'none';
      }
    }
    
    // ✅ Load saved delivery address
    await loadSavedDeliveryAddress();
    
    // ✅ Show/hide address sections based on saved address
    const savedAddressDiv = document.getElementById('checkoutSavedAddress');
    const noAddressDiv = document.getElementById('checkoutNoAddress');
    
    if (savedDeliveryAddress) {
      // Show saved address
      if (savedAddressDiv) {
        savedAddressDiv.style.display = 'block';
        document.getElementById('savedAddressName').textContent = savedDeliveryAddress.name;
        document.getElementById('savedAddressDetails').textContent = savedDeliveryAddress.fullAddress;
        document.getElementById('savedAddressPhone').textContent = savedDeliveryAddress.phone;
      }
      if (noAddressDiv) {
        noAddressDiv.style.display = 'none';
      }
      console.log('✅ Showing saved delivery address');
    } else {
      // Show no address state
      if (savedAddressDiv) {
        savedAddressDiv.style.display = 'none';
      }
      if (noAddressDiv) {
        noAddressDiv.style.display = 'block';
      }
      console.log('⚠️ No saved delivery address found');
    }
    
    // Populate checkout summary
    populateCheckoutSummary();
    
    // Show modal
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    checkoutModal.show();
    
    console.log('✅ Checkout modal opened');
  }
  
  // Make it global
  window.proceedToCheckout = proceedToCheckout;
  
  
  
  /**
   * Checkout Modal Event Listeners (NEW)
   */
   document.addEventListener('DOMContentLoaded', function() {
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (checkoutModal) {
      // ✅ Hide mini-cart when modal opens
      checkoutModal.addEventListener('show.bs.modal', function () {
        console.log('📦 Checkout modal opening - hiding mini-cart');
        
        if (typeof hideMiniCartFooter === 'function') {
          hideMiniCartFooter();
        } else {
          const miniCartFooter = document.getElementById('miniCartFooter');
          if (miniCartFooter) {
            miniCartFooter.style.display = 'none';
          }
        }
      });
      
      // ✅ Show mini-cart when modal closes (if cart has items)
      checkoutModal.addEventListener('hidden.bs.modal', function () {
        console.log('📦 Checkout modal closed - checking cart');
        
        // Only show mini-cart if we're still on cart page and cart has items
        const cartPage = document.getElementById('cartPage');
        const isOnCartPage = cartPage && cartPage.style.display !== 'none';
        
        if (!isOnCartPage && cart.items.length > 0) {
          // Not on cart page - show mini-cart
          if (typeof showMiniCartFooter === 'function') {
            showMiniCartFooter();
          } else {
            updateMiniCart();
          }
        }
      });
      
      console.log('✅ Checkout modal event listeners attached');
    }
  });
  
  /**
   * Populate Checkout Summary
   */
  function populateCheckoutSummary() {
    const itemsList = document.getElementById('checkoutItemsList');
    const itemCount = document.getElementById('checkoutItemCount');
    const subtotal = document.getElementById('checkoutSubtotal');
    const total = document.getElementById('checkoutTotal');
    
    if (!itemsList || !cart.items) return;
    
    // Render items
    let html = '';
    cart.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      html += `
        <div class="checkout-item">
          <div class="checkout-item-details">
            <div class="checkout-item-name">${escapeHtml(item.name)}</div>
            <div class="checkout-item-meta">
              Qty: ${item.quantity} × ₹${item.price.toFixed(2)}
              ${item.brand ? `<br><small>Brand: ${escapeHtml(item.brand)}</small>` : ''}
            </div>
          </div>
          <div class="checkout-item-price">₹${itemTotal.toFixed(2)}</div>
        </div>
      `;
    });
    
    itemsList.innerHTML = html;
    
    // Calculate totals
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    itemCount.textContent = totalItems;
    subtotal.textContent = subtotalAmount.toFixed(2);
    total.textContent = subtotalAmount.toFixed(2);
    
    console.log('✅ Checkout summary populated:', totalItems, 'items, ₹', subtotalAmount);
  }
  
  /**
   * Validate Phone Number
   */
  function validatePhone() {
    const phoneInput = document.getElementById('checkoutPhone');
    const phoneError = document.getElementById('phoneError');
    const phone = phoneInput.value.trim();
    
    // Remove non-numeric characters
    phoneInput.value = phone.replace(/\D/g, '');
    
    const phoneRegex = /^[6-9][0-9]{9}$/;
    
    if (phone.length === 0) {
      phoneInput.classList.remove('is-valid', 'is-invalid');
      return false;
    } else if (!phoneRegex.test(phone)) {
      phoneInput.classList.remove('is-valid');
      phoneInput.classList.add('is-invalid');
      phoneError.textContent = 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)';
      return false;
    } else {
      phoneInput.classList.remove('is-invalid');
      phoneInput.classList.add('is-valid');
      return true;
    }
  }
  
  /**
   * Validate Address
   */
  function validateAddress() {
    const addressInput = document.getElementById('checkoutAddress');
    const addressError = document.getElementById('addressError');
    const address = addressInput.value.trim();
    
    if (address.length === 0) {
      addressInput.classList.remove('is-valid', 'is-invalid');
      addressError.textContent = 'Please enter your house/flat number';
      return false;
    } else if (address.length < 3) {
      addressInput.classList.remove('is-valid');
      addressInput.classList.add('is-invalid');
      addressError.textContent = 'Address is too short (minimum 3 characters)';
      return false;
    } else {
      addressInput.classList.remove('is-invalid');
      addressInput.classList.add('is-valid');
      return true;
    }
  }
  
  /**
   * Validate Area (Must be Urban Estate 2)
   */
  function validateArea() {
    const areaInput = document.getElementById('checkoutArea');
    const areaError = document.getElementById('areaError');
    const area = areaInput.value.trim().toLowerCase();
    
    // Valid area keywords
    const validKeywords = [
      'urban estate 2',
      'urban estate2',
      'urbanestate 2',
      'urbanestate2',
      'ue2',
      'ue 2',
      'u.e.2',
      'u.e. 2',
      'hisar ue2',
      'hisar urban estate 2'
    ];
    
    if (area.length === 0) {
      areaInput.classList.remove('is-valid', 'is-invalid');
      return false;
    }
    
    // Check if area contains any valid keyword
    const isValid = validKeywords.some(keyword => area.includes(keyword));
    
    if (!isValid) {
      areaInput.classList.remove('is-valid');
      areaInput.classList.add('is-invalid');
      areaError.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i> 
        <strong>Delivery available only within Urban Estate 2</strong> — please update your address
      `;
      return false;
    } else {
      areaInput.classList.remove('is-invalid');
      areaInput.classList.add('is-valid');
      return true;
    }
  }
  /**
   * Confirm Checkout Order (UPDATED to use saved address)
   */
   async function confirmCheckoutOrder() {
    console.log('✅ Confirming order...');
    
    // ✅ Check if delivery address is saved
    if (!savedDeliveryAddress) {
      alert('⚠️ Please save your delivery address first!\n\nClick "Edit" button to add your delivery address.');
      return;
    }
    
    // Prepare order data with saved address
    const orderData = {
      orderId: generateOrderId(),
      customerId: window.currentUser.uid,
      customerName: savedDeliveryAddress.name,
      customerEmail: window.currentUser.email,
      shopId: cart.shopId,
      shopName: cart.shopName,
      shopOwnerId: cart.shopOwnerId,
      items: cart.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        brand: item.brand || '',
        size: item.size || ''
      })),
      deliveryAddress: {
        name: savedDeliveryAddress.name,
        phone: savedDeliveryAddress.phone,
        house: savedDeliveryAddress.house,
        area: savedDeliveryAddress.area,
        landmark: savedDeliveryAddress.landmark || '',
        fullAddress: savedDeliveryAddress.fullAddress
      },
      subtotal: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      deliveryFee: 0,
      tax: 0,
      total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      paymentMethod: 'COD',
      status: 'pending',
      placedAt: new Date().toISOString(),
      deliveredAt: null,
      estimatedDelivery: calculateEstimatedDelivery()
    };
    
    // Disable confirm button
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing Order...';
    }
    
    try {
      // Save order to Firestore
      const { collection, addDoc, serverTimestamp } = window.firebaseImports;
      
      const ordersRef = collection(window.db, 'shops', cart.shopId, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        placedAt: serverTimestamp()
      });
      
      console.log('✅ Order placed successfully:', docRef.id);
      
      // Clear cart
      clearCart();
      
      // Close modal
      const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
      if (checkoutModal) {
        checkoutModal.hide();
      }
      
      // Show success message
      showOrderSuccessModal(orderData.orderId, orderData.total);
      
      // Navigate to My Orders page
      setTimeout(() => {
        if (typeof navigateToCustomerOrders === 'function') {
          navigateToCustomerOrders();
        } else {
          goBackHome();
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert('❌ Failed to place order. Please try again.\n\nError: ' + error.message);
      
      // Re-enable button
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirm Order';
      }
    }
  }
  
  // Make it global
  window.confirmCheckoutOrder = confirmCheckoutOrder;
  
  /**
   * Generate Unique Order ID
   */
   function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }
  
  /**
   * Calculate Estimated Delivery Time
   */
  function calculateEstimatedDelivery() {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes
    
    return deliveryTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  /**
   * Populate Checkout Summary
   */
  function populateCheckoutSummary() {
    const itemsList = document.getElementById('checkoutItemsList');
    const itemCount = document.getElementById('checkoutItemCount');
    const subtotal = document.getElementById('checkoutSubtotal');
    const total = document.getElementById('checkoutTotal');
    
    if (!itemsList) return;
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Populate items
    let html = '';
    cart.items.forEach(item => {
      html += `
        <div class="d-flex justify-content-between mb-2" style="padding: 8px; background: #f8f9fa; border-radius: 6px;">
          <div style="flex: 1;">
            <strong>${escapeHtml(item.name)}</strong>
            <br>
            <small class="text-muted">Qty: ${item.quantity} × ₹${item.price.toFixed(2)}</small>
          </div>
          <div style="text-align: right;">
            <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        </div>
      `;
    });
    
    itemsList.innerHTML = html;
    
    // Update totals
    if (itemCount) itemCount.textContent = totalItems;
    if (subtotal) subtotal.textContent = totalAmount.toFixed(2);
    if (total) total.textContent = totalAmount.toFixed(2);
  }
  
  /**
   * Show Order Success Modal
   */
  function showOrderSuccessModal(orderId, total) {
    alert(`🎉 Order Placed Successfully!\n\nOrder ID: ${orderId}\nTotal: ₹${total.toFixed(2)}\n\nYou will be redirected to My Orders page.`);
  }
  
  // Make functions global
  window.generateOrderId = generateOrderId;
  window.calculateEstimatedDelivery = calculateEstimatedDelivery;
  window.populateCheckoutSummary = populateCheckoutSummary;
  window.showOrderSuccessModal = showOrderSuccessModal;
  
  
  // Make functions global
  window.proceedToCheckout = proceedToCheckout;
  window.validatePhone = validatePhone;
  window.validateAddress = validateAddress;
  window.validateArea = validateArea;
  window.confirmCheckoutOrder = confirmCheckoutOrder;
  
  
  /**
   * Update Sidebar Based on User Role
   */
   function updateSidebarForUser() {
    const myOrdersLink = document.getElementById('myOrdersLink');
    
    if (!myOrdersLink) {
      console.warn('⚠️ myOrdersLink element not found in sidebar');
      return;
    }
    
    // Show "My Orders" only for customers
    if (window.currentUser && window.currentUser.role === 'customer') {
      myOrdersLink.style.display = 'block';
      console.log('✅ My Orders link shown (customer role)');
    } else {
      myOrdersLink.style.display = 'none';
      console.log('ℹ️ My Orders link hidden (not a customer)');
    }
    
    // You can add more role-based sidebar updates here
    // Example: Show "Manage Shop" only for shopowners
  }
  
  // Make it global
  window.updateSidebarForUser = updateSidebarForUser;
  
  
  
  /**
   * Show Mini Cart Footer (UPDATED with padding management)
   */
   function showMiniCartFooter() {
    const miniCartFooter = document.getElementById('miniCartFooter');
    const miniCartSpacer = document.getElementById('miniCartSpacer');
    
    if (miniCartFooter) {
      miniCartFooter.style.display = 'block';
    }
    
    // ✅ NEW: Show spacer to push content up
    if (miniCartSpacer) {
      miniCartSpacer.style.display = 'block';
    }
    
    // ✅ NEW: Add bottom padding to all page containers
    addBottomPaddingToPages();
    
    console.log('✅ Mini cart footer shown with padding');
  }
  
  /**
   * Hide Mini Cart Footer (UPDATED with padding management)
   */
  function hideMiniCartFooter() {
    const miniCartFooter = document.getElementById('miniCartFooter');
    const miniCartSpacer = document.getElementById('miniCartSpacer');
    
    if (miniCartFooter) {
      miniCartFooter.style.display = 'none';
    }
    
    // ✅ NEW: Hide spacer
    if (miniCartSpacer) {
      miniCartSpacer.style.display = 'none';
    }
    
    // ✅ NEW: Remove bottom padding from all pages
    removeBottomPaddingFromPages();
    
    console.log('✅ Mini cart footer hidden, padding removed');
  }
  
  /**
   * Add Bottom Padding to All Page Containers (NEW)
   */
  function addBottomPaddingToPages() {
    // Main app container
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
      const mainContent = mainApp.querySelector('.main-content, .container');
      if (mainContent) {
        mainContent.style.paddingBottom = '100px';
      }
    }
    
    // Shop products page
    const shopProductsPage = document.getElementById('shopProductsPage');
    if (shopProductsPage) {
      const productsContainer = shopProductsPage.querySelector('.container');
      if (productsContainer) {
        productsContainer.style.paddingBottom = '100px';
      }
    }
    
    // Shop products grid
    const shopProductsGrid = document.getElementById('shopProductsGrid');
    if (shopProductsGrid) {
      shopProductsGrid.style.paddingBottom = '20px';
    }
    
    // My Orders page
    const myOrdersPage = document.getElementById('myOrdersPage');
    if (myOrdersPage) {
      const ordersContainer = myOrdersPage.querySelector('.container');
      if (ordersContainer) {
        ordersContainer.style.paddingBottom = '100px';
      }
    }
    
    console.log('✅ Bottom padding added to all pages');
  }
  
  /**
   * Remove Bottom Padding from All Page Containers (NEW)
   */
  function removeBottomPaddingFromPages() {
    // Main app container
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
      const mainContent = mainApp.querySelector('.main-content, .container');
      if (mainContent) {
        mainContent.style.paddingBottom = '20px';
      }
    }
    
    // Shop products page
    const shopProductsPage = document.getElementById('shopProductsPage');
    if (shopProductsPage) {
      const productsContainer = shopProductsPage.querySelector('.container');
      if (productsContainer) {
        productsContainer.style.paddingBottom = '20px';
      }
    }
    
    // Shop products grid
    const shopProductsGrid = document.getElementById('shopProductsGrid');
    if (shopProductsGrid) {
      shopProductsGrid.style.paddingBottom = '0';
    }
    
    // My Orders page
    const myOrdersPage = document.getElementById('myOrdersPage');
    if (myOrdersPage) {
      const ordersContainer = myOrdersPage.querySelector('.container');
      if (ordersContainer) {
        ordersContainer.style.paddingBottom = '20px';
      }
    }
    
    console.log('✅ Bottom padding removed from all pages');
  }
  
  // Make functions global
  window.showMiniCartFooter = showMiniCartFooter;
  window.hideMiniCartFooter = hideMiniCartFooter;
  window.addBottomPaddingToPages = addBottomPaddingToPages;
  window.removeBottomPaddingFromPages = removeBottomPaddingFromPages;
  
  
  /**
   * ==========================================
   * DELIVERY ADDRESS MANAGEMENT
   * ==========================================
   */
  
  // Global variable for saved address
  let savedDeliveryAddress = null;
  /**
   * Open Delivery Address Modal (UPDATED for nested modal support)
   */
   function openDeliveryAddressModal() {
    console.log('📍 Opening delivery address modal');
    
    if (!window.currentUser) {
      alert('⚠️ Please sign in to manage your delivery address.');
      return;
    }
    
    // Load saved address
    loadSavedDeliveryAddress();
    
    // ✅ Get references to both modals
    const addressModalEl = document.getElementById('deliveryAddressModal');
    const checkoutModalEl = document.getElementById('checkoutModal');
    
    // ✅ Check if checkout modal is open
    const isCheckoutOpen = checkoutModalEl && checkoutModalEl.classList.contains('show');
    
    if (isCheckoutOpen) {
      console.log('🔄 Checkout modal is open, opening address modal on top');
      
      // ✅ Store reference that we came from checkout
      window.openedFromCheckout = true;
      
      // ✅ Create and show address modal with higher z-index
      const addressModal = new bootstrap.Modal(addressModalEl, {
        backdrop: 'static',
        keyboard: false
      });
      addressModal.show();
      
      // ✅ Force z-index after modal opens
      setTimeout(() => {
        addressModalEl.style.zIndex = '10100';
        
        // Find and update backdrop z-index
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
          const lastBackdrop = backdrops[backdrops.length - 1];
          lastBackdrop.style.zIndex = '10050';
        }
      }, 100);
      
    } else {
      // Normal opening (not from checkout)
      window.openedFromCheckout = false;
      const addressModal = new bootstrap.Modal(addressModalEl);
      addressModal.show();
    }
  }
  
  
  /**
   * Load Saved Delivery Address from Firestore
   */
  async function loadSavedDeliveryAddress() {
    console.log('📦 Loading saved delivery address...');
    
    try {
      const { doc, getDoc } = window.firebaseImports;
      
      const addressDocRef = doc(window.db, 'users', window.currentUser.uid, 'deliveryAddress', 'default');
      const addressDoc = await getDoc(addressDocRef);
      
      if (addressDoc.exists()) {
        savedDeliveryAddress = addressDoc.data();
        console.log('✅ Loaded saved address:', savedDeliveryAddress);
        
        // Pre-fill form
        document.getElementById('addressName').value = savedDeliveryAddress.name || '';
        document.getElementById('addressPhone').value = savedDeliveryAddress.phone || '';
        document.getElementById('addressHouse').value = savedDeliveryAddress.house || '';
        document.getElementById('addressLandmark').value = savedDeliveryAddress.landmark || '';
        
      } else {
        console.log('ℹ️ No saved address found');
        
        // Pre-fill with user data
        if (window.currentUser.displayName) {
          document.getElementById('addressName').value = window.currentUser.displayName;
        }
        
        savedDeliveryAddress = null;
      }
      
    } catch (error) {
      console.error('❌ Error loading saved address:', error);
    }
  }
  
  /**
   * Save Delivery Address (UPDATED to refresh checkout after save)
   */
   async function saveDeliveryAddress() {
    console.log('💾 Saving delivery address...');
    
    // Validate form
    const form = document.getElementById('deliveryAddressForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      alert('⚠️ Please fill in all required fields!');
      return;
    }
    
    // Get form data
    const name = document.getElementById('addressName').value.trim();
    const phone = document.getElementById('addressPhone').value.trim();
    const house = document.getElementById('addressHouse').value.trim();
    const landmark = document.getElementById('addressLandmark').value.trim();
    
    // Validate phone
    if (!/^[0-9]{10}$/.test(phone)) {
      alert('⚠️ Please enter a valid 10-digit phone number!');
      document.getElementById('addressPhone').focus();
      return;
    }
    
    // Prepare address data
    const addressData = {
      name: name,
      phone: phone,
      house: house,
      area: 'Urban Estate 2, Hisar',
      landmark: landmark,
      fullAddress: `${house}, ${landmark ? landmark + ', ' : ''}Urban Estate 2, Hisar`,
      updatedAt: new Date().toISOString()
    };
    
    try {
      const { doc, setDoc, serverTimestamp } = window.firebaseImports;
      
      const addressDocRef = doc(window.db, 'users', window.currentUser.uid, 'deliveryAddress', 'default');
      
      await setDoc(addressDocRef, {
        ...addressData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Address saved successfully');
      
      // Update global variable
      savedDeliveryAddress = addressData;
      
      // Close modal
      closeDeliveryAddressModal();
      
      // ✅ If opened from checkout, update checkout display
      if (window.openedFromCheckout) {
        setTimeout(() => {
          updateCheckoutAddress();
        }, 400);
      }
      
      // Show success message
      alert('✅ Delivery address saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving address:', error);
      alert('❌ Failed to save address. Please try again.\n\nError: ' + error.message);
    }
  }
  
  
  /**
   * Get Saved Delivery Address (for checkout)
   */
  function getSavedDeliveryAddress() {
    return savedDeliveryAddress;
  }
  
  // Make functions global
  window.openDeliveryAddressModal = openDeliveryAddressModal;
  window.loadSavedDeliveryAddress = loadSavedDeliveryAddress;
  window.saveDeliveryAddress = saveDeliveryAddress;
  window.getSavedDeliveryAddress = getSavedDeliveryAddress;
  window.savedDeliveryAddress = savedDeliveryAddress;
  
  console.log('✅ Delivery address management loaded');
  
  
  /**
   * Close Delivery Address Modal (UPDATED)
   */
   function closeDeliveryAddressModal() {
    console.log('❌ Closing delivery address modal');
    
    const addressModalEl = document.getElementById('deliveryAddressModal');
    const addressModal = bootstrap.Modal.getInstance(addressModalEl);
    
    if (addressModal) {
      addressModal.hide();
    }
    
    // ✅ If opened from checkout, restore checkout modal focus
    if (window.openedFromCheckout) {
      setTimeout(() => {
        const checkoutModalEl = document.getElementById('checkoutModal');
        if (checkoutModalEl && checkoutModalEl.classList.contains('show')) {
          // Restore focus to checkout modal
          checkoutModalEl.focus();
        }
        window.openedFromCheckout = false;
      }, 300);
    }
  }
  
  /**
   * Update Checkout Address Display (NEW)
   */
   function updateCheckoutAddress() {
    console.log('🔄 Updating checkout address display');
    
    const savedAddressDiv = document.getElementById('checkoutSavedAddress');
    const noAddressDiv = document.getElementById('checkoutNoAddress');
    
    if (savedDeliveryAddress) {
      // Show saved address
      if (savedAddressDiv) {
        savedAddressDiv.style.display = 'block';
        document.getElementById('savedAddressName').textContent = savedDeliveryAddress.name;
        document.getElementById('savedAddressDetails').textContent = savedDeliveryAddress.fullAddress;
        document.getElementById('savedAddressPhone').textContent = savedDeliveryAddress.phone;
      }
      if (noAddressDiv) {
        noAddressDiv.style.display = 'none';
      }
      console.log('✅ Checkout address updated');
    }
  }
  
  // Make functions global
  window.openDeliveryAddressModal = openDeliveryAddressModal;
  window.closeDeliveryAddressModal = closeDeliveryAddressModal;
  window.saveDeliveryAddress = saveDeliveryAddress;
  window.updateCheckoutAddress = updateCheckoutAddress;
  window.openedFromCheckout = false;
  
  /**
   * Modal Event Listeners (UPDATED for nested modals)
   */
   document.addEventListener('DOMContentLoaded', function() {
    
    // Delivery Address Modal Events
    const deliveryAddressModal = document.getElementById('deliveryAddressModal');
    if (deliveryAddressModal) {
      deliveryAddressModal.addEventListener('shown.bs.modal', function () {
        console.log('📍 Delivery address modal shown');
        
        // Force z-index
        this.style.zIndex = '10100';
        
        // Update backdrop z-index
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
          const lastBackdrop = backdrops[backdrops.length - 1];
          lastBackdrop.style.zIndex = '10050';
        }
      });
      
      deliveryAddressModal.addEventListener('hidden.bs.modal', function () {
        console.log('❌ Delivery address modal hidden');
        
        // Clean up backdrop if needed
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 1) {
          // Remove extra backdrops
          for (let i = 1; i < backdrops.length; i++) {
            backdrops[i].remove();
          }
        }
      });
    }
    
    // Checkout Modal Events
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
      checkoutModal.addEventListener('show.bs.modal', function () {
        console.log('📦 Checkout modal opening');
        if (typeof hideMiniCartFooter === 'function') {
          hideMiniCartFooter();
        }
      });
      
      checkoutModal.addEventListener('hidden.bs.modal', function () {
        console.log('📦 Checkout modal closed');
        
        // Show mini-cart if cart has items and not on cart page
        const cartPage = document.getElementById('cartPage');
        const isOnCartPage = cartPage && cartPage.style.display !== 'none';
        
        if (!isOnCartPage && cart.items.length > 0) {
          if (typeof updateMiniCart === 'function') {
            updateMiniCart();
          }
        }
      });
    }
    
    console.log('✅ Modal event listeners attached');
  });

  
/**
 * ==========================================
 * CART MANAGEMENT SYSTEM (UPDATED with Featured Products)
 * ==========================================
 */


// Global cart state
let cart = {
    items: [],
    shopId: null,
    shopName: null,
    shopOwnerId: null
  };
  
  
  // Pending item for shop conflict resolution
  let pendingCartItem = null;
  
  
  /**
   * Initialize Cart from Storage
   */
  function initializeCart() {
    try {
      const savedCart = localStorage.getItem('ue2shop_cart');
      if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('✅ Cart loaded from storage:', cart);
        updateMiniCart();
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      cart = { items: [], shopId: null, shopName: null, shopOwnerId: null };
    }
  }
  
  
  /**
   * Save Cart to Storage
   */
  function saveCart() {
    try {
      localStorage.setItem('ue2shop_cart', JSON.stringify(cart));
      console.log('💾 Cart saved to storage');
    } catch (error) {
      console.error('❌ Error saving cart:', error);
    }
  }
  
  
  /**
   * Add Product to Cart (UPDATED with featured products refresh)
   */
  function addToCart(product) {
    console.log('🛒 Add to cart:', product);
    
    // Check if customer
    if (!window.currentUser || window.currentUser.role !== 'customer') {
      alert('⚠️ Only customers can add items to cart. Please sign in as a customer.');
      return;
    }
    
    // Check stock
    if (product.stock <= 0) {
      alert('❌ This product is out of stock!');
      return;
    }
    
    // Check shop conflict
    if (cart.shopId && cart.shopId !== product.shopId) {
      // Different shop - show conflict modal
      pendingCartItem = product;
      showShopConflictModal(cart.shopName, product.shopName);
      return;
    }
    
    // Set shop info if first item
    if (!cart.shopId) {
      cart.shopId = product.shopId;
      cart.shopName = product.shopName;
      cart.shopOwnerId = product.ownerId;
    }
    
    // Check if product already in cart
    const existingItem = cart.items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increase quantity
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        console.log('✅ Increased quantity:', existingItem.quantity);
      } else {
        alert('⚠️ Cannot add more. Stock limit reached!');
        return;
      }
    } else {
      // Add new item
      cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        stock: product.stock,
        quantity: 1,
        brand: product.brand || '',
        size: product.size || '',
        shopId: product.shopId,
        shopName: product.shopName,
        ownerId: product.ownerId
      });
      console.log('✅ Added new item to cart');
    }
    
    // Save and update UI
    saveCart();
    updateMiniCart();
    updateCartPage();
    
    // Re-render products to show stepper
    if (typeof allShopProducts !== 'undefined' && allShopProducts) {
      renderShopProducts(allShopProducts);
    }
    
    // ✅ NEW: Update featured products display
    if (typeof refreshFeaturedProductsDisplay === 'function') {
      refreshFeaturedProductsDisplay();
    }
    
    // Show success animation
    showMiniCartBriefly();
  }
  
  
  /**
   * Update Item Quantity in Cart (UPDATED with featured products refresh)
   */
  function updateCartQuantity(productId, change) {
    const item = cart.items.find(i => i.id === productId);
    
    if (!item) {
      console.warn('⚠️ Item not found in cart:', productId);
      return;
    }
    
    const newQuantity = item.quantity + change;
    
    // Remove item if quantity becomes 0 or negative
    if (newQuantity <= 0) {
      console.log('🗑️ Quantity reached 0, removing item');
      removeFromCart(productId);
      return;
    }
    
    // Check stock limit
    if (newQuantity > item.stock) {
      alert('⚠️ Cannot add more. Stock limit reached!');
      return;
    }
    
    // Update quantity
    item.quantity = newQuantity;
    console.log(`✅ Updated quantity: ${item.name} = ${item.quantity}`);
    
    saveCart();
    updateMiniCart();
    updateCartPage();
    
    // Update product page
    if (typeof allShopProducts !== 'undefined' && allShopProducts) {
      renderShopProducts(allShopProducts);
    }
    
    // ✅ NEW: Update featured products display
    if (typeof refreshFeaturedProductsDisplay === 'function') {
      refreshFeaturedProductsDisplay();
    }
  }
  
  
  /**
   * Remove Item from Cart (UPDATED with featured products refresh)
   */
  function removeFromCart(productId) {
    const itemIndex = cart.items.findIndex(i => i.id === productId);
    
    if (itemIndex === -1) return;
    
    const item = cart.items[itemIndex];
    console.log('🗑️ Removing from cart:', item.name);
    
    cart.items.splice(itemIndex, 1);
    
    // Clear shop info if cart is empty
    if (cart.items.length === 0) {
      cart.shopId = null;
      cart.shopName = null;
      cart.shopOwnerId = null;
      console.log('🧹 Cart cleared - no more items');
    }
    
    saveCart();
    updateMiniCart();
    updateCartPage();
    
    // Update product page if available
    if (typeof allShopProducts !== 'undefined' && allShopProducts) {
      renderShopProducts(allShopProducts);
    }
    
    // ✅ NEW: Update featured products display
    if (typeof refreshFeaturedProductsDisplay === 'function') {
      refreshFeaturedProductsDisplay();
    }
  }
  
  
  /**
   * Clear Entire Cart (UPDATED with featured products refresh)
   */
  function clearCart() {
    console.log('🗑️ Clearing entire cart');
    
    cart = { 
      items: [], 
      shopId: null, 
      shopName: null, 
      shopOwnerId: null 
    };
    
    saveCart();
    updateMiniCart(); // This will hide mini-cart and remove padding
    updateCartPage();
    
    // Update product page if available
    if (typeof renderShopProducts === 'function' && typeof allShopProducts !== 'undefined' && allShopProducts) {
      renderShopProducts(allShopProducts);
    }
    
    // ✅ NEW: Update featured products display
    if (typeof refreshFeaturedProductsDisplay === 'function') {
      refreshFeaturedProductsDisplay();
    }
    
    console.log('✅ Cart cleared successfully');
  }
  
  
  /**
   * Update Mini-Cart Footer (UPDATED with padding management)
   */
  function updateMiniCart() {
    const miniCartFooter = document.getElementById('miniCartFooter');
    const miniCartCount = document.getElementById('miniCartCount');
    const miniCartPreview = document.getElementById('miniCartPreview');
    const miniCartTotal = document.getElementById('miniCartTotal');
    
    if (!miniCartFooter) return;
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // ✅ Hide mini-cart when empty
    if (totalItems === 0 || cart.items.length === 0) {
      // Use the global hide function with padding management
      if (typeof hideMiniCartFooter === 'function') {
        hideMiniCartFooter();
      } else {
        miniCartFooter.style.display = 'none';
      }
      console.log('🚫 Mini-cart hidden (0 items)');
      return;
    }
    
    // ✅ Show mini-cart with padding management
    if (typeof showMiniCartFooter === 'function') {
      showMiniCartFooter();
    } else {
      miniCartFooter.style.display = 'block';
    }
    
    // Update count
    if (miniCartCount) {
      miniCartCount.textContent = totalItems;
    }
    
    // Update preview (first 2 items)
    if (miniCartPreview) {
      const preview = cart.items.slice(0, 2).map(item => item.name).join(', ');
      const remaining = cart.items.length > 2 ? ` +${cart.items.length - 2} more` : '';
      miniCartPreview.textContent = preview + remaining;
    }
    
    // Update total
    if (miniCartTotal) {
      miniCartTotal.textContent = `₹${totalAmount.toFixed(2)}`;
    }
    
    console.log('✅ Mini-cart updated:', totalItems, 'items, ₹', totalAmount);
  }
  
  
  /**
   * Show Mini-Cart Briefly (After Add) - with animation
   */
  function showMiniCartBriefly() {
    const miniCartFooter = document.getElementById('miniCartFooter');
    if (!miniCartFooter) return;
    
    // Add pulse animation
    miniCartFooter.style.animation = 'pulse 0.3s ease';
    
    setTimeout(() => {
      miniCartFooter.style.animation = '';
    }, 300);
  }
  
  
  /**
   * Navigate to Cart Page (UPDATED with padding management)
   */
  function navigateToCart() {
    console.log('🛒 Navigating to Cart Page');
    
    if (!window.currentUser) {
      alert('⚠️ Please sign in to view your cart.');
      return;
    }
    
    if (cart.items.length === 0) {
      alert('⚠️ Your cart is empty!\n\nAdd products from shops to get started.');
      return;
    }
    
    // Hide all pages
    const mainApp = document.getElementById('mainApp');
    const shopProductsPage = document.getElementById('shopProductsPage');
    const cartPage = document.getElementById('cartPage');
    const myOrdersPage = document.getElementById('myOrdersPage');
    
    if (mainApp) {
      mainApp.style.display = 'none';
      mainApp.classList.remove('active');
    }
    
    if (shopProductsPage) {
      shopProductsPage.style.display = 'none';
      shopProductsPage.classList.remove('active');
    }
    
    if (myOrdersPage) {
      myOrdersPage.style.display = 'none';
      myOrdersPage.classList.remove('active');
    }
    
    // Show cart page
    if (cartPage) {
      cartPage.style.display = 'block';
      cartPage.classList.add('active');
    }
    
    // Hide navbar
    const mainNavbar = document.getElementById('mainAppNavbar');
    if (mainNavbar) {
      mainNavbar.style.display = 'none';
    }
    
    const stickyNavbar = document.querySelector('.navbar.sticky-top');
    if (stickyNavbar) {
      stickyNavbar.style.display = 'none';
    }
    
    // ✅ Hide mini-cart footer on cart page (no need to show it here)
    if (typeof hideMiniCartFooter === 'function') {
      hideMiniCartFooter();
    }
    
    // Update cart page
    if (typeof updateCartPage === 'function') {
      updateCartPage();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '#cart';
  }
  
  
  // Make it global
  window.navigateToCart = navigateToCart;
  
  
  /**
   * Update Cart Page (UPDATED with padding management)
   */
  function updateCartPage() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCartState = document.getElementById('emptyCartState');
    const cartSummary = document.getElementById('cartSummary');
    const cartShopInfo = document.getElementById('cartShopInfo');
    
    if (!cartItemsList) return;
    
    // ✅ Check if cart is empty
    if (!cart.items || cart.items.length === 0) {
      // Show empty state
      cartItemsList.innerHTML = '';
      if (emptyCartState) emptyCartState.style.display = 'block';
      if (cartSummary) cartSummary.style.display = 'none';
      if (cartShopInfo) cartShopInfo.style.display = 'none';
      
      // ✅ Hide mini-cart with padding management
      if (typeof hideMiniCartFooter === 'function') {
        hideMiniCartFooter();
      }
      
      console.log('📋 Cart page: Empty state shown');
      return;
    }
    
    // Hide empty state
    if (emptyCartState) emptyCartState.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    if (cartShopInfo) cartShopInfo.style.display = 'block';
    
    // Render shop info
    if (cartShopInfo && cart.shopName) {
      cartShopInfo.innerHTML = `
        <div class="card-body">
          <h5 style="font-weight: 700; margin-bottom: 10px;">
            <i class="bi bi-shop"></i> ${escapeHtml(cart.shopName)}
          </h5>
          <p class="text-muted mb-0" style="font-size: 0.9rem;">
            <i class="bi bi-info-circle"></i> All items are from this shop
          </p>
        </div>
      `;
    }
    
    // Render cart items
    let html = '';
    cart.items.forEach(item => {
      html += `
        <div class="cart-item-card">
          <div style="display: flex; align-items: start; gap: 15px;">
            
            <!-- Product Image Placeholder -->
            <div style="
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              <i class="bi bi-box-seam" style="font-size: 2rem; color: #1976d2;"></i>
            </div>
            
            <!-- Product Details -->
            <div style="flex: 1;">
              <h6 style="font-weight: 600; margin-bottom: 5px;">${escapeHtml(item.name)}</h6>
              ${item.brand ? `<p class="text-muted mb-1" style="font-size: 0.85rem;">Brand: ${escapeHtml(item.brand)}</p>` : ''}
              ${item.size ? `<p class="text-muted mb-1" style="font-size: 0.85rem;">Size: ${escapeHtml(item.size)}</p>` : ''}
              <p style="font-weight: 700; font-size: 1.1rem; color: #25D366; margin-bottom: 10px;">₹${item.price.toFixed(2)}</p>
              
              <!-- Quantity Stepper -->
              <div class="quantity-stepper">
                <button onclick="updateCartQuantity('${item.id}', -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                  <i class="bi bi-dash"></i>
                </button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', 1)" ${item.quantity >= item.stock ? 'disabled' : ''}>
                  <i class="bi bi-plus"></i>
                </button>
              </div>
              
              ${item.quantity >= item.stock ? '<p class="text-warning mt-2 mb-0" style="font-size: 0.85rem;"><i class="bi bi-exclamation-triangle"></i> Stock limit reached</p>' : ''}
            </div>
            
            <!-- Remove Button -->
            <button 
              class="btn btn-sm btn-outline-danger" 
              onclick="removeFromCart('${item.id}')"
              title="Remove">
              <i class="bi bi-trash"></i>
            </button>
            
          </div>
        </div>
      `;
    });
    
    cartItemsList.innerHTML = html;
    
    // Update summary
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const summaryItemCount = document.getElementById('summaryItemCount');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summaryItemCount) summaryItemCount.textContent = totalItems;
    if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    if (summaryTotal) summaryTotal.textContent = `₹${subtotal.toFixed(2)}`;
    
    console.log('✅ Cart page updated:', totalItems, 'items');
  }
  
  
  /**
   * Go Back from Cart (UPDATED with padding management)
   */
  function goBackFromCart() {
    const cartPage = document.getElementById('cartPage');
    if (cartPage) {
      cartPage.style.display = 'none';
      cartPage.classList.remove('active');
    }
    
    // ✅ Show mini-cart again if cart has items
    if (cart.items.length > 0) {
      updateMiniCart(); // This will show mini-cart with padding
    }
    
    // Check if coming from shop products page
    if (window.location.hash.includes('shop-products')) {
      const shopProductsPage = document.getElementById('shopProductsPage');
      if (shopProductsPage) {
        shopProductsPage.style.display = 'block';
        shopProductsPage.classList.add('active');
      }
    } else {
      goBackHome();
    }
  }
  
  
  // Make functions global
  window.initializeCart = initializeCart;
  window.saveCart = saveCart;
  window.addToCart = addToCart;
  window.updateCartQuantity = updateCartQuantity;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;
  window.updateMiniCart = updateMiniCart;
  window.showMiniCartBriefly = showMiniCartBriefly;
  window.updateCartPage = updateCartPage;
  window.goBackFromCart = goBackFromCart;
  
  console.log('✅ Cart management system loaded (with featured products support)');
  
  /**
   * Go Back to Home (UPDATED)
   */
  function goBackHome() {
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
      mainApp.style.display = 'block';
      mainApp.classList.add('active');
    }
    
    const mainNavbar = document.getElementById('mainAppNavbar');
    if (mainNavbar) {
      mainNavbar.style.display = 'flex';
    }
    
    const stickyNavbar = document.querySelector('.navbar.sticky-top');
    if (stickyNavbar) {
      stickyNavbar.style.display = 'flex';
    }
    
    // ✅ Show mini-cart if cart has items
    if (cart.items.length > 0) {
      updateMiniCart();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '#home';
  }
  
  /**
   * Get Cart Item by ID (Utility)
   */
  function getCartItem(productId) {
    return cart.items.find(item => item.id === productId);
  }
  
  /**
   * Format Price (Utility)
   */
  function formatPrice(price) {
    return price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Make cart functions global
  window.cart = cart;
  window.initializeCart = initializeCart;
  window.saveCart = saveCart;
  window.addToCart = addToCart;
  window.updateCartQuantity = updateCartQuantity;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;
  window.updateMiniCart = updateMiniCart;
  window.updateCartPage = updateCartPage;
  window.goBackFromCart = goBackFromCart;
  window.goBackHome = goBackHome;
  window.getCartItem = getCartItem;
  window.formatPrice = formatPrice;
  
  console.log('✅ Cart management system loaded');
