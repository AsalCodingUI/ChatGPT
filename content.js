// Store chat categories
let chatCategories = {};

// Wait for element to be available in DOM
function waitForElement(selector, callback, maxAttempts = 10) {
  let attempts = 0;
  
  const checkElement = () => {
    attempts++;
    const element = document.querySelector(selector);
    
    if (element) {
      callback(element);
    } else if (attempts < maxAttempts) {
      setTimeout(checkElement, 1000);
    }
  };
  
  checkElement();
}

// Create and insert category tabs
function createCategoryTabs() {
  waitForElement('nav', (nav) => {
    if (nav.querySelector('.category-tabs')) return;

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';
    
    ['All', 'Design', 'Dev', 'Oth..'].forEach(category => {
      const tab = document.createElement('button');
      tab.className = 'category-tab' + (category === 'All' ? ' active' : '');
      tab.textContent = category;
      tab.onclick = () => filterChats(category);
      tabsContainer.appendChild(tab);
    });

    nav.insertBefore(tabsContainer, nav.firstChild);
  });
}

// Add category dropdown to input form
function addCategoryDropdown() {
  waitForElement('#prompt-textarea', (textarea) => {
    const existingDropdown = document.querySelector('.category-dropdown');
    if (existingDropdown) return;

    const wrapper = textarea.parentElement;
    if (!wrapper) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'category-dropdown';
    dropdown.innerHTML = `
      <select required>
        <option value="" disabled selected>Category</option>
        <option value="Design">Design</option>
        <option value="Dev">Developer</option>
        <option value="Oth..">Other Topic</option>
      </select>
    `;

    wrapper.appendChild(dropdown);

    const form = textarea.closest('form');
    if (form) {
      const select = dropdown.querySelector('select');
      const sendButton = form.querySelector('button[data-testid="send-button"]');

      const updateSendButton = () => {
        const textareaValue = textarea.value.trim();
        if (sendButton) {
          sendButton.disabled = !select.value || !textareaValue;
        }
      };

      select.addEventListener('change', updateSendButton);
      textarea.addEventListener('input', updateSendButton);

      // Handle form submission
      const originalSubmit = form.onsubmit;
      form.onsubmit = (e) => {
        if (!select.value) {
          e.preventDefault();
          e.stopPropagation();
          alert('Please select a category before sending');
          return false;
        }

        if (originalSubmit) {
          const result = originalSubmit.call(form, e);
          if (result === false) return false;
        }

        // Store category for this chat
        setTimeout(() => {
          const chatTitle = document.querySelector('h1')?.textContent || 'New Chat';
          chatCategories[chatTitle] = select.value;
          chrome.storage.local.set({ chatCategories });
        }, 500);
      };
    }
  });
}

// Filter chats based on selected category
function filterChats(category) {
  const chatItems = document.querySelectorAll('nav a.flex');
  chatItems.forEach(chat => {
    const chatTitle = chat.textContent;
    const chatCategory = chatCategories[chatTitle];
    
    if (category === 'All' || chatCategory === category) {
      chat.style.display = 'flex';
    } else {
      chat.style.display = 'none';
    }
  });

  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent === category);
  });
}

// Add category labels to existing chats
function addCategoryLabels() {
  const chatItems = document.querySelectorAll('nav a.flex');
  chatItems.forEach(chat => {
    if (chat.querySelector('.chat-item-category')) return;
    
    const chatTitle = chat.textContent;
    const category = chatCategories[chatTitle];
    
    if (category) {
      const label = document.createElement('span');
      label.className = 'chat-item-category';
      label.textContent = category;
      chat.appendChild(label);
    }
  });
}

// Initialize extension
function initialize() {
  chrome.storage.local.get('chatCategories', (data) => {
    chatCategories = data.chatCategories || {};
    setupExtension();
  });
}

// Setup extension functionality
function setupExtension() {
  createCategoryTabs();
  addCategoryDropdown();
  addCategoryLabels();
}

// Watch for navigation and DOM changes
const observer = new MutationObserver(() => {
  setupExtension();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Start the extension
initialize();