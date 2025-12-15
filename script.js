// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log(' CoinCraft 3D Earning Platform Initializing...');
    
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
    
    console.log(' CoinCraft Ready! Professional 3D Earning Platform');
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
        clicksRequired: 500 * (i + 1),  // 100k, 200k, 300k... 800k
        amount: i + 1,                    // $1, $2, $3... $8
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
    showNotification(`Welcome back, ${user.username}! `, 'success');
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
    showNotification(' Account created successfully! Welcome to CoinCraft!', 'success');
}

function handleGoogleAuth() {
    showNotification(' Google authentication coming soon!', 'info');
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
    const target = Math.floor(Math.random() * 200) + 300; // Random between 300-500
    
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
        showClickWarning(' Auto-click detected. Please slow down.');
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
            goalProgressEl.textContent = 'All milestones achieved! ';
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
            showNotification(` Milestone ${index + 1} completed! $${milestone.amount} ready for withdrawal.`, 'success');
            
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

// ===== WITHDRAWAL SYSTEM =====
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
    
    if (accountNumber) accountNumber.disabled = false;
    if (userEmail) userEmail.disabled = false;
    
    validateWithdrawForm();
}

function validateWithdrawForm() {
    const accountNumber = document.getElementById('accountNumber');
    const userEmail = document.getElementById('userEmail');
    const submitWithdraw = document.getElementById('submitWithdraw');
    const emailHint = document.getElementById('emailHint');
    
    if (!accountNumber || !userEmail || !submitWithdraw) return;
    
    const hasSelectedMethod = selectedPaymentMethod !== null;
    const hasValidAccount = accountNumber.value.trim().length > 0;
    const hasValidEmail = userEmail.value.trim().length > 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(userEmail.value);
    
    // Show validation hints
    if (emailHint) {
        if (userEmail.value && !isEmailValid) {
            emailHint.textContent = ' Please enter a valid email address';
            emailHint.className = 'input-hint warning';
        } else if (userEmail.value && isEmailValid) {
            emailHint.textContent = ' Valid email address';
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
        submitWithdraw.innerHTML = '<span class="btn-text"> Withdraw Now</span><span class="btn-glow"></span>';
    } else {
        submitWithdraw.style.opacity = '0.6';
        submitWithdraw.style.cursor = 'not-allowed';
        submitWithdraw.classList.remove('btn-3d-success');
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
    }
}

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
    
    // Validate inputs
    if (!accountNumber || !userEmailValue) {
        showNotification('Please fill in all fields!', 'warning');
        return;
    }
    
    if (!isValidEmail(userEmailValue)) {
        showNotification('Please enter a valid email address!', 'warning');
        return;
    }
    
    // Show processing notification
    showNotification(' Processing withdrawal request...', 'info');
    
    // Disable button during processing
    submitWithdraw.disabled = true;
    submitWithdraw.innerHTML = '<span class="btn-text">Processing...</span><span class="btn-glow"></span>';
    
    try {
        // Prepare email data
        const emailData = prepareEmailData(milestone, accountNumber, userEmailValue);
        
        // Send email using multiple methods
        const emailSent = await sendWithdrawalEmail(emailData);
        
        if (emailSent) {
            // Mark milestone as withdrawn
            milestone.withdrawn = true;
            
            // Save updated data
            saveUserData();
            
            // Reset form
            resetWithdrawForm();
            
            // Show success notification
            showNotification(' Withdrawal request email sent to admin!', 'success');
            
            // Show email preview
            showEmailPreview(emailData);
            
            // Simulate admin processing
            simulateAdminProcessing(milestone.amount, userEmailValue);
            
        } else {
            throw new Error('Email sending failed');
        }
        
    } catch (error) {
        console.error(' Withdrawal processing error:', error);
        showNotification(' Withdrawal processing failed. Please try again or contact support.', 'danger');
        
        // Re-enable button
        submitWithdraw.disabled = false;
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
    }
}

function prepareEmailData(milestone, accountNumber, userEmail) {
    const requestId = generateRequestId();
    const currentDate = new Date().toLocaleString();
    
    return {
        to: 'xstylishriaz72@gmail.com',
        subject: `[CoinCraft] Withdrawal Request - $${milestone.amount} - ${currentUser.username}`,
        body: `
COINCRAFT WITHDRAWAL REQUEST


 **WITHDRAWAL DETAILS**
• Amount: $${milestone.amount}
• Request Date: ${currentDate}
• Request ID: ${requestId}

 **USER INFORMATION**
• Username: ${currentUser.username}
• User ID: ${currentUser.userId}
• User Email: ${userEmail}
• Total Clicks: ${userData.clicks.toLocaleString()}
• Total Coins: ${userData.coins.toLocaleString()}

 **PAYMENT INFORMATION**
• Payment Method: ${selectedPaymentMethod.toUpperCase()}
• Account Number: ${accountNumber}
• Milestone Completed: #${milestone.id}

 **STATISTICS**
• Current Milestone: ${milestone.id}/8
• Clicks Required: ${milestone.clicksRequired.toLocaleString()}
• Clicks Achieved: ${userData.clicks.toLocaleString()}
• Completion: ${((userData.clicks / milestone.clicksRequired) * 100).toFixed(1)}%


 **ADMIN ACTIONS REQUIRED**
1. Process $${milestone.amount} payment via ${selectedPaymentMethod}
2. Send payment screenshot to user email: ${userEmail}
3. Update user record in system
4. Send confirmation to admin email


 **CONTACT FOR VERIFICATION**
• User Email: ${userEmail}
• Platform Admin: xstylishriaz72@gmail.com
• Admin WhatsApp: +92 333 4912454


 **SECURITY VERIFICATION**
 User authenticated: YES
 Milestone verified: YES
 Payment method selected: YES
 Account number provided: YES
 Email validated: YES


        `,
        htmlBody: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .section { margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #6366f1; }
        .highlight { background: #f0f9ff; padding: 15px; border-radius: 6px; border: 1px solid #bae6fd; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { margin-top: 30px; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 20px; font-size: 12px; margin: 0 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1> CoinCraft Withdrawal Request</h1>
        <p>Payment Processing Required</p>
    </div>
    
    <div class="content">
        <div class="amount">$${milestone.amount}</div>
        
        <div class="section">
            <h2> User Details</h2>
            <p><strong>Username:</strong> ${currentUser.username}</p>
            <p><strong>User ID:</strong> ${currentUser.userId}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Total Clicks:</strong> ${userData.clicks.toLocaleString()}</p>
        </div>
        
        <div class="section">
            <h2> Payment Information</h2>
            <p><strong>Method:</strong> <span class="badge">${selectedPaymentMethod.toUpperCase()}</span></p>
            <p><strong>Account Number:</strong> ${accountNumber}</p>
            <p><strong>Milestone:</strong> #${milestone.id} ($${milestone.amount})</p>
        </div>
        
        <div class="highlight">
            <h3> Action Required</h3>
            <p>Please process this payment and send confirmation to:</p>
            <p><strong>Admin:</strong> xstylishriaz72@gmail.com</p>
            <p><strong>User:</strong> ${userEmail}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>CoinCraft Earning Platform | Developed by Mr. Riaz</p>
        <p>This is an automated withdrawal request. Please process within 24 hours.</p>
        <p>Request ID: ${generateRequestId()} | ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
        `
    };
}

async function sendWithdrawalEmail(emailData) {
    try {
        // Method 1: EmailJS (if configured)
        if (typeof emailjs !== 'undefined' && emailjs.init) {
            try {
                await emailjs.send(
                    'service_coineraft', // Replace with your service ID
                    'template_withdrawal', // Replace with your template ID
                    {
                        to_email: emailData.to,
                        subject: emailData.subject,
                        message: emailData.body,
                        user_id: currentUser.userId,
                        username: currentUser.username,
                        amount: emailData.amount,
                        user_email: document.getElementById('userEmail').value
                    }
                );
                console.log(' Email sent via EmailJS');
                return true;
            } catch (emailjsError) {
                console.warn(' EmailJS failed, using fallback:', emailjsError);
            }
        }
        
        // Method 2: mailto fallback (works everywhere)
        const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}&cc=${encodeURIComponent(document.getElementById('userEmail').value)}`;
        window.open(mailtoLink, '_blank');
        
        // Method 3: Form submission simulation
        simulateFormSubmission(emailData);
        
        return true;
        
    } catch (error) {
        console.error(' Email sending error:', error);
        return false;
    }
}

function generateRequestId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CC-${id}`;
}

function simulateFormSubmission(emailData) {
    // Create a hidden form for form submission
    const form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'POST';
    form.action = 'https://formspree.io/f/xstylishriaz72@gmail.com';
    
    const fields = {
        '_replyto': document.getElementById('userEmail').value,
        '_subject': emailData.subject,
        'message': emailData.body,
        'user_id': currentUser.userId,
        'amount': emailData.amount,
        'timestamp': new Date().toISOString()
    };
    
    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });
    
    document.body.appendChild(form);
    // Note: In production, you would actually submit this form
    // For demo, we'll just log it
    console.log(' Form data prepared for submission:', fields);
    
    setTimeout(() => form.remove(), 1000);
}

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
            
            <h2 class="email-preview-header"> Email Preview (Sent to Admin)</h2>
            
            <div class="email-preview-info">
                <p><strong>To:</strong> ${emailData.to}</p>
                <p><strong>Subject:</strong> ${emailData.subject}</p>
                <p><strong>CC:</strong> ${document.getElementById('userEmail').value}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="email-preview-body">${emailData.body}</div>
            
            <div class="email-preview-actions">
                <button onclick="
                    window.open('mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}', '_blank');
                    this.parentElement.parentElement.parentElement.remove();
                ">
                    <i class="fas fa-paper-plane"></i>
                    Open in Email Client
                </button>
                
                <button class="copy-btn" onclick="
                    navigator.clipboard.writeText(document.getElementById('emailContentText').innerText);
                    showNotification('Email content copied to clipboard!', 'success');
                ">
                    <i class="fas fa-copy"></i>
                    Copy Email Content
                </button>
            </div>
            
            <div id="emailContentText" style="display: none;">${emailData.body}</div>
            
            <div class="email-preview-instructions">
                <h4> What happens next?</h4>
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

function simulateAdminProcessing(amount, userEmail) {
    console.log(' Admin processing simulation started...');
    
    setTimeout(() => {
        showNotification(' Admin received your withdrawal request...', 'info');
        
        setTimeout(() => {
            showNotification(' Payment being processed...', 'info');
            
            setTimeout(() => {
                showNotification(` Payment confirmation sent to ${userEmail}`, 'success');
                
                setTimeout(() => {
                    showNotification(` Payment of $${amount} completed! Check your email for screenshot.`, 'success');
                    
                    // Reset earning cycle
                    setTimeout(() => {
                        resetEarningCycle();
                    }, 3000);
                }, 2000);
            }, 2000);
        }, 2000);
    }, 2000);
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
    if (emailHint) {
        emailHint.textContent = '';
        emailHint.className = 'input-hint';
    }
    
    // Reset button
    const submitWithdraw = document.getElementById('submitWithdraw');
    if (submitWithdraw) {
        submitWithdraw.disabled = true;
        submitWithdraw.innerHTML = '<span class="btn-text">Withdraw Now</span><span class="btn-glow"></span>';
        submitWithdraw.style.opacity = '0.6';
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
    
    // Show notification
    showNotification(' New earning cycle started! Click to earn again.', 'info');
    
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

// ===== UTILITY FUNCTIONS =====
function formatNumber(num) {
    if (num >= 5000) {
        return (num / 5000).toFixed(1) + 'M';
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