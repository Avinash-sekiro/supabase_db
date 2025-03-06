// Supabase API configuration
const SUPABASE_URL = 'https://hmqvixspewwahgvbeokk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcXZpeHNwZXd3YWhndmJlb2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzE3MjcsImV4cCI6MjA1Njg0NzcyN30.20Zi0NdD81eKRV06yZ_G2zdeNxeglSNm8uyZzf9aCrg';

// Function to make authenticated API requests
async function supabaseRequest(endpoint, options = {}) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        
        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Server error occurred');
            } else {
                const text = await response.text();
                throw new Error(text || `HTTP error! status: ${response.status}`);
            }
        }
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }
    } catch (error) {
        console.error('API Request Error:', error);
        throw new Error(error.message || 'Failed to process the request');
    }
}

// Function to handle user login
async function login(email, password) {
    try {
        const response = await supabaseRequest('/auth/v1/token?grant_type=password', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return response;
    } catch (error) {
        console.error('Error logging in:', error.message);
        throw error;
    }
}

// Function to handle user signup
async function signup(email, password) {
    try {
        const response = await supabaseRequest('/auth/v1/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return response;
    } catch (error) {
        console.error('Error signing up:', error.message);
        throw error;
    }
}

// Function to show/hide the add record form
function showAddForm() {
    const overlay = document.getElementById('modalOverlay');
    const form = document.querySelector('.add-record-form');
    if (overlay.style.display === 'block') {
        overlay.classList.remove('active');
        form.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    } else {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('active');
            form.classList.add('active');
        }, 10);
    }
}

// Function to fetch and display all records
async function refreshData() {
    try {
        console.log('Fetching data...');
        const response = await supabaseRequest('/rest/v1/students?select=*', {
            method: 'GET'
        });
        console.log('Fetched data:', response);
        displayRecords(response);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Failed to fetch records: ${error.message}`);
    }
}

// Function to display records in the table
function displayRecords(records) {
    console.log('Displaying records:', records);
    const tbody = document.getElementById('recordsBody');
    if (!tbody) {
        console.error('Records body element not found');
        return;
    }
    tbody.innerHTML = '';

    if (!Array.isArray(records)) {
        console.error('Records is not an array:', records);
        return;
    }

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td onclick="showDetailPage('${record.id}')" style="cursor: pointer">${record.student_name}</td>
            <td>${record.roll_number || 'N/A'}</td>
            <td>${record.section_id || 'N/A'}</td>
            <td>
                <button onclick="editRecord('${record.id}')">Edit</button>
                <button onclick="deleteRecord('${record.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const roll_number = document.getElementById('roll_number').value;
    const section_id = document.getElementById('section_id').value;
    
    try {
        await supabaseRequest('/rest/v1/students', {
            method: 'POST',
            body: JSON.stringify({
                student_name: name,
                roll_number: roll_number,
                section_id: section_id
            })
        });
        
        showAddForm(); // Close the form
        refreshData(); // Refresh the table
    } catch (error) {
        console.error('Error adding record:', error);
        alert(`Failed to add record: ${error.message}`);
    }
}

// Function to edit a record
async function editRecord(id) {
    // Implementation for editing a record
    console.log('Edit record:', id);
}

// Function to delete a record
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
        await supabaseRequest(`/rest/v1/students?id=eq.${id}`, {
            method: 'DELETE'
        });
        
        refreshData(); // Refresh the table
    } catch (error) {
        console.error('Error deleting record:', error);
        alert(`Failed to delete record: ${error.message}`);
    }
}

// Function to show detail page
function showDetailPage(id) {
    window.location.href = `detail.html?id=${id}`;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    try {
        refreshData();
        // Add event listeners for buttons
        const addButton = document.getElementById('addButton');
        const refreshButton = document.getElementById('refreshButton');
        const closeButton = document.getElementById('closeButton');
        const studentForm = document.getElementById('studentForm');

        if (!addButton || !refreshButton || !closeButton || !studentForm) {
            throw new Error('Required elements not found');
        }

        addButton.addEventListener('click', showAddForm);
        refreshButton.addEventListener('click', refreshData);
        closeButton.addEventListener('click', showAddForm);
        studentForm.addEventListener('submit', handleSubmit);

        console.log('Event listeners attached successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Make functions available globally
window.showAddForm = showAddForm;
window.refreshData = refreshData;
window.handleSubmit = handleSubmit;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.showDetailPage = showDetailPage;