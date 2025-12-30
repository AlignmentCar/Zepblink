/**
 * ==========================================
 * NAVIGATION.JS - Centralized Page Navigation System
 * ==========================================
 * Version: 1.0.0
 * Created: October 29, 2025
 * 
 * This file handles all page navigation in the Inventory app.
 * It provides a clean, centralized way to navigate between pages.
 */

// ==========================================
// GLOBAL STATE VARIABLES
// ==========================================

/**
 * Current active page identifier
 * @type {string}
 */
let currentPage = 'dashboard';

/**
 * Current group ID when viewing group details
 * @type {string|null}
 */
let currentGroupId = null;

/**
 * Current group name when viewing group details
 * @type {string|null}
 */
let currentGroupName = null;

/**
 * Navigation history for back button functionality
 * Stores last 10 pages visited
 * @type {Array<{page: string, timestamp: number}>}
 */
let navigationHistory = [];

// ==========================================
// CORE NAVIGATION FUNCTION
// ==========================================

/**
 * Main navigation function - handles all page transitions
 * @param {string} page - Page identifier (dashboard, allProducts, productGroups, customers, groupDetail)
 * @param {Object} params - Optional parameters for the page (e.g., {groupId: '123', groupName: 'Tiles'})
 */
function navigateTo(page, params = {}) {
  console.log(`📍 Navigating to: ${page}`, params);
  
  // Save current page to history
  if (currentPage !== page) {
    navigationHistory.push({ 
      page: currentPage, 
      timestamp: Date.now() 
    });
    
    // Keep only last 10 entries
    if (navigationHistory.length > 10) {
      navigationHistory.shift();
    }
  }
  
  // Update current page
  currentPage = page;
  
  // Step 1: Hide all pages
  hideAllPages();
  
  // Step 2: Show selected page
  showPage(page);
  
  // Step 3: Update UI elements (navbar, sidebar, etc.)
  updateUIForPage(page);
  
  // Step 4: Load page-specific data
  loadPageData(page, params);
  
  // Step 5: Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log(`✅ Navigation complete: ${page}`);
}

// ==========================================
// PAGE VISIBILITY MANAGEMENT
// ==========================================

/**
 * Hides all pages in the app
 */
function hideAllPages() {
  console.log('🙈 Hiding all pages...');
  
  // Hide all elements with .page class
  const allPages = document.querySelectorAll('.page');
  allPages.forEach(pageEl => {
    pageEl.classList.remove('active');
    pageEl.style.display = 'none';
  });
  
  // Also hide specific page IDs (for backward compatibility)
  const pageIds = [
    'mainApp',
    'allProductsPage',
    'productGroupsPage',
    'customersPage',
    'groupDetailPage'
  ];
  
  pageIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('active');
      element.style.display = 'none';
    }
  });
  
  // Remove any dynamically created page containers
  removeDynamicContainers();
}

/**
 * Shows the specified page
 * @param {string} page - Page identifier
 */
function showPage(page) {
  console.log(`👁️ Attempting to show page: ${page}`);
  
  let pageElement = null;
  
  // Strategy 1: Try new format page-{pageName}
  pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    console.log(`✅ Found using new format: page-${page}`);
  }
  
  // Strategy 2: Try exact page name
  if (!pageElement) {
    pageElement = document.getElementById(page);
    if (pageElement) {
      console.log(`✅ Found using exact ID: ${page}`);
    }
  }
  
  // Strategy 3: Try known mappings
  if (!pageElement) {
    const idMappings = {
      'dashboard': 'mainApp',
      'allProducts': 'allProductsPage',
      'productGroups': 'productGroupsPage',
      'customers': 'customersPage',
      'groupDetail': 'groupDetailPage'
    };
    
    const mappedId = idMappings[page];
    if (mappedId) {
      pageElement = document.getElementById(mappedId);
      if (pageElement) {
        console.log(`✅ Found using mapping: ${mappedId}`);
      }
    }
  }
  
  // Show the page if found
  if (pageElement) {
    pageElement.classList.add('active');
    pageElement.style.display = 'block';
    console.log(`✅ Successfully displayed page: ${page}`);
  } else {
    console.error(`❌ Could not find page element for: ${page}`);
    console.error('Available page elements:', 
      Array.from(document.querySelectorAll('[id*="Page"], [id*="page"], [id="mainApp"]'))
        .map(el => el.id)
    );
  }
}



/**
 * Removes any dynamically created page containers
 * This cleans up old navigation methods that created temporary page containers
 */
function removeDynamicContainers() {
  const dynamicContainerIds = [
    'productGroupsPageContainer',
    'groupVariantsPageContainer'
  ];
  
  dynamicContainerIds.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.remove();
      console.log(`🗑️ Removed dynamic container: ${id}`);
    }
  });
}

// ==========================================
// UI UPDATES
// ==========================================

/**
 * Updates UI elements when navigating to a page
 * @param {string} page - Current page identifier
 */
function updateUIForPage(page) {
  // Update navbar visibility
  updateNavbarVisibility(page);
  
  // Close sidebar if open
  closeSidebarIfOpen();
  
  // Update page title
  updatePageTitle(page);
}

/**
 * Shows or hides the bottom navbar based on current page
 * @param {string} page - Current page identifier
 */
function updateNavbarVisibility(page) {
  const navbar = document.querySelector('.navbar');
  
  if (navbar) {
    if (page === 'dashboard') {
      // Show navbar on dashboard
      navbar.style.display = 'flex';
    } else {
      // Hide navbar on other pages
      navbar.style.display = 'none';
    }
  }
}

/**
 * Closes the sidebar navigation if it's open
 */
function closeSidebarIfOpen() {
  // Check if closeSidebar function exists (defined in index.html)
  if (typeof closeSidebar === 'function') {
    closeSidebar();
  }
}

/**
 * Updates the page title element if it exists
 * @param {string} page - Current page identifier
 */
function updatePageTitle(page) {
  const pageTitles = {
    'dashboard': 'Dashboard',
    'allProducts': 'All Products',
    'productGroups': 'Product Groups',
    'groupDetail': currentGroupName || 'Group Details',
    'customers': 'Customers'
  };
  
  const titleElement = document.getElementById('pageTitle');
  if (titleElement) {
    titleElement.textContent = pageTitles[page] || page;
  }
}

// ==========================================
// DATA LOADING
// ==========================================

/**
 * Loads page-specific data when navigating
 * @param {string} page - Current page identifier
 * @param {Object} params - Page parameters
 */
function loadPageData(page, params = {}) {
  console.log(`📊 Loading data for page: ${page}`);
  
  switch(page) {
    case 'dashboard':
      loadDashboardData();
      break;
      
    case 'allProducts':
      loadAllProductsData();
      break;
      
    case 'productGroups':
      loadProductGroupsData();
      break;
      
    case 'groupDetail':
      loadGroupDetailData(params);
      break;
      
    case 'customers':
      loadCustomersData();
      break;
      
    default:
      console.warn(`⚠️ No data loader defined for page: ${page}`);
  }
}

/**
 * Loads dashboard data
 */
function loadDashboardData() {
  if (typeof window.loadDashboardData === 'function') {
    window.loadDashboardData();
  }
}

/**
 * Loads all products data
 */
function loadAllProductsData() {
  if (typeof renderAllProductsList === 'function') {
    renderAllProductsList();
  }
}

/**
 * Loads product groups data
 */
function loadProductGroupsData() {
  if (typeof loadProductGroups === 'function') {
    loadProductGroups();
  }
}

/**
 * Loads group detail page data
 * @param {Object} params - Parameters including groupId and groupName
 */
function loadGroupDetailData(params) {
  // Store group info globally
  currentGroupId = params.groupId;
  currentGroupName = params.groupName;
  
  // Update page title
  const titleElement = document.getElementById('groupDetailTitle');
  if (titleElement) {
    titleElement.textContent = params.groupName || 'Group Variants';
  }
  
  // Load variants data
  if (typeof loadGroupVariants === 'function') {
    loadGroupVariants(params.groupId);
  }
}

/**
 * Loads customers data
 */
function loadCustomersData() {
  if (typeof loadCustomers === 'function') {
    loadCustomers();
  }
}

// ==========================================
// NAVIGATION HELPER FUNCTIONS
// ==========================================

/**
 * Navigates back to the previous page
 */
function navigateBack() {
  if (navigationHistory.length > 0) {
    const previousPage = navigationHistory.pop();
    navigateTo(previousPage.page);
  } else {
    // Default to dashboard if no history
    navigateTo('dashboard');
  }
}

/**
 * Gets the current active page
 * @returns {string} Current page identifier
 */
function getCurrentPage() {
  return currentPage;
}

/**
 * Checks if currently on a specific page
 * @param {string} page - Page identifier to check
 * @returns {boolean} True if on the specified page
 */
function isOnPage(page) {
  return currentPage === page;
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initializes the navigation system
 * Called automatically when the page loads
 */
function initNavigation() {
  console.log('🚀 Navigation system initialized');
  
  // Set initial page
  currentPage = 'dashboard';
  
  // Show dashboard by default
  showPage('dashboard');
  
  // Make sure navbar is visible on dashboard
  updateNavbarVisibility('dashboard');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}

// ==========================================
// LEGACY COMPATIBILITY LAYER
// ==========================================
// These functions maintain backward compatibility with old code
// They will show warnings in console but still work
// Remove these after full migration is complete

/**
 * @deprecated Use navigateTo('dashboard') instead
 */
function navigateToHome() {
  console.warn('⚠️ navigateToHome() is deprecated. Use navigateTo("dashboard") instead.');
  navigateTo('dashboard');
}

/**
 * @deprecated Use navigateTo('allProducts') instead
 */
function navigateToAllProducts() {
  console.warn('⚠️ navigateToAllProducts() is deprecated. Use navigateTo("allProducts") instead.');
  navigateTo('allProducts');
}

/**
 * @deprecated Use navigateTo('productGroups') instead
 */
function navigateToProductGroups() {
  console.warn('⚠️ navigateToProductGroups() is deprecated. Use navigateTo("productGroups") instead.');
  navigateTo('productGroups');
}

/**
 * @deprecated Use navigateTo('customers') instead
 */
function navigateToCustomers() {
  console.warn('⚠️ navigateToCustomers() is deprecated. Use navigateTo("customers") instead.');
  navigateTo('customers');
}

/**
 * @deprecated Use navigateTo('groupDetail', {groupId, groupName}) instead
 */
function navigateToGroupVariants(groupId, groupName) {
  console.warn('⚠️ navigateToGroupVariants() is deprecated. Use navigateTo("groupDetail", {groupId, groupName}) instead.');
  navigateTo('groupDetail', { groupId, groupName });
}

/**
 * @deprecated Use navigateTo('productGroups') instead
 */
function closeGroupVariantsPage() {
  console.warn('⚠️ closeGroupVariantsPage() is deprecated. Use navigateTo("productGroups") instead.');
  navigateTo('productGroups');
}

// ==========================================
// END OF NAVIGATION.JS
// ==========================================

console.log('📦 navigation.js loaded successfully');

