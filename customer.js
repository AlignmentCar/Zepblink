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
