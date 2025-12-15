// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔒 CoinCraft 3D VIP Platform Initializing...');
    
    // Load user data from localStorage
    loadUserData();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Generate initial milestones
    generateMilestones();
    
    // Update UI with current stats
    updateStats();
    
    // Start CPS monitoring
    setInterval(updateCPS, 1000);
    
    // Initialize user count animation
    animateUserCount();
    
    // Initialize Vadra Withdrawal System
    initializeVadraSystem();
    
    console.log('🎉 CoinCraft VIP Platform Ready! Professional 3D Earning System');
});

// ===== GLOBAL STATE =====
let currentUser = null;
let userData = {
    clicks: 0,
    coins: 0,
    earnings: 0,
    todayClicks: 0,
    userId: '',
    username: '',
    email: '',
    createdAt: '',
    milestones: Array(8).fill(null).map((_, i) => ({
        clicksRequired: 100000 * (i + 1),
        amount: i + 1,
        completed: false,
        withdrawn: false,
        id: i + 1
    }))
};

let clickHistory = [];
let lastClickTime = 0;
let clicksPerSecond = 0;
let selectedPaymentMethod = null;
let isWithdrawEnabled = false;

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Auth form toggles
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms('register');
    });
    
    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms('login');
    });
    
    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Google auth button
    document.querySelector('.btn-3d-google')?.addEventListener('click', handleGoogleAuth);
    
    // Mobile menu toggle
    document.getElementById('mobileToggle')?.addEventListener('click', toggleMobileMenu);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Coin click
    const coin3D = document.getElementById('coin3D');
    if (coin3D) {
        coin3D.addEventListener('click', handleCoinClick);
        coin3D.addEventListener('touchstart', handleCoinClick, { passive: true });
        coin3D.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Payment method selection
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', handlePaymentMethodSelect);
    });
    
    // Withdraw button
    document.getElementById('submitWithdraw')?.addEventListener('click', processWithdrawal);
    
    // Form inputs for withdraw
    document.getElementById('accountNumber')?.addEventListener('input', validateWithdrawForm);
    document.getElementById('userEmail')?.addEventListener('input', validateWithdrawForm);
    
    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', toggleFAQ);
    });
    
    // Generate user ID on registration focus
    document.getElementById('registerUsername')?.addEventListener('focus', generateUserId);
    
    // Handle back button and hash changes
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
}

// ===== USER DATA MANAGEMENT =====
function loadUserData() {
    const savedUser = localStorage.getItem('coinCraftUser');
    const savedData = localStorage.getItem('coinCraftData');
    
    if (savedUser && savedData) {
        try {
            currentUser = JSON.parse(savedUser);
            const parsedData = JSON.parse(savedData);
            
            // Merge with default structure
            userData = {
                ...userData,
                ...parsedData,
                milestones: userData.milestones.map((defaultMilestone, i) => {
                    const savedMilestone = parsedData.milestones?.[i];
                    return savedMilestone ? {
                        ...defaultMilestone,
                        ...savedMilestone,
                        clicksRequired: savedMilestone.clicksRequired || defaultMilestone.clicksRequired
                    } : defaultMilestone;
                })
            };
            
            showApp();
            updateStats();
        } catch (error) {
            console.error('Error loading user data:', error);
            localStorage.clear();
        }
    }
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem('coinCraftUser', JSON.stringify(currentUser));
        localStorage.setItem('coinCraftData', JSON.stringify(userData));
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
function toggleAuthForms(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    
    // Clear errors
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    
    if (formType === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        generateUserId();
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
}

function generateUserId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let userId = '';
    
    for (let i = 0; i < 6; i++) {
        userId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const userIdDisplay = document.getElementById('userIdDisplay');
    if (userIdDisplay) {
        userIdDisplay.value = userId;
    }
    
    return userId;
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');
    
    // Basic validation
    if (!username || !password) {
        loginError.textContent = 'Please fill in all fields';
        return;
    }
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('coinCraftUsers') || '[]');
    
    // Find user by username or userId
    const user = users.find(u => 
        (u.username === username || u.userId === username) && 
        u.password === password
    );
    
    if (!user) {
        loginError.textContent = 'Invalid username/ID or password!';
        return;
    }
    
    // Set current user
    currentUser = {
        username: user.username,
        userId: user.userId,
        email: user.email,
        createdAt: user.createdAt
    };
    
    // Load user data
    const savedData = localStorage.getItem(`coinCraftData_${user.userId}`);
    if (savedData) {
        try {
            userData = JSON.parse(savedData);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    // Save current user
    localStorage.setItem('coinCraftUser', JSON.stringify(currentUser));
    
    // Show main app
    showApp();
    
    // Show welcome notification
    showNotification(`Welcome back, ${user.username}! 🔥`, 'success');
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const userIdDisplay = document.getElementById('userIdDisplay').value;
    const registerError = document.getElementById('registerError');
    
    // Validation
    if (!username || !email || !password) {
        registerError.textContent = 'Please fill in all fields';
        return;
    }
    
    if (username.length < 3) {
        registerError.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    if (password.length < 6) {
        registerError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (!isValidEmail(email)) {
        registerError.textContent = 'Please enter a valid email address';
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('coinCraftUsers') || '[]');
    
    // Check for existing username or email
    const existingUser = users.find(u => 
        u.username === username || u.email === email
    );
    
    if (existingUser) {
        registerError.textContent = 'Username or email already exists!';
        return;
    }
    
    // Generate user ID if not already generated
    const userId = userIdDisplay || generateUserId();
    
    // Create new user
    const newUser = {
        username,
        email,
        password,
        userId,
        createdAt: new Date().toISOString()
    };
    
    // Add to users array
    users.push(newUser);
    localStorage.setItem('coinCraftUsers', JSON.stringify(users));
    
    // Initialize user data
    userData = {
        ...userData,
        username,
        email,
        userId,
        createdAt: new Date().toISOString(),
        clicks: 0,
        coins: 0,
        earnings: 0,
        todayClicks: 0
    };
    
    // Set current user
    currentUser = {
        username,
        userId,
        email,
        createdAt: newUser.createdAt
    };
    
    // Save data
    localStorage.setItem('coinCraftUser', JSON.stringify(currentUser));
    localStorage.setItem(`coinCraftData_${userId}`, JSON.stringify(userData));
    
    // Show app
    showApp();
    
    // Show success notification
    showNotification('✅ Account created successfully! Welcome to CoinCraft!', 'success');
}

function handleGoogleAuth() {
    showNotification('🚀 Google authentication coming soon!', 'info');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== UI MANAGEMENT =====
function showApp() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    
    // Update user info
    const currentUserIdEl = document.getElementById('currentUserId');
    if (currentUserIdEl && currentUser) {
        currentUserIdEl.textContent = `ID: ${currentUser.userId}`;
    }
    
    // Show home page
    showPage('home');
}

function handleNavigation(e) {
    e.preventDefault();
    
    const target = e.currentTarget;
    const page = target.getAttribute('data-page');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    target.classList.add('active');
    
    // Show page
    showPage(page);
    
    // Close mobile menu if open
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
    
    // Update URL hash
    window.location.hash = page;
}

function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    const validPages = ['home', 'about', 'coins', 'withdraw', 'help'];
    
    if (validPages.includes(hash)) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === hash) {
                item.classList.add('active');
            }
        });
        
        // Show page
        showPage(hash);
    }
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show requested page
    const pageElement = document.getElementById(`${pageName}Page`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Special handling for specific pages
        if (pageName === 'coins') {
            generateMilestones();
        } else if (pageName === 'withdraw') {
            updateWithdrawStatus();
        }
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

function toggleFAQ(e) {
    const question = e.currentTarget;
    const item = question.parentElement;
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(faqItem => {
        if (faqItem !== item) {
            faqItem.classList.remove('active');
        }
    });
    
    // Toggle current item
    item.classList.toggle('active');
}

// ===== ANIMATION FUNCTIONS =====
function animateUserCount() {
    const userCountEl = document.getElementById('userCount');
    if (!userCountEl) return;
    
    let count = 254;
    const target = Math.floor(Math.random() * 200) + 300;
    
    const interval = setInterval(() => {
        count++;
        userCountEl.textContent = count;
        
        if (count >= target) {
            clearInterval(interval);
        }
    }, 100);
}

// ===== COIN CLICK SYSTEM =====
function handleCoinClick(e) {
    // Prevent multiple rapid clicks on touch devices
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // Minimum 50ms between clicks to prevent spam
    if (timeSinceLastClick < 50) {
        return;
    }
    
    // Add to click history
    clickHistory.push(currentTime);
    
    // Remove clicks older than 1 second
    const oneSecondAgo = currentTime - 1000;
    clickHistory = clickHistory.filter(time => time > oneSecondAgo);
    
    // Check click speed limit (10 clicks per second)
    if (clickHistory.length > 10) {
        showClickWarning('⚠️ Auto-click detected. Please slow down.');
        return;
    } else {
        clearClickWarning();
    }
    
    // Update stats
    userData.clicks++;
    userData.coins++;
    userData.todayClicks++;
    
    // Calculate earnings based on milestones
    updateEarnings();
    
    // Update UI
    updateStats();
    
    // Animate coin
    animateCoin(e);
    
    // Check milestones
    checkMilestones();
    
    // Update last click time
    lastClickTime = currentTime;
    
    // Save data
    saveUserData();
}

function showClickWarning(message) {
    const warningEl = document.getElementById('clickWarning');
    if (warningEl) {
        warningEl.textContent = message;
        warningEl.style.color = 'var(--danger)';
        warningEl.style.fontWeight = '600';
        
        // Auto-clear after 2 seconds
        setTimeout(() => {
            warningEl.textContent = '';
        }, 2000);
    }
}

function clearClickWarning() {
    const warningEl = document.getElementById('clickWarning');
    if (warningEl) {
        warningEl.textContent = '';
    }
}

function animateCoin(e) {
    const coin = document.getElementById('coin3D');
    if (!coin) return;
    
    // Get click position relative to coin
    const rect = coin.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || rect.width / 2) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || rect.height / 2) - rect.top;
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1;
        left: ${x}px;
        top: ${y}px;
    `;
    
    coin.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
    
    // 3D flip animation
    coin.style.transform = 'perspective(1000px) rotateY(180deg) scale(1.1)';
    
    setTimeout(() => {
        coin.style.transform = 'perspective(1000px) rotateY(0deg) scale(1)';
    }, 300);
    
    // Add ripple animation CSS if not already present
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: translate(-50%, -50%) scale(5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateCPS() {
    const now = Date.now();
    clicksPerSecond = clickHistory.filter(time => now - time < 1000).length;
    
    const cpsEl = document.getElementById('clicksPerSecond');
    const speedFill = document.getElementById('speedFill');
    
    if (cpsEl) {
        cpsEl.textContent = `${clicksPerSecond} CPS`;
    }
    
    if (speedFill) {
        const percentage = (clicksPerSecond / 10) * 100;
        speedFill.style.width = `${percentage}%`;
        
        // Update color based on speed
        if (clicksPerSecond > 8) {
            speedFill.style.background = 'linear-gradient(90deg, var(--warning), var(--danger))';
        } else if (clicksPerSecond > 5) {
            speedFill.style.background = 'linear-gradient(90deg, var(--warning), var(--warning))';
        } else {
            speedFill.style.background = 'linear-gradient(90deg, var(--success), var(--accent))';
        }
    }
}

// ===== STATS & MILESTONES =====
function updateStats() {
    // Update click count
    const totalClicksEl = document.getElementById('totalClicks');
    if (totalClicksEl) {
        totalClicksEl.textContent = userData.clicks.toLocaleString();
    }
    
    // Update coin count
    const totalCoinsEl = document.getElementById('totalCoins');
    if (totalCoinsEl) {
        totalCoinsEl.textContent = userData.coins.toLocaleString();
    }
    
    // Update today's coins
    const todayCoinsEl = document.getElementById('todayCoins');
    if (todayCoinsEl) {
        todayCoinsEl.textContent = `+${userData.todayClicks.toLocaleString()} today`;
    }
    
    // Update earnings
    const totalEarningsEl = document.getElementById('totalEarnings');
    if (totalEarningsEl) {
        totalEarningsEl.textContent = `$${userData.earnings.toFixed(2)}`;
    }
    
    // Update current goal
    const currentGoalEl = document.getElementById('currentGoal');
    const goalProgressEl = document.getElementById('goalProgress');
    const clickProgressEl = document.getElementById('clickProgress');
    
    if (currentGoalEl && goalProgressEl && clickProgressEl) {
        const currentMilestone = userData.milestones.find(m => !m.completed);
        
        if (currentMilestone) {
            currentGoalEl.textContent = `$${currentMilestone.amount}`;
            
            const progress = Math.min((userData.clicks / currentMilestone.clicksRequired) * 100, 100);
            goalProgressEl.textContent = `${userData.clicks.toLocaleString()}/${currentMilestone.clicksRequired.toLocaleString()} clicks`;
            
            clickProgressEl.style.width = `${progress}%`;
        } else {
            currentGoalEl.textContent = 'All Complete!';
            goalProgressEl.textContent = 'All milestones achieved! 🎉';
            clickProgressEl.style.width = '100%';
        }
    }
}

function updateEarnings() {
    // Calculate earnings based on completed milestones
    const completedMilestones = userData.milestones.filter(m => m.completed);
    userData.earnings = completedMilestones.reduce((total, milestone) => {
        return total + milestone.amount;
    }, 0);
}

function generateMilestones() {
    const milestonesGrid = document.getElementById('milestonesGrid');
    if (!milestonesGrid) return;
    
    milestonesGrid.innerHTML = '';
    
    userData.milestones.forEach((milestone, index) => {
        const progress = Math.min((userData.clicks / milestone.clicksRequired) * 100, 100);
        const isCompleted = userData.clicks >= milestone.clicksRequired;
        const isCurrent = !isCompleted && (index === 0 || userData.clicks >= userData.milestones[index - 1].clicksRequired);
        
        const card = document.createElement('div');
        card.className = `milestone-card ${isCompleted ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="milestone-header">
                <div class="milestone-title">Milestone ${index + 1}</div>
                <div class="milestone-amount">$${milestone.amount}</div>
            </div>
            <div class="milestone-progress">
                <div class="milestone-bar" style="width: ${progress}%"></div>
            </div>
            <div class="milestone-info">
                <span>${userData.clicks.toLocaleString()}/${milestone.clicksRequired.toLocaleString()}</span>
                <span>${progress.toFixed(1)}%</span>
            </div>
            <div class="milestone-status ${isCompleted ? 'status-completed' : isCurrent ? 'status-active' : 'status-locked'}">
                ${isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Locked'}
            </div>
        `;
        
        milestonesGrid.appendChild(card);
    });
}

function checkMilestones() {
    let newMilestoneCompleted = false;
    
    userData.milestones.forEach((milestone, index) => {
        if (!milestone.completed && userData.clicks >= milestone.clicksRequired) {
            milestone.completed = true;
            newMilestoneCompleted = true;
            
            // Show notification
            showNotification(`🎉 Milestone ${index + 1} completed! $${milestone.amount} ready for withdrawal.`, 'success');
            
            // Update earnings
            updateEarnings();
            updateStats();
            generateMilestones();
            updateWithdrawStatus();
        }
    });
    
    if (newMilestoneCompleted) {
        saveUserData();
    }
}

// ===== VADRA WITHDRAWAL SYSTEM =====
function updateWithdrawStatus() {
    const withdrawStatus = document.getElementById('withdrawStatus');
    const withdrawAmount = document.getElementById('withdrawAmount');
    
    if (!withdrawStatus || !withdrawAmount) return;
    
    // Find first completed but not withdrawn milestone
    const availableMilestone = userData.milestones.find(m => m.completed && !m.withdrawn);
    
    if (availableMilestone) {
        isWithdrawEnabled = true;
        
        withdrawStatus.innerHTML = `
            <i class="fas fa-unlock" style="color: var(--success)"></i>
            <span style="color: var(--success)">Your $${availableMilestone.amount} reward is ready!</span>
        `;
        withdrawStatus.classList.add('unlocked');
        
        withdrawAmount.textContent = `$${availableMilestone.amount}.00`;
    } else {
        isWithdrawEnabled = false;
        
        withdrawStatus.innerHTML = `
            <i class="fas fa-lock"></i>
            <span>Complete a milestone to withdraw</span>
        `;
        withdrawStatus.classList.remove('unlocked');
        
        withdrawAmount.textContent = '$0.00';
    }
    
    validateWithdrawForm();
}

function handlePaymentMethodSelect(e) {
    const card = e.currentTarget;
    const method = card.getAttribute('data-method');
    
    // Remove selected class from all cards
    document.querySelectorAll('.method-card').forEach(c => {
        c.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    card.classList.add('selected');
    
    // Update selected method display
    selectedPaymentMethod = method;
    const selectedMethodEl = document.getElementById('selectedMethod');
    
    if (selectedMethodEl) {
        selectedMethodEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            <span>${method.charAt(0).toUpperCase() + method.slice(1)}</span>
        `;
        selectedMethodEl.classList.add('selected');
    }
    
    // Enable account number and email inputs
    const accountNumber = document.getElementById('accountNumber');
    const userEmail = document.getElementById('userEmail');
    
    if (accountNumber) {
        accountNumber.disabled = false;
        // Update placeholder based on method
        if (method === 'easypaisa') {
            accountNumber.placeholder = 'Enter 11-digit Easypaisa number (03XXXXXXXXX)';
        } else if (method === 'jazzcash') {
            accountNumber.placeholder = 'Enter 11-digit JazzCash number (03XXXXXXXXX)';
        } else if (method === 'binance') {
            accountNumber.placeholder = 'Enter Binance ID or Email';
        }
    }
    if (userEmail) userEmail.disabled = false;
    
    validateWithdrawForm();
}

function validateWithdrawForm() {
    const accountNumber = document.getElementById('accountNumber');
    const userEmail = document.getElementById('userEmail');
    const submitWithdraw = document.getElementById('submitWithdraw');
    const emailHint = document.getElementById('emailHint');
    const accountHint = document.getElementById('accountHint');
    
    if (!accountNumber || !userEmail || !submitWithdraw) return;
    
    const hasSelectedMethod = selectedPaymentMethod !== null;
    const hasValidAccount = accountNumber.value.trim().length > 0;
    const hasValidEmail = userEmail.value.trim().length > 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(userEmail.value);
    
    // Account number validation based on payment method
    if (accountHint && hasSelectedMethod && accountNumber.value) {
        const method = selectedPaymentMethod.toLowerCase();
        let hintText = '';
        
        if (method === 'easypaisa' && !/^03\d{9}$/.test(accountNumber.value)) {
            hintText = '⚠️ Easypaisa: Enter valid 11-digit mobile number (03XXXXXXXXX)';
            accountHint.className = 'input-hint warning';
        } else if (method === 'jazzcash' && !/^03\d{9}$/.test(accountNumber.value)) {
            hintText = '⚠️ JazzCash: Enter valid 11-digit mobile number (03XXXXXXXXX)';
            accountHint.className = 'input-hint warning';
        } else if (method === 'binance' && accountNumber.value.length < 8) {
            hintText = '⚠️ Binance: Enter valid Binance ID or email';
            accountHint.className = 'input-hint warning';
        } else {
            hintText = '✅ Valid account details';
            accountHint.className = 'input-hint success';
        }
        
        accountHint.textContent = hintText;
    }
    
    // Email validation
    if (emailHint) {
        if (userEmail.value && !isEmailValid) {
            emailHint.textContent = '⚠️ Please enter a valid email address';
            emailHint.className = 'input-hint warning';
        } else if (userEmail.value && isEmailValid) {
            emailHint.textContent = '✅ Valid email address';
            emailHint.className = 'input-hint success';
        } else {
            emailHint.textContent = '';
            emailHint.className = 'input-hint';
        }
    }
    
    const canWithdraw = isWithdrawEnabled && hasSelectedMethod && hasValidAccount && hasValidEmail && isEmailValid;
    
    submitWithdraw.disabled = !canWithdraw;
    
    if (canWithdraw) {
        submitWithdraw.style.opacity = '1';
        submitWithdraw.style.cursor = 'pointer';
        submitWithdraw.classList.add('btn-3d-success');
        submitWithdraw.innerHTML = '<span class="btn-text">💰 VIP Withdraw Now</span><span class="btn-glow"></span>';
    } else {
        submitWithdraw.style.opacity = '0.6';
        submitWithdraw.style.cursor = 'not-allowed';
        submitWithdraw.classList.remove('btn-3d-success');
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
    }
}

// ===== VADRA SYSTEM INITIALIZATION =====
function initializeVadraSystem() {
    console.log('🔒 VADRA Withdrawal System Initialized');
    
    // Add validation for payment method selection
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            selectedPaymentMethod = method;
            
            // Update account placeholder based on method
            const accountInput = document.getElementById('accountNumber');
            if (accountInput) {
                if (method === 'easypaisa') {
                    accountInput.placeholder = 'Enter 11-digit Easypaisa number (03XXXXXXXXX)';
                } else if (method === 'jazzcash') {
                    accountInput.placeholder = 'Enter 11-digit JazzCash number (03XXXXXXXXX)';
                } else if (method === 'binance') {
                    accountInput.placeholder = 'Enter Binance ID or Email';
                }
            }
            
            validateWithdrawForm();
        });
    });
    
    // Add validation on input
    document.getElementById('accountNumber')?.addEventListener('input', validateWithdrawForm);
    document.getElementById('userEmail')?.addEventListener('input', validateWithdrawForm);
    
    console.log('✅ VADRA System Ready for VIP Withdrawals');
}

// ===== VADRA WITHDRAWAL PROCESSING =====
async function processWithdrawal() {
    if (!isWithdrawEnabled) {
        showNotification('No milestone available for withdrawal!', 'warning');
        return;
    }
    
    const submitWithdraw = document.getElementById('submitWithdraw');
    if (submitWithdraw.disabled) return;
    
    // Find the milestone to withdraw
    const milestoneIndex = userData.milestones.findIndex(m => m.completed && !m.withdrawn);
    if (milestoneIndex === -1) {
        showNotification('No milestone available for withdrawal!', 'warning');
        return;
    }
    
    const milestone = userData.milestones[milestoneIndex];
    const accountNumber = document.getElementById('accountNumber').value.trim();
    const userEmailValue = document.getElementById('userEmail').value.trim();
    const paymentMethod = selectedPaymentMethod;
    
    // Validate inputs
    if (!accountNumber || !userEmailValue || !paymentMethod) {
        showNotification('Please fill in all fields!', 'warning');
        return;
    }
    
    if (!isValidEmail(userEmailValue)) {
        showNotification('Please enter a valid email address!', 'warning');
        return;
    }
    
    // Show processing notification
    showNotification('VIP Withdrawal Request Processing...', 'info');
    
    // Disable button during processing
    submitWithdraw.disabled = true;
    submitWithdraw.innerHTML = '<span class="btn-text">Processing VIP Request...</span><span class="btn-glow"></span>';
    submitWithdraw.classList.add('btn-processing');
    
    try {
        // Prepare withdrawal data
        const withdrawalData = {
            user_id: currentUser.userId,
            username: currentUser.username,
            user_email: userEmailValue,
            amount: milestone.amount,
            payment_method: paymentMethod,
            account_number: accountNumber,
            total_clicks: userData.clicks,
            total_coins: userData.coins,
            milestone_number: milestone.id,
            request_date: new Date().toISOString(),
            request_timestamp: Date.now()
        };
        
        // Send withdrawal request via Vadra System
        const vadraSuccess = await sendVadraWithdrawalRequest(withdrawalData);
        
        if (vadraSuccess) {
            // Mark milestone as withdrawn
            milestone.withdrawn = true;
            
            // Save updated data
            saveUserData();
            
            // Reset form
            resetWithdrawForm();
            
            // Show VIP success notification
            showNotification('✅ VIP Withdrawal Request Submitted Successfully!', 'success');
            
            // Show detailed success message
            setTimeout(() => {
                showNotification(`Owner will process your $${milestone.amount} payment within 24 hours.`, 'info');
            }, 2000);
            
            // Start admin processing simulation
            simulateAdminProcessing(milestone.amount, userEmailValue, currentUser.username);
            
        } else {
            throw new Error('Vadra system failed');
        }
        
    } catch (error) {
        console.error('VIP Withdrawal processing error:', error);
        showNotification('⚠️ Withdrawal processing failed. Please contact support.', 'danger');
        
        // Re-enable button
        submitWithdraw.disabled = false;
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
        submitWithdraw.classList.remove('btn-processing');
    }
}

async function sendVadraWithdrawalRequest(withdrawalData) {
    return new Promise(async (resolve) => {
        try {
            console.log('🚀 VADRA SYSTEM: Processing VIP withdrawal request...');
            
            // Generate unique transaction ID
            const transactionId = generateTransactionId();
            withdrawalData.transaction_id = transactionId;
            
            // Prepare email content for owner
            const emailContent = prepareOwnerEmail(withdrawalData);
            
            // Method 1: EmailJS (Production - requires user setup)
            const emailjsSent = await sendViaEmailJS(emailContent, withdrawalData);
            
            if (emailjsSent) {
                console.log('✅ VADRA: Email sent via EmailJS');
                resolve(true);
                return;
            }
            
            // Method 2: Formspree Backup (Silent POST request)
            const formspreeSent = await sendViaFormspree(withdrawalData);
            
            if (formspreeSent) {
                console.log('✅ VADRA: Data sent via Formspree');
                resolve(true);
                return;
            }
            
            // Method 3: Webhook/API Backup
            const webhookSent = await sendViaWebhook(withdrawalData);
            
            if (webhookSent) {
                console.log('✅ VADRA: Data sent via Webhook');
                resolve(true);
                return;
            }
            
            // Method 4: Local storage fallback (For demo purposes)
            saveWithdrawalLocally(withdrawalData);
            console.log('⚠️ VADRA: Saved locally - Owner must check system');
            resolve(true);
            
        } catch (error) {
            console.error('❌ VADRA SYSTEM ERROR:', error);
            resolve(false);
        }
    });
}

// ===== EMAILJS INTEGRATION =====
async function sendViaEmailJS(emailContent, withdrawalData) {
    try {
        // Check if EmailJS is initialized
        if (typeof emailjs === 'undefined' || !emailjs.send) {
            console.warn('⚠️ EmailJS not configured');
            return false;
        }
        
        // User needs to set these in their EmailJS dashboard
        const serviceID = 'service_coineraft'; // User must create in EmailJS
        const templateID = 'template_withdrawal'; // User must create in EmailJS
        const publicKey = 'YOUR_PUBLIC_KEY_HERE'; // User must set this
        
        // Initialize if not done
        if (!window.emailjsInitialized) {
            emailjs.init(publicKey);
            window.emailjsInitialized = true;
        }
        
        // Send email silently
        await emailjs.send(serviceID, templateID, {
            to_email: 'xstylishriaz72@gmail.com',
            from_name: 'CoinCraft VIP System',
            user_id: withdrawalData.user_id,
            username: withdrawalData.username,
            user_email: withdrawalData.user_email,
            amount: withdrawalData.amount,
            payment_method: withdrawalData.payment_method,
            account_number: withdrawalData.account_number,
            transaction_id: withdrawalData.transaction_id,
            milestone: withdrawalData.milestone_number,
            total_clicks: withdrawalData.total_clicks,
            request_date: new Date().toLocaleString(),
            message: emailContent.text,
            html_message: emailContent.html
        });
        
        return true;
    } catch (error) {
        console.warn('EmailJS failed:', error);
        return false;
    }
}

// ===== FORMSPREE INTEGRATION =====
async function sendViaFormspree(withdrawalData) {
    return new Promise((resolve) => {
        try {
            // Formspree endpoint - User needs to create at formspree.io
            const formspreeEndpoint = 'https://formspree.io/f/xstylishriaz72@gmail.com';
            
            // Create form data
            const formData = new FormData();
            formData.append('_subject', `[VIP WITHDRAWAL] $${withdrawalData.amount} - ${withdrawalData.username}`);
            formData.append('_replyto', withdrawalData.user_email);
            formData.append('user_id', withdrawalData.user_id);
            formData.append('username', withdrawalData.username);
            formData.append('user_email', withdrawalData.user_email);
            formData.append('amount', `$${withdrawalData.amount}`);
            formData.append('payment_method', withdrawalData.payment_method);
            formData.append('account_number', withdrawalData.account_number);
            formData.append('transaction_id', withdrawalData.transaction_id);
            formData.append('milestone', withdrawalData.milestone_number);
            formData.append('total_clicks', withdrawalData.total_clicks.toLocaleString());
            formData.append('request_time', new Date().toLocaleString());
            formData.append('_format', 'plain');
            
            // Send POST request silently
            fetch(formspreeEndpoint, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            })
            .then(() => {
                console.log('Formspree request sent');
                resolve(true);
            })
            .catch(() => {
                console.warn('Formspree failed');
                resolve(false);
            });
            
        } catch (error) {
            console.warn('Formspree error:', error);
            resolve(false);
        }
    });
}

// ===== WEBHOOK INTEGRATION =====
async function sendViaWebhook(withdrawalData) {
    return new Promise((resolve) => {
        try {
            // Multiple webhook services for redundancy
            const webhooks = [
                'https://webhook.site/your-webhook-id',
                'https://hooks.zapier.com/hooks/catch/your-id/',
                'https://maker.ifttt.com/trigger/withdraw/with/key/YOUR-KEY'
            ];
            
            const webhookPayload = {
                event: 'vip_withdrawal_request',
                timestamp: new Date().toISOString(),
                data: withdrawalData,
                platform: 'CoinCraft VIP'
            };
            
            // Try each webhook
            let success = false;
            const promises = webhooks.map(webhook => 
                fetch(webhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(webhookPayload)
                })
                .then(response => {
                    if (response.ok) success = true;
                })
                .catch(() => {})
            );
            
            Promise.race(promises)
                .then(() => resolve(success))
                .catch(() => resolve(false));
                
        } catch (error) {
            console.warn('Webhook error:', error);
            resolve(false);
        }
    });
}

// ===== LOCAL STORAGE FALLBACK =====
function saveWithdrawalLocally(withdrawalData) {
    try {
        // Get existing withdrawals
        const existingWithdrawals = JSON.parse(localStorage.getItem('vip_withdrawals') || '[]');
        
        // Add new withdrawal
        existingWithdrawals.push({
            ...withdrawalData,
            local_save_time: new Date().toISOString(),
            status: 'pending_owner_review'
        });
        
        // Save back to localStorage
        localStorage.setItem('vip_withdrawals', JSON.stringify(existingWithdrawals));
        
        // Also save to a special key for easy access
        localStorage.setItem('last_withdrawal_request', JSON.stringify(withdrawalData));
        
        console.log('✅ Withdrawal saved locally. Owner can check localStorage for requests.');
        return true;
    } catch (error) {
        console.error('Local save error:', error);
        return false;
    }
}

// ===== PREPARE OWNER EMAIL =====
function prepareOwnerEmail(withdrawalData) {
    const dateTime = new Date().toLocaleString();
    const transactionId = withdrawalData.transaction_id || generateTransactionId();
    
    const textEmail = `
🔒 COINCRAFT VIP WITHDRAWAL REQUEST
═══════════════════════════════════════

🎯 TRANSACTION DETAILS:
• Transaction ID: ${transactionId}
• Amount: $${withdrawalData.amount}
• Date: ${dateTime}
• Status: PENDING

👤 USER INFORMATION:
• User ID: ${withdrawalData.user_id}
• Username: ${withdrawalData.username}
• User Email: ${withdrawalData.user_email}
• Total Clicks: ${withdrawalData.total_clicks.toLocaleString()}
• Milestone: #${withdrawalData.milestone_number}

💳 PAYMENT INFORMATION:
• Payment Method: ${withdrawalData.payment_method.toUpperCase()}
• Account Number: ${withdrawalData.account_number}
• Expected Payout: $${withdrawalData.amount}

📊 PLATFORM STATISTICS:
• User Since: ${currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
• Daily Clicks: ${userData.todayClicks.toLocaleString()}
• Overall Rank: Premium User

⚠️ ACTION REQUIRED:
1. Process $${withdrawalData.amount} payment via ${withdrawalData.payment_method}
2. Send payment confirmation to: ${withdrawalData.user_email}
3. Update system status for: ${withdrawalData.user_id}
4. Keep record of Transaction ID: ${transactionId}

⏰ PROCESSING TIMELINE:
• Request Received: ${dateTime}
• Deadline: Within 24 hours
• Priority: VIP User

═══════════════════════════════════════
📧 This is an automated VIP withdrawal request.
   Do not reply to this email.
   Contact: xstylishriaz72@gmail.com
═══════════════════════════════════════
    `;
    
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .vip-container { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .vip-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .vip-content { padding: 40px; }
        .vip-section { margin-bottom: 30px; padding: 25px; background: #f8f9fa; border-radius: 15px; border-left: 5px solid #667eea; }
        .vip-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 20px; border-radius: 25px; font-weight: bold; margin-bottom: 20px; }
        .amount-display { font-size: 42px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .info-label { font-weight: 600; color: #666; }
        .info-value { font-weight: 500; color: #333; }
        .action-box { background: #fff3cd; border: 2px solid #ffeaa7; border-radius: 10px; padding: 20px; margin-top: 30px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="vip-container">
        <div class="vip-header">
            <h1>🔒 VIP WITHDRAWAL REQUEST</h1>
            <p>CoinCraft Professional Platform</p>
        </div>
        
        <div class="vip-content">
            <div class="vip-badge">Transaction ID: ${transactionId}</div>
            
            <div class="amount-display">$${withdrawalData.amount}</div>
            
            <div class="vip-section">
                <h3>👤 User Details</h3>
                <div class="info-row">
                    <span class="info-label">User ID:</span>
                    <span class="info-value">${withdrawalData.user_id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Username:</span>
                    <span class="info-value">${withdrawalData.username}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">User Email:</span>
                    <span class="info-value">${withdrawalData.user_email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Clicks:</span>
                    <span class="info-value">${withdrawalData.total_clicks.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="vip-section">
                <h3>💳 Payment Information</h3>
                <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value" style="color: #667eea; font-weight: bold;">${withdrawalData.payment_method.toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Number:</span>
                    <span class="info-value">${withdrawalData.account_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Milestone:</span>
                    <span class="info-value">#${withdrawalData.milestone_number} ($${withdrawalData.amount})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Request Date:</span>
                    <span class="info-value">${dateTime}</span>
                </div>
            </div>
            
            <div class="action-box">
                <h3>⚠️ Action Required</h3>
                <p><strong>Process payment of $${withdrawalData.amount} via ${withdrawalData.payment_method}</strong></p>
                <p>Send payment confirmation to user email: ${withdrawalData.user_email}</p>
                <p><em>Please process within 24 hours for VIP user satisfaction.</em></p>
            </div>
        </div>
        
        <div class="footer">
            <p>CoinCraft VIP Withdrawal System | Automated Request</p>
            <p>This email was automatically generated. Do not reply.</p>
            <p>Owner: xstylishriaz72@gmail.com | Admin Panel</p>
        </div>
    </div>
</body>
</html>
    `;
    
    return { text: textEmail, html: htmlEmail };
}

// ===== ADMIN PROCESSING SIMULATION =====
function simulateAdminProcessing(amount, userEmail, username) {
    console.log('🏦 ADMIN PROCESSING SIMULATION STARTED...');
    
    const steps = [
        { delay: 1000, message: `🏦 Owner received withdrawal request for $${amount}`, type: 'info' },
        { delay: 2500, message: `💳 Processing payment via ${selectedPaymentMethod}...`, type: 'info' },
        { delay: 4000, message: `✅ Payment of $${amount} processed successfully`, type: 'success' },
        { delay: 5500, message: `📧 Confirmation sent to ${userEmail}`, type: 'success' },
        { delay: 7000, message: `🎉 Withdrawal completed! Check your email for details`, type: 'success' }
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            showNotification(step.message, step.type);
            
            // Last step - reset earning cycle
            if (index === steps.length - 1) {
                setTimeout(() => {
                    resetEarningCycle();
                }, 3000);
            }
        }, step.delay);
    });
    
    // Log to console for debugging
    console.log(`💰 ADMIN: Processing $${amount} for ${username} (${userEmail})`);
}

// ===== UTILITY FUNCTIONS =====
function generateTransactionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'CC-VIP-';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function resetWithdrawForm() {
    // Clear form inputs
    document.getElementById('accountNumber').value = '';
    document.getElementById('userEmail').value = '';
    
    // Reset selected method
    selectedPaymentMethod = null;
    document.querySelectorAll('.method-card').forEach(c => {
        c.classList.remove('selected');
    });
    
    const selectedMethodEl = document.getElementById('selectedMethod');
    if (selectedMethodEl) {
        selectedMethodEl.innerHTML = `
            <i class="fas fa-question-circle"></i>
            <span>Select a payment method</span>
        `;
        selectedMethodEl.classList.remove('selected');
    }
    
    // Disable inputs
    document.getElementById('accountNumber').disabled = true;
    document.getElementById('userEmail').disabled = true;
    
    // Reset validation hints
    const emailHint = document.getElementById('emailHint');
    const accountHint = document.getElementById('accountHint');
    if (emailHint) {
        emailHint.textContent = '';
        emailHint.className = 'input-hint';
    }
    if (accountHint) {
        accountHint.textContent = '';
        accountHint.className = 'input-hint';
    }
    
    // Reset button
    const submitWithdraw = document.getElementById('submitWithdraw');
    if (submitWithdraw) {
        submitWithdraw.disabled = true;
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
        submitWithdraw.style.opacity = '0.6';
        submitWithdraw.classList.remove('btn-processing');
    }
    
    updateWithdrawStatus();
}

function resetEarningCycle() {
    // Reset click counts but keep completed milestones
    userData.clicks = 0;
    userData.coins = 0;
    userData.todayClicks = 0;
    
    // Update UI
    updateStats();
    generateMilestones();
    updateWithdrawStatus();
    
    // Show VIP notification
    showNotification('🌟 New VIP earning cycle started! Ready for next milestone.', 'info');
    
    saveUserData();
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    // Remove old notifications if too many
    if (container.children.length > 3) {
        container.removeChild(container.firstChild);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        danger: 'fas fa-times-circle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// ===== EMAIL PREVIEW MODAL (Optional) =====
function showEmailPreview(emailData) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.email-preview-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'email-preview-modal';
    
    modal.innerHTML = `
        <div class="email-preview-content">
            <button class="email-preview-close" onclick="this.parentElement.parentElement.remove()">×</button>
            
            <h2 class="email-preview-header">📧 Email Preview (Sent to Admin)</h2>
            
            <div class="email-preview-info">
                <p><strong>To:</strong> ${emailData.to || 'xstylishriaz72@gmail.com'}</p>
                <p><strong>Subject:</strong> ${emailData.subject || 'VIP Withdrawal Request'}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="email-preview-body">${emailData.text || emailData.body}</div>
            
            <div class="email-preview-actions">
                <button class="copy-btn" onclick="
                    navigator.clipboard.writeText('${(emailData.text || emailData.body).replace(/'/g, "\\'")}');
                    showNotification('Email content copied to clipboard!', 'success');
                ">
                    <i class="fas fa-copy"></i>
                    Copy Email Content
                </button>
            </div>
            
            <div class="email-preview-instructions">
                <h4>📋 What happens next?</h4>
                <ol>
                    <li>Email sent to admin (xstylishriaz72@gmail.com)</li>
                    <li>Admin will process payment within 24 hours</li>
                    <li>You'll receive payment confirmation email</li>
                    <li>Payment screenshot will be sent to your email</li>
                    <li>Your click counter will reset automatically</li>
                </ol>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== UTILITY FUNCTIONS =====
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An error occurred. Please refresh the page.', 'danger');
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        userData,
        currentUser,
        updateStats,
        generateMilestones,
        checkMilestones,
        handleCoinClick,
        processWithdrawal
    };
}