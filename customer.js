/**
 * ==========================================
 * CUSTOMER MANAGEMENT MODULE
 * File: customers.js
 * ==========================================
 */

// ===== GLOBAL VARIABLES =====
let cachedCustomers = [];
let currentCustomerId = null;

/**
 * ==========================================
 * SECTION 1: NAVIGATION FUNCTIONS
 * ==========================================
 */

// Navigate to Customers Page - UPDATED FOR INVOICE NAVIGATION
function navigateToCustomers() {
  console.log('📇 Navigating to Customers');
  
  currentPage = 'customers';
  
  // === STEP 1: Get page elements ===
  const mainApp = document.getElementById('mainApp');
  const allProductsPage = document.getElementById('allProductsPage');
  const productGroupsPage = document.getElementById('productGroupsPage');
  const customersPage = document.getElementById('customersPage');
  const groupDetailPage = document.getElementById('groupDetailPage');
  
  // === STEP 2: Hide all other pages ===
  if (mainApp) {
    mainApp.style.display = 'none';
    mainApp.classList.remove('active');
  }
  
  if (allProductsPage) {
    allProductsPage.classList.remove('active');
    allProductsPage.style.display = 'none';
  }
  
  if (productGroupsPage) {
    productGroupsPage.classList.remove('active');
    productGroupsPage.style.display = 'none';
  }
  
  if (groupDetailPage) {
    groupDetailPage.classList.remove('active');
    groupDetailPage.style.display = 'none';
  }
  
  // === STEP 3: Show customers page ===
  if (customersPage) {
    customersPage.classList.add('active');
    customersPage.style.display = 'block';
    console.log('✅ Customers page displayed');
  } else {
    console.error('❌ customersPage element not found!');
    return;
  }
  
  // === STEP 4: Hide the blue navbar ===
  const navbar = document.querySelector('.navbar.navbar-dark.bg-primary');
  if (navbar) {
    navbar.style.display = 'none';
  }
  
  // === STEP 5: Load customers from backend ===
  if (typeof loadCustomers === 'function') {
    loadCustomers();
    console.log('✅ Customers data loaded');
  } else {
    console.warn('⚠️ loadCustomers function not found');
  }
  
  // === STEP 6: Close sidebar and scroll ===
  if (typeof closeSidebar === 'function') {
    closeSidebar();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * ==========================================
 * SECTION 2: DATA LOADING FUNCTIONS
 * ==========================================
 */

// Load Customers from Backend
async function loadCustomers() {
  try {
    console.log('📡 Fetching customers from server...');
    
    // Build URL with authentication
    const url = `${GOOGLE_SCRIPT_URL}?action=getCustomers&email=${encodeURIComponent(userEmail)}&hash=${encodeURIComponent(userHash)}&t=${Date.now()}`;
    
    // Fetch data
    const response = await fetch(url);
    const data = await response.json();
    
    // Check response
    if (data.success && data.customers) {
      cachedCustomers = data.customers;
      console.log('✅ Loaded', data.customers.length, 'customers');
      
      // Render customers list
      renderCustomersList();
    } else {
      throw new Error(data.error || 'Failed to load customers');
    }
    
  } catch (error) {
    console.error('❌ Error loading customers:', error);
    
    // Show error message
    const container = document.getElementById('customersListContainer');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:#dc3545;">
          <i class="bi bi-exclamation-circle" style="font-size:48px;"></i>
          <h4 style="margin-top:20px;">Error Loading Customers</h4>
          <p>${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="loadCustomers()">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      `;
    }
  }
}

/**
 * ==========================================
 * SECTION 3: RENDERING FUNCTIONS
 * ==========================================
 */

// Render Customers List
function renderCustomersList() {
  console.log('🎨 Rendering customers list...');
  
  const container = document.getElementById('customersListContainer');
  const emptyState = document.getElementById('customersEmptyState');
  
  if (!container) {
    console.error('customersListContainer not found!');
    return;
  }
  
  // Check if no customers
  if (!cachedCustomers || cachedCustomers.length === 0) {
    container.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    console.log('No customers to display');
    return;
  }
  
  // Hide empty state
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // Build HTML
  let html = '<div style="padding:20px; max-width:1200px; margin:0 auto;">';
  
  cachedCustomers.forEach(customer => {
    // Determine icon based on type
    const typeIcon = customer.customerType === 'Business' ? '🏢' : '👤';
    
    // Get contact info (with fallbacks)
    const phone = customer.phoneNumber || 'No phone';
    const email = customer.email || 'No email';
    
    // Create customer card
    html += `
      <div class="card mb-3 shadow-sm" style="cursor:pointer; transition:transform 0.2s;" 
           onmouseover="this.style.transform='scale(1.02)'" 
           onmouseout="this.style.transform='scale(1)'"
           onclick="showCustomerDetails('${customer.customerId}')">
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div style="flex:1;">
              <h5 class="mb-2">
                ${typeIcon} ${escapeHtml(customer.customerName)}
              </h5>
              <p class="text-muted mb-2" style="font-size:14px;">
                <i class="bi bi-telephone"></i> ${escapeHtml(phone)}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <i class="bi bi-envelope"></i> ${escapeHtml(email)}
              </p>
              <span class="badge bg-secondary">${customer.customerType}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-primary" 
                      onclick="event.stopPropagation(); openEditCustomerModal('${customer.customerId}')"
                      title="Edit Customer">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" 
                      onclick="event.stopPropagation(); confirmDeleteCustomer('${customer.customerId}', '${escapeHtml(customer.customerName)}')"
                      title="Delete Customer">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  // Render to page
  container.innerHTML = html;
  console.log(`✅ Rendered ${cachedCustomers.length} customers`);
}

// Filter Customers (Search)
function filterCustomers(searchText) {
  const text = searchText.toLowerCase().trim();
  
  if (!text) {
    renderCustomersList();
    return;
  }
  
  // Filter customers
  const filtered = cachedCustomers.filter(c => {
    return c.customerName.toLowerCase().includes(text) ||
           (c.phoneNumber && c.phoneNumber.includes(text)) ||
           (c.email && c.email.toLowerCase().includes(text));
  });
  
  // Render filtered list
  const container = document.getElementById('customersListContainer');
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#999;">
        <i class="bi bi-search" style="font-size:48px;"></i>
        <h4 style="margin-top:20px;">No customers found</h4>
        <p>Try a different search term</p>
      </div>
    `;
    return;
  }
  
  // Render filtered results (same as renderCustomersList but with filtered array)
  let html = '<div style="padding:20px; max-width:1200px; margin:0 auto;">';
  
  filtered.forEach(customer => {
    const typeIcon = customer.customerType === 'Business' ? '🏢' : '👤';
    const phone = customer.phoneNumber || 'No phone';
    const email = customer.email || 'No email';
    
    html += `
      <div class="card mb-3" style="cursor:pointer;" onclick="showCustomerDetails('${customer.customerId}')">
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div style="flex:1;">
              <h5 class="mb-2">${typeIcon} ${escapeHtml(customer.customerName)}</h5>
              <p class="text-muted mb-2" style="font-size:14px;">
                <i class="bi bi-telephone"></i> ${escapeHtml(phone)}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <i class="bi bi-envelope"></i> ${escapeHtml(email)}
              </p>
              <span class="badge bg-secondary">${customer.customerType}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openEditCustomerModal('${customer.customerId}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); confirmDeleteCustomer('${customer.customerId}', '${escapeHtml(customer.customerName)}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * ==========================================
 * SECTION 4: MODAL FUNCTIONS
 * ==========================================
 */

// Open Add Customer Modal
function openAddCustomerModal() {
  console.log('➕ Opening Add Customer modal');
  
  // Reset current customer ID
  currentCustomerId = null;
  
  // Set modal title
  document.getElementById('customerFormTitle').textContent = 'Add Customer';
  
  // Clear all form fields
  document.getElementById('customerId').value = '';
  document.getElementById('typeBusiness').checked = true;
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerEmail').value = '';
  document.getElementById('customerAddress').value = '';
  document.getElementById('customerOtherInfo').value = '';
  
  // Hide advanced options
  document.getElementById('advancedOptionsContainer').style.display = 'none';
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('customerModal'));
  modal.show();
}

// Open Edit Customer Modal
function openEditCustomerModal(customerId) {
  console.log('✏️ Opening Edit Customer modal for:', customerId);
  
  // Find customer in cache
  const customer = cachedCustomers.find(c => c.customerId === customerId);
  
  if (!customer) {
    console.error('Customer not found:', customerId);
    alert('Customer not found!');
    return;
  }
  
  // Set current customer ID
  currentCustomerId = customerId;
  
  // Set modal title
  document.getElementById('customerFormTitle').textContent = 'Edit Customer';
  
  // Fill form with customer data
  document.getElementById('customerId').value = customer.customerId;
  
  // Set customer type radio button
  if (customer.customerType === 'Business') {
    document.getElementById('typeBusiness').checked = true;
  } else {
    document.getElementById('typeIndividual').checked = true;
  }
  
  document.getElementById('customerName').value = customer.customerName;
  document.getElementById('customerPhone').value = customer.phoneNumber || '';
  document.getElementById('customerEmail').value = customer.email || '';
  document.getElementById('customerAddress').value = customer.address || '';
  document.getElementById('customerOtherInfo').value = customer.otherInfo || '';
  
  // Show advanced options if any data exists
  if (customer.phoneNumber || customer.email || customer.address || customer.otherInfo) {
    document.getElementById('advancedOptionsContainer').style.display = 'block';
  } else {
    document.getElementById('advancedOptionsContainer').style.display = 'none';
  }
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('customerModal'));
  modal.show();
}

// Toggle Advanced Options
function toggleAdvancedOptions() {
  const container = document.getElementById('advancedOptionsContainer');
  
  if (container.style.display === 'none') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// Save Customer (Add or Update)
async function saveCustomer() {
  console.log('💾 Saving customer...');
  
  // Get form values
  const customerName = document.getElementById('customerName').value.trim();
  
  // Validation
  if (!customerName) {
    alert('Customer name is required!');
    document.getElementById('customerName').focus();
    return;
  }
  
  // Get customer type (which radio button is checked)
  const customerType = document.getElementById('typeBusiness').checked ? 'Business' : 'Individual';
  
  // ✅ FIX: Rename customer email field to avoid conflict
  const customerData = {
    action: currentCustomerId ? 'updateCustomer' : 'addCustomer',
    email: userEmail,                    // User email for authentication
    hash: userHash,                      // User hash for authentication
    customerId: currentCustomerId || '',
    customerType: customerType,
    customerName: customerName,
    phoneNumber: document.getElementById('customerPhone').value.trim(),
    customerEmail: document.getElementById('customerEmail').value.trim(),  // ✅ Changed to customerEmail
    address: document.getElementById('customerAddress').value.trim(),
    otherInfo: document.getElementById('customerOtherInfo').value.trim()
  };
  
  try {
    // Prepare form data
    const formData = new URLSearchParams();
    Object.keys(customerData).forEach(key => {
      formData.append(key, customerData[key] || '');
    });
    
    // Send to backend
    console.log('Sending customer data to server...');
    console.log('Data being sent:', Object.fromEntries(formData));
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('Server response:', result);
    
    // Check result
    if (result.success) {
      console.log('✅ Customer saved successfully!');
      
      // Show success message
      alert(currentCustomerId ? 'Customer updated successfully!' : 'Customer added successfully!');
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
      if (modal) {
        modal.hide();
      }
      
      // Reload customers list
      await loadCustomers();
      
    } else {
      throw new Error(result.error || 'Failed to save customer');
    }
    
  } catch (error) {
    console.error('❌ Error saving customer:', error);
    alert('Error saving customer: ' + error.message);
  }
}


// Confirm Delete Customer
function confirmDeleteCustomer(customerId, customerName) {
  console.log('🗑️ Confirm delete:', customerId);
  
  // Ask for confirmation
  const confirmed = confirm(`Delete customer "${customerName}"?\n\nThis action cannot be undone.`);
  
  if (confirmed) {
    deleteCustomer(customerId);
  }
}

// Delete Customer
async function deleteCustomer(customerId) {
  console.log('🗑️ Deleting customer:', customerId);
  
  try {
    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('action', 'deleteCustomer');
    formData.append('email', userEmail);
    formData.append('hash', userHash);
    formData.append('customerId', customerId);
    
    // Send to backend
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    // Check result
    if (result.success) {
      console.log('✅ Customer deleted successfully');
      
      // Show success message
      alert('Customer deleted successfully!');
      
      // Reload customers list
      await loadCustomers();
      
    } else {
      throw new Error(result.error || 'Failed to delete customer');
    }
    
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    alert('Error deleting customer: ' + error.message);
  }
}

/**
 * ==========================================
 * SECTION 6: CUSTOMER DETAIL VIEW
 * ==========================================
 */

// Show Customer Details
function showCustomerDetails(customerId) {
  console.log('👁️ Showing customer details:', customerId);
  
  // Find customer in cache
  const customer = cachedCustomers.find(c => c.customerId === customerId);
  
  if (!customer) {
    console.error('Customer not found:', customerId);
    alert('Customer not found!');
    return;
  }
  
  // Set current customer ID
  currentCustomerId = customerId;
  
  // Fill customer info in modal
  document.getElementById('detailCustomerName').textContent = customer.customerName;
  document.getElementById('detailCustomerType').textContent = customer.customerType;
  document.getElementById('detailCustomerPhone').textContent = customer.phoneNumber || 'Not provided';
  document.getElementById('detailCustomerEmail').textContent = customer.email || 'Not provided';
  document.getElementById('detailCustomerAddress').textContent = customer.address || 'Not provided';
  
  // Show Info tab by default
  showCustomerTab('info');
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('customerDetailModal'));
  modal.show();
}

// Show Customer Tab (Info/Transactions/Invoices)
function showCustomerTab(tab) {
  console.log('📑 Switching to tab:', tab);
  
  // Hide all tabs
  document.getElementById('customerInfoTab').style.display = 'none';
  document.getElementById('customerTransactionsTab').style.display = 'none';
  document.getElementById('customerInvoicesTab').style.display = 'none';
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.customer-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  if (tab === 'info') {
    document.getElementById('customerInfoTab').style.display = 'block';
    document.querySelector('[onclick*="showCustomerTab(\'info\')"]').classList.add('active');
    
  } else if (tab === 'transactions') {
    document.getElementById('customerTransactionsTab').style.display = 'block';
    document.querySelector('[onclick*="showCustomerTab(\'transactions\')"]').classList.add('active');
    
    // Load transactions when tab is opened
    loadCustomerTransactions(currentCustomerId);
    
  } else if (tab === 'invoices') {
    document.getElementById('customerInvoicesTab').style.display = 'block';
    document.querySelector('[onclick*="showCustomerTab(\'invoices\')"]').classList.add('active');
    
    // Load invoices when tab is opened
    loadCustomerInvoices(currentCustomerId);
  }
}

/**
 * ==========================================
 * SECTION 7: TRANSACTIONS & INVOICES
 * ==========================================
 */

// Load Customer Transactions
async function loadCustomerTransactions(customerId) {
  console.log('📊 Loading transactions for customer:', customerId);
  
  const container = document.getElementById('customerTransactionsList');
  
  // Show loading state
  container.innerHTML = '<p class="text-center text-muted"><i class="spinner-border spinner-border-sm"></i> Loading transactions...</p>';
  
  try {
    // Fetch transactions from backend
    const url = `${GOOGLE_SCRIPT_URL}?action=getCustomerTransactions&customerId=${encodeURIComponent(customerId)}&t=${Date.now()}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Check response
    if (!data.success) {
      throw new Error(data.error || 'Failed to load transactions');
    }
    
    // Check if no transactions
    if (!data.transactions || data.transactions.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:#999;">
          <i class="bi bi-receipt" style="font-size:48px;"></i>
          <h5 style="margin-top:20px;">No Transactions Yet</h5>
          <p>This customer hasn't made any purchases yet</p>
        </div>
      `;
      return;
    }
    
    // Build transactions table
    let html = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sale ID</th>
              <th>Items</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add each transaction
    data.transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('en-IN');
      const amount = t.total ? `₹${parseFloat(t.total).toFixed(2)}` : 'N/A';
      
      html += `
        <tr>
          <td>${date}</td>
          <td><small>${t.saleId}</small></td>
          <td>${escapeHtml(t.items || 'N/A')}</td>
          <td class="text-end"><strong>${amount}</strong></td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
      <div class="text-muted text-end" style="padding:10px;">
        <small>Total Transactions: ${data.transactions.length}</small>
      </div>
    `;
    
    container.innerHTML = html;
    console.log(`✅ Loaded ${data.transactions.length} transactions`);
    
  } catch (error) {
    console.error('❌ Error loading transactions:', error);
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#dc3545;">
        <i class="bi bi-exclamation-circle" style="font-size:48px;"></i>
        <h5 style="margin-top:20px;">Error Loading Transactions</h5>
        <p>${error.message}</p>
        <button class="btn btn-sm btn-primary mt-3" onclick="loadCustomerTransactions('${customerId}')">
          <i class="bi bi-arrow-clockwise"></i> Retry
        </button>
      </div>
    `;
  }
}

// Load Customer Invoices
async function loadCustomerInvoices(customerId) {
  console.log('📄 Loading invoices for customer:', customerId);
  
  const container = document.getElementById('customerInvoicesList');
  
  // For now, show coming soon message
  // This will be implemented when you integrate with invoice system
  container.innerHTML = `
    <div style="text-align:center; padding:40px; color:#999;">
      <i class="bi bi-file-text" style="font-size:48px;"></i>
      <h5 style="margin-top:20px;">Invoice History</h5>
      <p>Invoice tracking will be available soon</p>
    </div>
  `;
}

// Create Invoice for Customer
function createInvoiceForCustomer() {
  console.log('📝 Creating invoice for customer:', currentCustomerId);
  
  // Find customer
  const customer = cachedCustomers.find(c => c.customerId === currentCustomerId);
  
  if (!customer) {
    alert('Customer not found!');
    return;
  }
  
  // Close customer detail modal
  const detailModal = bootstrap.Modal.getInstance(document.getElementById('customerDetailModal'));
  if (detailModal) {
    detailModal.hide();
  }
  
  // Wait for modal to close, then open invoice modal
  setTimeout(() => {
    // Check if invoice modal opening function exists
    if (typeof openInvoiceSetupModal === 'function') {
      openInvoiceSetupModal();
      
      // Pre-fill customer name after modal opens
      setTimeout(() => {
        const customerNameField = document.getElementById('invoiceCustomerName');
        if (customerNameField) {
          customerNameField.value = customer.customerName;
        }
      }, 300);
      
    } else {
      console.warn('Invoice modal function not found');
      alert('Invoice feature will be integrated soon');
    }
  }, 300);
}

/**
 * ==========================================
 * SECTION 8: HELPER FUNCTIONS
 * ==========================================
 */

// Escape HTML (prevent XSS attacks)
function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * ==========================================
 * END OF CUSTOMER MANAGEMENT MODULE
 * ==========================================
 */

console.log('✅ Customer Management Module Loaded');




