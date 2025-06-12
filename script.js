const apiUrl = CONFIG.API_URL;
const colorPalletes = ["#ecf5fc", "#e8f7e6", "#fceced", "#fff8dc", "#d6e6ff", "#ffffea", "#e5d4ef", "##d1dbe4"];
let currentPage = 1;
const ITEMS_PER_PAGE = 100; // Number of items per 
let transactionData = [];
let filterTransactionData = [];
let isEditing = false; // Flag to check if we are editing
let editingRowNumber = null; // Row number to edit

let cardList = [], subCategoryList = {}, headerList = {}, headerWOIcon = {};

document.addEventListener("DOMContentLoaded", function () {
    //document.getElementById("date-picker").value = new Date().toISOString().split("T")[0];


    fetchCategories()
    getColumnData("Credit Card", 1).then(result => {

        cardList = result
        updateButtons(cardList, "paymentSourceContainer", "selectedPaymentSource", "Payment Source");


    }).catch(error => console.error("Unexpected error:", error));
    // Auto-fill today's date

    // Usage
    document.getElementById("expenseDate").value = getFormattedISTDate();
    localStorage.removeItem("selectedFilters");
});
function getFormattedISTDate() {
    let now = new Date();

    // Convert to IST (UTC +5:30)
    let istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    let istTime = new Date(now.getTime() + istOffset);

    // Format to YYYY-MM-DDTHH:MM (needed for datetime-local input)
    let formattedDate = istTime.toISOString().slice(0, 16);

    return formattedDate;
}
function formatDateIST(date) {

    let istTime = new Date(date);
    // Extract components
    let month = String(istTime.getMonth() + 1).padStart(2, '0');
    let day = String(istTime.getDate()).padStart(2, '0');
    let year = istTime.getFullYear();
    let hours = String(istTime.getHours()).padStart(2, '0');
    let minutes = String(istTime.getMinutes()).padStart(2, '0');

    const formatedDate = `${month}/${day}/${year}, ${hours}:${minutes}`
    console.log("formatDateIST" + formatedDate);

    // Format as MM/dd/yyyy, hh:mm (24-hour format)
    return formatedDate;
}




async function fetchData(endpoint, params = {}) {
    try {
        const url = new URL(`${apiUrl}?action=${endpoint}`);

        // Append additional query parameters if provided
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);
        const data = await response.json();

        return data; // Return data for flexible reuse

    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        return null; // Return null if there's an error
    }
}

// Fetch transaction data
fetchData("getTransaction").then(data => {
    transactionData = data;
    filterTransactionData = transactionData;
    renderTransactions(false, currentPage);
});


// Function to render pagination controls
function renderPagination(activePage) {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = ''; // Clear current controls

    const totalPages = Math.ceil(filterTransactionData.length / ITEMS_PER_PAGE);

    for (let i = 1; i <= totalPages; i++) {
        paginationControls.innerHTML += `
          <button class="button is-small ${i === activePage ? 'is-primary' : ''}" onclick="changePage(${i})">
            ${i}
          </button>
        `;
    }
}

// Function to handle page change
function changePage(page) {
    currentPage = page;
    renderTransactions(false, page);
}

function showSection(sectionId, navId) {

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    const links = document.querySelectorAll('.nav-item');
    sections.forEach(section => section.classList.remove('active'));
    links.forEach(link => link.classList.remove('active'));
    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    const selectedNav = document.getElementById(navId);
    selectedSection.classList.add('active');
    selectedNav.classList.add('active');
}
function renderDashboard(data) {
    const container = document.getElementById('dashboard-content');

}
async function loadDashboardData(tableId) {
    let editData = {}
    try {
        const response = await fetch(`${apiUrl}?action=getDashboard`);
        const data = await response.json();
        const dashboardContent = document.getElementById("dashboard-content");
        dashboardContent.innerHTML = ""; // Clear existing content

        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = ""; // Clear table contents before adding new rows
        //console.log(data);
        data.cards.forEach((card, index) => {
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            dashboardContent.innerHTML += `
    <div class="column is-half">
          <div class="card-details">
            <div class="card-title">${card.name}</div>
            <div class="data-item">
              <span class="data-item-title">Utilized:</span>
              <span class="data-item-value">${formatAmountInINR(card.utilized)}</span>
              <span>(${utilizedPercent(card.utilized, card.total)}%)</span>
            </div>
            <div class="data-item">
              <span class="data-item-title">Avai. Limit:</span>
              <span class="data-item-value">${formatAmountInINR(card.remaining)}</span>
            </div>
            <div class="data-item">
              <span class="data-item-title">Credit Limit:</span>
              <span class="data-item-value">${formatAmountInINR(card.total)}</span>
            </div>
          </div>
        </div>
    `
            editData = { cardNumber: card.name.split("-")[1], bankName: card.name.split("-")[0], cardLimit: card.total }
            tableBody.innerHTML += `
    <tr>
    <td class="is-size-7-mobile">${card.name}</td>
    <td class="is-size-7-mobile">${card.total}</td>
    <td class="is-size-7-mobile">${card.utilized}</td>
    <td class="is-size-7-mobile">${card.remaining}</td>
    <td class="is-size-7-mobile">
      <button class="button is-small is-warning is-size-7-mobile" onclick="editData('Credit Card', ${index + 2},${JSON.stringify(editData).replace(/"/g, '&quot;')} )"><i class="fas fa-edit"> </i></button>
      <button class="button is-small is-danger" onclick="deleteData('Credit Card', ${index + 2})"><i class="fas fa-trash"> </i></button>
    </td>
      </tr>
    `
        });
        //console.log(editData);
        const cardDetails = document.querySelectorAll('.card-details');
        cardDetails.forEach((cardDetail, index) => {
            cardDetail.style.backgroundColor = getRandomLightColor()
        })
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function formatAmountInINR(amount) {

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}


function handleModal(modalId, action) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(`${modalId.toLowerCase().replace("modal", "form")}`);

    if (modal) {
        if (action === 'open') {
            modal.classList.add('is-active');
        } else if (action === 'close') {
            modal.classList.remove('is-active');
            isEditing = false;
            if (form) {
                form.reset()
            }
        }
    }
    // console.log("isEditing" + isEditing);

}
function handleModalWithCheckbox(modalId, action) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (action === 'open') {

            // Load the checkboxes dynamically first
            createInputData(cardList, "panel-payment")
            createInputData(headerList, "panel-category")

            const savedFiltersRaw = localStorage.getItem("selectedFilters");
            if (savedFiltersRaw !== null) {
                // Parse JSON and ensure defaults
                const savedFilters = savedFiltersRaw ? JSON.parse(savedFiltersRaw) : { payment: [] };

                setTimeout(() => {
                    document.querySelectorAll(".payment-checkbox").forEach(cb => {
                        cb.checked = savedFilters.payment.includes(cb.value);
                    });
                    document.querySelectorAll(".category-checkbox").forEach(cb => {
                        cb.checked = savedFilters.category.includes(cb.value);
                    });
                    //console.log(saveFilters.payment);
                    document.getElementById("dateFromModal").value = document.getElementById("dateFromModal").getAttribute("data-selected") || "";
                    document.getElementById("dateToModal").value = document.getElementById("dateToModal").getAttribute("data-selected") || "";
                }, 50);
            } // Wait for checkboxes to load
            modal.classList.add('is-active');
        } else if (action === 'close') {
            const selectedBanks = Array.from(document.querySelectorAll(".payment-checkbox:checked")).map(cb => cb.value);
            const selectedCategories = Array.from(document.querySelectorAll(".category-checkbox:checked")).map(cb => cb.value);
            const dateFrom = document.getElementById("dateFromModal").value;
            const dateTo = document.getElementById("dateToModal").value;
            localStorage.setItem("selectedFilters", JSON.stringify({
                payment: selectedBanks, dateFrom, dateTo, category: selectedCategories
            }))

            console.log("Saved Filters:");
            console.log("Banks:", selectedBanks);
            console.log("Categories:", selectedCategories);
            console.log("Date From:", dateFrom);
            console.log("Date To:", dateTo);


            modal.classList.remove('is-active');
        }
    }
    // console.log("isEditing" + isEditing);
}


// Event listeners for opening modals
document.querySelectorAll('[data-modal]').forEach(button => {
    button.addEventListener('click', function () {
        const modalId = this.getAttribute('data-modal');

        if (modalId === 'filter-modal') {
            handleModalWithCheckbox(modalId, 'open')
        } else {
            handleModal(modalId, 'open');
        }
    });
});

// Event listeners for closing modals
document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', function () {
        const modalId = this.getAttribute('data-close');
        handleModal(modalId, 'close');
    });
});

// Close modal on background click
document.querySelectorAll('.modal-background').forEach(background => {
    background.addEventListener('click', function () {
        const modal = this.closest('.modal');
        if (modal) {
            handleModal(modal.id, 'close');
        }
    });
});

// Helper Function: Display Messages
function showMessage(messageBox, type, message) {
    messageBox.className = `notify ${type}`;
    messageBox.textContent = message;
    messageBox.style.visibility = "visible";
    setTimeout(() => {
        messageBox.style.visibility = "hidden";
    }, 3000);
}

function submitData(module, formId) {
    const form = document.getElementById(formId);
    var formData = new FormData(form);
    const action = isEditing ? "edit" : "add";

    if (formId === 'credit-card-form') {
        var data = Object.fromEntries(formData.entries())
        const card = `${data.bankName}-${data.cardNumber}`
        const utilized = 0;
        var rem = 0;

        if (isEditing) {
            rem = `=IF(A${editingRowNumber}<>"",B${editingRowNumber}-D${editingRowNumber})`
            data = { card, ...data, rem }
        } else {
            data = { card, ...data, rem, utilized }
        }
        delete data.cardNumber;
        delete data.bankName;


        console.log("datasubmit:" + JSON.stringify(data, null));
    } else {
        var data = {}
        // Convert form data into JSON object
        formData.forEach((value, key) => {
            data[key] = value;
        });
        console.log("datasubmit:" + JSON.stringify(data, null));
    }
    // Object.assign(data, { utilized: 100, rem: '=IF(A3<>"",C3-D3,"")' })
    // console.log("daaaa: " + data);
    try {
        if (isEditing) {
            data.rowNumber = editingRowNumber; // Include the row number for editing
        }
        fetch(apiUrl, {
            redirect: "follow",
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action, module, data }),
        });

        form.reset();
        isEditing = false;
        // alert(`${module} data added successfully!`);
        // loadTableData(module, `${module.toLowerCase().replace(" ", "-")}-table`);
        alert(`${module} data ${isEditing ? "updated" : "added"} successfully!`);
        //console.log(`${module.toLowerCase().replace(" ", "-")}-table`);
        console.log("modal id:" + `${module.toLowerCase().replace(" ", "-")}-modal`);
        if (formId === 'credit-card-form') {
            loadDashboardData("credit-card-table")
        } else {
            loadTableData(module, `${module.toLowerCase().replace(" ", "-")}-table`, module);
        }
        handleModal(`${module.toLowerCase().replace(" ", "-")}-modal`, 'close')

    } catch (error) {
        console.error(`Error adding data to ${module}:`, error);
    }
}

// Edit Data Function
window.editData = function (module, rowNumber, rowData) {
    isEditing = true;
    editingRowNumber = rowNumber; // Save row number for editing
    const formId = `${module.toLowerCase().replace(" ", "-")}-form`;
    const form = document.getElementById(formId);
    console.log(module);
    console.log(rowData);
    console.log("Row Data Keys:", Object.keys(rowData));
    // Populate the form fields with the existing data
    Object.keys(rowData).forEach((key) => {
        if (form.elements[key]) {
            form.elements[key].value = rowData[key];
        }
    });

    // Open the corresponding modal
    //modals[module.toLowerCase().replace("s", "")].classList.add("is-active");
    handleModal(`${module.toLowerCase().replace(" ", "-")}-modal`, 'open')
}

function deleteData(module, rowNumber) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
        fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "delete", module, data: { rowNumber } }),
        });
        alert(`${module} data deleted successfully!`);
        if (module === 'Profile') {
            loadTableData(module, `${module.toLowerCase().replace(" ", "-")}-table`);
        } else {
            loadDashboardData(`${module.toLowerCase().replace(" ", "-")}-table`)
        }

    } catch (error) {
        console.error(`Error deleting data from ${module}:`, error);
    }
}

// Attach the functions to the global scope:
// window.editData = editData;
//window.deleteData = deleteData;

// Form Submission Handlers
document.getElementById("saveProfileButton").addEventListener("click", (e) => {
    e.preventDefault();
    submitData("Profile", "profile-form");
    // handleModal(modalId, 'close');
});

document.getElementById("saveCreditCardButton").addEventListener("click", (e) => {
    e.preventDefault();
    submitData("Credit Card", "credit-card-form");
});

// document.getElementById("transaction-form").addEventListener("submit", (e) => {
//   e.preventDefault();
//   submitData("Transactions", "transaction-form");
//   //modals.transaction.classList.remove("is-active");
// });

function getRandomLightColor() {
    let hue = Math.floor(Math.random() * 360); // Full spectrum
    let saturation = Math.floor(Math.random() * 50) + 40; // Random saturation between 40-90%
    let lightness = Math.floor(Math.random() * 10) + 92; // Lightness between 90-100%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

document.querySelectorAll('.card-details').forEach(card => {
    card.style.backgroundColor = getRandomLightColor();
});

function loadTableData(module, tableId) {
    fetch(`${apiUrl}?action=get&module=${module}`)
        .then(response => response.json())
        .then(data => {
            //const { transactions, creditCards, profiles } = data
            const tableBody = document.getElementById(tableId);
            tableBody.innerHTML = ""; // Clear table contents before adding new rows

            data.forEach((row, index) => {
                const tr = document.createElement("tr");
                Object.values(row).forEach((value) => {
                    const td = document.createElement("td");
                    td.textContent = value;
                    tr.appendChild(td);
                });

                // Add Edit and Delete buttons
                const actionTd = document.createElement("td");
                actionTd.innerHTML = `
                    <button class="button is-small is-warning" onclick="editData('${module}', ${index + 2},${JSON.stringify(row).replace(/"/g, '&quot;')} )"><i class="fas fa-edit"> </i></button>
                    <button class="button is-small is-danger" onclick="deleteData('${module}', ${index + 2})"><i class="fas fa-trash"> </i></button>
                `;
                tr.appendChild(actionTd);

                tableBody.appendChild(tr);
            })
        })

        .catch(error => {
            console.error("Error loading data:", error);
            // document.getElementById('error-message').classList.remove('is-hidden');
        });
}

// Fetch Card Numbers for Transaction Form
function fetchCardNumbers() {
    fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
        // Send the action in the request body.
        body: JSON.stringify({ action: "getCards" })

    }).then(function (response) {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
        .then(function (data) {
            console.log(data);

            data.data.forEach(function (card) {
                const option = document.createElement('option');
                option.value = card;
                option.textContent = card;
                transactionCardDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching card numbers:", error));
}


function formattedDateDDMMYYYY(date) {
    const currentDate = new Date(date);
    const day = String(currentDate.getDate()).padStart(2, '0'); // Ensures two digits
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month starts from 0
    const year = String(currentDate.getFullYear()); // Gets last two digits of the year

    const formattedDate = `${month}/${day}/${year}`;
    //console.log(formattedDate); // Outputs something like "14-04-25"
    return formattedDate;
}

function formatDateToDDMMYY(isoTimestamp) {
    // Create a Date object from the ISO timestamp
    let date = new Date(isoTimestamp);

    // Convert to IST (UTC+5:30)
    date.setMinutes(date.getMinutes() + 330);

    // Extract day, month, and year
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    let year = String(date.getFullYear());

    return `${day}-${month}-${year}`;
}
function dformatDate(isoTimeStamp) {
    const date = new Date(isoTimeStamp);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function utilizedPercent(utilized, limit) {
    const utilizedPer = utilized / limit * 100;
    return Math.floor(utilizedPer);
}
function formatDateWithOrdinal(inputDate) {
    let date = new Date(inputDate);
    let day = date.getDate();
    let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let month = monthNames[date.getMonth()];
    let year = date.getFullYear();

    // Determine the correct ordinal suffix
    let ordinal;
    if (day === 1 || day === 21 || day === 31) {
        ordinal = "st";
    } else if (day === 2 || day === 22) {
        ordinal = "nd";
    } else if (day === 3 || day === 23) {
        ordinal = "rd";
    } else {
        ordinal = "th";
    }

    return `${day}${ordinal} ${month} ${year}`;
}



const secondSetData = [
    { item: "Recurring", icon: "fas fa-sync" },
    { item: "Medical", icon: "fas fa-credit-card" },
    { item: "Periodic", icon: "fas fa-wallet" },
    { item: "Non-essential", icon: "fas fa-wallet" }
];

// Define light pastel colors for the buttons
const colorMap = ["#e6f7ff", "#fef6e4", "#f3e9f7", "#fff8e6", "#f0fff4"];


function getCardIcon(card) {

    if (typeof card !== "string") {
        return "fas fa-coin"; // Default icon if card isn't valid
    }
    //console.log(card);

    switch (card.trim().replace(/\s+/g, " ").split("-")[0].toLowerCase()) {

        case 'sbi': return 'fas fa-money-check';
        case 'hdfc': return 'fas fa-credit-card';
        case 'axis': return 'fas fa-wallet';
        case 'icici': return 'fas fa-money-bill';
        case 'recurring': return 'fas fa-sync';
        case 'medical': return 'fas fa-notes-medical';
        case 'periodic': return 'fas fa-calendar-alt';
        case 'non': return 'fas fa-shopping-bag';
        default: return 'fas fa-question';
    };
}

// // Submit the form data along with selections
// submitButton.addEventListener('click', () => {
//     saveTransactionData('Credit Card')
//     //console.log("Submitting Data: ", formData); // Replace with app script submission logic

// });
function formattedDate() {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0'); // Ensures two digits
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month starts from 0
    const year = String(currentDate.getFullYear()).slice(-2); // Gets last two digits of the year

    const formattedDate = `${month}/${day}/${year}`;
    //console.log(formattedDate); // Outputs something like "14-04-25"
    return formattedDate;
}

async function getButtonsData() {
    var firstSetData = {}
    try {
        const response = await fetch(`${apiUrl}?action=getCards`);
        var data = await response.json();
        // Generate buttons
        createButtons(data, buttonSet1, handleFirstSetClick);

    } catch (error) {
        console.error("Error loading button data:", error);
    }
}
loadDashboardData("credit-card-table")
// Load data for all modules
loadTableData("Profile", "profile-table");
// loadTableData("Credit Cards", "credit-cards-table");
window.onload = fetchData;

// // google login
// document.addEventListener("DOMContentLoaded", () => {


// });

function handleCredentialResponse(response) {
    if (!response.credential) {
        console.error("Failed to retrieve credentials.");
        return;
    }

    const userInfo = parseJwt(response.credential);
    if (!userInfo.email) {
        console.error("No email found in JWT.");
        return;
    }

    setCookie("userEmail", userInfo.email, 7);
    displayEmail(userInfo.email);
    saveSessionToken(userInfo.email);
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (e) {
        console.error("Error parsing JWT", e);
        return {};
    }
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}; path=/; Secure; SameSite=Strict` + expires
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) return value;
    }
    return null;
}

function loadEmailFromCookie() {
    const savedEmail = getCookie("userEmail");
    if (savedEmail) {
        displayEmail(savedEmail);
    }
    return savedEmail;
}

function displayEmail(email) {
    document.getElementById("email").innerText = email;
    document.getElementById("logoutBtn").style.display = "block"; // Show logout button
}

function logout() {
    deleteSessionToken(getCookie("userEmail"))
    setCookie("userEmail", "", 0); // Expire the cookie immediately
    document.getElementById("email").innerText = "Logged out";
    document.getElementById("logoutBtn").style.display = "none"; // Hide logout button
}

function initGoogleLogin() {
    google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleLogin"),
        { theme: "outline", size: "large" }
    );
}
function verifyPageOwner(email) {
    const data = {
        email
    };
    try {
        fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            // Send the action in the request body.
            body: JSON.stringify({ action: "zEbDgsVTWtlbtdS7", data })

        });
        alert(' data saved successfully..!')
    } catch (error) {
        alert('Error Adding data:', error)
    }
}

async function fetchDatadd() {
    try {
        const response = await fetch(`${apiUrl}?action=verifyPageOwner&module=${email}`); // Replace with your Web App URL
        transactionData = await response.json();
        console.log(transactionData);
        TransactionPage(currentPage)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function saveSessionToken(email) {
    const data = {
        email
    };
    try {
        await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            // Send the action in the request body.
            body: JSON.stringify({ action: "zEbDgsVTWtlbtdS7", data })

        });
        alert(' data saved successfully..!')
    } catch (error) {
        alert('Error Adding data:', error.message)
    }
}
async function deleteSessionToken(email) {
    const data = {
        email
    };
    try {
        await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            // Send the action in the request body.
            body: JSON.stringify({ action: "EDCD5B64", data })

        });
        alert(' data remove successfully..!')
    } catch (error) {
        alert('Error remove data:', error.message)
    }
}

// ADD TRANSACTION START
let selectedButtons = { bank: null, category: null };



function resetForm() {

    document.getElementById("transaction-form").reset(); // Reset form

    setTimeout(() => {
        // Clear hidden fields
        document.getElementById("expenseDate").value = getFormattedISTDate(); // Restore prefilled value
        document.getElementById("selectedCategory").value = "";
        document.getElementById("selectedSubcategory").value = "";
        document.getElementById("selectedPaymentSource").value = "";
        document.querySelector(`#paymentSourceContainer .buttons`).querySelectorAll("button").forEach(btn => {
            btn.classList.remove("is-link"); // Remove active class
        });
        // Clear subcategory/payment source containers
        document.getElementById("subcategoryContainer").innerHTML = "";
        // Optionally reinitialize to a default category (e.g., "Groceries")
        const defaultCategory = "Groceries";
        const defaultTab = document.querySelector(`#categoryTabs li[data-category="${defaultCategory}"]`);
        if (defaultTab) {
            activateTab(defaultTab, defaultCategory);
        }
    }, 0);
}


function feedbackMessage(color, message) {
    let messageElement = document.getElementById("feedback-message");
    messageElement.style.display = "block";
    messageElement.style.color = color;
    messageElement.innerText = message;
    setTimeout(() => {
        messageElement.style.display = "none"
    }, 7000);
}

function getCategoryDetails(category) {
    if (typeof category !== "string") {
        return {
            icon: 'fa-question',
            color: "has-text-dark"
        };
    }

    const formattedCategory = category.toLowerCase().trim().replace(/\s+/g, " ");

    const categoryMap = {
        "recurring": { icon: 'fa-arrows-rotate', color: "has-text-danger" },
        "medical": { icon: 'fa-notes-medical', color: "has-text-info" },
        "periodic": { icon: 'fa-calendar-alt', color: "has-text-primary" },
        "non-essential": { icon: 'fa-shopping-bag', color: "has-text-warning" }
    };

    return categoryMap[formattedCategory] || { icon: 'fa-question', color: "has-text-dark" };
}

async function getColumnDataR(module, field) {
    fetch(`${apiUrl}?action=get&module=${module}&field=${field}`)
        .then(response => response.json())
        .then(data => {
            return data;
            //console.log("Fetched column:", JSON.stringify(bankName, null, 2)); // Logs the array to the console
        })
        .catch(error => console.error("Error fetching data:", error));

}
async function getColumnData(module, field) {
    try {
        const response = await fetch(`${apiUrl}?action=get&module=${module}&field=${field}`)
        if (!response.ok) {
            throw new Error(`Error:${response.status} - ${response.statusText}`);
        }
        const data = await response.json();


        return data;
    } catch (error) {
        console.error(error.message);
        return { message: "Failed to fetch data" }
    }
}

getColumnData("helper", 1).then(result => {

    categoryList = result
}).catch(error => console.error("Unexpected error:", error));

function fetchCategories() {

    // AJAX submission using plaintext with UTF-8 charset
    fetch(`${apiUrl}?action=getCategories2`, {
        method: "GET",
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
    })
        .then(response => response.json())
        .then(data => {
            headerList = Object.keys(data).slice(1);
            subCategoryList = data
            console.log(subCategoryList["Groceries"]);

            // headerWOIcon = headerList.map(item => item.includes(" ") ? item.substring(item.indexOf(" ") + 1) : item)
            loadHeaderList(subCategoryList)
            // Only activate tab after data is fetched
            const defaultCategory = "Groceries";
            const defaultTab = document.querySelector(`#categoryTabs li[data-category="${defaultCategory}"]`);
            if (defaultTab) activateTab(defaultTab, defaultCategory);
        })
        .catch(error => console.log("Error Fetching categories: " + error));

}

function disabledSubmitBtn(disabled) {
    let submitButton = document.getElementById("submitBtn");
    submitButton.disabled = disabled
    if (disabled) {
        submitButton.innerText = "Submitting..."
    } else {
        submitButton.innerText = "Submit"
    }
}

/* TRANSACTION LIST WITH FILTER START */

function renderTransactions(isFilter, page) {
    let expense = 0;
    const transactionContainer = document.getElementById("transactions");

    transactionContainer.innerHTML = "";
    const totalDiv = document.createElement("div");
    const scrollContainer = document.createElement("div");
    totalDiv.classList.add("is-flex", "is-justify-content-space-between", "px-4", "pt-4");

    let totalData = 0;
    let pStr = "";

    let start = (page - 1) * ITEMS_PER_PAGE;
    const end = Math.min(page * ITEMS_PER_PAGE, filterTransactionData.length);

    const transactions = filterTransactionData.slice(start, end);
    if (filterTransactionData.length > 0) {
        start += 1
    }
    totalDiv.innerHTML = `
    <p class="is-size-7 has-text-weight-bold pl-2 is-italic">${pStr}</p>
    <p class="is-size-7 has-text-weight-bold pl-2 is-italic">Displaying ${start} to ${end} records of ${filterTransactionData.length}</p>
    `
    scrollContainer.innerHTML = `<div class="scroll-container " id="scrollContainer"></div>`
    transactionContainer.appendChild(totalDiv)
    transactionContainer.appendChild(scrollContainer)
    transactions.forEach(transaction => {
        expense += transaction.amount;
        let category = getCategoryDetails(transaction.spendCategory)
        const card = document.createElement("div");
        card.classList.add("card", "is-flex");
        card.innerHTML = `
            <div class="left-cardData is-size-7" style="width: 20%;">
            <p class="has-text-weight-bold">${formatDateWithOrdinal(transaction.date)}</p>
            </div>
            <div class="right-cardData is-flex is-flex-direction-column" style="width: 80%;">
                <div class="is-flex is-justify-content-space-between">
                    <span class=" one-line  has-text-semi-bold">${capitalizeFirstLetter(transaction.subcategory)}</span>
                    <span class="amount is-size-6 has-text-info has-text-weight-bold one-line-amount has-text-right">${formatAmountInINR(transaction.amount)}</span>
                </div>
                    <div class="is-flex is-justify-content-space-between">
                    <span class="is-size-7"> ${transaction.category}</span>
                    <span class="is-size-7">${transaction.card}</span>
                </div>
            </div>
    `;
        document.getElementById("tranId").innerText = expense

        // Add click event listener to highlight selected card
        card.addEventListener("click", function () {
            document.querySelectorAll(".card").forEach(c => c.classList.remove("selected-card")); // Remove highlight from all
            card.classList.add("selected-card"); // Highlight clicked card
        });

        transactionContainer.appendChild(card);
    });
    renderPagination(page); // Render pagination controls
}

// // Apply button: add any filtering logic as required and then close the modal
// const applyFilterBtn = document.getElementById('applyFilterBtn');
// applyFilterBtn.addEventListener('click', () => {
//     // Insert filtering logic (e.g., update transactions table) here
//     searchTransactionB()
//     // Close the modal after applying filters
//     closeModal();
// });

function createInputData(list, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = "";
    list.forEach(item => {
        const elementFilter = document.createElement("div");
        elementFilter.innerHTML = `
        <div class="field">
            <label class="checkbox">
                <input type="checkbox" class="${elementId.split("-").pop()}-checkbox" name="${elementId.split("-").pop()}"  value="${item}"
                data-${elementId.split("-").pop()}-id="${item}"
                >
                <span class="pl-2"> ${item}</span>
            </label>
        </div>
        `;
        container.appendChild(elementFilter);
    });
}
function removeIcons(text) {
    return text.replace(/^[^\w\s]+/, "").trim(); // Removes leading non-alphanumeric characters
}
function loadHeaderList(lists) {
    const ul = document.getElementById("categoryTabs");
    ul.innerHTML = "";
    const categories = Object.keys(lists).slice(1);
    categories.forEach(category => {
        const iconClass = getCategoryIconClass(category); // Get matching Font Awesome icon
        const li = document.createElement("li");
        li.dataset.category = category;
        li.innerHTML = `
            <a><i class="${iconClass} pr-1 has-text-info"></i> ${category}</a>
        `;
        ul.appendChild(li);
    })
}

function getCategoryIconClass(category) {
    const iconMap = {
        "Groceries": "fas fa-shopping-cart",
        "Child Care": "fas fa-baby",
        "Utilities": "fas fa-bolt",
        "Transportation": "fas fa-car",
        "Healthcare": "fas fa-hospital",
        "Personal Care": "fas fa-spa",
        "Investments": "fas fa-chart-line",
        "Entertainment": "fas fa-theater-masks",
        "Debt Payments": "fas fa-credit-card",
        "Housing": "fas fa-home",
        "Household Essentials": "fas fa-box",
        "Food & Dining": "fas fa-utensils",
        "Shopping": "fas fa-shopping-bag",
        "Stationery": "fas fa-pencil-alt",
        "Education": "fas fa-book",
        "Miscellaneous": "fas fa-random"
    };

    return iconMap[category] || "fas fa-question-circle"; // Default icon for unknown categories
}


function createCategories(items, containerId, inputId, labelText) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<label class="label" style="font-size: 13px;">Select ${labelText}:</label><div class="buttons"></div>`;
    const buttonGroup = container.querySelector(".buttons");

    items.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button";
        button.textContent = item;
        button.addEventListener("click", () => {
            // Remove active class from all buttons in this group
            buttonGroup.querySelectorAll("button").forEach(btn => btn.classList.remove("is-link"));
            // Mark the selected button
            button.classList.add("is-link");
            // Set the hidden field with the selected value
            document.getElementById(inputId).value = item;
        });
        buttonGroup.appendChild(button);
    });
}


// SEARCH N FILTER
// Function to filter transactions by keyword across multiple fields
const filterTransactions = (keyword, transactions) => {
    return transactions.filter(txn =>
        Object.values(txn).some(value => String(value).toLowerCase().includes(keyword.toLowerCase()))
    );
};

// Function to search transactions via user input
const searchTransaction = () => {
    currentPage = 1;
    document.querySelector('.clear-icon').style.display = 'block';
    const input = document.getElementById("searchInput").value.trim();

    filterTransactionData = filterTransactions(input, transactionData);
    renderTransactions(true, currentPage);

    // document.getElementById("result").innerText = results.length
    //     ? `Matches found: \n${ JSON.stringify(results, null, 2) } `
    //     : "No matching transactions found.";
};

document.querySelector(".clear-icon").addEventListener("click", function () {
    document.getElementById("searchInput").value = "";
    filterTransactionData = transactionData;
    renderTransactions(false, currentPage);
    document.querySelector('.clear-icon').style.display = 'none';
});

const filterTransactionsB = (selectedCards, selectedCategories, dateFrom, dateTo, transactions) => {
    return transactions.filter(txn => {
        let matchesCard = selectedCards.length ? selectedCards.includes(txn.card) : true;
        let matchesCategory = selectedCategories.length ? selectedCategories.includes(txn.category) : true;
        let matchesDate = (!dateFrom || !dateTo) ? true : (new Date(txn.date) >= new Date(dateFrom) && new Date(txn.date) <= new Date(dateTo));
        return matchesCard && matchesCategory && matchesDate;
    });
};

const searchTransactionB = () => {
    currentPage = 1;
    const selectedCards = Array.from(document.querySelectorAll("input[name='payment']:checked")).map(c => c.value);
    const selectedCategories = Array.from(document.querySelectorAll("input[name='category']:checked")).map(c => c.value);
    const dateFrom = document.getElementById("dateFromModal").value;
    const dateTo = document.getElementById("dateToModal").value;
    console.log(selectedCards);

    filterTransactionData = filterTransactionsB(selectedCards, selectedCategories, dateFrom, dateTo, transactionData);
    // Close the modal after applying filters
    document.getElementById('filter-modal').classList.remove('is-active');

    renderTransactions(true, currentPage);
    //     document.getElementById("result").innerText = results.length
    //         ? `Matches found: \n${ JSON.stringify(results, null, 2) } `
    //         : "No matching transactions found.";
};

function showNavItemData(sec) {

    // Hide all sections first
    document.querySelectorAll(".modal-content > div").forEach(el => el.style.display = "none");

    // Show the selected section
    document.getElementById("panel-" + sec).style.display = "block";
    // Update the active state on the navigation menu
    document.querySelectorAll(".menu-list li").forEach(el => el.classList.remove("is-active"));
    console.log("nav" + sec.charAt(0).toUpperCase() + sec.slice(1))
    document.getElementById("nav" + sec.charAt(0).toUpperCase() + sec.slice(1)).classList.add("is-active");
}


// Apply filters: update the dynamic button list and close the modal
function applyFilters() {
    searchTransactionB()
    updateDynamicButtons();
    handleModalWithCheckbox("filter-modal", "close")
}

// Build dynamic button list based on selected filters
function updateDynamicButtons() {
    const cont = document.getElementById("scrollContainer");
    cont.innerHTML = "";
    let cnt = 0;

    // Date filter – format as "May 10 - May 15"
    const df = document.getElementById("dateFromModal").value, dt = document.getElementById("dateToModal").value;
    if (df || dt) {
        const fmt = d => new Date(d).toLocaleString("en-IN", { month: "short", day: "numeric" });
        const text = `${df ? fmt(df) : "N/A"} - ${dt ? fmt(dt) : "N/A"}`;
        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.innerHTML = `${text} <span class="icon" onclick="removeDate(event)">✖</span>`;
        const div = document.createElement("div");
        div.className = "button-container";
        div.appendChild(btn);
        cont.appendChild(div);
        cnt++;
    }

    // Payment Source filters
    document.querySelectorAll(".payment-checkbox:checked").forEach(chk => {
        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.setAttribute("data-payment-id", chk.getAttribute("data-payment-id"));
        btn.innerHTML = chk.value + ` <span class="icon" onclick="removeFilter(event, 'payment', '${chk.getAttribute("data-payment-id")}')">✖</span>`;
        const div = document.createElement("div");
        div.className = "button-container";
        div.appendChild(btn);
        cont.appendChild(div);
        cnt++;
    });

    // Category filters
    document.querySelectorAll(".category-checkbox:checked").forEach(chk => {
        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.setAttribute("data-category-id", chk.getAttribute("data-catategory-id"));
        btn.innerHTML = chk.value + ` <span class="icon" onclick="removeFilter(event, 'category', '${chk.getAttribute("data-category-id")}')">✖</span>`;
        const div = document.createElement("div");
        div.className = "button-container";
        div.appendChild(btn);
        cont.appendChild(div);
        cnt++;
    });

    // Append separator and Clear All button only if there are any filters
    if (cnt > 1) {
        const sep = document.createElement("span");
        sep.className = "separator";
        sep.textContent = "|";
        cont.appendChild(sep);

        const clrDiv = document.createElement("div");
        clrDiv.className = "button-container";
        const clrBtn = document.createElement("button");
        clrBtn.className = "clearAll-btn";
        clrBtn.textContent = "Clear All";
        clrBtn.onclick = clearAll;
        clrDiv.appendChild(clrBtn);
        cont.appendChild(clrDiv);
    }
}

// Remove a bank or category filter when its remove icon is clicked
function removeFilter(e, type, id) {
    console.log(id);
    const savedFilters = JSON.parse(localStorage.getItem("selectedFilters") || {})
    e.stopPropagation();
    if (type === "payment") {
        const chk = document.querySelector(`.payment-checkbox[data-payment-id="${id}"]`);
        if (chk) chk.checked = false;
        savedFilters.payment = savedFilters.payment.filter(item => item !== id)

    } else if (type === "category") {
        const chk = document.querySelector(`.category-checkbox[data-category-id="${id}"]`);
        if (chk) chk.checked = false;
        savedFilters.category = savedFilters.category.filter(item => item !== id)
    }
    localStorage.setItem("selectedFilters", JSON.stringify(savedFilters))
    searchTransactionB()
    updateDynamicButtons();


}

// Remove date filter: clear both date inputs
function removeDate(e) {
    const savedFilters = JSON.parse(localStorage.getItem("selectedFilters") || {})
    e.stopPropagation();
    document.getElementById("dateFromModal").value = "";
    document.getElementById("dateToModal").value = "";
    savedFilters.dateFrom = "";
    savedFilters.dateTo = "";
    localStorage.setItem("selectedFilters", JSON.stringify(savedFilters))
    searchTransactionB()
    updateDynamicButtons();
}

// Clear all filters
function clearAll() {
    document.querySelectorAll(".payment-checkbox, .category-checkbox").forEach(chk => chk.checked = false);
    document.getElementById("dateFromModal").value = "";
    document.getElementById("dateToModal").value = "";
    localStorage.setItem("selectedFilters", JSON.stringify({ payment: [], dateFrom: "", dateTo: "", category: [] }))
    updateDynamicButtons();
    searchTransactionB();
}

// Listen for clicks on category tabs
document.getElementById("categoryTabs").addEventListener("click", event => {
    const li = event.target.closest("li");
    if (li) {
        activateTab(li, li.dataset.category);
    }
});

// Activate a category tab and update subcategory and payment source buttons
function activateTab(tab, category) {
    // Highlight active category tab
    document.querySelectorAll("#categoryTabs li").forEach(item => {
        item.classList.remove("is-active")
        item.querySelector("a i")?.classList.add("has-text-info");
    });
    tab.classList.add("is-active");
    tab.querySelector("a i")?.classList.remove("has-text-info");
    // Set selected category value
    document.getElementById("selectedCategory").value = category;

    // Reset hidden fields for subcategory and payment source
    document.getElementById("selectedSubcategory").value = "";
    document.getElementById("selectedPaymentSource").value = "";

    // Update subcategory and payment source buttons accordingly
    updateButtons(subCategoryList[category], "subcategoryContainer", "selectedSubcategory", "Subcategory");
}

// Dynamically create buttons for selection (subcategories or payment sources)
function updateButtons(items, containerId, inputId, labelText) {

    const container = document.getElementById(containerId);
    container.innerHTML = `<label class="label" style="font-size: 13px;">Select ${labelText}:</label><div class="buttons"></div>`;
    const buttonGroup = container.querySelector(".buttons");

    items.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button";
        // Set default active class on the first button
        if (index === 0) {
            button.classList.add("is-link");
            document.getElementById(inputId).value = item; // Set default selected value
        }
        button.textContent = item;
        button.addEventListener("click", () => {
            // Remove active class from all buttons in this group
            buttonGroup.querySelectorAll("button").forEach(btn => btn.classList.remove("is-link"));
            // Mark the selected button
            button.classList.add("is-link");
            // Set the hidden field with the selected value
            document.getElementById(inputId).value = item;
        });
        buttonGroup.appendChild(button);
    });
}

// Form submission event with field validation
document.getElementById("transaction-form").addEventListener("submit", function (event) {
    event.preventDefault();
    let isSuccess = false;


    const category = document.getElementById("selectedCategory").value;
    let amount = document.getElementById("amountInput").value;


    // Capture form data
    const formData = {
        date: formatDateIST(document.getElementById("expenseDate").value),
        category: document.getElementById("selectedCategory").value,
        subcategory: document.getElementById("selectedSubcategory").value,
        paymentSource: document.getElementById("selectedPaymentSource").value,
        amount: amount,
        description: document.getElementById("descriptionInput").value
    };

    // Validation: Check required fields
    if (!formData.date || !formData.category || !formData.subcategory || !formData.paymentSource || !formData.amount) {
        feedbackMessage(
            "red",
            "Please fill out all fields before submitting.",
        )
        return;
    }
    let dynamicMessage = "null"
    disabledSubmitBtn(true);
    // AJAX submission using plaintext with UTF-8 charset
    fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
        body: JSON.stringify({ action: "add", module: "Transaction", data: formData })
    })
        .then(response => response.text())
        .then(message => {
            console.log(message);
            if (message != "Invalid Action") {
                isSuccess = true;
            }
            dynamicMessage = message
            updateAlert(isSuccess, dynamicMessage);
            // Dynamic message includes the user input if successful; else, a default error.
            handleModal("alert-modal", "open")

            // Fetch transaction data
            fetchData("getTransaction").then(data => {
                transactionData = data;
                filterTransactionData = transactionData;
                renderTransactions(false, currentPage);
            });
            // Fetch today transaction data
            fetchData("getTodayTransaction").then(data => {
                loadTodayTransaction(data.data);
            });

            disabledSubmitBtn(false)
            resetForm();
        })
        .catch(error => {
            isSuccess = false;
            dynamicMessage = error.message
            updateAlert(isSuccess, dynamicMessage);
            handleModal("alert-modal", "open")
            disabledSubmitBtn(false)
            console.error("Error:", error);

        }).finally(() => {
            isSuccess = false;
            disabledSubmitBtn(false)
        })

});

// Reset event listener: Clear all hidden inputs and reinitialize default category selection
document.getElementById("transaction-form").addEventListener("reset", function (event) {
    // Give the form time to reset before reinitializing the UI
    resetForm()
});

document.getElementById("fundForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let amount = document.getElementById("amount").value;
    let fundType = document.getElementById("fundType").value;

    let requestBody = JSON.stringify({
        action: "add",
        module: "Income",
        data: {
            amount: amount,
            fundType: fundType
        }
    });

    fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain; charset=UTF-8"
        },
        body: requestBody
    })
        .then(response => response.text()) // Parse JSON response
        .then(data => {
            console.log("Success:", data);
            alert("Form submitted successfully!");
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error submitting form!");
        });
});

function loadTodayTransaction(lists) {
    let total = 0;
    const container = document.getElementById("todayTransaction-content");
    const title_con = document.createElement("div")
    title_con.classList.add("is-flex", "is-justify-content-space-between", "px-3", "py-0");
    title_con.style.width = "100%"
    title_con.innerHTML = `
    <h3 class="titleHead">Today's Expenses</h3>
    <p class="titleHead" id="total-expense"></p>
    `
    container.classList.add("pt-4")
    container.innerHTML = ""
    container.appendChild(title_con);
    if (lists.length > 0) {
        lists.forEach((item) => {
            total += item.amount;
            container.innerHTML += `
    <div class="column  is-full">
        <div class="columns card-transaction">
            <div class="column first-column">
                <div class="rounded-div">${item.icon}</div>
            </div>
            <div class="column has-text-left second-column">
                <p class="is-size-6 has-text-weight-bold">${item.subcategory}</p>
                <p class="is-size-7">${item.category}</p>
            </div>
            <div class="column third-column">
                <p class="has-text-info has-text-weight-bold">${formatAmountInINR(item.amount)}</p>
                <p class="is-size-7">${item.card}</p>
            </div>
        </div>
            
    </div>   
    `
        })
        document.getElementById("total-expense").innerText = formatAmountInINR(total);
    } else {
        container.innerHTML += `
         <div class="column">
        <p>No Transaction for Today!</p>
        </div>
        `
    }
}

// Fetch today transaction data
fetchData("getTodayTransaction").then(data => {
    loadTodayTransaction(data.data);
});

const form = document.getElementById('transaction-form');
const alertBox = document.getElementById('alertBox');
const alertIcon = document.getElementById('alertIcon');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertClose = document.getElementById('alertClose');

// Function to update the alert box based on form status and a dynamic message.
function updateAlert(isSuccess, messageContent) {
    console.log("isSuccess:" + isSuccess);
    console.log("messageContent:" + messageContent);
    if (isSuccess) {

        const successColor = "#27ae60"; // Dark green
        alertIcon.innerHTML = '<i class="fas fa-smile"></i>';
        alertIcon.style.color = successColor;
        alertIcon.style.backgroundColor = "rgba(39, 174, 96, 0.1)";
        alertTitle.textContent = 'Success';
        alertTitle.style.color = successColor;
        alertMessage.textContent = messageContent;
        alertClose.textContent = 'Close';
        alertClose.style.backgroundColor = "rgba(39, 174, 96, 0.1)";
        alertClose.style.color = successColor;
    } else {
        const failureColor = "#c0392b"; // Dark red
        alertIcon.innerHTML = '<i class="fas fa-frown"></i>';
        alertIcon.style.color = failureColor;
        alertIcon.style.backgroundColor = "rgba(192, 57, 43, 0.1)";
        alertTitle.textContent = 'Failed!';
        alertTitle.style.color = failureColor;
        alertMessage.textContent = messageContent;
        alertClose.textContent = 'Try Again';
        alertClose.style.backgroundColor = "rgba(192, 57, 43, 0.1)";
        alertClose.style.color = failureColor;
    }
    alertBox.style.display = 'block';
}


// The alert button will work differently based on its label.
alertClose.addEventListener('click', () => {
    if (alertClose.textContent.trim() === 'Try Again') {
        // Hide the alert and re-trigger the form submission.
        alertBox.style.display = 'none';
        // Use requestSubmit if available to simulate a resubmission.
        form.requestSubmit ? form.requestSubmit() : form.submit();
    } else {
        // For a success state, simply close the alert.
        handleModal("alert-modal", "close")
    }
});